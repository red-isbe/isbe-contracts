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
 * LOCAL TEST NETWORKS ONLY (ISBECORE-285). Plays the part of the ISBE DID API on a local
 * network so the evidence agent can be tested end to end with a real entity DID:
 *   1. registers the entity DID produced by did-gen (deployer with DID_REGISTRY_ROLE),
 *   2. funds the entity founder key so it can send its own transactions,
 *   3. as the entity (its founder key, the DID controller), adds the docker public key as
 *      a verification method and declares it as assertionMethod.
 * Every step is skipped when already done, so the script can be rerun safely.
 * Refuses to run against an RPC that is not local.
 *
 *   did-gen did --keystore ./identity.keystore.json --modelDeploy uc-pre --json
 *   ISBE_URL=http://127.0.0.1:8545 \
 *   ENTITY_DID=did:isbe:uc-pre:z1... ENTITY_PUBLIC_KEY=0x04... ENTITY_PROOF=0x... \
 *   ENTITY_KEYSTORE=./identity.keystore.json ENTITY_KEYSTORE_PASSWORD_FILE=./identity.password \
 *   DOCKER_PUBLIC_KEY=0x04... [FACTORY=0x...15BE] [FUND_ETH=1] [VALIDITY_DAYS=365] \
 *   npx hardhat run scripts/local/onboardEntityDid.ts --network isbe
 */
import { readFileSync } from 'node:fs'
import { ethers, network } from 'hardhat'

const DID_REGISTRY_ROLE =
    '0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973'
const SECP_256_K1 = 1
const ASSERTION_METHOD = 'assertionMethod'
const LOCAL_HOSTS = new Set([
    '127.0.0.1',
    'localhost',
    'host.docker.internal',
    '[::1]',
])

