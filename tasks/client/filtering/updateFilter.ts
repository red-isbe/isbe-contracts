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
import { task, types } from 'hardhat/config'
import { updateFilter } from '../../../scripts/client/filtering/updateFilter'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { ISignatureProvider } from '../../deployment/providers/ISignatureProvider'
import { NetworkConfigWithCurve } from '../../../types/hardhat'
import { ZeroAddress, ZeroHash } from 'ethers'

/**
 npx hardhat updateFilter --network localhost \
  --client-filtering-address "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10" \
  --filter-id "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157" \
  --filter-type 1 \
  --transaction-hash "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157" \
  --contract-address "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10" \
  --signature "0x01234567" \
  --json-rpc-method "eth_storageAt" \
  --initial-block 0 \
  --end-block 0 \
  --disabled false
 */
task('updateFilter', 'Updates an existing filter in ClientFilteringFacet')
    .addParam(
        'filterId',
        'Unique identifier of the filter',
        undefined,
        types.string
    )
    .addParam(
        'filterType',
        'Filter type: 0=NONE, 1=TRANSACTION_HASH, 2=CONTRACT, 3=SIGNATURE, 4=CONTRACT_AND_SIGNATURE, 5=JSONRPC_METHOD',
        1,
        types.int
    )
    .addParam(
        'transactionHash',
        'The transaction hash to be filtered (for TRANSACTION_HASH type)',
        ZeroHash,
        types.string
    )
    .addParam(
        'contractAddress',
        'The contract address to be filtered (for CONTRACT & CONTRACT_AND_SIGNATURE types)',
        ZeroAddress,
        types.string
    )
    .addParam(
        'signature',
        'The function signature to be filtered (for SIGNATURE & CONTRACT_AND_SIGNATURE types)',
        '0x00000000',
        types.string
    )
    .addParam(
        'jsonRpcMethod',
        'JSON RPC method to be filtered (for JSONRPC_METHOD type)',
        '',
        types.string
    )
    .addParam('initialBlock', 'The initial block for the filter', 0, types.int)
    .addParam('endBlock', 'The end block for the filter', 0, types.int)
    .addParam(
        'disabled',
        'Whether the filter is disabled',
        false,
        types.boolean
    )
    .addParam(
        'clientFilteringAddress',
        'The address of the ClientFilteringFacet proxy',
        undefined,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                filterId: string
                filterType: number
                transactionHash: string
                contractAddress: string
                signature: string
                jsonRpcMethod: string
                initialBlock: number
                endBlock: number
                disabled: boolean
                clientFilteringAddress: string
            },
            hre
        ) => {
            const {
                filterId,
                filterType,
                transactionHash,
                contractAddress,
                signature,
                jsonRpcMethod,
                initialBlock,
                endBlock,
                disabled,
                clientFilteringAddress,
            } = taskArgs

            // Validate filter type
            if (filterType < 0 || filterType > 5) {
                throw new Error(
                    `Invalid filterType: ${filterType}. Must be 0 (NONE), 1 (TRANSACTION_HASH), 2 (CONTRACT), 3 (SIGNATURE), 4 (CONTRACT_AND_SIGNATURE), or 5 (JSONRPC_METHOD)`
                )
            }

            console.log(`🔍 Network: ${hre.network.name}`)

            // Check if we're on a secp256r1 network
            const networkConfig = hre.config.networks[
                hre.network.name
            ] as NetworkConfigWithCurve
            const isSecp256r1 = networkConfig.curve === 'secp256r1'

            if (isSecp256r1) {
                console.log(
                    '✅ secp256r1 network detected - using enhanced validation'
                )
            }

            const filterTypeNames = [
                'NONE',
                'TRANSACTION_HASH',
                'CONTRACT',
                'SIGNATURE',
                'CONTRACT_AND_SIGNATURE',
                'JSONRPC_METHOD',
            ]

            console.log('📋 Updating filter with parameters:')
            console.log(`   Filter ID: ${filterId}`)
            console.log(
                `   Filter Type: ${filterTypeNames[filterType]} (${filterType})`
            )
            console.log(`   Transaction Hash: ${transactionHash}`)
            console.log(`   Contract Address: ${contractAddress}`)
            console.log(`   Signature: ${signature}`)
            console.log(`   JSON-RPC Method: ${jsonRpcMethod || '(none)'}`)
            console.log(`   Initial Block: ${initialBlock}`)
            console.log(`   End Block: ${endBlock}`)
            console.log(`   Disabled: ${disabled}`)
            console.log(
                `   Client Filtering Address: ${clientFilteringAddress}`
            )

            try {
                const signatureProvider: ISignatureProvider =
                    SignatureProviderFactory.create(hre)

                const filterParams = {
                    filterId: filterId,
                    filterType: filterType,
                    transactionHash: transactionHash,
                    contractAddress: contractAddress,
                    signature: signature,
                    jsonRpcMethod: jsonRpcMethod,
                    initialBlock: BigInt(initialBlock),
                    endBlock: BigInt(endBlock),
                    disabled: disabled,
                }

                const result = await updateFilter(
                    hre,
                    clientFilteringAddress,
                    filterParams,
                    signatureProvider
                )

                console.log('✅ Filter updated successfully')
                console.log(
                    'Update filter result:',
                    JSON.stringify(result, null, 2)
                )
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)
                // Enhanced error handling for secp256r1
                if (
                    isSecp256r1 &&
                    errorMessage.includes('Cannot find square root')
                ) {
                    console.error(
                        '🚨 CRITICAL: secp256r1 signature generation failed'
                    )
                    console.error(
                        '   This indicates the Besu client may not support secp256r1 properly'
                    )
                    console.error('   Required Actions:')
                    console.error(
                        '   1. Check Besu client version and secp256r1 support'
                    )
                    console.error('   2. Verify network configuration')
                    console.error('   3. Test basic secp256r1 operations with:')
                    console.error(
                        '      npx hardhat quick-secp256r1-check --network customR1Network'
                    )
                    process.exit(1)
                }

                throw error
            }
        }
    )
