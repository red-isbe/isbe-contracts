/**
 * @file getDidDocument.ts
 * @description Hardhat task to retrieve a complete DID document from the Diamond
 * @module tasks/didDocument
 */

/**
 npx hardhat getDidDocument --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDidDocument } from '../../scripts/didDocument/getDidDocument'

task('getDidDocument', 'Gets a complete DID document from the Diamond')
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, diamond } = taskArgs
        return getDidDocument(did, diamond, hre.ethers.provider)
    })
