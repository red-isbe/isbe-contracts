/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
/**
 * @file addVerificationMethod.ts
 * @description Hardhat task to add a verification method to a DID
 * @module tasks/didVerificationMethod
 */

/**
 * ⚠️ WARNING: The --vmethodid must be NEW and the DID must already exist.
 * If the key already exists you will see PublicKeyAlreadyInUse. If the method exists, VerificationMethodExists.
 *
 npx hardhat addVerificationMethod --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --vmethodid 0x9999999999999999999999999999999999999999999999999999999999999999 \
  --publickey 0x045f1e2d3c4b6a79880796a5b4c3d2e1f0a9b8c7d6e5f4123456789abcdef00112233445566778899aabbccddeeff1029384756a1b2c3d4e5f60718293a4b5c6d7 \
  --elliptictype 1 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addVerificationMethod } from '../../scripts/didVerificationMethod/addVerificationMethod'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

task('addVerificationMethod', 'Adds a verification method to a DID')
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'vmethodid',
        'Verification Method ID (bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'publickey',
        'Public key bytes (hex string)',
        undefined,
        types.string
    )
    .addParam(
        'elliptictype',
        'Elliptic curve type (0=NONE, 1=SECP_256_K1, 2=SECP_256_R1)',
        undefined,
        types.int
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, vmethodid, publickey, elliptictype, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        return addVerificationMethod(
            hre,
            did,
            vmethodid,
            publickey,
            elliptictype,
            diamond,
            signatureProvider
        )
    })
