import { HttpNetworkConfig } from 'hardhat/types'

export interface NetworkConfigWithCurve extends HttpNetworkConfig {
    secp256r1Accounts?: Array<{ privateKey: string }>
    [key: string]: unknown
}
