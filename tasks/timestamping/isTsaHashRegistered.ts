import { task, types } from 'hardhat/config'
import { isTsaHashRegistered } from '../../scripts/timestamping/isTsaHashRegistered'

/**
 npx hardhat isTsaHashRegistered --network localhost \
  --tsa-hash "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'isTsaHashRegistered',
    'Checks if a TSA hash is registered in the TimeStampingRegistry'
)
    .addParam('tsaHash', 'The TSA hash to check', undefined, types.string)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { tsaHash, diamond } = taskArgs

        await isTsaHashRegistered(tsaHash, diamond, hre.ethers.provider)
    })
