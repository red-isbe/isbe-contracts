/**
 * @file getRolesByDidLength.ts
 * @description Hardhat task to get the count of roles assigned to a DID
 * @module tasks/accessControlDid
 */

/**
 npx hardhat getRolesByDidLength --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getRolesByDidLength } from '../../scripts/accessControlDid/getRolesByDidLength'

task('getRolesByDidLength', 'Gets the count of roles assigned to a DID')
    .addParam('did', 'The DID hash (bytes32)', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, diamond } = taskArgs
        return getRolesByDidLength(did, diamond, hre.ethers.provider)
    })
