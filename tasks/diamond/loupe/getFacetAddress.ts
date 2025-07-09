import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetAddress } from '../../../scripts/diamond/loupe/getFacetAddress'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacetAddress --network localhost \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
    --selector "0x34a23402"
 */

dotenv.config()

task('getFacetAddress', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .addParam('selector', 'The selector bytes4')
    .setAction(async (taskArgs, hre) => {
        const { diamond, selector } = taskArgs

        const signer = getSigner(hre)

        const result = await getFacetAddress(diamond, selector, signer)

        console.log('Facet address:', result)
    })
