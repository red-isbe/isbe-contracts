import { task, types } from 'hardhat/config'
import { isApprovedForAll } from '../../scripts/ens/isApprovedForAll'

/**
 npx hardhat ensIsApprovedForAll --network localhost \
  --owner "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --operator "0x1234567890123456789012345678901234567890" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensIsApprovedForAll',
    'Checks if an operator is approved for all nodes of an owner'
)
    .addParam(
        'owner',
        'The address that owns the domain nodes',
        undefined,
        types.string
    )
    .addParam(
        'operator',
        'The address to check for operator approval',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { owner, operator, diamond } = taskArgs

        await isApprovedForAll(owner, operator, diamond, hre.ethers.provider)
    })
