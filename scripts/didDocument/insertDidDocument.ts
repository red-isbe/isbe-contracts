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
import { executeDidDocumentWrite, EllipticTypeNames } from './utils'

export async function insertDidDocument(
    did: string,
    baseDocument: string,
    vMethodId: string,
    publicKey: string,
    ellipticType: number,
    notBefore: bigint | number,
    notAfter: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const notBeforeDate = new Date(Number(notBefore) * 1000).toISOString()
    const notAfterDate = new Date(Number(notAfter) * 1000).toISOString()

    console.log('\n📝 Inserting DID Document...\n')
    console.log(`  DID:           ${did}`)
    console.log(
        `  Base Doc:      ${baseDocument.substring(0, 40)}${baseDocument.length > 40 ? '...' : ''}`
    )
    console.log(`  V-Method ID:   ${vMethodId}`)
    console.log(`  Public Key:    ${publicKey.substring(0, 20)}...`)
    console.log(
        `  Elliptic Type: ${EllipticTypeNames[ellipticType] || ellipticType}`
    )
    console.log(`  Not Before:    ${notBefore} (${notBeforeDate})`)
    console.log(`  Not After:     ${notAfter} (${notAfterDate})`)
    console.log(`  Diamond:       ${diamond}`)
    console.log(`  Curve:         ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeDidDocumentWrite(
        diamond,
        signatureProvider,
        'insertDidDocument',
        [
            did,
            baseDocument,
            vMethodId,
            publicKey,
            ellipticType,
            BigInt(notBefore),
            BigInt(notAfter),
        ],
        5000000n
    )

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('               DID DOCUMENT INSERTED                        ')
    console.log('═══════════════════════════════════════════════════════════')

    return { did, vMethodId }
}
