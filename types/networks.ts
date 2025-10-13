export type CurveType = 'secp256k1' | 'secp256r1'

export interface NetworkConfig {
    url: string
    chainId: number
    accounts: string[]
    gasPrice: number
    gas: number
    blockGasLimit: number
    curve: CurveType
    mining?: {
        auto: boolean
        interval: number
    }
    allowUnlimitedContractSize?: boolean
}

export interface Secp256r1Account {
    address: string
    privateKey: string
    publicKey?: string
}

export interface NetworkConfigWithCurve extends NetworkConfig {
    secp256r1Accounts?: Secp256r1Account[]
}

export interface HardhatNetworkConfig {
    mining?: {
        auto: boolean
        interval: number
    }
    blockGasLimit?: number
    allowUnlimitedContractSize?: boolean
    curve: CurveType
}

export interface NetworksConfig {
    [networkName: string]: NetworkConfigWithCurve | HardhatNetworkConfig
}
