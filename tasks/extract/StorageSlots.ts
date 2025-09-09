import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getContractStorageSlots } from '../../scripts/extract/getContractStorageSlot'

/**
 npx hardhat StorageSlots --network localhost \
  --address "0x8796e5187fDAe37EFE827cd0a68cA73584011cE8" \
  --start "0x04fb5b1674918eac185959cfae932d99373bdf254d85286d6561bd7c87ae22e8" \
  --end "0x04fb5b1674918eac185959cfae932d99373bdf254d85286d6561bd7c87ae22eB"
 */

dotenv.config()

task('StorageSlots', 'Pauses a deployed smart contract')
    .addParam('address', 'The address of the contract to extract its code from')
    .addParam('start', 'The first storage slot to extract')
    .addParam('end', 'The last storage slot to extract')
    .setAction(async (taskArgs, hre) => {
        const { address, start, end } = taskArgs

        const slots = await getContractStorageSlots(address, start, end, hre)

        console.log('slots:', slots)
    })
