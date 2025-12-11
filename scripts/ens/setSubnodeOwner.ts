import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setSubnodeOwner(
    node: string,
    label: string,
    owner: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting subnode owner:')
    console.log(`   Parent Node: ${node}`)
    console.log(`   Label: ${label}`)
    console.log(`   New Owner: ${owner}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setSubnodeOwner',
        [node, label, owner],
        150000n
    )

    console.log('\n✅ Subnode owner set successfully')
}
