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
// utils/networkUtils.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    EllipticCurve,
    NetworkConfigWithCurve,
    NetworkCurveInfo,
} from '../types/hardhat'

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
        console.log(
            '✅ secp256r1 network detected - using production secp256r1 wallet'
        )
    }
}
