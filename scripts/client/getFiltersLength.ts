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
import { isValidBytesAndLength } from '../utils/validation'
import { getClientFiltering } from '../utils/getClientFiltering'
import { IClientFiltering } from '../../typechain-types'

export async function getFiltersLength(
    clientFilteringAddress: string,
    signer: Signer
): Promise<{
    filtersLength: bigint
}> {
    if (!isValidBytesAndLength(clientFilteringAddress, 20))
        throw new Error(
            'Invalid client filtering address format : ' +
                clientFilteringAddress
        )

    const clientFiltering = (await getClientFiltering(
        clientFilteringAddress,
        signer
    )) as IClientFiltering

    const result = await clientFiltering.getFiltersLength()

    return {
        filtersLength: result,
    }
}
