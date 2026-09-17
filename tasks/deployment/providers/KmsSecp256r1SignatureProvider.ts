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
import {
    KMSClient,
    SignCommand,
    GetPublicKeyCommand,
} from '@aws-sdk/client-kms'
import { ISignatureProvider } from './ISignatureProvider'
import { NetworkConfigWithCurve } from '../../../types/hardhat'
import { DEFAULT_TX_GAS_LIMIT } from '../../../utils/constants'
import {
    decodeDerSignature,
    decodeDerPublicKeySpki,
    deriveAddressFromUncompressedPoint,
    canonicalizeSecp256r1Signature,
    findRecoveryParam,
} from '../../../utils/kmsSecp256r1Utils'

/**
 * Ethers v6 signer for a secp256r1 (P-256) AWS KMS key.
 *
 * Unlike KmsSignatureProvider (secp256k1), there is no @rumblefishdev/eth-signer-kms
 * equivalent for this curve: AWS KMS signs with SigningAlgorithm ECDSA_SHA_256 and
 * returns a DER-encoded signature, which this class decodes, canonicalizes (low-S)
 * and recovers a v/recoveryParam for using the same curve math already used by the
 * local-key Secp256r1Wallet (see utils/kmsSecp256r1Utils.ts).
 *
 * Signing follows Secp256r1Wallet's pattern exactly (manual legacy tx + explicit
 * r/s/v), not ethers' populateTransaction/broadcastTransaction flow — the caller
 * (KmsSecp256r1SignatureProvider) is expected to pass an already fully-formed
 * transaction and submit the result via eth_sendRawTransaction, since ethers'
 * standard signer-driven flow assumes secp256k1-shaped recoverability.
 */
class KmsSecp256r1EthersSigner extends ethers.AbstractSigner {
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
            const { PublicKey } = await this.kmsClient.send(
                new GetPublicKeyCommand({ KeyId: this.kmsKeyId })
            )
            if (!PublicKey) {
                throw new Error(
                    `AWS KMS returned no public key for ${this.kmsKeyId}`
                )
            }
            const point = decodeDerPublicKeySpki(PublicKey)
            this.cachedAddress = deriveAddressFromUncompressedPoint(point)
        }
        return this.cachedAddress
    }

    async signTransaction(transaction: TransactionRequest): Promise<string> {
        const address = await this.getAddress()

        // Transaction.from() expects TransactionLike (already-resolved values),
        // not TransactionRequest (which allows AddressLike/Promise fields) —
        // callers here always pass a fully-formed raw tx, never a promise field.
        const unsignedTx = ethers.Transaction.from(
            transaction as unknown as ethers.TransactionLike<string>
        )
        const signingHash = unsignedTx.unsignedHash

        const { Signature: derSignature } = await this.kmsClient.send(
            new SignCommand({
                KeyId: this.kmsKeyId,
                Message: ethers.getBytes(signingHash),
                MessageType: 'DIGEST',
                SigningAlgorithm: 'ECDSA_SHA_256',
            })
        )
        if (!derSignature) {
            throw new Error(
                `AWS KMS returned no signature for ${this.kmsKeyId}`
            )
        }

        const { r, s } = decodeDerSignature(derSignature)
        const recoveryParam = findRecoveryParam(
            ethers.getBytes(signingHash),
            r,
            s,
            address
        )
        const canonical = canonicalizeSecp256r1Signature(r, s, recoveryParam)

        const chainId = await this.provider!.getNetwork().then((n) => n.chainId)
        const v = chainId * 2n + 35n + BigInt(canonical.recoveryParam)

        unsignedTx.signature = {
            r: canonical.r,
            s: canonical.s,
            v: Number(v),
            networkV: Number(v),
            recoveryParam: canonical.recoveryParam,
        } as unknown as ethers.SignatureLike

        return unsignedTx.serialized
    }

    async signMessage(_message: string | Uint8Array): Promise<string> {
        throw new Error('signMessage is not supported for KMS secp256r1 signer')
    }

    async signTypedData(
        _domain: ethers.TypedDataDomain,
        _types: Record<string, ethers.TypedDataField[]>,
        _value: Record<string, unknown>
    ): Promise<string> {
        throw new Error(
            'signTypedData is not supported for KMS secp256r1 signer'
        )
    }

    async call(
        transaction: TransactionRequest,
        blockTag?: string | number
    ): Promise<string> {
        if (!this.provider) {
            throw new Error(
                'Provider not available on KmsSecp256r1EthersSigner'
            )
        }
        return this.provider.call({ ...transaction, blockTag })
    }

    connect(provider: Provider): KmsSecp256r1EthersSigner {
        return new KmsSecp256r1EthersSigner(this.kmsKeyId, provider)
    }
}

/**
 * ISignatureProvider implementation for AWS KMS keys backed by a P-256
 * (secp256r1) CMK. Uses raw transactions (build tx object -> sign ->
 * eth_sendRawTransaction), following Secp256r1SignatureProvider's pattern
 * rather than KmsSignatureProvider's ContractFactory/broadcastTransaction
 * pattern, since R1 needs the same bypass of ethers' internal
 * secp256k1-shaped assumptions that the local-key R1 provider already needed.
 *
 * Detected by curve === 'secp256r1' together with a kmsKeyId on the network
 * config — see SignatureProviderFactory for precedence versus the local-key
 * R1 provider and the k1 KMS provider.
 */
