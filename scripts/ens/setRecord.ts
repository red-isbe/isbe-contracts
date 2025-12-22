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

export async function setRecord(
    node: string,
    owner: string,
    resolver: string,
    ttl: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('📋 Setting ENS record:')
    console.log(`   Node: ${node}`)
    console.log(`   Owner: ${owner}`)
    console.log(`   Resolver: ${resolver}`)
    console.log(`   TTL: ${ttl} seconds`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeEnsWrite(
        diamond,
        signatureProvider,
        'setRecord',
        [node, owner, resolver, BigInt(ttl)],
        200000n
    )

    console.log('\n✅ ENS record set successfully')
}
