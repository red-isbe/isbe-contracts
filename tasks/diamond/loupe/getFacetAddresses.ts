import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetAddresses } from '../../../scripts/diamond/loupe/getFacetAddresses'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacetAddresses --network localhost \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

dotenv.config()

task('getFacetAddresses', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = getSigner(hre)

        const result = await getFacetAddresses(diamond, signer)

        console.log('Facets addresses:')

        for (let i = 0; i < result.facetAddresses.length; i++) {
            console.log(result.facetAddresses[i])
        }
    })
