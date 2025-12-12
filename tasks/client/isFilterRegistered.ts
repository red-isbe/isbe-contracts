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
import { task, types } from 'hardhat/config'
import { getSigner } from '../../scripts/utils/getSigner'
import { ZeroHash } from 'ethers'
import { isFilterRegistered } from '../../scripts/client/isFilterRegistered'

/**
 npx hardhat isFilterRegistered --network localhost \
  --client-filtering-address "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --filter-id "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157"
 */
task('isFilterRegistered', 'Returns if a filter is registered')
    .addParam(
        'clientFilteringAddress',
        'The address of the proxy associated to ClientFilteringFacet',
        undefined,
        types.string
    )
    .addParam(
        'filterId',
        'Unique identifier of the filter',
        ZeroHash,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                clientFilteringAddress: string
                filterId: string
            },
            hre
        ) => {
            const { clientFilteringAddress, filterId } = taskArgs

            const signer = await getSigner(hre)

            const { registered } = await isFilterRegistered(
                filterId,
                clientFilteringAddress,
                signer
            )

            console.log(
                `Filter with id ${filterId} is ${registered ? 'registered' : 'unregistered'}.`
            )
        }
    )
