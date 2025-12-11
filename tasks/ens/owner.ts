import { task, types } from 'hardhat/config'
import { owner } from '../../scripts/ens/owner'

/**
 npx hardhat ensOwner --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensOwner', 'Gets the owner address of an ENS node')
    .addParam(
        'node',
        'The node hash to query for ownership',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, diamond } = taskArgs

        await owner(node, diamond, hre.ethers.provider)
    })
