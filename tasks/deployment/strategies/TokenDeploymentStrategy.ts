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
    TokenConfiguration,
    DeploymentEnvironment,
    DeploymentResult,
    DeploymentStrategy,
} from '../types/configuration'
import { TransactionRequest } from 'ethers'

export abstract class BaseTokenDeploymentStrategy implements DeploymentStrategy {
    abstract deploy(
        config: TokenConfiguration,
        env: DeploymentEnvironment
    ): Promise<DeploymentResult>

    protected async buildDeployTransaction(
        env: DeploymentEnvironment,
        data: string
    ): Promise<TransactionRequest> {
        const { gasPrice, gasLimit } = env.deploymentOptions

        return {
            to: null, // Contract deployment
            data,
            gasPrice: gasPrice || (await env.provider.getFeeData()).gasPrice,
            gasLimit: gasLimit || BigInt('5000000'),
            value: BigInt(0),
            nonce: env.deploymentOptions.nonce,
            chainId: (await env.provider.getNetwork()).chainId,
        }
    }

    protected async waitForDeployment(
        env: DeploymentEnvironment,
        txHash: string
    ): Promise<string> {
        const receipt = await env.provider.waitForTransaction(txHash)
        if (!receipt || !receipt.contractAddress) {
            throw new Error('Deployment failed - no contract address')
        }
        return receipt.contractAddress
    }
}

export class ERC20DeploymentStrategy extends BaseTokenDeploymentStrategy {
    async deploy(
        config: TokenConfiguration,
        env: DeploymentEnvironment
    ): Promise<DeploymentResult> {
        try {
            // Build deployment data
            const data = this.buildERC20DeploymentData(config)

            // Create and send transaction
            const tx = await this.buildDeployTransaction(env, data)
            const signedTx = await env.signer.signTransaction(tx)
            const txHash = await env.provider.broadcastTransaction(signedTx)

            // Wait for deployment
            const contractAddress = await this.waitForDeployment(env, txHash)

            return {
                success: true,
                proxyAddress: contractAddress,
                configurationId: config.id,
                transactionHash: txHash,
            }
        } catch (error) {
            return {
                success: false,
                configurationId: config.id,
                error: error as Error,
            }
        }
    }

    private buildERC20DeploymentData(): string {
        // Implementation depends on your specific ERC20 deployment logic
        throw new Error('Not implemented')
    }
}

export class ERC721DeploymentStrategy extends BaseTokenDeploymentStrategy {
    async deploy(
        config: TokenConfiguration,
        env: DeploymentEnvironment
    ): Promise<DeploymentResult> {
        try {
            // Build deployment data
            const data = this.buildERC721DeploymentData(config)

            // Create and send transaction
            const tx = await this.buildDeployTransaction(env, data)
            const signedTx = await env.signer.signTransaction(tx)
            const txHash = await env.provider.broadcastTransaction(signedTx)

            // Wait for deployment
            const contractAddress = await this.waitForDeployment(env, txHash)

            return {
                success: true,
                proxyAddress: contractAddress,
                configurationId: config.id,
                transactionHash: txHash,
            }
        } catch (error) {
            return {
                success: false,
                configurationId: config.id,
                error: error as Error,
            }
        }
    }

    private buildERC721DeploymentData(): string {
        // Implementation depends on your specific ERC721 deployment logic
        throw new Error('Not implemented')
    }
}

export class DeploymentFactory {
    static createDeploymentStrategy(type: string): DeploymentStrategy {
        switch (type) {
            case 'erc20':
                return new ERC20DeploymentStrategy()
            case 'erc721':
                return new ERC721DeploymentStrategy()
            default:
                throw new Error(`Unsupported token type: ${type}`)
        }
    }
}
