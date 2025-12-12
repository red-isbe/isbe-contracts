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

export async function initializeDiDRegistry(
    diamond: string,
    ellipticType: number,
    signatureProvider: ISignatureProvider
) {
    if (ellipticType !== 1 && ellipticType !== 2) {
        throw new Error(
            `Invalid elliptic type: ${ellipticType}. Must be 1 (SECP_256_K1) or 2 (SECP_256_R1)`
        )
    }

    console.log('\n🔧 Initializing DID Registry...\n')
    console.log(`  Diamond:       ${diamond}`)
    console.log(
        `  Elliptic Type: ${ellipticType} (${EllipticTypeNames[ellipticType]})`
    )
    console.log(`  Curve:         ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeDidDocumentWrite(
        diamond,
        signatureProvider,
        'initializeDiDRegistry',
        [ellipticType],
        200000n
    )

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('         DID REGISTRY INITIALIZED SUCCESSFULLY              ')
    console.log(
        `         Network Elliptic Type: ${EllipticTypeNames[ellipticType]}`
    )
    console.log('═══════════════════════════════════════════════════════════')

    if (ellipticType === 1) {
        console.log(
            '\nℹ️  Use standard Ethereum (secp256k1) keys for DID proofs.'
        )
        console.log('   Run: npx hardhat run scripts/generate-did-proof.ts')
    } else {
        console.log('\nℹ️  Use NIST P-256 (secp256r1) keys for DID proofs.')
        console.log(
            '   Configure secp256r1Accounts in your hardhat network config.'
        )
    }

    return { diamond, ellipticType }
}
