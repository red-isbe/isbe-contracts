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
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ContractFactory, TransactionReceipt } from 'ethers'
import { Secp256r1Wallet } from './Secp256r1Wallet'

/**
 * Utility functions for secp256r1-compatible contract deployment using raw transactions
 * Uses TypeChain-generated factories for proper event parsing
 */
export class Secp256r1DeploymentUtils {
    constructor(private hre: HardhatRuntimeEnvironment) {}

    /**
     * Get secp256r1 wallet from network configuration
     */
    private async getSecp256r1Wallet() {
        const networkConfig = this.hre.config.networks[
            this.hre.network.name
        ] as {
            secp256r1Accounts: Array<{ privateKey: string }>
        }
        const secp256r1Account = networkConfig.secp256r1Accounts[0]
        const privateKey = secp256r1Account.privateKey.startsWith('0x')
            ? secp256r1Account.privateKey
            : '0x' + secp256r1Account.privateKey

        return new Secp256r1Wallet(privateKey, this.hre.ethers.provider)
    }

    /**
     * Wait for transaction receipt using manual polling (avoids hardhat provider issues)
     */
    private async waitForTransaction(
        txHash: string,
        maxAttempts: number = 60
    ): Promise<TransactionReceipt> {
        let receipt = null
        let attempts = 0

        while (!receipt && attempts < maxAttempts) {
            try {
                receipt =
                    await this.hre.ethers.provider.getTransactionReceipt(txHash)
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
            throw new Error(`Transaction ${txHash} failed`)
        }

        return receipt
    }

    /**
     * Parse event from transaction receipt using factory interface
     */
    private parseEventFromLogs<T extends ContractFactory>(
        receipt: TransactionReceipt,
        factory: T,
        eventName: string
    ): unknown {
        const factoryInterface = factory.interface

        const eventLog = receipt.logs
            .map((log) => {
                try {
                    return factoryInterface.parseLog(log)
                } catch {
                    return null
                }
            })
            .find((log) => log && log.name === eventName)

        if (!eventLog) {
            throw new Error(
                `Could not find ${eventName} event in transaction logs`
            )
        }

        return eventLog.args
    }

    /**
     * Deploy a contract using raw transaction with secp256r1 signature
     */
    async deployContract<T extends ContractFactory>(
        factoryClass: new (...args: unknown[]) => T,
        contractAddress: string,
        functionName: string,
        functionArgs: unknown[],
        expectedEventName: string,
        logMessage?: string
    ): Promise<unknown> {
        if (logMessage) {
            console.log(logMessage)
        }

        const ethers = this.hre.ethers
        const wallet = await this.getSecp256r1Wallet()
        const deployerAddress = await wallet.getAddress()

        // Create factory instance to get interface
        const factory = new factoryClass() as T

        // Encode function call using factory interface
        const functionData = factory.interface.encodeFunctionData(
            functionName,
            functionArgs
        )

        // Get fresh nonce to avoid race conditions
        const nonce = await ethers.provider.getTransactionCount(
            deployerAddress,
            'latest'
        )

        // Create raw transaction
        const deployTx = {
            nonce: nonce,
            gasPrice: 0n,
            gasLimit: 5000000n,
            to: contractAddress,
            value: 0n,
            data: functionData,
            chainId: (await ethers.provider.getNetwork()).chainId,
        }

        // Sign and send transaction
        const signedTx = await wallet.signTransaction(deployTx)
        const response = await ethers.provider.send('eth_sendRawTransaction', [
            signedTx,
        ])

        // Wait for transaction receipt
        const receipt = await this.waitForTransaction(response)

        // Parse event using factory interface
        const eventArgs = this.parseEventFromLogs(
            receipt,
            factory,
            expectedEventName
        )

        return eventArgs
    }

    /**
     * Deploy a contract using CREATE opcode (contract deployment)
     */
    async deployContractBytecode<T extends ContractFactory>(
        factoryClass: new (...args: unknown[]) => T,
        bytecode: string,
        constructorArgs: unknown[] = [],
        expectedEventName?: string,
        logMessage?: string
    ): Promise<{ contractAddress: string; eventArgs?: unknown }> {
        if (logMessage) {
            console.log(logMessage)
        }

        const ethers = this.hre.ethers
        const wallet = await this.getSecp256r1Wallet()
        const deployerAddress = await wallet.getAddress()

        // Create factory instance to get interface
        const factory = new factoryClass() as T

        // Encode constructor arguments if any
        let deploymentBytecode = bytecode
        if (constructorArgs.length > 0) {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder()
            const encodedArgs = abiCoder.encode(
                factory.interface.deploy.inputs.map((input) =>
                    input.format('full')
                ),
                constructorArgs
            )
            deploymentBytecode = bytecode + encodedArgs.slice(2)
        }

        // Get fresh nonce to avoid race conditions
        const nonce = await ethers.provider.getTransactionCount(
            deployerAddress,
            'latest'
        )

        // Create raw transaction for contract deployment
        const deployTx = {
            nonce: nonce,
            gasPrice: 0n,
            gasLimit: 5000000n,
            to: undefined, // Contract deployment
            value: 0n,
            data: deploymentBytecode,
            chainId: (await ethers.provider.getNetwork()).chainId,
        }

        // Sign and send transaction
        const signedTx = await wallet.signTransaction(deployTx)
        const response = await ethers.provider.send('eth_sendRawTransaction', [
            signedTx,
        ])

        // Wait for transaction receipt
        const receipt = await this.waitForTransaction(response)

        const result: { contractAddress: string; eventArgs?: unknown } = {
            contractAddress: receipt.contractAddress || '',
        }

        // Parse event if expected
        if (expectedEventName) {
            result.eventArgs = this.parseEventFromLogs(
                receipt,
                factory,
                expectedEventName
            )
        }

        return result
    }
}
