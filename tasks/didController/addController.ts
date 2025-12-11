/**
 * @file addController.ts
 * @description Hardhat task to add a controller to a DID
 * @module tasks/didController
 */

/**
 * ⚠️ WARNING: The --controller parameter must be an already-registered DID.
 * Do NOT use the same DID as --did if it is already a controller; it will trigger DidIsControlledBy.
 * Change the value before running the examples.
 *
 npx hardhat addController --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --controller 0x81937c3e4c9d61ee5f01777ce2e10e2c7f422e00c1b9ad614475f351a5df6919 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addController } from '../../scripts/didController/addController'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

task('addController', 'Adds a new controller to a DID')
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'controller',
        'The controller identifier to add (bytes32)',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, controller, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        return addController(did, controller, diamond, signatureProvider)
    })
