import { task, types } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { facetUpdates } from '../../../scripts/diamond/cut/facetUpdates'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat facetUpdates --network localhost \
  --facet-addresses '["0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"]' \
  --init '0x1234567812345678' \
  --calldata '0x1234567812345678' \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

dotenv.config()

task('facetUpdates', 'updates a diamond')
    .addParam(
        'facetAddresses',
        'The addresses of the facets to update',
        undefined,
        types.json
    )
    .addParam('init', 'The init address')
    .addParam('calldata', 'The calldata bytes')
    .addParam('diamond', 'The diamond contract address')
    .setAction(
        async (
            taskArgs: {
                facetAddresses: string[]
                actions: number[]
                items: string[][]
                init: string
                calldata: string
                diamond: string
            },
            hre
        ) => {
            const { facetAddresses, init, calldata, diamond } = taskArgs

            const signer = getSigner(hre)

            const result = await facetUpdates(
                facetAddresses,
                init,
                calldata,
                diamond,
                signer
            )

            console.log('Facet Updates result:', result)
        }
    )
