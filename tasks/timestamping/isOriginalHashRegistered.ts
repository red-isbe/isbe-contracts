import { task, types } from 'hardhat/config'
import { isOriginalHashRegistered } from '../../scripts/timestamping/isOriginalHashRegistered'

/**
 npx hardhat isOriginalHashRegistered --network localhost \
  --original-hash "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'isOriginalHashRegistered',
    'Checks if an original hash is registered in the TimeStampingRegistry'
)
    .addParam(
        'originalHash',
        'The original hash to check',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { originalHash, diamond } = taskArgs

        await isOriginalHashRegistered(
            originalHash,
            diamond,
            hre.ethers.provider
        )
    })
