import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeAccessControlDidWrite } from './utils'

export async function revokeDidRole(
    role: string,
    did: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🔐 Revoking Role from DID...\n')
    console.log(`  Role:    ${role}`)
    console.log(`  DID:     ${did}`)
    console.log(`  Diamond: ${diamond}`)
    console.log(`  Curve:   ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeAccessControlDidWrite(
        diamond,
        signatureProvider,
        'revokeDidRole',
        [role, did],
        200000n
    )

    console.log('\n✅ DID role revoked')
    return { role, did }
}
