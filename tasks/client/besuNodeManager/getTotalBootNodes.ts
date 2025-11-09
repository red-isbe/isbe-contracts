import { task, types } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getTotalBootNodes } from '../../../scripts/client/besuNodeManager/getTotalBootNodes'

/**
 npx hardhat getTotalBootNodes --network dev \
  --besu-node-manager-address "0xCc979C27AeB74D13f73B2621b799b7221c1C9B4C" \
 --state 1
 */
task('getTotalBootNodes', 'Returns the number of BootNodes registered')
    .addParam(
        'besuNodeManagerAddress',
        'The address of the proxy associated to besuNodeManagerFacet',
        undefined,
        types.string
    )
    .addParam('state', '1: ACTIVE, 2 : QUARANTINE', 1, types.int)
    .setAction(
        async (
            taskArgs: {
                besuNodeManagerAddress: string
                state: number
            },
            hre
        ) => {
            const { besuNodeManagerAddress, state } = taskArgs

            const signer = await getSigner(hre)

            const result = await getTotalBootNodes(
                besuNodeManagerAddress,
                state,
                signer
            )

            console.log(
                'BootNodes registered length: ',
                Number(result.BootNodesLength)
            )
        }
    )
