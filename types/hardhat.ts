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
    kmsKeyId?: string
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
