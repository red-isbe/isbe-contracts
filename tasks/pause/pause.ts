import { task } from 'hardhat/config'
import { pause } from '../../scripts/pause/pause'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat pause --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('pause', 'Pauses a deployed smart contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = await getSigner(hre)

        const result = await pause(diamond, signer)

        console.log('Pause result:', result)
    })
