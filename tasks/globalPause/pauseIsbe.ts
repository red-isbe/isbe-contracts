import { task } from 'hardhat/config'

import { pauseIsbe } from '../../scripts/globalPause/pauseIsbe'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat pauseIsbe --network localhost \
  --proxy-address "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('pauseIsbe', 'Pauses a deployed smart contract')
    .addParam('proxyAddress', 'The address of the contract to pause')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { proxyAddress, factory } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        const result = await pauseIsbe(proxyAddress, factory, signatureProvider)

        console.log('Pause result:', result)
    })
