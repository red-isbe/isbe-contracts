import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetSelectors } from '../../scripts/configMgmt/getFacetSelectors'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat facetSelectors --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
 --config-version 1 \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --facet-address "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

dotenv.config()

task('facetSelectors', 'Returns facet selectors from config management')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The version number')
    .addParam('factory', 'The factory contract address')
    .addParam('facetAddress', 'The facet address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                version: number
                factory: string
                facetAddress: string
            },
            hre
        ) => {
            const { configId, version, factory, facetAddress } = taskArgs

            const signer = await getSigner(hre)

            const result = await getFacetSelectors(
                configId,
                version,
                factory,
                facetAddress,
                signer
            )

            console.log('Facet selectors:')

            for (let i = 0; i < result.functionSelectors.length; i++) {
                console.log(result.functionSelectors[i])
            }
        }
    )
