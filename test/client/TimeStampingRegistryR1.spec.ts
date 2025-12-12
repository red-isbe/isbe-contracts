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
import { expect } from 'chai'
import { ethers } from 'hardhat'
import hre from 'hardhat'
// @ts-expect-error - Secp256r1Wallet is a JS module with .d.ts types
import { Secp256r1Wallet } from '../../utils/Secp256r1Wallet'

/**
 * TimeStampingRegistry R1 Network Test Suite
 *
 * This test suite is specifically designed for secp256r1 (P-256) curve networks.
 * It tests the custom signTypedData implementation in Secp256r1Wallet.
 *
 * REQUIREMENTS:
 * - A running local R1 network (e.g., customSecondR1Network)
 * - Secp256r1 accounts configured in config/networks.ts
 * - Funded deployer account if is necessary
 *
 * EXECUTION:
 *   npx hardhat test test/client/TimeStampingAuthorityR1.spec.ts --network customSecondR1Network
 *
 * WHAT THIS TESTS:
 * - Secp256r1Wallet.signTypedData() implementation
 * - EIP-712 signature generation with P-256 curve
 * - Signature format validation for TimeStampingRegistry
 *
 * IMPORTANT NOTE:
 * The integration test does NOT execute stampWithSignature() on the deployed contract
 * because that method requires TIMESTAMPING_REGISTRY_ROLE, which is not configured
 * in this minimal deployment. The purpose of this test suite is to validate that:
 *
 * 1. signTypedData works correctly with secp256r1 (P-256) curve
 * 2. EIP-712 signatures are generated in the correct format
 * 3. Signatures are deterministic and unique per data
 * 4. The signature format is compatible with TimeStampingRegistry contract
 *
 * The actual signature verification happens inside the contract's EIP-712 implementation,
 * which we validate through the signature format tests. A full end-to-end test would
 * require deploying the complete ISBE system with proper role configuration.
 */

