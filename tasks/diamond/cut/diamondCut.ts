import { task, types } from 'hardhat/config'

import { diamondCut } from '../../../scripts/diamond/cut/diamondCut'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { ISignatureProvider } from '../../deployment/providers/ISignatureProvider'
import { NetworkConfigWithCurve } from '../../../types/hardhat'

/**
 npx hardhat diamondCut --network localhost \
  --facet-addresses '["0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"]' \
  --actions '[1,1]' \
  --items '[["0x12345678","0x12345678"],["0x12345678","0x12345678"]]' \
  --init '0x1234567812345678' \
  --calldata '0x1234567812345678' \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('diamondCut', 'updates a diamond')
    .addParam(
        'facetAddresses',
        'The addresses of the facets to update',
        undefined,
        types.json
    )
    .addParam('actions', 'The array of actions number', undefined, types.json)
    .addParam(
        'items',
        'The two dimensional bytes4 items',
        undefined,
        types.json
    )
    .addParam('init', 'The init address')
    .addParam('calldata', 'The calldata bytes')
    .addParam('diamond', 'The diamond contract address')
    .setAction(
        async (
            taskArgs: {
                facetAddresses: string[]
                actions: number[]
                items: string[][]
                init: string
                calldata: string
                diamond: string
            },
            hre
        ) => {
            const { facetAddresses, actions, items, init, calldata, diamond } =
                taskArgs

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

            try {
                const signatureProvider: ISignatureProvider =
                    SignatureProviderFactory.create(hre)

                const result = await diamondCut(
                    facetAddresses,
                    actions,
                    items,
                    init,
                    calldata,
                    diamond,
                    signatureProvider
                )

                console.log('✅ Diamond cut completed successfully')
                console.log('Diamond Cut result:', result)
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
