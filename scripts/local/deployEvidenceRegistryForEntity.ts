// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */

/**
 * LOCAL TEST NETWORKS ONLY (ISBECORE-285). Prepares the evidence registry (HashTimestamp
 * v2) for one entity on a network that was not deployed with deployAllClean:
 *   1. deploys the v2 business logic if missing or if the compiled facet changed,
 *   2. registers a configuration pinned to that explicit business logic version when the
 *      latest one is not (never 0 = "latest", which would follow future versions silently),
 *   3. deploys the use case proxy (or reuses the one already on that version),
 *   4. onboards the ENTITY DID (HASH_TIMESTAMP_ROLE granted per DID, spec H1/H2),
 *   5. optionally checks the gateway Service DID (active, controlled by the entity) and
 *      funds its signing key so it can send transactions.
 * The entity creates its DID and registers the gateway Service DID itself (did-gen + DID
 * API, or onboardEntityDid.ts locally). Refuses to run against an RPC that is not local.
 *
 *   ISBE_URL=http://127.0.0.1:8545 ENTITY_DID=did:isbe:uc-dev:z1... \
 *   [SERVICE_DID=did:isbe:svc:uc-dev:z1...:1 | 0x<bytes32>] \
 *   [FACTORY=0x...15BE] [FUND_ETH=1] \
 *   npx hardhat run scripts/local/deployEvidenceRegistryForEntity.ts --network isbe
 */
import { artifacts, ethers, network } from 'hardhat'
import type { Contract } from 'ethers'

const BUSINESS_ID =
    '0x798ec97da51506566f19dc4d3df52a19b9de52f59e46d12a45f964feb662bb8b'
const CONFIG_ID =
    '0xe6b27c38d9af155e702d00c070c1cd2c981cce55d91a4464c16ecb4f98fe0187'
const HASH_TIMESTAMP_ROLE =
    '0x3bb8341caefb6dc4800c130d6d6d2789f8c4e534bc168ff9a7eda2e2831a721f'
const ROLES = {
    BUSINESS_LOGIC_DEPLOYER_ROLE:
        '0xdc99c621188983b30fd7ff7b62ee13c081548c6b000e3c54b59686f091418069',
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE:
        '0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb',
    PROXY_DEPLOYER_ROLE:
        '0xc6832bf28cac8042fe5597e3b605a7fa9af230954df24409efd82699171f3c26',
}
const LOCAL_HOSTS = new Set([
    '127.0.0.1',
    'localhost',
    'host.docker.internal',
    '[::1]',
])

const FACTORY_ABI = [
    'function hasRole(bytes32 role, address account) view returns (bool)',
    'function deploy(bytes32 businessId, bytes bytecode)',
    'function getBusinessLogicVersions(bytes32 businessId) view returns (address[])',
    'function checkConfiguration(bytes32 configurationId, uint256 version) view',
    'function setConfiguration(bytes32 configurationId, tuple(bytes32 businessId, uint256 version)[] businessIds)',
    'function getDeployedProxiesByConfiguration(bytes32 configurationId, uint256 version) view returns (address[])',
    'function deployUseCase(bytes32 configurationId, uint256 version, tuple(bytes32 role, address[] members)[] rbacs, bool initPause, bytes32[] initBusinessIds, bytes[] initData)',
    'function getConfiguration(bytes32 configurationId, uint256 version) view returns (tuple(bytes32 businessId, uint256 version)[])',
    'function isServiceDidActive(bytes32 serviceDid) view returns (bool)',
    'function getServiceDid(bytes32 serviceDid) view returns (tuple(bytes32 controllerDid, bytes32 labelHash, bytes32 pubKeyX, bytes32 pubKeyY, uint64 expiresAt, uint8 ellipticType, uint64 nonce, bool deactivated, bool exists, uint64 registeredAt, uint64 updatedAt))',
    'function signingKeyAddressOf(bytes32 serviceDid) view returns (address)',
    'event ConfigurationSet(bytes32 configurationId, tuple(bytes32 businessId, uint256 version)[] businessData, uint256 version)',
    'event UseCaseDeployed(bytes32 configurationId, uint256 version, tuple(bytes32 role, address[] members)[] rbacs, address proxy)',
]
const PROXY_ABI = [
    'function grantDidRole(bytes32 role, bytes32 did)',
    'function hasRoleForDid(bytes32 role, bytes32 did) view returns (bool)',
]

