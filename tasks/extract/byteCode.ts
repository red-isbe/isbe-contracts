import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getContractRuntimeBytecode } from '../../scripts/extract/getContractRuntimeBytecode'

/**
 npx hardhat byteCode --network localhost \
  --address "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('byteCode', 'Pauses a deployed smart contract')
    .addParam('address', 'The address of the contract to extract its code from')
    .setAction(async (taskArgs, hre) => {
        const { address } = taskArgs

        const byteCode = await getContractRuntimeBytecode(address, hre)

        console.log('byteCode:', byteCode)
    })
