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
