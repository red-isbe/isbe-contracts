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
import { ISignatureProvider } from './ISignatureProvider'
import { Secp256k1SignatureProvider } from './Secp256k1SignatureProvider'
import { Secp256r1SignatureProvider } from './Secp256r1SignatureProvider'
import { KmsSignatureProvider } from './KmsSignatureProvider'

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

        const kmsProvider = new KmsSignatureProvider(hre)
        if (kmsProvider.isCompatibleWith(hre)) {
            console.log('🔐 Using AWS KMS signature provider (secp256k1)')
            return kmsProvider
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

        const kmsProvider = new KmsSignatureProvider(hre)
        if (kmsProvider.isCompatibleWith(hre)) {
            providers.push(kmsProvider)
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
