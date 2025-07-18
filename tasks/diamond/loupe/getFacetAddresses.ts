import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetAddresses } from '../../../scripts/diamond/loupe/getFacetAddresses'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacetAddresses --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('getFacetAddresses', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = await getSigner(hre)

        const result = await getFacetAddresses(diamond, signer)

        console.log('Facets addresses:')

        for (let i = 0; i < result.facetAddresses.length; i++) {
            console.log(result.facetAddresses[i])
        }
    })
