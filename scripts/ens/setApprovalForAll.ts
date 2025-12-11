import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeEnsWrite } from './utils'

export async function setApprovalForAll(
    operator: string,
    approved: boolean,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting approval for all:')
    console.log(`   Operator: ${operator}`)
    console.log(`   Approved: ${approved}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setApprovalForAll',
        [operator, approved],
        100000n
    )

    console.log(
        `\n✅ Operator approval ${approved ? 'granted' : 'revoked'} successfully`
    )
}
