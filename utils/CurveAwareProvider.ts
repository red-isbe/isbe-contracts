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
// utils/CurveAwareProvider.ts
import { JsonRpcProvider, Wallet } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export interface CurveConfig {
    curve: 'secp256k1' | 'secp256r1'
    keyDerivation?: 'ethereum' | 'custom'
}

export class CurveAwareProvider extends JsonRpcProvider {
    private curveConfig: CurveConfig
    private originalProvider: JsonRpcProvider

    constructor(
        url: string,
        curveConfig: CurveConfig,
        originalProvider?: JsonRpcProvider
    ) {
        super(url)
        this.curveConfig = curveConfig
        this.originalProvider = originalProvider || this
    }

    /**
     * Override wallet creation to handle different curves
     */
    async createWallet(privateKey: string): Promise<Wallet> {
        if (this.curveConfig.curve === 'secp256k1') {
            // Standard Ethereum wallet
            return new Wallet(privateKey, this)
        } else {
            // For secp256r1, we would need a custom implementation
            throw new Error(
                'secp256r1 wallet creation not yet implemented. ' +
                    'This would require a custom secp256r1 signing implementation.'
            )
        }
    }

    /**
     * Override transaction sending to handle different signature formats
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendTransaction(transaction: any): Promise<any> {
        if (this.curveConfig.curve === 'secp256r1') {
            // Custom transaction signing logic for secp256r1 would go here
            console.warn('secp256r1 transaction signing not implemented')
            // You would need to implement secp256r1 signing here
        }

        // Fall back to standard provider
        return super.sendTransaction(transaction)
    }
}

/**
 * Factory function to create curve-aware provider based on network config
 */
export function createCurveAwareProvider(
    hre: HardhatRuntimeEnvironment,
    networkName?: string
): CurveAwareProvider {
    const network = networkName || hre.network.name
    const networkConfig = hre.config.networks[network]

    if (!networkConfig || typeof networkConfig.url !== 'string') {
        throw new Error(`Invalid network configuration for ${network}`)
    }

    // Determine curve based on network configuration
    // This could be extended to read from network config
    const curveConfig: CurveConfig = {
        curve: networkConfig.chainId === 9999 ? 'secp256r1' : 'secp256k1',
    }

    return new CurveAwareProvider(networkConfig.url, curveConfig)
}
