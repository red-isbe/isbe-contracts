import { task, types } from 'hardhat/config'
import { resolver } from '../../scripts/ens/resolver'

/**
 npx hardhat ensResolver --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensResolver', 'Gets the resolver address of an ENS node')
    .addParam(
        'node',
        'The node hash to query for its resolver',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, diamond } = taskArgs

        await resolver(node, diamond, hre.ethers.provider)
    })
