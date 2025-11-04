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