async function main() {
    assertLocalNetwork()
    const entityDid = toDidBytes32(requiredEnv('ENTITY_DID'))
    const serviceDid = process.env.SERVICE_DID
        ? toServiceDidBytes32(process.env.SERVICE_DID)
        : null
    const factoryAddress = ethers.getAddress(
        process.env.FACTORY ?? '0x00000000000000000000000000000000000015BE'
    )
    const fundWei = ethers.parseEther(process.env.FUND_ETH ?? '1')

    const [deployer] = await ethers.getSigners()
    if (deployer === undefined)
        throw new Error('No signer: set ACCOUNTS for this network')
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, deployer)
    console.log(
        `chainId ${(await ethers.provider.getNetwork()).chainId}, factory ${factoryAddress}, deployer ${deployer.address}`
    )
    for (const [name, role] of Object.entries(ROLES)) {
        if (!(await factory.hasRole(role, deployer.address)))
            throw new Error(`Deployer lacks ${name}`)
    }

    const { bytecode } = await ethers.getContractFactory('HashTimestampV2Facet')
    const { deployedBytecode } = await artifacts.readArtifact(
        'HashTimestampV2Facet'
    )
    const versions: string[] =
        await factory.getBusinessLogicVersions(BUSINESS_ID)
    const latestLogic = versions.at(-1)
    if (
        latestLogic === undefined ||
        (await ethers.provider.getCode(latestLogic)) !== deployedBytecode
    ) {
        console.log('Deploying HashTimestampV2Facet business logic...')
        await (await factory.deploy(BUSINESS_ID, bytecode)).wait()
    }

    const businessVersion = BigInt(
        (await factory.getBusinessLogicVersions(BUSINESS_ID)).length
    )
    const version = await ensureConfiguration(factory, businessVersion)
    const proxy = await ensureProxy(factory, version)

    const access = new ethers.Contract(proxy, PROXY_ABI, deployer)
    if (!(await access.hasRoleForDid(HASH_TIMESTAMP_ROLE, entityDid))) {
        console.log('Onboarding the entity DID (HASH_TIMESTAMP_ROLE)...')
        await (await access.grantDidRole(HASH_TIMESTAMP_ROLE, entityDid)).wait()
    }

    if (serviceDid !== null) {
        // The registry checks the Service DID exactly like this.
        if (!(await factory.isServiceDidActive(serviceDid)))
            throw new Error(`Service DID ${serviceDid} is not active`)
        const { controllerDid } = await factory.getServiceDid(serviceDid)
        if (controllerDid !== entityDid) {
            throw new Error(
                `Service DID ${serviceDid} is controlled by ${controllerDid}, not by the entity`
            )
        }
        const gateway: string = await factory.signingKeyAddressOf(serviceDid)
        if ((await ethers.provider.getBalance(gateway)) < fundWei) {
            console.log(
                `Funding the gateway key ${gateway} with ${ethers.formatEther(fundWei)} ETH...`
            )
            await (
                await deployer.sendTransaction({ to: gateway, value: fundWei })
            ).wait()
        }
        console.log(`SERVICE_DID=${serviceDid} (gateway ${gateway})`)
    }

    console.log('\n=== Evidence registry ready ===')
    console.log(`EVIDENCE_CONTRACT_ADDRESS=${proxy}`)
    console.log(
        `configuration version ${version}, entity DID ${entityDid} onboarded: ${await access.hasRoleForDid(HASH_TIMESTAMP_ROLE, entityDid)}`
    )
}

