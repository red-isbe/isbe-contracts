import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setResolver(
    node: string,
    resolver: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting ENS node resolver:')
    console.log(`   Node: ${node}`)
    console.log(`   New Resolver: ${resolver}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setResolver',
        [node, resolver],
        100000n
    )

    console.log('\n✅ ENS node resolver set successfully')
}
