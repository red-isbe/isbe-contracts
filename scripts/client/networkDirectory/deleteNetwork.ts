import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { executeNetworkDirectoryWrite } from './utils'

export async function deleteNetwork(
    chainId: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const normalizedChainId = BigInt(chainId)

    console.log('🌐 Initializing signature provider for network deletion...')
    console.log('📋 Deleting network with parameters:')
    console.log(`   Chain ID: ${normalizedChainId}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeNetworkDirectoryWrite(
        diamond,
        signatureProvider,
        'deleteNetwork',
        [normalizedChainId],
        200000n
    )

    console.log('\n✅ Network deleted successfully')
}
