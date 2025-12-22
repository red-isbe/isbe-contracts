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
import {
    transferNative,
    getNativeBalance,
    getNativeBalances,
    getNetworkInfo,
} from '../../scripts/native/transfer'

/**
 * Task to transfer native tokens (ETH/ISBE)
 * 
 * @example
  npx hardhat native:transfer --network localhost \
    --to "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
    --amount "10"
 */
task('native:transfer', 'Transfer native tokens (ETH/ISBE) to a recipient')
    .addParam('to', 'The recipient address')
    .addParam('amount', 'The amount to transfer in ether units (e.g., "1.5")')
    .setAction(async (taskArgs, hre) => {
        const { to, amount } = taskArgs

        console.log('=== Native Token Transfer ===')
        console.log(`   Network: ${hre.network.name}`)

        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)
        const senderAddress = await signatureProvider.getAddress()

        console.log(`   Sender: ${senderAddress}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)
        console.log('')

        // Get network info
        const provider = hre.ethers.provider
        const networkInfo = await getNetworkInfo(provider)
        console.log('🌐 Network Info:')
        console.log(`   Chain ID: ${networkInfo.chainId}`)
        console.log(`   Block Number: ${networkInfo.blockNumber}`)
        console.log('')

        // Execute transfer
        const result = await transferNative(
            to,
            amount,
            signatureProvider,
            provider
        )

        console.log('\n✅ Transfer completed successfully!')
        console.log('📋 Transaction Details:')
        console.log(`   From: ${result.from}`)
        console.log(`   To: ${result.to}`)
        console.log(`   Amount: ${result.amount} native tokens`)
        console.log(`   Transaction Hash: ${result.transactionHash}`)
        if (result.gasUsed) {
            console.log(`   Gas Used: ${result.gasUsed}`)
        }

        // Show updated balances
        console.log('\n💰 Updated balances:')
        const newSenderBalance = await getNativeBalance(senderAddress, provider)
        const recipientBalance = await getNativeBalance(to, provider)
        console.log(`   Sender: ${newSenderBalance} native tokens`)
        console.log(`   Recipient: ${recipientBalance} native tokens`)

        return result
    })

/**
 * Task to get native token balance for an account
 *
 * @example
 * npx hardhat native:balance --network localhost \
 *   --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
 */
task('native:balance', 'Get native token balance for an account')
    .addParam('account', 'The account address to check balance for')
    .setAction(async (taskArgs, hre) => {
        const { account } = taskArgs

        console.log('=== Native Token Balance ===')
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Account: ${account}`)
        console.log('')

        const provider = hre.ethers.provider

        // Get network info
        const networkInfo = await getNetworkInfo(provider)
        console.log('🌐 Network Info:')
        console.log(`   Chain ID: ${networkInfo.chainId}`)
        console.log(`   Block Number: ${networkInfo.blockNumber}`)
        console.log('')

        // Get balance
        const balance = await getNativeBalance(account, provider)

        console.log('💰 Balance:')
        console.log(`   ${balance} native tokens`)

        return { account, balance }
    })

/**
 * Task to get native token balances for all configured accounts
 *
 * @example
 * npx hardhat native:balances --network localhost
 */
task(
    'native:balances',
    'Get native token balances for all configured accounts'
).setAction(async (_, hre) => {
    console.log('=== Native Token Balances (All Accounts) ===')
    console.log(`   Network: ${hre.network.name}`)
    console.log('')

    const provider = hre.ethers.provider
    // Get network info
    const networkInfo = await getNetworkInfo(provider)
    console.log('🌐 Network Info:')
    console.log(`   Chain ID: ${networkInfo.chainId}`)
    console.log(`   Block Number: ${networkInfo.blockNumber}`)
    console.log('')
    // Get all signers from hardhat
    const signers = await hre.ethers.getSigners()
    const accounts = signers.map((signer) => signer.address)
    if (accounts.length === 0) {
        console.log('⚠️  No accounts configured for this network')
        return []
    }

    console.log(`📋 Checking ${accounts.length} accounts...\n`)

    // Get balances
    const balances = await getNativeBalances(accounts, provider)

    console.log('💰 Balances:')
    console.log('─'.repeat(80))

    let totalBalance = 0n
    balances.forEach((item, index) => {
        const balanceNum = parseFloat(item.balance) || 0
        totalBalance += BigInt(Math.floor(balanceNum * 1e18))
        const prefix =
            index === 0 ? '👑 ' : `${(index + 1).toString().padStart(2, '0')}. `
        console.log(
            `   ${prefix}${item.account}: ${item.balance} native tokens`
        )
    })

    console.log('─'.repeat(80))
    console.log(
        `   Total: ${(Number(totalBalance) / 1e18).toFixed(6)} native tokens across ${accounts.length} accounts`
    )

    return balances
})

/**
 * Task to get network information
 *
 * @example
 * npx hardhat native:network-info --network localhost
 */
task('native:network-info', 'Get network information').setAction(
    async (_, hre) => {
        console.log('=== Network Information ===')
        console.log(`   Network Name (Hardhat): ${hre.network.name}`)
        console.log('')

        const provider = hre.ethers.provider
        const signers = await hre.ethers.getSigners()
        const senderAddress = signers.length > 0 ? signers[0].address : 'N/A'
        const networkInfo = await getNetworkInfo(provider)
        console.log('🌐 Network Details:')
        console.log(`   Chain ID: ${networkInfo.chainId}`)
        console.log(`   Network Name: ${networkInfo.name}`)
        console.log(`   Current Block: ${networkInfo.blockNumber}`)
        console.log(`   Default Account: ${senderAddress}`)
        // Get default account balance
        const balance = await getNativeBalance(senderAddress, provider)
        console.log(`   Default Account Balance: ${balance} native tokens`)
        return networkInfo
    }
)
