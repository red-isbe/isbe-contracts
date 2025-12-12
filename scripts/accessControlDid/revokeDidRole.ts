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
