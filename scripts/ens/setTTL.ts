import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setTTL(
    node: string,
    ttl: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting ENS node TTL:')
    console.log(`   Node: ${node}`)
    console.log(`   New TTL: ${ttl} seconds`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setTTL',
        [node, BigInt(ttl)],
        100000n
    )

    console.log('\n✅ ENS node TTL set successfully')
}
