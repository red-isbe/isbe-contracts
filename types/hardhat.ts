// types/hardhat.ts
// Shared TypeScript types for Hardhat network configurations

/**
 * Elliptic curve types supported by ISBE networks
 */
export type EllipticCurve = 'secp256k1' | 'secp256r1'

/**
 * Extended network configuration interface that includes curve information
 * and secp256r1 account support
 */
export interface NetworkConfigWithCurve {
    url?: string
    chainId?: number
    accounts?: string[]
    gasPrice?: number
    gas?: number
    blockGasLimit?: number
    curve?: EllipticCurve
    mining?: {
        auto: boolean
        interval: number
    }
    allowUnlimitedContractSize?: boolean
    secp256r1Accounts?: Array<{
        address: string
        privateKey: string
    }>
    [key: string]: unknown
}

/**
 * Network curve information
 */
export interface NetworkCurveInfo {
    networkName: string
    curve: EllipticCurve
    chainId?: number
    url?: string
}
