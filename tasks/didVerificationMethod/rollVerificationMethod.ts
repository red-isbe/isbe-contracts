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
 * @file rollVerificationMethod.ts
 * @description Hardhat task to roll a verification method (key rotation)
 * @module tasks/didVerificationMethod
 */

/**
 * ⚠️ WARNING: oldVMethodId must exist and the new vMethodId/publicKey must be new.
 * notBefore/notAfter/duration must be coherent. The ellipticType must match the network.
 *
 npx hardhat rollVerificationMethod --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --vmethodid 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --publickey 0x0477c8231a995dd9bcdfe9ab0b20cfb64a63486a5c2b7e1519bad0d0d5a793102cee664f645dd5bb58b2f9b9f453f3dcd89e5cd9a39af51ed245032e0cd8477221 \
  --elliptictype 1 \
  --notbefore 1893456000 \
  --notafter 1896058000 \
  --oldvmethodid 0x9999999999999999999999999999999999999999999999999999999999999999 \
  --duration 2592000 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { rollVerificationMethod } from '../../scripts/didVerificationMethod/rollVerificationMethod'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

task(
    'rollVerificationMethod',
    'Rolls (rotates) a verification method to a new key'
)
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'vmethodid',
        'New verification method ID (bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'publickey',
        'New public key bytes (hex string)',
        undefined,
        types.string
    )
    .addParam(
        'elliptictype',
        'Elliptic curve type (0=NONE, 1=SECP_256_K1, 2=SECP_256_R1)',
        undefined,
        types.int
    )
    .addParam(
        'notbefore',
        'Unix timestamp when new method is valid',
        undefined,
        types.int
    )
    .addParam(
        'notafter',
        'Unix timestamp when new method expires',
        undefined,
        types.int
    )
    .addParam(
        'oldvmethodid',
        'Existing verification method ID to replace (bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'duration',
        'Validity duration (seconds) for the new method',
        undefined,
        types.int
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const {
            did,
            vmethodid,
            publickey,
            elliptictype,
            notbefore,
            notafter,
            oldvmethodid,
            duration,
            diamond,
        } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        return rollVerificationMethod(
            hre,
            did,
            vmethodid,
            publickey,
            elliptictype,
            notbefore,
            notafter,
            oldvmethodid,
            duration,
            diamond,
            signatureProvider
        )
    })
