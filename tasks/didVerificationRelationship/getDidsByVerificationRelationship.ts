/**
 * @file getDidsByVerificationRelationship.ts
 * @description Hardhat task to list DIDs linked to a verification relationship
 * @module tasks/didVerificationRelationship
 */

/**
 npx hardhat getDidsByVerificationRelationship --network localhost \
  --vmethodid 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --name "authentication" \
  --page 1 \
  --pagesize 10 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDidsByVerificationRelationship } from '../../scripts/didVerificationRelationship/getDidsByVerificationRelationship'

// Read: getDidsByVerificationRelationship(bytes32,string,uint256,uint256)
task(
    'getDidsByVerificationRelationship',
    'Gets paginated DIDs for a verification relationship'
)
    .addParam(
        'vmethodid',
        'Verification Method ID (bytes32)',
        undefined,
        types.string
    )
    .addParam('name', 'Relationship name', undefined, types.string)
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
        const { vmethodid, name, page, pagesize, diamond } = taskArgs
        return getDidsByVerificationRelationship(
            vmethodid,
            name,
            page,
            pagesize,
            diamond,
            hre.ethers.provider
        )
    })
