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
import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { stamp } from '../../../scripts/client/timestamping/stamp'

/**
 npx hardhat stamp --network localhost \
  --original-hash "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdea" \
  --tsa-hash "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891" \
  --external-reference-id "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654322" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('stamp', 'Stamps a hash set in the TimeStampingRegistry')
    .addParam(
        'originalHash',
        'The original hash to be stamped (primary key)',
        undefined,
        types.string
    )
    .addParam(
        'tsaHash',
        'The TimeStamping Authority response hash',
        undefined,
        types.string
    )
    .addParam(
        'externalReferenceId',
        'The external reference ID associated with the hashes',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { originalHash, tsaHash, externalReferenceId, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await stamp(
            hre,
            originalHash,
            tsaHash,
            externalReferenceId,
            diamond,
            signatureProvider
        )
    })
