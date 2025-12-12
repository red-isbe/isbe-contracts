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
import { ethers } from 'hardhat'
import { Secp256r1Wallet } from '../utils/Secp256r1Wallet'
import hre from 'hardhat'
import * as fs from 'fs'

/**
 * MINIMAL DEPLOYMENT: Only TimeStampingAuthority contract
 * For testing signTypedData with secp256r1
 *
 * Deploys: 1 contract
 *
 *
 * Usage:
 *   npx hardhat run scripts/deploy-timestamping-r1-minimal.ts --network customSecondR1Network
 */

async function main() {
    console.log(' MINIMAL TIMESTAMPING AUTHORITY DEPLOYMENT (R1)')
    console.log('='.repeat(70))
    console.log(`📍 Network: ${hre.network.name}`)
    console.log('')

    // Validate R1 network
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const networkConfig = hre.config.networks[hre.network.name] as any

    if (networkConfig.curve !== 'secp256r1') {
        console.error('❌ ERROR: This script only works on secp256r1 networks')
        console.error(
            `   Current network: ${hre.network.name} (${networkConfig.curve || 'secp256k1'})`
        )
        console.error('   Use: --network customSecondR1Network')
        process.exit(1)
    }

    // Setup Secp256r1 Wallet
    const provider = hre.ethers.provider

    if (
        !networkConfig.secp256r1Accounts ||
        networkConfig.secp256r1Accounts.length === 0
    ) {
        console.error(
            '❌ ERROR: No secp256r1Accounts configured for this network'
        )
        process.exit(1)
    }

    const deployerAccount = networkConfig.secp256r1Accounts[0]
    const wallet = new Secp256r1Wallet(deployerAccount.privateKey, provider)
    const walletAddress = await wallet.getAddress()

    console.log(` Deployer: ${walletAddress}`)

    // Note: customSecondR1Network is a zero-fee network, no balance check needed
    const balance = await provider.getBalance(walletAddress)
    console.log(` Balance: ${ethers.formatEther(balance)} ETH`)
    console.log(' ℹ️  Zero-fee network - no balance required')

    console.log('')

    // Get TimeStampingAuthority artifact
    console.log(' Preparing TimeStampingAuthority deployment...')

    let tsaArtifact
    try {
        tsaArtifact = await hre.artifacts.readArtifact(
            'TimeStampingAuthorityTestWrapper'
        )
        console.log(`   Contract: TimeStampingAuthorityTestWrapper`)
    } catch {
        console.log(
            ' TimeStampingAuthorityTestWrapper not found, trying base contract...'
        )
        try {
            tsaArtifact = await hre.artifacts.readArtifact(
                'TimeStampingAuthorityFacet'
            )
            console.log(`   Contract: TimeStampingAuthorityFacet`)
        } catch {
            console.error('❌ ERROR: TimeStampingAuthority contract not found')
            console.error(
                '   Make sure contracts are compiled: npx hardhat compile'
            )
            process.exit(1)
        }
    }

    console.log(
        `   Bytecode size: ${(tsaArtifact.bytecode.length / 2 - 1).toLocaleString()} bytes`
    )
    console.log('')

    // Deploy contract
    console.log(' Deploying...')

    const nonce = await provider.getTransactionCount(walletAddress)
    const chainId = (await provider.getNetwork()).chainId

    const deployTx = {
        nonce: nonce,
        gasPrice: hre.config.networks[hre.network.name].gasPrice,
        gasLimit: 5000000n, // Generous gas limit
        to: null, // Contract creation
        value: 0n,
        data: tsaArtifact.bytecode,
        chainId: chainId,
    }

    console.log(`   Nonce: ${nonce}`)
    console.log(`   Chain ID: ${chainId}`)
    console.log(`   Gas Limit: ${deployTx.gasLimit}`)
    console.log('')

    const signedDeployTx = await wallet.signTransaction(deployTx)
    console.log(` Sending transaction...`)

    const deployTxHash = await provider.send('eth_sendRawTransaction', [
        signedDeployTx,
    ])

    console.log(`   Tx Hash: ${deployTxHash}`)
    console.log(' Waiting for confirmation...')
    console.log('')

    // Wait for transaction with timeout
    let receipt = null
    let attempts = 0
    const maxAttempts = 30

    while (!receipt && attempts < maxAttempts) {
        try {
            receipt = await provider.getTransactionReceipt(deployTxHash)
            if (receipt) break
        } catch {
            // Not mined yet
        }

        process.stdout.write(`   Attempt ${attempts + 1}/${maxAttempts}\r`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
    }

    console.log('') // New line after progress

    if (!receipt) {
        console.error(
            '❌ ERROR: Deployment transaction not mined after 30 seconds'
        )
        console.error('   Check if the network is running and mining blocks')
        process.exit(1)
    }

    if (receipt.status !== 1) {
        console.error('❌ ERROR: Deployment transaction failed')
        console.error(`   Status: ${receipt.status}`)
        console.error(`   Block: ${receipt.blockNumber}`)
        process.exit(1)
    }

    const tsaAddress = receipt.contractAddress!

    console.log('✅ TimeStampingAuthority deployed successfully!')
    console.log('')
    console.log(' DEPLOYMENT DETAILS:')
    console.log(`   Contract Address: ${tsaAddress}`)
    console.log(`   Transaction Hash: ${deployTxHash}`)
    console.log(`   Block Number: ${receipt.blockNumber}`)
    console.log(`   Gas Used: ${receipt.gasUsed.toLocaleString()}`)
    console.log('')

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        chainId: Number(chainId),
        deployer: walletAddress,
        deployerBalance: ethers.formatEther(balance),
        contracts: {
            TimeStampingAuthority: {
                address: tsaAddress,
                txHash: deployTxHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
            },
        },
        timestamp: new Date().toISOString(),
        curve: 'secp256r1',
    }

    const filename = `deployment-timestamping-${hre.network.name}-${Date.now()}.json`
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2))

    console.log(' Deployment info saved:')
    console.log(`   File: ${filename}`)
    console.log('')

    console.log(' DEPLOYMENT COMPLETE!')
    console.log('='.repeat(70))
    console.log('')
    console.log(' QUICK REFERENCE:')
    console.log(`   Contract: ${tsaAddress}`)
    console.log(`   Network: ${hre.network.name}`)
    console.log(`   Deployer: ${walletAddress}`)
    console.log('')
    console.log(' NEXT STEPS:')
    console.log(`   1. Run tests:`)
    console.log(
        `      npx hardhat test test/client/TimeStampingAuthorityR1.spec.ts --network ${hre.network.name}`
    )
    console.log('')
    console.log(
        `   2. Or interact manually with the contract at: ${tsaAddress}`
    )
    console.log('')
}

main()
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('')
        console.error('❌ DEPLOYMENT FAILED')
        console.error('='.repeat(70))
        console.error('')
        console.error(
            'Error:',
            error instanceof Error ? error.message : String(error)
        )

        if (error instanceof Error && error.stack) {
            console.error('')
            console.error('Stack trace:')
            console.error(error.stack)
        }

        process.exit(1)
    })