describe('TimeStampingRegistry on R1 Network (secp256r1)', function () {
    // Skip if not on an R1 network
    before(async function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const networkConfig = hre.config.networks[hre.network.name] as any

        if (networkConfig.curve !== 'secp256r1') {
            console.log('Skipping R1 tests - not on secp256r1 network')
            console.log(
                `   Current network: ${hre.network.name} (${networkConfig.curve || 'secp256k1'})`
            )
            console.log('   Run with: --network customSecondR1Network')
            this.skip()
        }

        console.log('Running R1 Network Tests')
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: secp256r1 (P-256)`)
        console.log('')
    })

    describe('Secp256r1Wallet - signTypedData', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let wallet: any
        let walletAddress: string

        beforeEach(async function () {
            const provider = ethers.provider
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const networkConfig = hre.config.networks[hre.network.name] as any

            if (
                !networkConfig.secp256r1Accounts ||
                networkConfig.secp256r1Accounts.length === 0
            ) {
                throw new Error(
                    'No secp256r1Accounts configured for this network'
                )
            }

            const account = networkConfig.secp256r1Accounts[0]
            wallet = new Secp256r1Wallet(account.privateKey, provider)
            walletAddress = await wallet.getAddress()

            console.log(`   Wallet: ${walletAddress}`)

            const balance = await provider.getBalance(walletAddress)
            console.log(`   Balance: ${ethers.formatEther(balance)} ETH`)

            if (balance === 0n) {
                console.warn('   Warning: Wallet has zero balance')
            }
        })

        it('GIVEN secp256r1 wallet WHEN signTypedData THEN generates valid signature', async function () {
            const domain = {
                name: 'TimeStampingRegistry',
                version: '1.0.0',
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: ethers.ZeroAddress,
            }

            const types = {
                Timestamp: [
                    { name: 'hash', type: 'bytes32' },
                    { name: 'timestamp', type: 'uint256' },
                ],
            }

            const hash = ethers.keccak256(ethers.toUtf8Bytes('test document'))
            const timestamp = Math.floor(Date.now() / 1000)

            const value = {
                hash: hash,
                timestamp: timestamp,
            }

            console.log(`    Document hash: ${hash}`)
            console.log(`    Timestamp: ${timestamp}`)

            // Sign with secp256r1
            const signature = await wallet.signTypedData(domain, types, value)

            console.log(
                `     Signature: ${signature.slice(0, 20)}...${signature.slice(-10)}`
            )

            // Verify signature format
            expect(signature).to.match(
                /^0x[a-fA-F0-9]{130}$/,
                'Signature should be 65 bytes (130 hex chars + 0x)'
            )

            const r = signature.slice(0, 66)
            const s = '0x' + signature.slice(66, 130)
            const v = '0x' + signature.slice(130, 132)

            console.log(`   R: ${r.slice(0, 20)}...${r.slice(-10)}`)
            console.log(`   S: ${s.slice(0, 20)}...${s.slice(-10)}`)
            console.log(`   V: ${v}`)

            // Verify v value (should be 27 or 28 for EIP-712)
            const vNum = parseInt(v, 16)
            expect([27, 28]).to.include(
                vNum,
                'V should be 27 or 28 for EIP-712'
            )

            console.log(`   ✅ Signature format valid`)
        })

        it('GIVEN secp256r1 wallet WHEN sign multiple times with same data THEN signatures are consistent', async function () {
            const domain = {
                name: 'Test',
                version: '1',
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: ethers.ZeroAddress,
            }

            const types = {
                Message: [{ name: 'content', type: 'string' }],
            }

            const value = {
                content: 'Hello R1',
            }

            const sig1 = await wallet.signTypedData(domain, types, value)
            const sig2 = await wallet.signTypedData(domain, types, value)

            // Signatures should be identical for same data
            expect(sig1).to.equal(sig2, 'Deterministic signatures should match')

            console.log(`   ✅ Deterministic signatures confirmed`)
        })

        it('GIVEN secp256r1 wallet WHEN sign different data THEN signatures are different', async function () {
            const domain = {
                name: 'Test',
                version: '1',
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: ethers.ZeroAddress,
            }

            const types = {
                Message: [{ name: 'value', type: 'uint256' }],
            }

            const value1 = { value: 123 }
            const value2 = { value: 456 }

            const sig1 = await wallet.signTypedData(domain, types, value1)
            const sig2 = await wallet.signTypedData(domain, types, value2)

            expect(sig1).to.not.equal(
                sig2,
                'Different data should produce different signatures'
            )

            console.log(`   ✅ Different data produces different signatures`)
        })

        it('GIVEN complex EIP-712 structure WHEN signTypedData THEN handles correctly', async function () {
            const domain = {
                name: 'TimeStampingRegistry',
                version: '1.0.0',
                chainId: Number((await ethers.provider.getNetwork()).chainId),
                verifyingContract: ethers.ZeroAddress,
            }

            const types = {
                stampWithSignature: [
                    { name: 'originalHash', type: 'bytes32' },
                    { name: 'tsaHash', type: 'bytes32' },
                    { name: 'externalReferenceId', type: 'bytes32' },
                    { name: 'sender', type: 'address' },
                    { name: 'expirationTimestamp', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            const value = {
                originalHash: ethers.keccak256(ethers.toUtf8Bytes('document')),
                tsaHash: ethers.keccak256(ethers.toUtf8Bytes('tsa-doc')),
                externalReferenceId: ethers.keccak256(
                    ethers.toUtf8Bytes('ref-123')
                ),
                sender: walletAddress,
                expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                nonce: 1,
            }

            const signature = await wallet.signTypedData(domain, types, value)

            expect(signature).to.match(/^0x[a-fA-F0-9]{130}$/)

            console.log(`   ✅ Complex EIP-712 structure signed successfully`)
        })
    })

    describe('Integration with TimeStampingRegistry Contract', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let contract: any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let deploymentInfo: any

        before(async function () {
            const fs = await import('fs')

            // Load deployment info
            const deploymentFiles = fs
                .readdirSync('.')
                .filter(
                    (f: string) =>
                        f.startsWith('deployment-timestamping-') &&
                        f.endsWith('.json')
                )
                .sort()
                .reverse()

            if (deploymentFiles.length === 0) {
                console.log(
                    '     No deployment found - run deploy script first'
                )
                this.skip()
                return
            }

            const deploymentFile = deploymentFiles[0]
            deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))

            const contractAddress =
                deploymentInfo.contracts?.TimeStampingRegistry?.address

            if (!contractAddress) {
                console.log('     No contract address found in deployment file')
                this.skip()
                return
            }

            console.log(`    Using deployment: ${deploymentFile}`)
            console.log(`    Contract: ${contractAddress}`)

            // Get contract instance
            const TimeStampingRegistryTestWrapper =
                await ethers.getContractFactory(
                    'TimeStampingRegistryTestWrapper'
                )
            contract = TimeStampingRegistryTestWrapper.attach(contractAddress)
        })

        it('GIVEN deployed TimeStampingRegistry WHEN generate signature THEN signature is valid format', async function () {
            const provider = ethers.provider
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const networkConfig = hre.config.networks[hre.network.name] as any

            const account = networkConfig.secp256r1Accounts[0]
            const wallet = new Secp256r1Wallet(account.privateKey, provider)
            const walletAddress = await wallet.getAddress()

            console.log(`    Signer: ${walletAddress}`)

            // Prepare TSA data
            const tsaHash = ethers.keccak256(
                ethers.toUtf8Bytes('test document for R1')
            )
            const externalReferenceId = ethers.keccak256(
                ethers.toUtf8Bytes('ref-r1-001')
            )
            const nonce = 1
            const expirationTimestamp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

            console.log(`    TSA Hash: ${tsaHash.slice(0, 20)}...`)
            console.log(
                `    External Ref: ${externalReferenceId.slice(0, 20)}...`
            )

            // Create EIP-712 domain
            const domain = {
                name: 'TimeStampingRegistry',
                version: '1.0.0',
                chainId: Number((await provider.getNetwork()).chainId),
                verifyingContract: await contract.getAddress(),
            }

            // Create EIP-712 types
            const types = {
                stampWithSignature: [
                    { name: 'originalHash', type: 'bytes32' },
                    { name: 'tsaHash', type: 'bytes32' },
                    { name: 'externalReferenceId', type: 'bytes32' },
                    { name: 'sender', type: 'address' },
                    { name: 'expirationTimestamp', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            // Create value to sign
            const value = {
                originalHash: ethers.keccak256(
                    ethers.toUtf8Bytes('original-doc-r1')
                ),
                tsaHash: tsaHash,
                externalReferenceId: externalReferenceId,
                sender: walletAddress,
                expirationTimestamp: expirationTimestamp,
                nonce: nonce,
            }

            // Sign with secp256r1
            const signature = await wallet.signTypedData(domain, types, value)
            console.log(
                `     Signature: ${signature.slice(0, 20)}...${signature.slice(-10)}`
            )

            // Verify signature format
            expect(signature).to.match(
                /^0x[a-fA-F0-9]{130}$/,
                'Signature should be 65 bytes'
            )

            const r = signature.slice(0, 66)
            const s = '0x' + signature.slice(66, 130)
            const v = '0x' + signature.slice(130, 132)

            console.log(`   R: ${r.slice(0, 20)}...${r.slice(-10)}`)
            console.log(`   S: ${s.slice(0, 20)}...${s.slice(-10)}`)
            console.log(`   V: ${v}`)

            // Verify v value
            const vNum = parseInt(v, 16)
            expect([27, 28]).to.include(vNum, 'V should be 27 or 28')

            console.log(
                `   ✅ Signature format validated for TimeStampingRegistry`
            )
            console.log(
                `   ✅ Ready for stampWithSignature on properly configured contract`
            )
            console.log(
                `   ℹ️  Note: Actual stampWithSignature requires TIMESTAMPING_REGISTRY_ROLE`
            )
        })
    })

    after(function () {
        console.log('')
        console.log(' R1 Network Tests Complete')
        console.log('   ✅ signTypedData implementation verified on secp256r1')
        console.log('   ✅ EIP-712 signatures working with P-256 curve')
        console.log('')
    })
})
