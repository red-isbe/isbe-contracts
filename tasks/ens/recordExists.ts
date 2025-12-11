import { task, types } from 'hardhat/config'
import { recordExists } from '../../scripts/ens/recordExists'

/**
 npx hardhat ensRecordExists --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensRecordExists', 'Checks if an ENS record exists for a node')
    .addParam(
        'node',
        'The node hash to check for record existence',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, diamond } = taskArgs

        await recordExists(node, diamond, hre.ethers.provider)
    })