export class KmsSecp256r1SignatureProvider implements ISignatureProvider {
    private signer?: KmsSecp256r1EthersSigner

    constructor(private hre: HardhatRuntimeEnvironment) {}

    async getSigner(): Promise<Signer> {
        if (!this.signer) {
            const networkConfig = this.hre.config.networks[
                this.hre.network.name
            ] as NetworkConfigWithCurve
            const kmsKeyId = networkConfig.kmsKeyId as string

            this.signer = new KmsSecp256r1EthersSigner(
                kmsKeyId,
                this.hre.ethers.provider
            )

            console.log(
                `   🔐 KMS secp256r1 signer initialized: ${await this.signer.getAddress()}`
            )
        }
        return this.signer
    }

    async getAddress(): Promise<string> {
        const signer = (await this.getSigner()) as KmsSecp256r1EthersSigner
        return signer.getAddress()
    }

    async deployContract(
        contractName: string,
        bytecode: string,
        constructorArgs: unknown[] = [],
        constructorTypes: string[] = []
    ): Promise<string> {
        console.log(
            `   🔧 Deploying ${contractName} with AWS KMS secp256r1 signer (raw transactions)...`
        )

        const signer = (await this.getSigner()) as KmsSecp256r1EthersSigner

        let deployData = bytecode
        if (constructorArgs.length > 0 && constructorTypes.length > 0) {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder()
            const encodedArgs = abiCoder.encode(
                constructorTypes,
                constructorArgs
            )
            deployData = bytecode + encodedArgs.slice(2)
        }

        const deployerAddress = await signer.getAddress()
        const nonce =
            await this.hre.ethers.provider.getTransactionCount(deployerAddress)

        const deployTx = {
            nonce,
            gasPrice: this.hre.config.networks[this.hre.network.name].gasPrice,
            gasLimit: BigInt(DEFAULT_TX_GAS_LIMIT),
            to: undefined,
            value: 0n,
            data: deployData,
            chainId: (await this.hre.ethers.provider.getNetwork()).chainId,
        }

        const signedTx = await signer.signTransaction(deployTx)
        const response = await this.hre.ethers.provider.send(
            'eth_sendRawTransaction',
            [signedTx]
        )

        const receipt = await this.waitForTransaction(response, 1, 60000)
        if (!receipt || receipt.status !== 1) {
            console.log(receipt)
            throw new Error(`Failed to deploy ${contractName}`)
        }

        console.log(
            `   ✅ ${contractName} deployed at: ${receipt.contractAddress}`
        )
        return receipt.contractAddress!
    }

    async sendTransaction(
        transaction: TransactionRequest
    ): Promise<TransactionResponse> {
        const signer = (await this.getSigner()) as KmsSecp256r1EthersSigner
        const address = await signer.getAddress()

        const rawTx = {
            nonce:
                transaction.nonce ??
                (await this.hre.ethers.provider.getTransactionCount(address)),
            gasPrice:
                transaction.gasPrice ??
                this.hre.config.networks[this.hre.network.name].gasPrice,
            gasLimit: transaction.gasLimit ?? 5_000_000n,
            to: transaction.to,
            value: transaction.value ?? 0n,
            data: transaction.data ?? '0x',
            chainId: (await this.hre.ethers.provider.getNetwork()).chainId,
        }

        const signedTx = await signer.signTransaction(rawTx)
        const hash = await this.hre.ethers.provider.send(
            'eth_sendRawTransaction',
            [signedTx]
        )

        return {
            hash,
            from: address,
            to: rawTx.to,
            value: rawTx.value,
            gasLimit: rawTx.gasLimit,
            gasPrice: rawTx.gasPrice,
            nonce: rawTx.nonce,
            data: rawTx.data,
            chainId: Number(rawTx.chainId),
            wait: (confirmations?: number) =>
                this.waitForTransaction(hash, confirmations),
        } as TransactionResponse
    }

    async waitForTransaction(
        txHash: string,
        confirmations?: number,
        timeout: number = 60000
    ): Promise<import('ethers').TransactionReceipt | null> {
        console.log(`   ⏳ Waiting for transaction ${txHash}...`)

        let receipt = null
        let attempts = 0
        const maxAttempts = Math.floor(timeout / 1000)

        while (!receipt && attempts < maxAttempts) {
            try {
                receipt =
                    await this.hre.ethers.provider.getTransactionReceipt(txHash)
                if (receipt) {
                    console.log(
                        `   ✅ Transaction confirmed in block ${receipt.blockNumber}`
                    )
                    break
                }
            } catch {
                // Transaction not yet mined
            }

            await new Promise((resolve) => setTimeout(resolve, 1000))
            attempts++
        }

        if (!receipt) {
            throw new Error(`Timeout waiting for transaction ${txHash}`)
        }

        return receipt
    }

    getCurveType(): 'secp256r1' {
        return 'secp256r1'
    }

    isCompatibleWith(hre: HardhatRuntimeEnvironment): boolean {
        const networkConfig = hre.config.networks[
            hre.network.name
        ] as NetworkConfigWithCurve

        return (
            networkConfig.curve === 'secp256r1' &&
            Boolean(networkConfig.kmsKeyId)
        )
    }
}
