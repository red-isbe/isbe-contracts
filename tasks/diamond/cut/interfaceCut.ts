import { task, types } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { interfaceCut } from '../../../scripts/diamond/cut/interfaceCut'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat interfaceCut --network localhost \
  --facet-addresses '["0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"]' \
  --actions '[1,1]' \
  --items '[["0x12345678","0x12345678"],["0x12345678","0x12345678"]]' \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('interfaceCut', 'updates a diamond')
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
    .addParam('diamond', 'The diamond contract address')
    .setAction(
        async (
            taskArgs: {
                facetAddresses: string[]
                actions: number[]
                items: string[][]
                diamond: string
            },
            hre
        ) => {
            const { facetAddresses, actions, items, diamond } = taskArgs

            const signer = getSigner(hre)

            const result = await interfaceCut(
                facetAddresses,
                actions,
                items,
                diamond,
                signer
            )

            console.log('Interface Cut result:', result)
        }
    )
