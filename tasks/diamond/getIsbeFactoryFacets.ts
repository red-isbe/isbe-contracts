import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getIsbeFactoryFacets } from '../../scripts/diamond/getIsbeFactoryFacets'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getIsbeFactoryFacets --network localhost \
  --factory "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
 */

dotenv.config()

task('getIsbeFactoryFacets', 'Deploys business logic contract')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { factory } = taskArgs

        const signer = getSigner(hre)

        // Call the deploy script and display the result
        const result = await getIsbeFactoryFacets(factory, signer)

        console.log('Isbe Factory facets:')

        for (let i = 0; i < result.facets.length; i++) {
            console.log('  Facet :', result.facets[i].facetAddress)
            for (
                let j = 0;
                j < result.facets[i].functionSelectors.length;
                j++
            ) {
                console.log(
                    '     Selector : ',
                    result.facets[i].functionSelectors[j]
                )
            }
        }
    })
