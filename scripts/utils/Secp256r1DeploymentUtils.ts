import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { TransactionReceipt } from 'ethers'
import { Secp256r1Wallet } from '../../utils/Secp256r1Wallet'

/**
 * Utility class for secp256r1 deployment operations
 * Provides a unified interface for deploying contracts using raw transactions
 * and parsing events using TypeChain-generated factory interfaces
 */
export class Secp256r1DeploymentUtils {
    private hre: HardhatRuntimeEnvironment
    private ethers: typeof import('ethers')
    private wallet: Secp256r1Wallet | null

    constructor(hre: HardhatRuntimeEnvironment) {
        this.hre = hre
        this.ethers = hre.ethers
        this.wallet = null
    }

    /**
     * Initialize secp256r1 wallet from network configuration
     */
    private async initializeWallet() {
        if (this.wallet) return this.wallet

        const networkConfig = this.hre.config.networks[
            this.hre.network.name
        ] as {
            secp256r1Accounts: Array<{ privateKey: string }>
        }
        const secp256r1Account = networkConfig.secp256r1Accounts[0]
        const privateKey = secp256r1Account.privateKey.startsWith('0x')
            ? secp256r1Account.privateKey
            : '0x' + secp256r1Account.privateKey

        this.wallet = new Secp256r1Wallet(privateKey, this.ethers.provider)
        return this.wallet
    }

    /**
     * Wait for transaction receipt with manual polling
     */
    private async waitForTransaction(
        txHash: string
    ): Promise<TransactionReceipt> {
        let receipt = null
        let attempts = 0
        const maxAttempts = 60

        while (!receipt && attempts < maxAttempts) {
            try {
                receipt =
                    await this.ethers.provider.getTransactionReceipt(txHash)
                if (receipt) break
            } catch {
                // Transaction not yet mined
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
            attempts++
        }

        if (!receipt) {
            throw new Error(`Timeout waiting for transaction ${txHash}`)
        }

        if (receipt.status !== 1) {
            throw new Error(`Transaction failed: ${txHash}`)
        }

        return receipt
    }

    /**
     * Parse event from transaction receipt using factory interface
     */
    private parseEventFromReceipt(
        receipt: TransactionReceipt,
        factoryClass: {
            createInterface(): {
                parseLog(log: {
                    topics: string[]
                    data: string
                }): { name: string; args: unknown } | null
            }
        },
        eventName: string
    ): unknown {
        // Create interface from factory
        const factoryInterface = factoryClass.createInterface()

        // Parse logs to find the target event
        const targetEvent = receipt.logs
            .map((log) => {
                try {
                    return factoryInterface.parseLog(log)
                } catch {
                    return null
                }
            })
            .find((log) => log && log.name === eventName)

        if (!targetEvent) {
            throw new Error(
                `Could not find ${eventName} event in transaction logs`
            )
        }

        return targetEvent.args
    }

    /**
     * Deploy a contract using raw transaction and return event data
     */
    async deployContract(
        factoryClass: {
            createInterface(): {
                encodeFunctionData(name: string, args: unknown[]): string
            }
        },
        contractAddress: string,
        methodName: string,
        params: unknown[],
        eventName: string,
        logMessage?: string
    ): Promise<unknown> {
        if (logMessage) {
            console.log(logMessage)
        }

        const wallet = await this.initializeWallet()
        const deployerAddress = await wallet.getAddress()

        // Create interface from factory for method encoding
        const factoryInterface = factoryClass.createInterface()

        // Encode the function call
        const callData = factoryInterface.encodeFunctionData(methodName, params)

        // Get current nonce
        const nonce =
            await this.ethers.provider.getTransactionCount(deployerAddress)

        // Create raw transaction
        const transaction = {
            nonce: nonce,
            gasPrice: BigInt(0),
            gasLimit: BigInt(5000000), // High gas limit for complex operations
            to: contractAddress,
            value: BigInt(0),
            data: callData,
            chainId: (await this.ethers.provider.getNetwork()).chainId,
        }

        // Sign and send transaction
        const signedTx = await wallet.signTransaction(transaction)
        const txHash = await this.ethers.provider.send(
            'eth_sendRawTransaction',
            [signedTx]
        )

        // Wait for transaction receipt
        const receipt = await this.waitForTransaction(txHash)

        // Parse event data from receipt
        return this.parseEventFromReceipt(receipt, factoryClass, eventName)
    }

    /**
     * Deploy a new contract (not just calling a method on existing one)
     */
    async deployNewContract(
        factoryClass: {
            createInterface(): {
                parseLog(log: {
                    topics: string[]
                    data: string
                }): { name: string; args: unknown } | null
            }
            abi: Array<{ type: string; inputs?: unknown[] }>
        },
        bytecode: string,
        constructorParams: unknown[] = [],
        eventName?: string,
        logMessage?: string
    ): Promise<{ contractAddress: string; eventArgs?: unknown }> {
        if (logMessage) {
            console.log(logMessage)
        }

        const wallet = await this.initializeWallet()
        const deployerAddress = await wallet.getAddress()

        // Encode constructor parameters
        let deployData = bytecode
        if (constructorParams.length > 0) {
            const encodedParams = this.ethers.AbiCoder.defaultAbiCoder().encode(
                factoryClass.abi.find(
                    (item: { type: string; inputs?: unknown[] }) =>
                        item.type === 'constructor'
                )?.inputs || [],
                constructorParams
            )
            deployData += encodedParams.slice(2) // Remove 0x prefix
        }

        // Get current nonce
        const nonce =
            await this.ethers.provider.getTransactionCount(deployerAddress)

        // Create raw transaction for contract deployment
        const transaction = {
            nonce: nonce,
            gasPrice: BigInt(0),
            gasLimit: BigInt(5000000),
            to: null, // Deployment
            value: BigInt(0),
            data: deployData,
            chainId: (await this.ethers.provider.getNetwork()).chainId,
        }

        // Sign and send transaction
        const signedTx = await wallet.signTransaction(transaction)
        const txHash = await this.ethers.provider.send(
            'eth_sendRawTransaction',
            [signedTx]
        )

        // Wait for transaction receipt
        const receipt = await this.waitForTransaction(txHash)

        const result: { contractAddress: string; eventArgs?: unknown } = {
            contractAddress: receipt.contractAddress || '',
        }

        // If eventName provided, parse the event
        if (eventName) {
            try {
                result.eventArgs = this.parseEventFromReceipt(
                    receipt,
                    factoryClass,
                    eventName
                )
            } catch (e) {
                // Event parsing is optional for new contract deployments
                console.warn(`Could not parse ${eventName} event:`, e)
            }
        }

        return result
    }
}
