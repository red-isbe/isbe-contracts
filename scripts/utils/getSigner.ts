// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSigner(hre: any) {
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
