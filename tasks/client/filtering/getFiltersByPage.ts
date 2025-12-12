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
import { task, types } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getFiltersByPage } from '../../../scripts/client/filtering/getFiltersByPage'
import { ethers } from 'ethers'

/**
 * Converts bytes32 to readable string
 */
function bytes32ToString(bytes32: string): string {
    try {
        // Remove trailing zeros and decode
        const trimmed = bytes32.replace(/0+$/, '')
        if (trimmed === '0x' || trimmed === '') return '(empty)'
        return ethers.decodeBytes32String(bytes32)
    } catch {
        return bytes32
    }
}

/**
 * Converts filter type enum to string
 */
function filterTypeToString(filterType: number): string {
    const types = [
        'NONE',
        'TRANSACTION_HASH',
        'CONTRACT',
        'SIGNATURE',
        'CONTRACT_AND_SIGNATURE',
        'JSONRPC_METHOD',
    ]
    return types[filterType] || 'UNKNOWN'
}

/**
 npx hardhat getFiltersByPage --network localhost \
  --client-filtering-address "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10" \
  --page-number 1 \
  --page-size 10
 */
task('getFiltersByPage', 'Returns filters registered with pagination')
    .addParam(
        'clientFilteringAddress',
        'The address of the proxy associated to ClientFilteringFacet',
        undefined,
        types.string
    )
    .addParam(
        'pageNumber',
        'The number of the page to recover the results (0-indexed)',
        0,
        types.int
    )
    .addParam('pageSize', 'The number of items to be recovered', 10, types.int)
    .setAction(
        async (
            taskArgs: {
                clientFilteringAddress: string
                pageNumber: number
                pageSize: number
            },
            hre
        ) => {
            const { clientFilteringAddress, pageNumber, pageSize } = taskArgs

            console.log(
                `📋 Getting filters (page ${pageNumber}, size ${pageSize})`
            )
            console.log(
                `   Client Filtering Address: ${clientFilteringAddress}`
            )
            console.log(`   Network: ${hre.network.name}`)

            const signer = await getSigner(hre)

            const { filters } = await getFiltersByPage(
                pageNumber,
                pageSize,
                clientFilteringAddress,
                signer
            )

            console.log(
                `\n📊 Found ${filters.length} filter(s) on this page:\n`
            )

            if (filters.length === 0) {
                console.log('   No filters found on this page.')
                return
            }

            filters.forEach((filter, index) => {
                console.log(`   ━━━ Filter ${index + 1} ━━━`)
                console.log(`   Filter ID: ${filter.filterId}`)
                console.log(
                    `   Filter Type: ${filterTypeToString(Number(filter.filterType))} (${filter.filterType})`
                )
                console.log(`   Transaction Hash: ${filter.transactionHash}`)
                console.log(`   Contract Address: ${filter.contractAddress}`)
                console.log(`   Signature: ${filter.signature}`)
                console.log(
                    `   JSON-RPC Method: ${bytes32ToString(filter.jsonRpcMethod)}`
                )
                console.log(`   Initial Block: ${filter.initialBlock}`)
                console.log(`   End Block: ${filter.endBlock}`)
                console.log(`   Disabled: ${filter.disabled ?? 'N/A'}`)
                console.log('')
            })
        }
    )
