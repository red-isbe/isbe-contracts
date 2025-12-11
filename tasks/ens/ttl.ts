import { task, types } from 'hardhat/config'
import { ttl } from '../../scripts/ens/ttl'

/**
 npx hardhat ensTtl --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensTtl', 'Gets the TTL (time-to-live) of an ENS node')
    .addParam(
        'node',
        'The node hash to query for its TTL',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, diamond } = taskArgs

        await ttl(node, diamond, hre.ethers.provider)
    })
