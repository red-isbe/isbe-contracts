import { task, types } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { diamondCut } from '../../../scripts/diamond/cut/diamondCut'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat diamondCut --network localhost \
  --facet-addresses '["0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"]' \
  --actions '[1,1]' \
  --items '[["0x12345678","0x12345678"],["0x12345678","0x12345678"]]' \
  --init '0x1234567812345678' \
  --calldata '0x1234567812345678' \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('diamondCut', 'updates a diamond')
    .addParam(
        'facetAddresses',
        'The addresses of the facets to update',
        undefined,
        types.json
    )
    .addParam('actions', 'The array of actions number', undefined, types.json)
    .addParam(
        'items',
        'The two dimensional bytes4 items',
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
            const { facetAddresses, actions, items, init, calldata, diamond } =
                taskArgs

            const signer = await getSigner(hre)

            const result = await diamondCut(
                facetAddresses,
                actions,
                items,
                init,
                calldata,
                diamond,
                signer
            )

            console.log('Diamond Cut result:', result)
        }
    )
