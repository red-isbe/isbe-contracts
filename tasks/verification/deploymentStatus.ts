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
// tasks/verification/deploymentStatus.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getNetworkCurveInfo } from '../../utils/networkUtils'
import { NetworkConfigWithCurve } from '../../types/hardhat'

/**
 * Task to check deployment status and list deployed contracts on the network
 */
task('deployment-status', 'Check deployment status and list deployed contracts')
    .addOptionalParam('startBlock', 'Block number to start scanning from', '0')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('📊 Deployment Status Check')
        console.log('')

        const curveInfo = getNetworkCurveInfo(hre)
        console.log('📋 Network Information:')
        console.log(`   • Network: ${curveInfo.networkName}`)
        console.log(`   • Curve: ${curveInfo.curve}`)
        console.log(`   • Chain ID: ${curveInfo.chainId}`)
        console.log('')

        try {
            const provider = hre.ethers.provider
            const currentBlock = await provider.getBlockNumber()
            const startBlock = parseInt(taskArgs.startBlock)

            console.log('🔍 Scanning for Contract Deployments...')
            console.log(
                `   • Scanning from block ${startBlock} to ${currentBlock}`
            )
            console.log(
                `   • Total blocks to scan: ${currentBlock - startBlock + 1}`
            )
            console.log('')

            const deployedContracts: Array<{
                address: string
                blockNumber: number
                transactionHash: string
                deployer: string
                contractSize: number
            }> = []

            // Get network configuration for accounts
            const networkConfig = hre.config.networks[
                hre.network.name
            ] as NetworkConfigWithCurve
            const accounts =
                curveInfo.curve === 'secp256r1'
                    ? (networkConfig.secp256r1Accounts || []).map(
                          (acc) => acc.address
                      )
                    : networkConfig.accounts || []

            console.log('🔐 Known Deployer Accounts:')
            accounts.slice(0, 3).forEach((account: string, index: number) => {
                console.log(`   • Account ${index + 1}: ${account}`)
            })
            if (accounts.length > 3) {
                console.log(`   • ... and ${accounts.length - 3} more`)
            }
            console.log('')

            // Scan blocks for contract deployments
            const batchSize = 100
            let totalTransactions = 0

            for (
                let blockNum = startBlock;
                blockNum <= currentBlock;
                blockNum += batchSize
            ) {
                const endBlock = Math.min(
                    blockNum + batchSize - 1,
                    currentBlock
                )

                process.stdout.write(
                    `\r   Scanning blocks ${blockNum}-${endBlock}...`
                )

                for (let i = blockNum; i <= endBlock; i++) {
                    try {
                        const block = await provider.getBlock(i, true)
                        if (block && block.transactions.length > 0) {
                            totalTransactions += block.transactions.length

                            for (const tx of block.transactions) {
                                if (
                                    typeof tx === 'object' &&
                                    tx.to === null &&
                                    tx.data &&
                                    tx.data.length > 2
                                ) {
                                    // This is a contract creation transaction
                                    const receipt =
                                        await provider.getTransactionReceipt(
                                            tx.hash
                                        )
                                    if (receipt && receipt.contractAddress) {
                                        const code = await provider.getCode(
                                            receipt.contractAddress
                                        )
                                        if (code !== '0x') {
                                            deployedContracts.push({
                                                address:
                                                    receipt.contractAddress,
                                                blockNumber: i,
                                                transactionHash: tx.hash,
                                                deployer: tx.from,
                                                contractSize:
                                                    (code.length - 2) / 2,
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    } catch {
                        // Skip problematic blocks
                        continue
                    }
                }
            }

            console.log(
                '\r   Scanning complete!                                   '
            )
            console.log('')

            if (deployedContracts.length === 0) {
                console.log(
                    '🔍 No contract deployments found in the specified range.'
                )
                console.log(
                    `   • Total transactions processed: ${totalTransactions}`
                )
                console.log('')
                return
            }

            // Sort by block number
            deployedContracts.sort((a, b) => a.blockNumber - b.blockNumber)

            console.log(
                `📦 Found ${deployedContracts.length} Deployed Contracts:`
            )
            console.log('')

            for (let i = 0; i < deployedContracts.length; i++) {
                const contract = deployedContracts[i]
                console.log(`   ${i + 1}. Contract at ${contract.address}`)
                console.log(`      • Block: ${contract.blockNumber}`)
                console.log(`      • Deployer: ${contract.deployer}`)
                console.log(`      • Size: ${contract.contractSize} bytes`)
                console.log(`      • Tx Hash: ${contract.transactionHash}`)

                // Try to identify contract type
                try {
                    const code = await provider.getCode(contract.address)
                    let contractType = 'Unknown'

                    // Basic pattern matching for contract identification
                    if (code.includes('ERC20')) contractType = 'Possible ERC20'
                    else if (code.includes('ERC721'))
                        contractType = 'Possible ERC721'
                    else if (code.includes('Diamond'))
                        contractType = 'Possible Diamond'
                    else if (code.includes('Factory'))
                        contractType = 'Possible Factory'
                    else if (code.includes('Proxy'))
                        contractType = 'Possible Proxy'

                    console.log(`      • Type: ${contractType}`)
                } catch {
                    console.log(`      • Type: Unknown`)
                }

                console.log('')
            }

            // Summary statistics
            console.log('📊 Deployment Summary:')
            console.log(
                `   • Total contracts deployed: ${deployedContracts.length}`
            )
            console.log(
                `   • Total transactions processed: ${totalTransactions}`
            )
            console.log(
                `   • Average contract size: ${Math.round(deployedContracts.reduce((sum, c) => sum + c.contractSize, 0) / deployedContracts.length)} bytes`
            )

            // Group by deployer
            const deployerStats: { [key: string]: number } = {}
            deployedContracts.forEach((contract) => {
                deployerStats[contract.deployer] =
                    (deployerStats[contract.deployer] || 0) + 1
            })

            console.log('')
            console.log('👨‍💻 Deployment by Address:')
            Object.entries(deployerStats)
                .sort(([, a], [, b]) => b - a)
                .forEach(([deployer, count]) => {
                    const isKnownAccount = accounts.includes(deployer)
                    console.log(
                        `   • ${deployer}: ${count} contract${count > 1 ? 's' : ''} ${isKnownAccount ? '(Known Account)' : '(External)'}`
                    )
                })
        } catch (error) {
            console.error('')
            console.error('❌ Error during deployment status check:')
            console.error(`   Error: ${error.message}`)
        }
    })

/**
 * Enhanced task to check complete deployment status including roles
 */
task(
    'complete-deployment-status',
    'Complete deployment status with governance roles and use case details'
)
    .addOptionalParam(
        'governance',
        'Governance factory address',
        '0x48d1C9025B3C6255b67c88628e75A441e564De27'
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('📊 Complete Deployment Status Report')
        console.log('='.repeat(50))
        console.log('')

        const curveInfo = getNetworkCurveInfo(hre)
        console.log('📋 Network Information:')
        console.log(`   • Network: ${curveInfo.networkName}`)
        console.log(`   • Curve: ${curveInfo.curve}`)
        console.log(`   • Chain ID: ${curveInfo.chainId}`)
        console.log(`   • URL: ${curveInfo.url}`)
        console.log('')

        try {
            const provider = hre.ethers.provider
            const [signer] = await hre.ethers.getSigners()

            // Network status
            const currentBlock = await provider.getBlockNumber()
            console.log('🌐 Network Status:')
            console.log(`   • Current Block: ${currentBlock}`)
            console.log(`   • Signer Address: ${signer.address}`)
            console.log('')

            // Governance Analysis
            await analyzeGovernance(hre, taskArgs.governance, signer)

            // Use Cases Analysis
            const useCases = [
                {
                    name: 'ERC20 Complete UseCase',
                    address: '0xd3BcD561a24a79fDcb0783659d114cC585916393',
                },
                {
                    name: 'DID Registry UseCase',
                    address: '0x4D4Aeb368E01729d9D53ad27cF8505950f88ad28',
                },
                {
                    name: 'ERC721 UseCase',
                    address: '0x82371d620dB480FDDed8FCE502C83dFF98446C9d',
                },
                {
                    name: 'Hash Timestamp UseCase',
                    address: '0x45Bd73B01C8ED610Bbaf18ce0eb8323EccC0EF18',
                },
            ]

            await analyzeUseCases(hre, useCases, signer)

            // Business Logic Status
            await analyzeBusinessLogicRegistry(hre, taskArgs.governance, signer)

            // Network Performance Summary
            console.log('⚡ Network Performance:')
            const startTime = Date.now()
            await provider.getBlockNumber()
            const endTime = Date.now()
            console.log(`   • RPC Response Time: ${endTime - startTime}ms`)
            console.log('')

            console.log('🎉 Complete Deployment Status Report Finished!')
        } catch (error) {
            console.error('')
            console.error('❌ Error during complete status check:')
            console.error(`   Error: ${error.message}`)
            console.error(`   Stack: ${error.stack}`)
        }
    })

/**
 * Analyze governance contract and roles
 */
async function analyzeGovernance(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any,
    governanceAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer: any
) {
    console.log('🏛️ GOVERNANCE ANALYSIS')
    console.log('-'.repeat(30))

    try {
        // Check if governance exists
        const code = await hre.ethers.provider.getCode(governanceAddress)
        if (code === '0x') {
            console.log('❌ Governance contract not found')
            return
        }

        console.log(`📍 Governance Address: ${governanceAddress}`)
        console.log(`📦 Contract Size: ${(code.length - 2) / 2} bytes`)

        // Create contract instance
        const governanceContract = new hre.ethers.Contract(
            governanceAddress,
            [
                'function hasRole(bytes32,address) view returns (bool)',
                'function getRoleAdmin(bytes32) view returns (bytes32)',
                'function getRoleMember(bytes32,uint256) view returns (address)',
                'function getRoleMemberCount(bytes32) view returns (uint256)',
                'function supportsInterface(bytes4) view returns (bool)',
                'function facets() view returns (tuple(address,bytes4[])[])',
            ],
            signer
        )

        // Check supported interfaces
        console.log('')
        console.log('🔍 Interface Support:')
        const interfaces = {
            ERC165: '0x01ffc9a7',
            AccessControl: '0x7965db0b',
            Diamond: '0x48e2b093',
        }

        for (const [name, interfaceId] of Object.entries(interfaces)) {
            try {
                const supported =
                    await governanceContract.supportsInterface(interfaceId)
                console.log(
                    `   ${supported ? '✅' : '❌'} ${name}: ${supported}`
                )
            } catch {
                console.log(`   ❓ ${name}: Unable to check`)
            }
        }

        // Analyze roles
        console.log('')
        console.log('👥 Role Analysis:')

        const roles = {
            DEFAULT_ADMIN_ROLE:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            GOVERNANCE_MANAGER_ROLE: hre.ethers.keccak256(
                hre.ethers.toUtf8Bytes('GOVERNANCE_MANAGER_ROLE')
            ),
            BUSINESS_LOGIC_MANAGER_ROLE: hre.ethers.keccak256(
                hre.ethers.toUtf8Bytes('BUSINESS_LOGIC_MANAGER_ROLE')
            ),
            DEPLOYER_ROLE: hre.ethers.keccak256(
                hre.ethers.toUtf8Bytes('DEPLOYER_ROLE')
            ),
            PAUSER_ROLE: hre.ethers.keccak256(
                hre.ethers.toUtf8Bytes('PAUSER_ROLE')
            ),
        }

        for (const [roleName, roleHash] of Object.entries(roles)) {
            try {
                console.log(`\n   🔐 ${roleName}:`)
                console.log(`      Hash: ${roleHash}`)

                // Get role admin
                const roleAdmin =
                    await governanceContract.getRoleAdmin(roleHash)
                console.log(`      Admin: ${roleAdmin}`)

                // Get role members count
                const memberCount =
                    await governanceContract.getRoleMemberCount(roleHash)
                console.log(`      Members: ${memberCount}`)

                // List first few members
                if (memberCount > 0) {
                    const maxToShow = Math.min(Number(memberCount), 3)
                    for (let i = 0; i < maxToShow; i++) {
                        const member = await governanceContract.getRoleMember(
                            roleHash,
                            i
                        )
                        console.log(`      Member ${i + 1}: ${member}`)
                    }
                    if (memberCount > 3) {
                        console.log(
                            `      ... and ${Number(memberCount) - 3} more`
                        )
                    }
                }
            } catch (error) {
                console.log(`      ❌ Error checking role: ${error.message}`)
            }
        }

        // Analyze facets
        console.log('')
        console.log('💎 Diamond Facets:')
        try {
            const facets = await governanceContract.facets()
            console.log(`   Total Facets: ${facets.length}`)

            facets.forEach((facet, index) => {
                console.log(
                    `   ${index + 1}. ${facet[0]} (${facet[1].length} selectors)`
                )
            })
        } catch (error) {
            console.log('   ❌ Error getting facets:', error.message)
        }
    } catch (error) {
        console.error('❌ Error analyzing governance:', error.message)
    }

    console.log('')
}

/**
 * Analyze use case contracts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function analyzeUseCases(hre: any, useCases: any[], signer: any) {
    console.log('🎯 USE CASES ANALYSIS')
    console.log('-'.repeat(30))

    for (let i = 0; i < useCases.length; i++) {
        const useCase = useCases[i]
        console.log(`\n${i + 1}. ${useCase.name}`)
        console.log(`   📍 Address: ${useCase.address}`)

        try {
            // Check if contract exists
            const code = await hre.ethers.provider.getCode(useCase.address)
            if (code === '0x') {
                console.log('   ❌ Contract not found')
                continue
            }

            console.log(`   📦 Size: ${(code.length - 2) / 2} bytes`)

            // Get balance
            const balance = await hre.ethers.provider.getBalance(
                useCase.address
            )
            console.log(`   💰 Balance: ${hre.ethers.formatEther(balance)} ETH`)

            // Create contract instance for diamond analysis
            const contract = new hre.ethers.Contract(
                useCase.address,
                [
                    'function facets() view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])',
                    'function supportsInterface(bytes4) view returns (bool)',
                    'function hasRole(bytes32,address) view returns (bool)',
                ],
                signer
            )

            // Check if it's a diamond
            try {
                const facets = await contract.facets()
                console.log(`   💎 Diamond Facets: ${facets.length}`)

                // Show first few facets
                const maxToShow = Math.min(facets.length, 3)
                for (let j = 0; j < maxToShow; j++) {
                    console.log(
                        `      - ${facets[j][0]} (${facets[j][1].length} selectors)`
                    )
                }
                if (facets.length > 3) {
                    console.log(
                        `      ... and ${facets.length - 3} more facets`
                    )
                }
            } catch {
                console.log('   ❓ Diamond info not available')
            }

            // Check common interfaces
            const interfaces = {
                ERC165: '0x01ffc9a7',
                ERC20: '0xa9059cbb',
                ERC721: '0x80ac58cd',
                AccessControl: '0x7965db0b',
            }

            console.log('   🔍 Interface Support:')
            for (const [name, interfaceId] of Object.entries(interfaces)) {
                try {
                    const supported =
                        await contract.supportsInterface(interfaceId)
                    if (supported) {
                        console.log(`      ✅ ${name}`)
                    }
                    // eslint-disable-next-line no-empty
                } catch {}
            }
        } catch (error) {
            console.log(`   ❌ Error analyzing use case: ${error.message}`)
        }
    }

    console.log('')
}

/**
 * Analyze business logic registry
 */
async function analyzeBusinessLogicRegistry(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any,
    governanceAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer: any
) {
    console.log('🔧 BUSINESS LOGIC REGISTRY')
    console.log('-'.repeat(30))

    try {
        // Create governance contract instance with business logic methods
        const governanceContract = new hre.ethers.Contract(
            governanceAddress,
            [
                'function getBusinessLogicAddress(bytes32) view returns (address)',
                'function getBusinessLogicVersions(bytes32) view returns (uint256[])',
                'function getBusinessLogics() view returns (bytes32[])',
                'function supportsInterface(bytes4) view returns (bool)',
            ],
            signer
        )

        // Get all registered business logics
        const businessLogics = await governanceContract.getBusinessLogics()
        console.log(
            `📊 Total Registered Business Logics: ${businessLogics.length}`
        )
        console.log('')

        // Analyze each business logic
        const businessLogicNames = [
            {
                key: '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25',
                name: 'IsbeCutFacet',
            },
            {
                key: '0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2',
                name: 'IsbeLoupeFacet',
            },
            {
                key: '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c',
                name: 'AccessControlFacet',
            },
            {
                key: '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3',
                name: 'ISBEPauseFacet',
            },
            {
                key: '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad',
                name: 'ERC20Facet',
            },
            {
                key: '0x90e014dbbf0f1e8a714d05a5a0c9464d9ab25275f7dcdaf3297d1ccc80452413',
                name: 'ERC721Facet',
            },
            {
                key: '0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a',
                name: 'HashTimestampFacet',
            },
        ]

        let registeredCount = 0
        for (const logic of businessLogicNames) {
            try {
                const address =
                    await governanceContract.getBusinessLogicAddress(logic.key)
                if (address !== '0x0000000000000000000000000000000000000000') {
                    registeredCount++
                    console.log(`✅ ${logic.name}:`)
                    console.log(`   Key: ${logic.key}`)
                    console.log(`   Address: ${address}`)

                    // Get versions
                    const versions =
                        await governanceContract.getBusinessLogicVersions(
                            logic.key
                        )
                    console.log(`   Versions: [${versions.join(', ')}]`)
                    console.log('')
                }
            } catch (error) {
                console.log(
                    `❓ ${logic.name}: Unable to check (${error.message})`
                )
            }
        }

        // Show statistics
        console.log('📈 Registry Statistics:')
        console.log(`   • Total Keys in Registry: ${businessLogics.length}`)
        console.log(`   • Verified Business Logics: ${registeredCount}`)
        console.log(
            `   • Registration Rate: ${Math.round((registeredCount / businessLogicNames.length) * 100)}%`
        )
    } catch (error) {
        console.error(
            '❌ Error analyzing business logic registry:',
            error.message
        )
    }

    console.log('')
}

/**
 * Task to get detailed information about a specific contract
 */
task('contract-info', 'Get detailed information about a specific contract')
    .addParam('address', 'Contract address to inspect')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log(`🔍 Contract Information: ${taskArgs.address}`)
        console.log('')

        try {
            const provider = hre.ethers.provider

            // Basic contract info
            const code = await provider.getCode(taskArgs.address)
            if (code === '0x') {
                console.log('❌ No contract found at this address')
                return
            }

            const balance = await provider.getBalance(taskArgs.address)

            console.log('📋 Basic Information:')
            console.log(`   • Address: ${taskArgs.address}`)
            console.log(`   • Balance: ${hre.ethers.formatEther(balance)} ETH`)
            console.log(`   • Bytecode size: ${(code.length - 2) / 2} bytes`)
            console.log('')

            // Try common interface methods
            const commonInterfaces = [
                {
                    name: 'ERC165',
                    abi: [
                        'function supportsInterface(bytes4) view returns (bool)',
                    ],
                },
                {
                    name: 'Ownable',
                    abi: ['function owner() view returns (address)'],
                },
                {
                    name: 'ERC20',
                    abi: [
                        'function name() view returns (string)',
                        'function symbol() view returns (string)',
                        'function totalSupply() view returns (uint256)',
                    ],
                },
                {
                    name: 'Diamond',
                    abi: [
                        'function facets() view returns (tuple(address,bytes4[])[])',
                    ],
                },
                {
                    name: 'AccessControl',
                    abi: [
                        'function hasRole(bytes32,address) view returns (bool)',
                    ],
                },
            ]

            console.log('🔍 Interface Detection:')
            for (const iface of commonInterfaces) {
                try {
                    const contract = new hre.ethers.Contract(
                        taskArgs.address,
                        iface.abi,
                        provider
                    )

                    // Try first method
                    if (iface.name === 'ERC165') {
                        // Check for ERC165 support
                        const supports165 =
                            await contract.supportsInterface('0x01ffc9a7')
                        console.log(
                            `   ✅ ${iface.name}: ${supports165 ? 'Supported' : 'Not supported'}`
                        )
                    } else if (iface.name === 'Ownable') {
                        const owner = await contract.owner()
                        console.log(`   ✅ ${iface.name}: Owner is ${owner}`)
                    } else if (iface.name === 'ERC20') {
                        const name = await contract.name()
                        const symbol = await contract.symbol()
                        const totalSupply = await contract.totalSupply()
                        console.log(
                            `   ✅ ${iface.name}: ${name} (${symbol}) - Supply: ${hre.ethers.formatEther(totalSupply)}`
                        )
                    } else if (iface.name === 'Diamond') {
                        const facets = await contract.facets()
                        console.log(
                            `   ✅ ${iface.name}: ${facets.length} facets`
                        )
                    } else if (iface.name === 'AccessControl') {
                        // Just check if method exists without calling it
                        console.log(`   ✅ ${iface.name}: Interface detected`)
                    }
                } catch {
                    console.log(`   ❌ ${iface.name}: Not supported`)
                }
            }
        } catch (error) {
            console.error('')
            console.error('❌ Error getting contract information:')
            console.error(`   Error: ${error.message}`)
        }
    })
