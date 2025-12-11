/**
 * @file getDidsByController.ts
 * @description Hardhat task to retrieve DIDs controlled by a specific controller
 * @module tasks/didController
 */

/**
 npx hardhat getDidsByController --network localhost \
  --controller 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --page 1 \
  --pagesize 10 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDidsByController } from '../../scripts/didController/getDidsByController'

task(
    'getDidsByController',
    'Gets a paginated list of DIDs controlled by a specific controller'
)
    .addParam(
        'controller',
        'The controller identifier (bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'page',
        'Page number to retrieve (starting from 0)',
        0,
        types.int,
        true
    )
    .addParam('pagesize', 'Number of items per page', 10, types.int, true)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { controller, page, pagesize, diamond } = taskArgs
        return getDidsByController(
            controller,
            page,
            pagesize,
            diamond,
            hre.ethers.provider
        )
    })
