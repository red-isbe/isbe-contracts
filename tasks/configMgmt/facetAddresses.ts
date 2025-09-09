import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetAddresses } from '../../scripts/configMgmt/getFacetAddresses'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat facetAddresses --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
 --config-version 1 \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('facetAddresses', 'Returns facet addresses from config management')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The version number')
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                version: number
                factory: string
            },
            hre
        ) => {
            const { configId, version, factory } = taskArgs

            const signer = await getSigner(hre)

            const result = await getFacetAddresses(
                configId,
                version,
                factory,
                signer
            )

            console.log('Facets addresses:')

            for (let i = 0; i < result.facetAddresses.length; i++) {
                console.log(result.facetAddresses[i])
            }
        }
    )
