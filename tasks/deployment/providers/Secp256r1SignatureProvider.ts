import { Signer, TransactionRequest, TransactionResponse, ethers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ISignatureProvider } from './ISignatureProvider'
import { NetworkConfigWithCurve } from '../../../types/hardhat'
import { Secp256r1Wallet } from '../../../utils/Secp256r1Wallet'

/**
 * Secp256r1 signature provider using raw transactions
 * Encapsulates all the complexity of secp256r1 signing and deployment
 */
export class Secp256r1SignatureProvider implements ISignatureProvider {
    private signer?: Signer
    private wallet?: Secp256r1Wallet

    constructor(private hre: HardhatRuntimeEnvironment) {}

    async getSigner(): Promise<Signer> {
        if (!this.signer) {
            await this.initializeWallet()
        }
        return this.signer!
    }

    async getAddress(): Promise<string> {
        if (!this.wallet) {
            await this.initializeWallet()
        }
        return await this.wallet.getAddress()
    }

    private async initializeWallet(): Promise<void> {
        const networkConfig = this.hre.config.networks[
            this.hre.network.name
        ] as NetworkConfigWithCurve

        if (
            !networkConfig.secp256r1Accounts ||
            networkConfig.secp256r1Accounts.length === 0
        ) {
            throw new Error(
                `No secp256r1 accounts configured for network ${this.hre.network.name}`
            )
        }

        const secp256r1Account = networkConfig.secp256r1Accounts[0]
        const privateKey = secp256r1Account.privateKey.startsWith('0x')
            ? secp256r1Account.privateKey
            : '0x' + secp256r1Account.privateKey

        this.wallet = new Secp256r1Wallet(privateKey, this.hre.ethers.provider)
        this.signer = this.wallet

        console.log(
            `   🔐 secp256r1 wallet initialized: ${await this.wallet.getAddress()}`
        )
    }

    async deployContract(
        contractName: string,
        bytecode: string,
        constructorArgs: unknown[] = [],
        constructorTypes: string[] = []
    ): Promise<string> {
        console.log(
            `   🔧 Deploying ${contractName} with secp256r1 raw transactions...`
        )

        if (!this.wallet) {
            await this.initializeWallet()
        }

        // Prepare deployment data
        let deployData = bytecode
        if (constructorArgs.length > 0 && constructorTypes.length > 0) {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder()
            const encodedArgs = abiCoder.encode(
                constructorTypes,
                constructorArgs
            )
            deployData = bytecode + encodedArgs.slice(2)
        }

        // Get fresh nonce to avoid race conditions
        const deployerAddress = await this.wallet.getAddress()
        const nonce =
            await this.hre.ethers.provider.getTransactionCount(deployerAddress)

        // Create deployment transaction
        const deployTx = {
            nonce: nonce,
            gasPrice: 0n,
            gasLimit: 5000000n,
            to: undefined, // Contract deployment
            value: 0n,
            data: deployData,
            chainId: (await this.hre.ethers.provider.getNetwork()).chainId,
        }

        // Sign and send transaction using secp256r1 wallet
        const signedTx = await this.wallet.signTransaction(deployTx)
        const response = await this.hre.ethers.provider.send(
            'eth_sendRawTransaction',
            [signedTx]
        )

        // Wait for deployment with proper polling
        const receipt = await this.waitForTransaction(response, 1, 60000)

        if (!receipt || receipt.status !== 1) {
            throw new Error(`Failed to deploy ${contractName}`)
        }

        console.log(
            `   ✅ ${contractName} deployed at: ${receipt.contractAddress}`
        )
        return receipt.contractAddress
    }

    async sendTransaction(
        transaction: TransactionRequest
    ): Promise<TransactionResponse> {
        if (!this.wallet) {
            await this.initializeWallet()
        }

        // Convert TransactionRequest to our raw transaction format
        const rawTx = {
            nonce:
                transaction.nonce ||
                (await this.hre.ethers.provider.getTransactionCount(
                    await this.getAddress()
                )),
            gasPrice: transaction.gasPrice || 0n,
            gasLimit: transaction.gasLimit || 5000000n,
            to: transaction.to,
            value: transaction.value || 0n,
            data: transaction.data || '0x',
            chainId: (await this.hre.ethers.provider.getNetwork()).chainId,
        }

        const signedTx = await this.wallet.signTransaction(rawTx)
        const hash = await this.hre.ethers.provider.send(
            'eth_sendRawTransaction',
            [signedTx]
        )

        // Create a TransactionResponse-like object
        return {
            hash,
            from: await this.getAddress(),
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
        const maxAttempts = Math.floor(timeout / 1000) // 1 second intervals

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

        // Compatible with networks that explicitly specify secp256r1
        return (
            networkConfig.curve === 'secp256r1' &&
            networkConfig.secp256r1Accounts &&
            networkConfig.secp256r1Accounts.length > 0
        )
    }
}
