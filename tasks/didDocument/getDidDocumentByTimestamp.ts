/**
 * @file getDidDocumentByTimestamp.ts
 * @description Hardhat task to retrieve a DID document at a specific historical timestamp
 * @module tasks/didDocument
 */

/**
 npx hardhat getDidDocumentByTimestamp --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --timestamp 1733356800 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDidDocumentByTimestamp } from '../../scripts/didDocument/getDidDocumentByTimestamp'

task(
    'getDidDocumentByTimestamp',
    'Gets a DID document as it existed at a specific historical timestamp'
)
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'timestamp',
        'Unix timestamp for historical document state',
        undefined,
        types.int
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, timestamp, diamond } = taskArgs
        return getDidDocumentByTimestamp(
            did,
            timestamp,
            diamond,
            hre.ethers.provider
        )
    })
