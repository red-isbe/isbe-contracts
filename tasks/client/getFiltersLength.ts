import { task, types } from 'hardhat/config'
import { getSigner } from '../../scripts/utils/getSigner'
import { getFiltersLength } from '../../scripts/client/getFiltersLength'

/**
 npx hardhat getFiltersLength --network localhost \
  --client-filtering-address "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */
task('getFiltersLength', 'Returns the number of filters registered')
    .addParam(
        'clientFilteringAddress',
        'The address of the proxy associated to ClientFilteringFacet',
        undefined,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                clientFilteringAddress: string
            },
            hre
        ) => {
            const { clientFilteringAddress } = taskArgs

            const signer = await getSigner(hre)

            const result = await getFiltersLength(
                clientFilteringAddress,
                signer
            )

            console.log(
                'Client filters registered length: ',
                Number(result.filtersLength)
            )
        }
    )
