/**
 * @file hasRoleForDid.ts
 * @description Hardhat task to check if a DID has a specific role
 * @module tasks/accessControlDid
 */

/**
 npx hardhat hasRoleForDid --network localhost \
  --role 0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973 \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { hasRoleForDid } from '../../scripts/accessControlDid/hasRoleForDid'

task('hasRoleForDid', 'Checks if a DID has a specific role')
    .addParam('role', 'The role identifier (bytes32)', undefined, types.string)
    .addParam('did', 'The DID hash (bytes32)', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { role, did, diamond } = taskArgs
        return hasRoleForDid(role, did, diamond, hre.ethers.provider)
    })
