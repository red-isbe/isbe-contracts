import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { executeNetworkDirectoryWrite, stringToBytes32 } from './utils'

export async function setResource(
    chainId: bigint | number,
    resourceId: string,
    resource: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const normalizedChainId = BigInt(chainId)
    const resourceIdBytes32 = stringToBytes32(resourceId)

    console.log('🌐 Initializing signature provider for resource setting...')
    console.log('📋 Setting resource with parameters:')
    console.log(`   Chain ID: ${normalizedChainId}`)
    console.log(`   Resource ID: ${resourceId} (${resourceIdBytes32})`)
    console.log(`   Resource: ${resource}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeNetworkDirectoryWrite(
        diamond,
        signatureProvider,
        'setResource',
        [normalizedChainId, resourceIdBytes32, resource],
        200000n
    )

    console.log('\n✅ Resource set successfully')
}
