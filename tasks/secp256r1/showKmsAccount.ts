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
----------------------------------------------------------------------------------- */
// tasks/secp256r1/showKmsAccount.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    KMSClient,
    DescribeKeyCommand,
    GetPublicKeyCommand,
} from '@aws-sdk/client-kms'
import { NetworkConfigWithCurve } from '../../types/hardhat'
import {
    decodeDerPublicKeySpki,
    deriveAddressFromUncompressedPoint,
} from '../../utils/kmsSecp256r1Utils'

/**
 * Task to display the Ethereum-style address for a secp256r1 (P-256) AWS KMS key,
 * without needing a live signature — a sanity check step for ISBECORE-175 (compare
 * this against `aws kms get-public-key` directly, and against what the deployed
 * KmsSecp256r1SignatureProvider reports when actually signing).
 *
 * There is no private key to display here (unlike show-secp256r1-accounts) — KMS
 * never exposes one.
 */
task(
    'show-kms-secp256r1-account',
    'Display the Ethereum-style address for the network-configured secp256r1 AWS KMS key'
).setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log('=== KMS secp256r1 Account Information ===')

    const networkConfig = hre.config.networks[
        hre.network.name
    ] as NetworkConfigWithCurve

    if (networkConfig.curve !== 'secp256r1') {
        console.warn(
            `⚠️  Network ${hre.network.name} is not configured for curve secp256r1 (curve: ${networkConfig.curve})`
        )
        return
    }

    const kmsKeyId = networkConfig.kmsKeyId
    if (!kmsKeyId) {
        console.error(
            `❌ No kmsKeyId configured for network ${hre.network.name} (set KMS_KEY_ID)`
        )
        return
    }

    console.log(`Network:  ${hre.network.name}`)
    console.log(`KMS Key:  ${kmsKeyId}`)

    const kmsClient = new KMSClient()

    const describeKeyResult = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
    )
    const keyMetadata = describeKeyResult.KeyMetadata

    console.log(`KeySpec:  ${keyMetadata?.KeySpec}`)
    console.log(`KeyUsage: ${keyMetadata?.KeyUsage}`)
    console.log(`Enabled:  ${keyMetadata?.Enabled}`)

    if (keyMetadata?.KeySpec !== 'ECC_NIST_P256') {
        console.warn(
            `⚠️  Expected KeySpec ECC_NIST_P256 for a secp256r1 key, got ${keyMetadata?.KeySpec}`
        )
    }

    const { PublicKey } = await kmsClient.send(
        new GetPublicKeyCommand({ KeyId: kmsKeyId })
    )
    if (!PublicKey) {
        console.error(`❌ AWS KMS returned no public key for ${kmsKeyId}`)
        return
    }

    const point = decodeDerPublicKeySpki(PublicKey)
    const address = deriveAddressFromUncompressedPoint(point)

    console.log('')
    console.log(`📍 Address: ${address}`)
    console.log('')
    console.log(
        '💡 Cross-check: `aws kms get-public-key --key-id ' +
            kmsKeyId +
            '` should return the same public key.'
    )
})
