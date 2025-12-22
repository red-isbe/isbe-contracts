/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
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
