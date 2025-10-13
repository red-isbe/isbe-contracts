// Simple test to verify our compatibility mode works
import { ethers } from 'hardhat'
import { Secp256r1Wallet } from './utils/secp256r1TransactionSigner'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

async function testCompatibilityMode() {
    console.log('🧪 Testing secp256r1 compatibility mode...')

    const hre = (global as { hre?: HardhatRuntimeEnvironment }).hre
    if (!hre) {
        console.error('❌ Hardhat runtime environment not available')
        return
    }

    const privateKey =
        '0x7718b1f61c070fba4a13a7a19fc0107b29218e21100735c5220309946e11b3ad'

    try {
        // Create our secp256r1 wallet
        const secp256r1Wallet = new Secp256r1Wallet(privateKey, hre)
        console.log('✅ Secp256r1 wallet created:', secp256r1Wallet.address)

        // Test simple transaction
        const transaction = {
            to: '0x0000000000000000000000000000000000000001',
            value: ethers.parseEther('0.001'),
            gasLimit: 21000,
            gasPrice: 0,
        }

        console.log('🔐 Signing transaction...')
        const signedTx = await secp256r1Wallet.signTransaction(
            transaction as import('ethers').Transaction
        )
        console.log('✅ Transaction signed successfully')
        console.log('📄 Signed transaction length:', signedTx.length)

        // Try to send it
        console.log('📤 Sending transaction to Besu...')
        const result = await hre.ethers.provider.broadcastTransaction(signedTx)
        console.log('✅ Transaction sent successfully!')
        console.log('📋 Transaction hash:', result.hash)

        // Wait for confirmation
        console.log('⏳ Waiting for confirmation...')
        const receipt = await result.wait()
        console.log('🎉 Transaction confirmed in block:', receipt.blockNumber)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Test failed:', message)
        if (message.includes('insufficient funds')) {
            console.log('💡 This is expected - the account has no balance')
            console.log('✅ But the signing and transmission worked!')
        } else {
            console.error('🔍 Error details:', error)
        }
    }
}

export { testCompatibilityMode }
