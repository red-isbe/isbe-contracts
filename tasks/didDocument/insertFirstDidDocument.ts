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
 * @file insertFirstDidDocument.ts
 * @description Hardhat task to insert the first DID document (requires DID_REGISTRY_ROLE)
 * @module tasks/didDocument
 */

/** Grant Role First
 * 
  npx hardhat grantRole \
  --network localhost \
  --role "0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973" \
  --account "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

/**
 npx hardhat insertFirstDidDocument --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --basedocument '{"@context":"https://www.w3.org/ns/did/v1","id":"did:alastria:00000001"}' \
  --vmethodid 0x81937c3e4c9d61ee5f01777ce2e10e2c7f422e00c1b9ad614475f351a5df6919 \
  --proof 0x9311bce9a64f00c75082aab0b06f814e4b955d593991e029d4c5db245d122c3f025602b7292867ffa49c74b5d9c72077e08fd392124236d93b81914f3d6e3a3e1b \
  --publickey 0x042b6d0db1e37fb2614a8eae290c70b00f2f54ab5368585d98b05a3d5af38e99fe46a7caabae4792260eb498db844dddfcfd214c48395f87ac4cbfc636f1a3de4f \
  --elliptictype 1 \
  --notbefore 1764850269 \
  --notafter 1796386269 \
  --alsoknownas "irn:orgs:alastria" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { insertFirstDidDocument } from '../../scripts/didDocument/insertFirstDidDocument'
import { getSignatureProvider } from '../../utils/signature-provider'

task(
    'insertFirstDidDocument',
    'Inserts the first DID document with cryptographic proof (requires DID_REGISTRY_ROLE)'
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
        'proof',
        'Cryptographic proof to validate against public key and DID',
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
    .addParam(
        'alsoknownas',
        'Alternative identifier for the entity (e.g., irn:orgs:inetum)',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const {
            did,
            basedocument,
            vmethodid,
            proof,
            publickey,
            elliptictype,
            notbefore,
            notafter,
            alsoknownas,
            diamond,
        } = taskArgs

        return insertFirstDidDocument(
            did,
            basedocument,
            vmethodid,
            proof,
            publickey,
            elliptictype,
            notbefore,
            notafter,
            alsoknownas,
            diamond,
            await getSignatureProvider(hre)
        )
    })
