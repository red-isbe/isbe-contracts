/**
 * @file revokeController.ts
 * @description Hardhat task to revoke a controller from a DID
 * @module tasks/didController
 */

/**
 * ⚠️ WARNING: The --controller parameter must be a DID currently assigned as a controller.
 * If it is not, you will see DidIsNotControlledBy. If it is the last controller, you will see CannotLeaveDidWithoutControllers.
 * Change the value before running the examples.
 *
 npx hardhat revokeController --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --controller 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { revokeController } from '../../scripts/didController/revokeController'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

task('revokeController', 'Revokes a controller from a DID')
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'controller',
        'The controller identifier to revoke (bytes32)',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, controller, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        return revokeController(did, controller, diamond, signatureProvider)
    })
