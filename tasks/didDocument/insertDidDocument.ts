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
 * @file insertDidDocument.ts
 * @description Hardhat task to insert a new DID document (DID must NOT exist yet)
 * @module tasks/didDocument
 */

/**
 * ⚠️ The DID must not exist (throws DidAlreadyExists). Use a fresh DID; if you already inserted the first one, do not reuse it.
 *
 npx hardhat insertDidDocument --network localhost \
  --did 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --basedocument '{"@context":"https://www.w3.org/ns/did/v2","id":"did:alastria:00000002"}' \
  --vmethodid 0x81937c3e4c9d61ee5f01777ce2e10e2c7f422e00c1b9ad614475f351a5df6920 \
  --publickey 0x042b6d0db1e37fb2614a8eae290c70b00f2f54ab5368585d98b05a3d5af38e99fe46a7caabae4792260eb498db844dddfcfd214c48395f87ac4cbfc636f1a3de4f \
  --elliptictype 1 \
  --notbefore 1764850269 \
  --notafter 1796386269 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { insertDidDocument } from '../../scripts/didDocument/insertDidDocument'
import { getSignatureProvider } from '../../utils/signature-provider'

task(
    'insertDidDocument',
    'Inserts a new DID document for an existing DID (requires first document to exist)'
)
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'basedocument',
        'Base JSON-LD document content',
        undefined,
        types.string
    )
    .addParam(
        'vmethodid',
        'Unique identifier for the verification method (bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'publickey',
        'Public key bytes for cryptographic verification',
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
        'Unix timestamp when verification method becomes valid',
        undefined,
        types.int
    )
    .addParam(
        'notafter',
        'Unix timestamp when verification method expires',
        undefined,
        types.int
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const {
            did,
            basedocument,
            vmethodid,
            publickey,
            elliptictype,
            notbefore,
            notafter,
            diamond,
        } = taskArgs

        return insertDidDocument(
            did,
            basedocument,
            vmethodid,
            publickey,
            elliptictype,
            notbefore,
            notafter,
            diamond,
            await getSignatureProvider(hre)
        )
    })
