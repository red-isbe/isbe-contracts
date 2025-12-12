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

export async function getIssuers(
    diamond: string,
    signer: Signer,
    page: bigint, // Changed parameter name to match new signature
    pageSize: bigint // Changed parameter name to match new signature
): Promise<{
    items: string[] // Updated return type to match new signature
    total: bigint
    howMany: bigint
    prev: bigint
    next: bigint
}> {
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    const [items, total, howMany, prev, next] =
        await trustedIssuersRegistry.getIssuers(page, pageSize) // Updated function call

    return {
        items,
        total,
        howMany,
        prev,
        next,
    }
}
