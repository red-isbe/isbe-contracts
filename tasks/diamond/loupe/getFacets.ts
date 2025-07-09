import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacets } from '../../../scripts/diamond/loupe/getFacets'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacets --network localhost \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
 */

dotenv.config()

task('getFacets', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = getSigner(hre)

        const result = await getFacets(diamond, signer)

        console.log('Diamond facets:')

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
