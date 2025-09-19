// utils/networkUtils.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export type EllipticCurve = 'secp256k1' | 'secp256r1'

export interface NetworkCurveInfo {
    networkName: string
    curve: EllipticCurve
    chainId?: number
    url?: string
}

interface NetworkConfigWithCurve {
    curve?: EllipticCurve
    chainId?: number
    url?: string
    [key: string]: unknown
}

/**
 * Get the elliptic curve used by the current network
 */
export function getNetworkCurve(hre: HardhatRuntimeEnvironment): EllipticCurve {
    const networkName = hre.network.name
    const networkConfig = hre.config.networks[
        networkName
    ] as NetworkConfigWithCurve

    // Default to secp256k1 if not specified
    return networkConfig?.curve || 'secp256k1'
}

/**
 * Get complete network curve information
 */
export function getNetworkCurveInfo(
    hre: HardhatRuntimeEnvironment
): NetworkCurveInfo {
    const networkName = hre.network.name
    const networkConfig = hre.config.networks[
        networkName
    ] as NetworkConfigWithCurve

    return {
        networkName,
        curve: networkConfig?.curve || 'secp256k1',
        chainId: networkConfig?.chainId,
        url: networkConfig?.url,
    }
}

/**
 * Check if current network uses secp256r1
 */
export function isSecp256r1Network(hre: HardhatRuntimeEnvironment): boolean {
    return getNetworkCurve(hre) === 'secp256r1'
}

/**
 * Check if current network uses secp256k1 (standard Ethereum)
 */
export function isSecp256k1Network(hre: HardhatRuntimeEnvironment): boolean {
    return getNetworkCurve(hre) === 'secp256k1'
}

/**
 * Log network curve information
 */
export function logNetworkInfo(hre: HardhatRuntimeEnvironment): void {
    const info = getNetworkCurveInfo(hre)
    console.log(`Network: ${info.networkName}`)
    console.log(`Curve: ${info.curve}`)
    if (info.chainId) console.log(`Chain ID: ${info.chainId}`)
    if (info.url) console.log(`URL: ${info.url}`)

    if (info.curve === 'secp256r1') {
        console.warn(
            '⚠️  Warning: secp256r1 networks require custom signing implementation'
        )
    }
}
