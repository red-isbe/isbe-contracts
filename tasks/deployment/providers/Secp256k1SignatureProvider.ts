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
import { Signer, TransactionRequest, TransactionResponse, ethers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ISignatureProvider } from './ISignatureProvider'
import { NetworkConfigWithCurve } from '../../../types/hardhat'
import { DEFAULT_TX_GAS_LIMIT } from '../../../utils/constants'

/**
 * Standard secp256k1 signature provider using Hardhat's built-in signers
 * Works with all standard Ethereum networks
 */
export class Secp256k1SignatureProvider implements ISignatureProvider {
    private signer?: Signer

    constructor(private hre: HardhatRuntimeEnvironment) {}

    async getSigner(): Promise<Signer> {
        if (!this.signer) {
            const signers = await this.hre.ethers.getSigners()
            if (signers.length === 0) {
                throw new Error('No signers available for secp256k1 provider')
            }
            this.signer = signers[0]
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
        console.log(
            `   🔧 Deploying ${contractName} with standard secp256k1...`
        )

        // Use Hardhat's ContractFactory for standard deployment
        const signer = await this.getSigner()

        // If we have constructor args, encode them
        let deployData = bytecode
        if (constructorArgs.length > 0 && constructorTypes.length > 0) {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder()
            const encodedArgs = abiCoder.encode(
                constructorTypes,
                constructorArgs
            )
            deployData = bytecode + encodedArgs.slice(2)
        }

        // Deploy using ContractFactory with explicit gas limit to prevent "Internal error" on non-validator nodes
        const deployOptions = { gasLimit: DEFAULT_TX_GAS_LIMIT }
        const factory = new ethers.ContractFactory([], deployData, signer)
        const contract = await factory.deploy(deployOptions)
        await contract.waitForDeployment()

        const address = await contract.getAddress()
        console.log(`   ✅ ${contractName} deployed at: ${address}`)

        return address
    }

    async sendTransaction(
        transaction: TransactionRequest
    ): Promise<TransactionResponse> {
        const signer = await this.getSigner()
        // Add explicit gas limit if not already set to prevent "Internal error" on non-validator nodes
        if (!transaction.gasLimit) {
            transaction.gasLimit = DEFAULT_TX_GAS_LIMIT
        }
        return await signer.sendTransaction(transaction)
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
        const networkConfig = hre.config.networks[
            hre.network.name
        ] as NetworkConfigWithCurve

        // Compatible with networks that don't specify a curve (defaults to secp256k1)
        // or explicitly specify secp256k1
        return !networkConfig.curve || networkConfig.curve === 'secp256k1'
    }
}