async function main() {
    assertLocalNetwork()
    const didText = requiredEnv('ENTITY_DID')
    const did = toDidBytes32(didText)
    const proof = requiredEnv('ENTITY_PROOF')
    const dockerPublicKey = ethers.SigningKey.computePublicKey(
        requiredEnv('DOCKER_PUBLIC_KEY'),
        false
    )
    const dockerAddress = ethers.computeAddress(dockerPublicKey)
    const founderPublicKey = proofPublicKey(
        requiredEnv('ENTITY_PUBLIC_KEY'),
        proof
    )
    const factoryAddress = ethers.getAddress(
        process.env.FACTORY ?? '0x00000000000000000000000000000000000015BE'
    )
    const fundWei = ethers.parseEther(process.env.FUND_ETH ?? '1')
    const validitySeconds =
        Number(process.env.VALIDITY_DAYS ?? '365') * 24 * 60 * 60

    if (proofToDid(proof) !== did) {
        throw new Error(
            `ENTITY_DID does not derive from ENTITY_PROOF: use the three values of the same did-gen run`
        )
    }

    const [deployer] = await ethers.getSigners()
    if (deployer === undefined)
        throw new Error('No signer: set ACCOUNTS for this network')
    const founder = (
        await ethers.Wallet.fromEncryptedJson(
            readFileSync(requiredEnv('ENTITY_KEYSTORE'), 'utf8'),
            readFileSync(
                requiredEnv('ENTITY_KEYSTORE_PASSWORD_FILE'),
                'utf8'
            ).trim()
        )
    ).connect(ethers.provider)
    if (founder.address !== ethers.computeAddress(founderPublicKey)) {
        throw new Error(
            `ENTITY_KEYSTORE (${founder.address}) is not the key of ENTITY_PUBLIC_KEY`
        )
    }

    const registry = await ethers.getContractAt(
        'DidDocumentDetailedFacet',
        factoryAddress,
        deployer
    )
    const query = await ethers.getContractAt(
        'DidRegistryQueryFacet',
        factoryAddress
    )
    const methods = await ethers.getContractAt(
        'DidVerificationMethodFacet',
        factoryAddress,
        founder
    )
    const relationships = await ethers.getContractAt(
        'DidVerificationRelationshipFacet',
        factoryAddress,
        founder
    )
    const registryViews = new ethers.Contract(
        factoryAddress,
        [
            'function hasActiveRelationship(bytes32 did, string name, address account) view returns (bool)',
            'function hasRole(bytes32 role, address account) view returns (bool)',
        ],
        ethers.provider
    )
    console.log(
        `chainId ${(await ethers.provider.getNetwork()).chainId}, registry ${factoryAddress}`
    )
    console.log(`entity ${didText} (${did}), founder ${founder.address}`)
    console.log(`docker ${dockerAddress}`)

    const now = BigInt((await ethers.provider.getBlock('latest'))!.timestamp)
    const notAfter = now + BigInt(validitySeconds)

    const registeredDid = await query.didOf(founder.address)
    if (registeredDid === did) {
        console.log('Entity DID already registered')
    } else if (registeredDid !== ethers.ZeroHash) {
        throw new Error(
            `The founder key already belongs to another DID (${registeredDid})`
        )
    } else {
        if (
            !(await registryViews.hasRole(DID_REGISTRY_ROLE, deployer.address))
        ) {
            throw new Error(
                `Deployer ${deployer.address} lacks DID_REGISTRY_ROLE`
            )
        }
        console.log('Registering the entity DID...')
        await (
            await registry.insertFirstDidDocument(
                did,
                JSON.stringify({
                    '@context': 'https://www.w3.org/ns/did/v1',
                    id: didText,
                }),
                ethers.id(`${didText}#founder`),
                proof,
                founderPublicKey,
                SECP_256_K1,
                now,
                notAfter,
                ''
            )
        ).wait()
    }

    if ((await ethers.provider.getBalance(founder.address)) < fundWei) {
        console.log(
            `Funding the founder key with ${ethers.formatEther(fundWei)} ETH...`
        )
        await (
            await deployer.sendTransaction({
                to: founder.address,
                value: fundWei,
            })
        ).wait()
    }

    if (
        await registryViews.hasActiveRelationship(
            did,
            ASSERTION_METHOD,
            dockerAddress
        )
    ) {
        console.log('Docker key already an active assertionMethod')
    } else {
        // A fresh id per run: a revoked method cannot be reused under the same id.
        const vMethodId = ethers.id(`${didText}#evidence-agent-${now}`)
        console.log(
            'Adding the docker key as verification method (signed by the entity)...'
        )
        await (
            await methods.addVerificationMethod(
                did,
                vMethodId,
                dockerPublicKey,
                SECP_256_K1
            )
        ).wait()
        console.log('Declaring it as assertionMethod (signed by the entity)...')
        await (
            await relationships.addVerificationRelationship(
                did,
                ASSERTION_METHOD,
                vMethodId,
                now,
                notAfter
            )
        ).wait()
    }

    const active = await registryViews.hasActiveRelationship(
        did,
        ASSERTION_METHOD,
        dockerAddress
    )
    console.log('\n=== Entity DID ready ===')
    console.log(`ENTITY_DID=${didText}`)
    console.log(`DOCKER_ADDRESS=${dockerAddress}`)
    console.log(`docker key active assertionMethod: ${active}`)
    if (!active) process.exitCode = 1
}

/**
 * The registry recovers the proof over keccak256(publicKey) exactly as received. did-gen
 * prints the 65-byte 0x04 form but signs the 64-byte X||Y form, so the key is sent in
 * whichever form the proof was made for.
 */
function proofPublicKey(publicKey: string, proof: string): string {
    const uncompressed = ethers.SigningKey.computePublicKey(publicKey, false)
    const address = ethers.computeAddress(uncompressed)
    const bare = `0x${uncompressed.slice(4)}`
    for (const candidate of [bare, uncompressed]) {
        const digest = ethers.keccak256(candidate)
        for (const message of [
            digest,
            ethers.hashMessage(ethers.getBytes(digest)),
        ]) {
            if (ethers.recoverAddress(message, proof) === address)
                return candidate
        }
    }
    throw new Error(
        'ENTITY_PROOF was not signed by the key of ENTITY_PUBLIC_KEY'
    )
}

/** DID bytes32 = version byte 0x00 + last 19 bytes of the proof + 12 zero bytes. */
function proofToDid(proof: string): string {
    return `0x00${proof.slice(-38)}${'0'.repeat(24)}`.toLowerCase()
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
