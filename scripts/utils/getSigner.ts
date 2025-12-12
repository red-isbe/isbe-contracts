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
// Re-export the curve-aware signer for backwards compatibility
export { getCurveAwareSigner as getSigner } from './getCurveAwareSigner'

// Legacy function - deprecated, use getCurveAwareSigner instead
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSignerLegacy(hre: any) {
    console.warn(
        '⚠️  Using legacy getSigner - consider switching to getCurveAwareSigner for better curve support'
    )

    const privateKey =
        hre.network.name === 'hardhat'
            ? hre.ethers.Wallet.fromPhrase(
                  (await hre.ethers.getSigners())[0]._accounts.mnemonic
              ).privateKey
            : process.env.ACCOUNT_PRIVATE_KEY

    if (!privateKey) {
        throw new Error('ACCOUNT_PRIVATE_KEY not set in .env')
    }

    // Create a signer using the private key and Hardhat's ethers provider
    return new hre.ethers.Wallet(privateKey, hre.ethers.provider)
}
