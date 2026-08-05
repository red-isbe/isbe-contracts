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
import { task } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { getNativeBalance } from '../../scripts/native/transfer'

/**
 * Task to display the active signing account for the current network configuration.
 * Goes through SignatureProviderFactory, so it correctly reflects KMS keys,
 * secp256r1 accounts, and local secp256k1 keys.
 *
 * @example
 * npx hardhat show-signer --network isbe
 */
task('show-signer', 'Show the active signing account for the current network')
    .setAction(async (_, hre) => {
        console.log('=== Active Signer ===')
        console.log(`   Network: ${hre.network.name}`)
        console.log('')

        const signatureProvider = SignatureProviderFactory.create(hre)
        const address = await signatureProvider.getAddress()
        const curve = signatureProvider.getCurveType()
        const balance = await getNativeBalance(address, hre.ethers.provider)

        console.log(`   Address: ${address}`)
        console.log(`   Curve:   ${curve}`)
        console.log(`   Balance: ${balance} native tokens`)

        return { address, curve, balance }
    })
