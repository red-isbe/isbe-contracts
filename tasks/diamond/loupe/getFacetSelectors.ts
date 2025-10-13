import { task } from 'hardhat/config'

import { getFacetSelectors } from '../../../scripts/diamond/loupe/getFacetSelectors'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacetSelectors --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --facet-address "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

task('getFacetSelectors', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .addParam('facetAddress', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond, facetAddress } = taskArgs

        const signer = await getSigner(hre)

        const result = await getFacetSelectors(diamond, facetAddress, signer)

        console.log('Facet selectors:')

        for (let i = 0; i < result.functionSelectors.length; i++) {
            console.log(result.functionSelectors[i])
        }
    })
