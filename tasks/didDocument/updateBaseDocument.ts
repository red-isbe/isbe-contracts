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
 * @file updateBaseDocument.ts
 * @description Hardhat task to update the base document of a DID
 * @module tasks/didDocument
 */

/**
 npx hardhat updateBaseDocument --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --basedocument '{"@context":"https://www.w3.org/ns/did/v1","id":"did:alastria:00000001"}' \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { updateBaseDocument } from '../../scripts/didDocument/updateBaseDocument'
import { getSignatureProvider } from '../../utils/signature-provider'

task(
    'updateBaseDocument',
    'Updates the base document content of an existing DID'
)
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'basedocument',
        'New base JSON-LD document content',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, basedocument, diamond } = taskArgs
        return updateBaseDocument(
            did,
            basedocument,
            diamond,
            await getSignatureProvider(hre)
        )
    })
