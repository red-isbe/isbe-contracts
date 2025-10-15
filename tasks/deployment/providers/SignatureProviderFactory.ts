import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ISignatureProvider } from './ISignatureProvider'
import { Secp256k1SignatureProvider } from './Secp256k1SignatureProvider'
import { Secp256r1SignatureProvider } from './Secp256r1SignatureProvider'

/**
 * Factory to create the appropriate signature provider based on network configuration
 * Automates the detection and selection of curve-specific providers
 */
export class SignatureProviderFactory {
    /**
     * Creates the appropriate signature provider for the current network
     */
    static create(hre: HardhatRuntimeEnvironment): ISignatureProvider {
        // Try secp256r1 first (more specific)
        const secp256r1Provider = new Secp256r1SignatureProvider(hre)
        if (secp256r1Provider.isCompatibleWith(hre)) {
            console.log('🔐 Using secp256r1 signature provider (NIST P-256)')
            return secp256r1Provider
        }

        // Fall back to secp256k1 (standard Ethereum)
        const secp256k1Provider = new Secp256k1SignatureProvider(hre)
        if (secp256k1Provider.isCompatibleWith(hre)) {
            console.log(
                '🔐 Using secp256k1 signature provider (standard Ethereum)'
            )
            return secp256k1Provider
        }

        throw new Error(
            `No compatible signature provider found for network ${hre.network.name}. ` +
                'Ensure your network configuration is valid.'
        )
    }

    /**
     * Get all available providers for the current network
     * Useful for testing or selection scenarios
     */
    static getAvailableProviders(
        hre: HardhatRuntimeEnvironment
    ): ISignatureProvider[] {
        const providers: ISignatureProvider[] = []

        const secp256r1Provider = new Secp256r1SignatureProvider(hre)
        if (secp256r1Provider.isCompatibleWith(hre)) {
            providers.push(secp256r1Provider)
        }

        const secp256k1Provider = new Secp256k1SignatureProvider(hre)
        if (secp256k1Provider.isCompatibleWith(hre)) {
            providers.push(secp256k1Provider)
        }

        return providers
    }

    /**
     * Check if a specific curve type is supported by the current network
     */
    static isCurveSupported(
        hre: HardhatRuntimeEnvironment,
        curveType: 'secp256k1' | 'secp256r1'
    ): boolean {
        const providers = SignatureProviderFactory.getAvailableProviders(hre)
        return providers.some(
            (provider) => provider.getCurveType() === curveType
        )
    }

    /**
     * Get curve information for debugging
     */
    static getCurveInfo(hre: HardhatRuntimeEnvironment): {
        supportedCurves: string[]
        defaultCurve: string
        networkName: string
    } {
        const providers = SignatureProviderFactory.getAvailableProviders(hre)
        const supportedCurves = providers.map((p) => p.getCurveType())

        return {
            supportedCurves,
            defaultCurve:
                supportedCurves.length > 0 ? supportedCurves[0] : 'none',
            networkName: hre.network.name,
        }
    }
}
