// scripts/utils/getCurveAwareSigner.ts
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Wallet } from 'ethers'
import { getNetworkCurve, isSecp256r1Network } from '../../utils/networkUtils'
import { NetworkConfigWithCurve } from '../../types/hardhat'
import { Secp256r1Wallet } from '../../utils/secp256r1TransactionSigner'

/**
 * Get a signer that works with the current network's elliptic curve
 * This replaces the original getSigner to be curve-aware
 */
export async function getCurveAwareSigner(hre: HardhatRuntimeEnvironment) {
    const networkCurve = getNetworkCurve(hre)
    const networkName = hre.network.name

    console.log(`🔐 Getting signer for ${networkCurve} network: ${networkName}`)

    if (isSecp256r1Network(hre)) {
        // secp256r1 network - use secp256r1 accounts from network config
        const networkConfig = hre.config.networks[
            networkName
        ] as NetworkConfigWithCurve

        if (
            !networkConfig.secp256r1Accounts ||
            networkConfig.secp256r1Accounts.length === 0
        ) {
            throw new Error(
                `No secp256r1 accounts configured for network ${networkName}. ` +
                    'Please ensure secp256r1Accounts are properly set in hardhat.config.ts'
            )
        }

        // Use the first secp256r1 account's private key
        const secp256r1Account = networkConfig.secp256r1Accounts[0]
        const privateKey = secp256r1Account.privateKey.startsWith('0x')
            ? secp256r1Account.privateKey
            : `0x${secp256r1Account.privateKey}`

        console.log(`   Using secp256r1 account: ${secp256r1Account.address}`)

        // Create secp256r1 wallet with compatibility mode
        // This will automatically use the appropriate signing method for the current Besu configuration
        const secp256r1Wallet = new Secp256r1Wallet(privateKey, hre)

        console.log(`   ✅ Created secp256r1-compatible wallet`)
        console.log(`   📍 Address: ${secp256r1Wallet.address}`)

        // Create a standard ethers wallet wrapper that uses our secp256r1 signing
        const wallet = new Wallet(privateKey, hre.ethers.provider)

        // Override the signTransaction method to use our secp256r1 signer
        wallet.signTransaction = async (transaction) => {
            console.log('🔐 Deployment using secp256r1-compatible signing...')
            console.log(`📋 Transaction type: ${transaction.type || 'legacy'}`)
            console.log(`🎯 To: ${transaction.to || 'contract creation'}`)
            const result = await secp256r1Wallet.signTransaction(transaction)
            console.log(
                `✅ Signed transaction length: ${result.length} characters`
            )
            return result
        }

        // Also override sendTransaction for deployment compatibility
        wallet.sendTransaction = async (transaction) => {
            console.log(
                '🚀 Deployment sendTransaction intercepted - using secp256r1...'
            )

            // Sign the transaction with our secp256r1 signer
            const signedTx = await secp256r1Wallet.signTransaction(transaction)

            // Broadcast the signed transaction
            console.log('📡 Broadcasting secp256r1 signed transaction...')
            const result = await wallet.provider!.broadcastTransaction(signedTx)

            console.log(`✅ Transaction sent with hash: ${result.hash}`)
            return result
        }

        return wallet
    } else {
        // secp256k1 network - use standard Ethereum approach
        let privateKey: string

        if (networkName === 'hardhat') {
            // For hardhat network, use the first default signer
            const signers = await hre.ethers.getSigners()
            return signers[0]
        } else {
            // For other networks, use ACCOUNT_PRIVATE_KEY from .env
            privateKey = process.env.ACCOUNT_PRIVATE_KEY || ''

            if (!privateKey) {
                throw new Error(
                    'ACCOUNT_PRIVATE_KEY not set in .env file. ' +
                        'This is required for non-hardhat secp256k1 networks.'
                )
            }

            // Ensure 0x prefix
            if (!privateKey.startsWith('0x')) {
                privateKey = `0x${privateKey}`
            }

            const wallet = new Wallet(privateKey, hre.ethers.provider)
            console.log(`   Using secp256k1 account: ${wallet.address}`)

            return wallet
        }
    }
}

/**
 * Backwards compatibility - export as getSigner
 * This allows existing tasks to work without modification
 */
export const getSigner = getCurveAwareSigner

/**
 * Get multiple signers for the current network
 */
export async function getCurveAwareSigners(
    hre: HardhatRuntimeEnvironment,
    count: number = 1
) {
    const signers = []

    if (isSecp256r1Network(hre)) {
        const networkConfig = hre.config.networks[
            hre.network.name
        ] as NetworkConfigWithCurve
        const secp256r1Accounts = networkConfig.secp256r1Accounts || []

        const maxCount = Math.min(count, secp256r1Accounts.length)

        for (let i = 0; i < maxCount; i++) {
            const account = secp256r1Accounts[i]
            const privateKey = account.privateKey.startsWith('0x')
                ? account.privateKey
                : `0x${account.privateKey}`

            const wallet = new Wallet(privateKey, hre.ethers.provider)
            signers.push(wallet)
        }
    } else {
        // For secp256k1 networks, use standard ethers signers
        const defaultSigners = await hre.ethers.getSigners()
        signers.push(...defaultSigners.slice(0, count))
    }

    return signers
}

/**
 * Get signer information for debugging
 */
export async function getSignerInfo(hre: HardhatRuntimeEnvironment) {
    const signer = await getCurveAwareSigner(hre)
    const networkCurve = getNetworkCurve(hre)

    return {
        address: signer.address,
        curve: networkCurve,
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        balance: await hre.ethers.provider.getBalance(signer.address),
    }
}
