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
 *   1. deploys the v2 business logic if missing,
 *   2. registers its configuration if missing and pins the use case to an explicit
 *      version (never 0 = "latest", which would follow future versions silently),
 *   3. deploys the use case proxy (or reuses the one already on that version),
 *   4. onboards the ENTITY DID (HASH_TIMESTAMP_ROLE granted per DID, spec H1/H2),
 *   5. optionally funds the docker key and warns if it is not an assertionMethod of the DID.
 * The entity creates its DID and declares the docker key itself (did-gen + DID API).
 * Refuses to run against an RPC that is not local.
 *
 *   ISBE_URL=http://127.0.0.1:8545 ENTITY_DID=did:isbe:uc-dev:z1... [DOCKER_ADDRESS=0x...] \
 *   [FACTORY=0x...15BE] [FUND_ETH=1] \
 *   npx hardhat run scripts/local/deployEvidenceRegistryForEntity.ts --network isbe
 */
import { ethers, network } from 'hardhat'
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
    'function hasActiveRelationship(bytes32 did, string name, address account) view returns (bool)',
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
    const docker = process.env.DOCKER_ADDRESS
        ? ethers.getAddress(process.env.DOCKER_ADDRESS)
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

    if ((await factory.getBusinessLogicVersions(BUSINESS_ID)).length === 0) {
        console.log('Deploying HashTimestampV2Facet business logic...')
        const { bytecode } = await ethers.getContractFactory(
            'HashTimestampV2Facet'
        )
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

    if (docker !== null) {
        if ((await ethers.provider.getBalance(docker)) < fundWei) {
            console.log(
                `Funding docker key with ${ethers.formatEther(fundWei)} ETH...`
            )
            await (
                await deployer.sendTransaction({ to: docker, value: fundWei })
            ).wait()
        }
        if (
            !(await factory.hasActiveRelationship(
                entityDid,
                'assertionMethod',
                docker
            ))
        ) {
            console.warn(
                `WARNING: ${docker} is not an active assertionMethod of the entity DID yet`
            )
        }
    }

    console.log('\n=== Evidence registry ready ===')
    console.log(`EVIDENCE_CONTRACT_ADDRESS=${proxy}`)
    console.log(
        `configuration version ${version}, entity DID ${entityDid} onboarded: ${await access.hasRoleForDid(HASH_TIMESTAMP_ROLE, entityDid)}`
    )
}

/** Registers the configuration (pinned to an explicit business logic version) when missing; returns the latest configuration version. */
async function ensureConfiguration(
    factory: Contract,
    businessVersion: bigint
): Promise<bigint> {
    let latest = 0n
    while (await configurationExists(factory, latest + 1n)) latest += 1n
    if (latest > 0n) return latest

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

/** Accepts the on-chain bytes32 form or did:isbe:<net>:z<base58>, whose 20 bytes are left aligned. */
function toDidBytes32(value: string): string {
    if (/^0x[0-9a-fA-F]{64}$/.test(value)) return value.toLowerCase()
    const match = /^did:isbe:[a-z0-9-]+:z([1-9A-HJ-NP-Za-km-z]+)$/.exec(value)
    if (match === null) throw new Error(`Unsupported DID format: ${value}`)
    const bytes = ethers.toBeHex(ethers.decodeBase58(match[1]!), 20)
    return ethers.zeroPadBytes(bytes, 32)
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
