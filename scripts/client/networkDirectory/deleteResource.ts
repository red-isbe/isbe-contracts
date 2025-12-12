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
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { executeNetworkDirectoryWrite, stringToBytes32 } from './utils'

export async function deleteResource(
    chainId: bigint | number,
    resourceId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const normalizedChainId = BigInt(chainId)
    const resourceIdBytes32 = stringToBytes32(resourceId)

    console.log('🌐 Initializing signature provider for resource deletion...')
    console.log('📋 Deleting resource with parameters:')
    console.log(`   Chain ID: ${normalizedChainId}`)
    console.log(`   Resource ID: ${resourceId} (${resourceIdBytes32})`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeNetworkDirectoryWrite(
        diamond,
        signatureProvider,
        'deleteResource',
        [normalizedChainId, resourceIdBytes32],
        200000n
    )

    console.log('\n✅ Resource deleted successfully')
}
