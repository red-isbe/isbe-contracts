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
import {
    Signer,
    TransactionRequest,
    TransactionResponse,
    ethers,
    Provider,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { KMSClient } from '@aws-sdk/client-kms'
import {
    getEthAddressFromKMS,
    createSignature,
} from '@rumblefishdev/eth-signer-kms'
import { ISignatureProvider } from './ISignatureProvider'
import { DEFAULT_TX_GAS_LIMIT } from '../../../utils/constants'

/**
 * Ethers v6 signer backed by AWS KMS.
 *
 * @rumblefishdev/hardhat-kms-signer wraps hre.network.provider (ethers v5 pattern)
 * and does not hook into @nomicfoundation/hardhat-ethers getSigners(). This class
 * bypasses the plugin's provider wrapping and calls the AWS SDK directly.
 */
class KmsEthersSigner extends ethers.AbstractSigner {
    private kmsClient: KMSClient
    private cachedAddress?: string

    constructor(
        private kmsKeyId: string,
        provider: Provider
    ) {
        super(provider)
        this.kmsClient = new KMSClient()
    }

    async getAddress(): Promise<string> {
        if (!this.cachedAddress) {
            this.cachedAddress = await getEthAddressFromKMS({
                keyId: this.kmsKeyId,
                kmsInstance: this.kmsClient,
            })
        }
        return this.cachedAddress
    }

    async signTransaction(tx: TransactionRequest): Promise<string> {
        const address = await this.getAddress()
        const populated = await this.populateTransaction(tx)
        // ethers v6 Transaction.from() rejects 'from' — it is not part of the
        // encoded tx (sender is recovered from the signature after signing).
        const { from: _from, ...txWithoutFrom } = populated
        const transaction = ethers.Transaction.from(txWithoutFrom)
        // createSignature returns { r, s, v } where v is 0 or 1 (recovery param)
        const sig = (await createSignature({
            kmsInstance: this.kmsClient,
            keyId: this.kmsKeyId,
            message: transaction.unsignedHash,
            address,
        })) as { r: string; s: string; v: number }
        transaction.signature = ethers.Signature.from({
            r: sig.r,
            s: sig.s,
            yParity: sig.v as 0 | 1,
        })
        return transaction.serialized
    }

    async sendTransaction(
        tx: TransactionRequest
    ): Promise<TransactionResponse> {
        if (!tx.gasLimit) {
            tx = { ...tx, gasLimit: DEFAULT_TX_GAS_LIMIT }
        }
        const signedTx = await this.signTransaction(tx)
        return this.provider!.broadcastTransaction(signedTx)
    }

    async signMessage(_message: string | Uint8Array): Promise<string> {
        throw new Error('signMessage is not supported for KMS signer')
    }

    async signTypedData(
        _domain: ethers.TypedDataDomain,
        _types: Record<string, ethers.TypedDataField[]>,
        _value: Record<string, unknown>
    ): Promise<string> {
        throw new Error('signTypedData is not supported for KMS signer')
    }

    connect(provider: Provider): KmsEthersSigner {
        return new KmsEthersSigner(this.kmsKeyId, provider)
    }
}

/**
 * ISignatureProvider implementation for AWS KMS keys (secp256k1).
 * Detected by the presence of kmsKeyId in the network config, which is
 * copied into hre.network.config by @rumblefishdev/hardhat-kms-signer's extendConfig.
 */
export class KmsSignatureProvider implements ISignatureProvider {
    private signer?: Signer

    constructor(private hre: HardhatRuntimeEnvironment) {}

    async getSigner(): Promise<Signer> {
        if (!this.signer) {
            const kmsKeyId = (
                this.hre.network.config as unknown as Record<string, unknown>
            )['kmsKeyId'] as string
            this.signer = new KmsEthersSigner(
                kmsKeyId,
                this.hre.ethers.provider
            )
        }
        return this.signer
    }

    async getAddress(): Promise<string> {
        const signer = await this.getSigner()
        return await signer.getAddress()
    }

    async deployContract(
        contractName: string,
        bytecode: string,
        constructorArgs: unknown[] = [],
        constructorTypes: string[] = []
    ): Promise<string> {
        console.log(`   🔧 Deploying ${contractName} with AWS KMS signer...`)

        const signer = await this.getSigner()

        let deployData = bytecode
        if (constructorArgs.length > 0 && constructorTypes.length > 0) {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder()
            const encodedArgs = abiCoder.encode(
                constructorTypes,
                constructorArgs
            )
            deployData = bytecode + encodedArgs.slice(2)
        }

        const factory = new ethers.ContractFactory([], deployData, signer)
        const contract = await factory.deploy({
            gasLimit: DEFAULT_TX_GAS_LIMIT,
        })
        await contract.waitForDeployment()

        const address = await contract.getAddress()
        console.log(`   ✅ ${contractName} deployed at: ${address}`)

        return address
    }

    async sendTransaction(
        transaction: TransactionRequest
    ): Promise<TransactionResponse> {
        const signer = await this.getSigner()
        return await (signer as KmsEthersSigner).sendTransaction(transaction)
    }

    async waitForTransaction(
        txHash: string,
        confirmations: number = 1,
        timeout: number = 60000
    ): Promise<import('ethers').TransactionReceipt | null> {
        return await this.hre.ethers.provider.waitForTransaction(
            txHash,
            confirmations,
            timeout
        )
    }

    getCurveType(): 'secp256k1' {
        return 'secp256k1'
    }

    isCompatibleWith(hre: HardhatRuntimeEnvironment): boolean {
        // @rumblefishdev/hardhat-kms-signer's extendConfig copies kmsKeyId from
        // userConfig into hre.network.config, so we can read it from the resolved config.
        return Boolean(
            (hre.network.config as unknown as Record<string, unknown>)[
                'kmsKeyId'
            ]
        )
    }
}