/** Registers a configuration pinned to the business logic version unless the latest one already is; returns its version. */
async function ensureConfiguration(
    factory: Contract,
    businessVersion: bigint
): Promise<bigint> {
    let latest = 0n
    while (await configurationExists(factory, latest + 1n)) latest += 1n
    if (latest > 0n) {
        const businessData = await factory.getConfiguration(CONFIG_ID, latest)
        if (
            businessData.some(
                ([businessId, version]: [string, bigint]) =>
                    businessId === BUSINESS_ID && version === businessVersion
            )
        )
            return latest
    }

    console.log('Registering the v2 configuration...')
    const receipt = await (
        await factory.setConfiguration(CONFIG_ID, [
            { businessId: BUSINESS_ID, version: businessVersion },
        ])
    ).wait()
    for (const log of receipt?.logs ?? []) {
        const parsed = factory.interface.parseLog(log)
        if (parsed?.name === 'ConfigurationSet')
            return parsed.args.version as bigint
    }
    throw new Error('ConfigurationSet event not found')
}

async function configurationExists(
    factory: Contract,
    version: bigint
): Promise<boolean> {
    try {
        await factory.checkConfiguration(CONFIG_ID, version)
        return true
    } catch {
        return false
    }
}

async function ensureProxy(
    factory: Contract,
    version: bigint
): Promise<string> {
    const existing: string[] = await factory.getDeployedProxiesByConfiguration(
        CONFIG_ID,
        version
    )
    const last = existing.at(-1)
    if (last !== undefined) {
        console.log(`Reusing proxy ${last}`)
        return last
    }
    const args = [CONFIG_ID, version, [], false, [], []] as const
    await factory.deployUseCase.staticCall(...args)
    console.log(
        `Deploying the use case proxy on configuration version ${version}...`
    )
    const receipt = await (await factory.deployUseCase(...args)).wait()
    for (const log of receipt?.logs ?? []) {
        const parsed = factory.interface.parseLog(log)
        if (parsed?.name === 'UseCaseDeployed')
            return parsed.args.proxy as string
    }
    throw new Error('UseCaseDeployed event not found')
}

/** Accepts the on-chain bytes32 form or did:isbe:svc:<net>:z<base58>:<nonce> (ISBE-ART-00007). */
function toServiceDidBytes32(value: string): string {
    if (/^0x[0-9a-fA-F]{64}$/.test(value)) return value.toLowerCase()
    const match =
        /^did:isbe:svc:([a-z0-9-]+:z[1-9A-HJ-NP-Za-km-z]+):(\d+)$/.exec(value)
    if (match === null) throw new Error(`Unsupported service DID: ${value}`)
    return ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes32', 'uint64'],
            [toDidBytes32(`did:isbe:${match[1]}`), BigInt(match[2]!)]
        )
    )
}

/** Accepts the on-chain bytes32 form or did:isbe:<net>:z<base58>, whose 20 bytes are left aligned. */
function toDidBytes32(value: string): string {
    if (/^0x[0-9a-fA-F]{64}$/.test(value)) return value.toLowerCase()
    const match = /^did:isbe:[a-z0-9-]+:z([1-9A-HJ-NP-Za-km-z]+)$/.exec(value)
    if (match === null) throw new Error(`Unsupported DID format: ${value}`)
    const bytes = ethers.toBeHex(ethers.decodeBase58(match[1]!), 20)
    return ethers.zeroPadBytes(bytes, 32).toLowerCase()
}

function assertLocalNetwork() {
    const url = (network.config as { url?: string }).url
    const host = url === undefined ? null : new URL(url).hostname
    if (host === null || !LOCAL_HOSTS.has(host)) {
        throw new Error(
            `Refusing to run against a non-local RPC (${url ?? network.name}): test networks only`
        )
    }
}

function requiredEnv(name: string): string {
    const value = process.env[name]
    if (value === undefined || value === '') throw new Error(`Set ${name}`)
    return value
}

main().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
})
