import { task } from 'hardhat/config'

import { unpause } from '../../scripts/pause/unpause'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat unpause --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('unpause', 'Unpauses a deployed smart contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        const result = await unpause(diamond, signatureProvider)

        console.log('Unpause result:', result)
    })
