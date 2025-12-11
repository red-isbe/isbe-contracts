/**
 * @file checkControllerByBytes.ts
 * @description Hardhat task to check if an address is a controller for a DID (using bytes)
 * @module tasks/didController
 */

/**
 npx hardhat checkControllerByBytes --network localhost \
  --did "0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de" \
  --controller "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { checkControllerByBytes } from '../../scripts/didController/checkControllerByBytes'

task(
    'checkControllerByBytes',
    'Checks if an address is an authorized controller for the specified DID (bytes format)'
)
    .addParam(
        'did',
        'The DID identifier in bytes format',
        undefined,
        types.string
    )
    .addParam(
        'controller',
        'The address to verify as a controller',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, controller, diamond } = taskArgs
        return checkControllerByBytes(
            did,
            controller,
            diamond,
            hre.ethers.provider
        )
    })
