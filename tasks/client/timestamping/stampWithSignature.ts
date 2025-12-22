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
import { stampWithSignature } from '../../../scripts/client/timestamping/stampWithSignature'

/**
 npx hardhat stampWithSignature --network localhost \
  --original-hash "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  --tsa-hash "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" \
  --external-reference-id "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321" \
  --sender "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --expiration-timestamp 1735689600 \
  --nonce 1 \
  --signature "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'stampWithSignature',
    'Stamps a hash set with EIP712 signature verification'
)
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
    .addParam(
        'sender',
        'The address of the signer (requester)',
        undefined,
        types.string
    )
    .addParam(
        'expirationTimestamp',
        'The expiration timestamp for the signature',
        undefined,
        types.int
    )
    .addParam(
        'nonce',
        'The nonce to prevent replay attacks',
        undefined,
        types.int
    )
    .addParam('signature', 'The EIP712 signature', undefined, types.string)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const {
            originalHash,
            tsaHash,
            externalReferenceId,
            sender,
            expirationTimestamp,
            nonce,
            signature,
            diamond,
        } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await stampWithSignature(
            {
                originalHash,
                tsaHash,
                externalReferenceId,
                sender,
                expirationTimestamp,
                nonce,
                signature,
            },
            diamond,
            signatureProvider
        )
    })
