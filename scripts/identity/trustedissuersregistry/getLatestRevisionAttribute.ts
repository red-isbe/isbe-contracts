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
----------------------------------------------------------------------------------- */
import { Signer } from 'ethers'
import { getTrustedIssuersRegistry } from '../../utils/getTrustedIssuersRegistry'

export async function getLatestRevisionAttribute(
    diamond: string,
    signer: Signer,
    issuerDid: string, // Changed parameter name to match new signature
    attributeId: string // Updated parameter name and type to match new signature
): Promise<{
    did: string // Updated return structure to match Attribute struct
    attributeId: string
    attribData: string
    tao: string
    rootTao: string
    issuerType: bigint // Assuming IssuerType is a numeric enum or similar
}> {
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    const result = await trustedIssuersRegistry.getLatestRevisionAttribute(
        issuerDid,
        attributeId // Updated function call to match new signature
    )

    return {
        did: result.did,
        attributeId: result.attributeId,
        attribData: result.attribData,
        tao: result.tao,
        rootTao: result.rootTao,
        issuerType: result.issuerType,
    }
}
