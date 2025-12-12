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

async function loadDidControllerFactory() {
    const { DidControllerFacet__factory } =
        await import('../../typechain-types')
    return DidControllerFacet__factory
}

export async function revokeController(
    did: string,
    controller: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🔓 Revoking Controller...\n')
    console.log(`  DID:        ${did}`)
    console.log(`  Controller: ${controller}`)
    console.log(`  Diamond:    ${diamond}`)
    console.log(`  Curve:      ${signatureProvider.getCurveType()}`)
    console.log('')

    const DidControllerFacet__factory = await loadDidControllerFactory()

    await executeDidWrite(
        DidControllerFacet__factory,
        diamond,
        signatureProvider,
        'revokeController',
        [did, controller],
        500000n
    )

    console.log('\n✅ Controller revoked')
    return { did, controller }
}
