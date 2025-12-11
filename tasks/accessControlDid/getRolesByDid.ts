/**
 * @file getRolesByDid.ts
 * @description Hardhat task to get paginated roles assigned to a DID
 * @module tasks/accessControlDid
 */

/**
 npx hardhat getRolesByDid --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --page 1 \
  --pagesize 10 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getRolesByDid } from '../../scripts/accessControlDid/getRolesByDid'

task('getRolesByDid', 'Gets paginated roles assigned to a DID')
    .addParam('did', 'The DID hash (bytes32)', undefined, types.string)
    .addParam('page', 'Page index (starting from 0)', 0, types.int, true)
    .addParam('pagesize', 'Number of items per page', 10, types.int, true)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, page, pagesize, diamond } = taskArgs
        return getRolesByDid(did, page, pagesize, diamond, hre.ethers.provider)
    })
