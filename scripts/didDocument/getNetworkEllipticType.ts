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
-------------------------------------------------------------- */
import { Provider } from 'ethers'
import { getDidDocumentFacet, EllipticTypeNames } from './utils'

export async function getNetworkEllipticType(
    diamond: string,
    provider: Provider
) {
    console.log('\n📋 Getting Network Elliptic Type\n')
    console.log('Diamond:', diamond)

    const facet = await getDidDocumentFacet(diamond, provider)

    const filter = facet.filters.DiDRegistryInitialized()
    const latestBlock = await provider.getBlockNumber()
    const CHUNK_SIZE = 10000
    const events: Awaited<ReturnType<typeof facet.queryFilter>> = []

    console.log(
        `Searching blocks 0 to ${latestBlock} for initialization events...`
    )

    for (let fromBlock = 0; fromBlock <= latestBlock; fromBlock += CHUNK_SIZE) {
        const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, latestBlock)
        try {
            const chunkEvents = await facet.queryFilter(
                filter,
                fromBlock,
                toBlock
            )
            events.push(...chunkEvents)
            if (chunkEvents.length > 0) {
                console.log(
                    `  Found ${chunkEvents.length} event(s) in blocks ${fromBlock}-${toBlock}`
                )
            }
        } catch (error) {
            console.log(`  Scanning blocks ${fromBlock}-${toBlock}...`)
            if (error instanceof Error && error.message) {
                console.log(`  ↳ ${error.message}`)
            }
        }
    }

    if (events.length === 0) {
        console.log(
            '\n⚠️  No DiDRegistryInitialized events found. The DID Registry may not be initialized.'
        )
        console.log(
            '   Run initializeDiDRegistry first to set the network elliptic type.'
        )
        return undefined
    }

    console.log('\n--- Initialization Events ---')
    for (const event of events) {
        const ellipticType = Number(event.args?.[0] ?? 0)
        const typeName = EllipticTypeNames[ellipticType] ?? 'UNKNOWN'
        console.log(`Block ${event.blockNumber}:`)
        console.log(`  Elliptic Type: ${ellipticType} (${typeName})`)
        console.log(`  Transaction: ${event.transactionHash}`)
    }

    const latestEvent = events[events.length - 1]
    const currentType = Number(latestEvent.args?.[0] ?? 0)
    const currentTypeName = EllipticTypeNames[currentType] ?? 'UNKNOWN'

    console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    console.log(
        `Current Network Elliptic Type: ${currentType} (${currentTypeName})`
    )
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (currentType === 1) {
        console.log(
            '\nℹ️  Use standard Ethereum (secp256k1) keys for DID proofs.'
        )
        console.log(
            '   The generate-did-proof.ts script will work with your Ethereum private key.'
        )
    } else if (currentType === 2) {
        console.log('\nℹ️  Use NIST P-256 (secp256r1) keys for DID proofs.')
        console.log(
            '   Configure secp256r1Accounts in your hardhat network config.'
        )
    }

    return currentType
}
