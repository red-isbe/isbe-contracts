import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { executeNetworkDirectoryWrite, stringToBytes32 } from './utils'

export async function deleteResource(
    chainId: bigint | number,
    resourceId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const normalizedChainId = BigInt(chainId)
    const resourceIdBytes32 = stringToBytes32(resourceId)

    console.log('🌐 Initializing signature provider for resource deletion...')
    console.log('📋 Deleting resource with parameters:')
    console.log(`   Chain ID: ${normalizedChainId}`)
    console.log(`   Resource ID: ${resourceId} (${resourceIdBytes32})`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeNetworkDirectoryWrite(
        diamond,
        signatureProvider,
        'deleteResource',
        [normalizedChainId, resourceIdBytes32],
        200000n
    )

    console.log('\n✅ Resource deleted successfully')
}
