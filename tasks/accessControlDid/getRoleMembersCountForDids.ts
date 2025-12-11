/**
 * @file getRoleMembersCountForDids.ts
 * @description Hardhat task to get the count of DIDs that have a specific role
 * @module tasks/accessControlDid
 */

/**
 npx hardhat getRoleMembersCountForDids --network localhost \
  --role 0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getRoleMembersCountForDids } from '../../scripts/accessControlDid/getRoleMembersCountForDids'

task(
    'getRoleMembersCountForDids',
    'Gets the count of DIDs that have a specific role'
)
    .addParam('role', 'The role identifier (bytes32)', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { role, diamond } = taskArgs
        return getRoleMembersCountForDids(role, diamond, hre.ethers.provider)
    })
