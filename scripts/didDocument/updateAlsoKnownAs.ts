import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidDocumentWrite } from './utils'

export async function updateAlsoKnownAs(
    did: string,
    alsoKnownAs: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n✏️ Updating AlsoKnownAs...\n')
    console.log(`  DID:          ${did}`)
    console.log(`  AlsoKnownAs:  ${alsoKnownAs}`)
    console.log(`  Diamond:      ${diamond}`)
    console.log(`  Curve:        ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeDidDocumentWrite(
        diamond,
        signatureProvider,
        'updateAlsoKnownAs',
        [did, alsoKnownAs],
        200000n
    )

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('                ALSO KNOWN AS UPDATED                       ')
    console.log('═══════════════════════════════════════════════════════════')

    return { did, alsoKnownAs }
}
