/**
 * @file initializeDiDRegistry.ts
 * @description Hardhat task to initialize the DID Registry with an elliptic type
 * @module tasks/didDocument
 *
 * Usage:
    npx hardhat didDocument:initializeDiDRegistry \
      --diamond 0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10 \
      --elliptictype 1 \
      --network localhost
 *
 * Elliptic Types:
 *   1 = SECP_256_K1 (standard Ethereum keys)
 *   2 = SECP_256_R1 (NIST P-256 keys)
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getSignatureProvider } from '../../utils/signature-provider'
import { initializeDiDRegistry } from '../../scripts/didDocument/initializeDiDRegistry'

task(
    'didDocument:initializeDiDRegistry',
    'Initialize the DID Registry with a network-wide elliptic type (one-time setup)'
)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .addParam(
        'elliptictype',
        'Elliptic curve type (1=SECP_256_K1, 2=SECP_256_R1)',
        undefined,
        types.int
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { diamond, elliptictype } = taskArgs
        return initializeDiDRegistry(
            elliptictype,
            diamond,
            await getSignatureProvider(hre)
        )
    })
