import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidDocumentWrite } from './utils'

export async function updateBaseDocument(
    did: string,
    baseDocument: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n✏️ Updating Base Document...\n')
    console.log(`  DID:          ${did}`)
    console.log(
        `  Base Doc:     ${baseDocument.substring(0, 50)}${baseDocument.length > 50 ? '...' : ''}`
    )
    console.log(`  Diamond:      ${diamond}`)
    console.log(`  Curve:        ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeDidDocumentWrite(
        diamond,
        signatureProvider,
        'updateBaseDocument',
        [did, baseDocument],
        200000n
    )

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('                BASE DOCUMENT UPDATED                       ')
    console.log('═══════════════════════════════════════════════════════════')

    return { did, baseDocument }
}
