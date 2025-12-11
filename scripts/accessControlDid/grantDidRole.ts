import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeAccessControlDidWrite } from './utils'

export async function grantDidRole(
    role: string,
    did: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🔐 Granting Role to DID...\n')
    console.log(`  Role:    ${role}`)
    console.log(`  DID:     ${did}`)
    console.log(`  Diamond: ${diamond}`)
    console.log(`  Curve:   ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeAccessControlDidWrite(
        diamond,
        signatureProvider,
        'grantDidRole',
        [role, did],
        200000n
    )

    console.log('\n✅ DID role granted')
    return { role, did }
}
