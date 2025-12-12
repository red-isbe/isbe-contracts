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
import { getFiltersByPage } from '../../scripts/client/getFiltersByPage'

/**
 npx hardhat getFiltersByPage --network localhost \
  --client-filtering-address "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --page-number 1 \
  --page-size 10
 */
task('getFiltersByPage', 'Returns the number of filters registered')
    .addParam(
        'clientFilteringAddress',
        'The address of the proxy associated to ClientFilteringFacet',
        undefined,
        types.string
    )
    .addParam(
        'pageNumber',
        'The number of the page to recover the results',
        1,
        types.int
    )
    .addParam('pageSize', 'The number of items to be recovered', 1, types.int)
    .setAction(
        async (
            taskArgs: {
                clientFilteringAddress: string
                pageNumber: number
                pageSize: number
            },
            hre
        ) => {
            const { clientFilteringAddress, pageNumber, pageSize } = taskArgs

            const signer = await getSigner(hre)

            const { filters } = await getFiltersByPage(
                pageNumber,
                pageSize,
                clientFilteringAddress,
                signer
            )

            // Convert filters to CSV format
            const csvHeader =
                'filterId,filterType,transactionHash,contractAddress,signature,jsonRpcMethod,initialBlock,endBlock'
            const csvRows = filters.map(
                (filter) =>
                    `${filter.filterId},${filter.filterType},${filter.transactionHash},${filter.contractAddress},${filter.signature},${filter.jsonRpcMethod},${filter.initialBlock},${filter.endBlock}`
            )
            const csvOutput = [csvHeader, ...csvRows].join('\n')

            console.log(csvOutput)
        }
    )
