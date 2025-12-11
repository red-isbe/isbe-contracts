import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setOwner(
    node: string,
    owner: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting ENS node owner:')
    console.log(`   Node: ${node}`)
    console.log(`   New Owner: ${owner}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setOwner',
        [node, owner],
        100000n
    )

    console.log('\n✅ ENS node owner set successfully')
}
