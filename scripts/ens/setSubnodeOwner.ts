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
import { executeEnsWrite } from './utils'

export async function setSubnodeOwner(
    node: string,
    label: string,
    owner: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting subnode owner:')
    console.log(`   Parent Node: ${node}`)
    console.log(`   Label: ${label}`)
    console.log(`   New Owner: ${owner}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setSubnodeOwner',
        [node, label, owner],
        150000n
    )

    console.log('\n✅ Subnode owner set successfully')
}
