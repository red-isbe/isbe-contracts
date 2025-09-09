import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getFacetAddress } from '../../../scripts/diamond/loupe/getFacetAddress'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacetAddress --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
    --selector "0x34a23402"
 */

dotenv.config()

task('getFacetAddress', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .addParam('selector', 'The selector bytes4')
    .setAction(async (taskArgs, hre) => {
        const { diamond, selector } = taskArgs

        const signer = await getSigner(hre)

        const result = await getFacetAddress(diamond, selector, signer)

        console.log('Facet address:', result)
    })
