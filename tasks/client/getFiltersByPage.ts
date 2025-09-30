import { task, types } from 'hardhat/config'
import { getSigner } from '../../scripts/utils/getSigner'
import { getFiltersByPage } from '../../scripts/client/getFiltersByPage'

/**
 npx hardhat getFiltersLength --network localhost \
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
