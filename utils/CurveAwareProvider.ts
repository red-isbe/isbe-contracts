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
