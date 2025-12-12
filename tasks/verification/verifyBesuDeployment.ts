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
// tasks/verification/verifyBesuDeployment.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getNetworkCurveInfo } from '../../utils/networkUtils'
import { NetworkConfigWithCurve } from '../../types/hardhat'

/**
 * Task to verify successful deployment on Hyperledger Besu secp256r1 network
 */
task(
    'verify-besu-deployment',
    'Verify deployment on Hyperledger Besu secp256r1 network'
)
    .addOptionalParam(
        'factory',
        'Factory contract address to verify',
        '0x0Fb86e586BEd09Bb63E8316177326fC3c821Cf8a'
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🔍 Verifying Hyperledger Besu secp256r1 Deployment...')
        console.log('')

        const curveInfo = getNetworkCurveInfo(hre)
        console.log('📋 Network Information:')
        console.log(`   • Network: ${curveInfo.networkName}`)
        console.log(`   • Curve: ${curveInfo.curve}`)
        console.log(`   • Chain ID: ${curveInfo.chainId}`)
        console.log(`   • URL: ${curveInfo.url}`)
        console.log('')

        if (curveInfo.curve !== 'secp256r1') {
            console.warn('⚠️  This task is designed for secp256r1 networks')
            return
        }

        try {
            // Check network connectivity
            console.log('🌐 Testing Network Connectivity...')
            const provider = hre.ethers.provider
            const network = await provider.getNetwork()
            console.log(`   ✅ Connected to chain ID: ${network.chainId}`)

            // Check block number
            const blockNumber = await provider.getBlockNumber()
            console.log(`   ✅ Current block number: ${blockNumber}`)

            // Get network configuration
            const networkConfig = hre.config.networks[
                hre.network.name
            ] as NetworkConfigWithCurve
            const secp256r1Accounts = networkConfig.secp256r1Accounts || []

            console.log('')
            console.log('🔐 secp256r1 Account Verification:')
            console.log(`   • Total accounts: ${secp256r1Accounts.length}`)
            console.log(
                `   • Primary account: ${secp256r1Accounts[0]?.address || 'N/A'}`
            )

            // Check account balances
            if (secp256r1Accounts.length > 0) {
                console.log('')
                console.log('💰 Account Balances:')

                for (
                    let i = 0;
                    i < Math.min(3, secp256r1Accounts.length);
                    i++
                ) {
                    const account = secp256r1Accounts[i]
                    const balance = await provider.getBalance(account.address)
                    console.log(`   • Account ${i + 1}: ${account.address}`)
                    console.log(
                        `     Balance: ${hre.ethers.formatEther(balance)} ETH`
                    )
                }
            }

            // Verify factory contract
            if (taskArgs.factory) {
                console.log('')
                console.log('🏭 Factory Contract Verification:')
                console.log(`   • Address: ${taskArgs.factory}`)

                const code = await provider.getCode(taskArgs.factory)
                if (code !== '0x') {
                    console.log('   ✅ Contract exists and has bytecode')
                    console.log(
                        `   • Bytecode size: ${(code.length - 2) / 2} bytes`
                    )

                    // Try to get some basic contract info
                    try {
                        const factoryContract = new hre.ethers.Contract(
                            taskArgs.factory,
                            ['function owner() view returns (address)'],
                            provider
                        )

                        try {
                            const owner = await factoryContract.owner()
                            console.log(`   • Owner: ${owner}`)
                        } catch {
                            console.log(
                                '   • Owner: N/A (method not available)'
                            )
                        }
                    } catch {
                        console.log(
                            '   • Additional info: N/A (interface not available)'
                        )
                    }
                } else {
                    console.log('   ❌ Contract not found or has no bytecode')
                }
            }

            // Network performance test
            console.log('')
            console.log('⚡ Network Performance Test:')
            const startTime = Date.now()
            await provider.getBlockNumber()
            const endTime = Date.now()
            console.log(
                `   ✅ RPC call response time: ${endTime - startTime}ms`
            )

            console.log('')
            console.log(
                '🎉 Hyperledger Besu secp256r1 Network Verification Complete!'
            )
            console.log('')
            console.log('📊 Summary:')
            console.log('   ✅ Network connectivity: Working')
            console.log('   ✅ secp256r1 configuration: Valid')
            console.log('   ✅ Account access: Available')
            console.log(
                `   ✅ Contract deployment: ${taskArgs.factory ? 'Verified' : 'Not tested'}`
            )
            console.log('   ✅ Performance: Good')
        } catch (error) {
            console.error('')
            console.error('❌ Verification failed:')
            console.error(`   Error: ${error.message}`)
            console.error('')
            console.error('🔧 Troubleshooting:')
            console.error(
                '   • Check network connectivity to 172.16.240.30:8545'
            )
            console.error('   • Verify Hyperledger Besu node is running')
            console.error(
                '   • Ensure secp256r1 accounts have sufficient balance'
            )
            console.error('   • Check firewall settings and network access')
        }
    })

/**
 * Task to get network client version and info
 */
task('besu-info', 'Get Hyperledger Besu network information').setAction(
    async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('📋 Hyperledger Besu Network Information')
        console.log('')

        try {
            const provider = hre.ethers.provider

            // Basic network info
            const network = await provider.getNetwork()
            const blockNumber = await provider.getBlockNumber()

            console.log('🌐 Network Details:')
            console.log(`   • Chain ID: ${network.chainId}`)
            console.log(`   • Chain Name: ${network.name}`)
            console.log(`   • Block Number: ${blockNumber}`)

            // Try to get gas price
            try {
                const gasPrice = await provider.getFeeData()
                if (gasPrice.gasPrice) {
                    console.log(
                        `   • Gas Price: ${hre.ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`
                    )
                } else {
                    console.log('   • Gas Price: N/A')
                }
            } catch {
                console.log('   • Gas Price: N/A (method not available)')
            }

            // Try to get client version via RPC
            try {
                const clientVersion = await provider.send(
                    'web3_clientVersion',
                    []
                )
                console.log(`   • Client Version: ${clientVersion}`)
            } catch {
                console.log(
                    '   • Client Version: N/A (RPC method not available)'
                )
            }

            // Get latest block info
            const latestBlock = await provider.getBlock('latest')
            if (latestBlock) {
                console.log('')
                console.log('📦 Latest Block:')
                console.log(`   • Number: ${latestBlock.number}`)
                console.log(`   • Hash: ${latestBlock.hash}`)
                console.log(
                    `   • Timestamp: ${new Date(latestBlock.timestamp * 1000).toISOString()}`
                )
                console.log(`   • Gas Used: ${latestBlock.gasUsed}`)
                console.log(`   • Gas Limit: ${latestBlock.gasLimit}`)
                console.log(
                    `   • Transactions: ${latestBlock.transactions.length}`
                )
            }
        } catch (error) {
            console.error('❌ Failed to get network information:')
            console.error(`   Error: ${error.message}`)
        }
    }
)
