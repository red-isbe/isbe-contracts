import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeTimeStampingWrite } from './utils'

export async function stamp(
    originalHash: string,
    tsaHash: string,
    externalReferenceId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('🔏 Initializing signature provider for stamping...')

    console.log('📋 Stamping with parameters:')
    console.log(`   Original Hash: ${originalHash}`)
    console.log(`   TSA Hash: ${tsaHash}`)
    console.log(`   External Reference ID: ${externalReferenceId}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeTimeStampingWrite(
        diamond,
        signatureProvider,
        'stamp',
        [originalHash, tsaHash, externalReferenceId],
        200000n
    )

    console.log('\n✅ Hash set stamped successfully')
}
