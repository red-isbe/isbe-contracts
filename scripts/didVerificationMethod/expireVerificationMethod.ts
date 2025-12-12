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
import { executeDidWrite } from '../did/utils'

async function loadDidVerificationMethodFactory() {
    const { DidVerificationMethodFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationMethodFacet__factory
}

export async function expireVerificationMethod(
    did: string,
    vMethodId: string,
    notAfter: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n⏰ Expiring Verification Method...\n')
    console.log(`  DID:         ${did}`)
    console.log(`  V-Method ID: ${vMethodId}`)
    console.log(`  Not After:   ${notAfter}`)
    console.log(`  Diamond:     ${diamond}`)
    console.log(`  Curve:       ${signatureProvider.getCurveType()}`)
    console.log('')

    const DidVerificationMethodFacet__factory =
        await loadDidVerificationMethodFactory()

    await executeDidWrite(
        DidVerificationMethodFacet__factory,
        diamond,
        signatureProvider,
        'expireVerificationMethod',
        [did, vMethodId, BigInt(notAfter)],
        800000n
    )

    console.log('\n✅ Verification method expiration set')
    return { did, vMethodId, notAfter }
}
