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
import { Signer, HDNodeWallet } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControl,
    ISBEPause,
    HashTimestampTestWrapper,
    IAccessControlDid,
    IDidRegistry__factory,
} from '../typechain-types'
import {
    HASH_TIMESTAMP_ROLE,
    PAUSER_ROLE,
    DID_REGISTRY_ROLE,
    CONFIGURATION_ID_ERC20,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { randomBytes32, proofToDid, generateProof } from './support'
import { EllipticType } from './types/identity'
import { config } from 'hardhat'

describe('Hash Timestamp', function () {
    const HASH = randomBytes32()
    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let hashTimestamp: HashTimestampTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAccountAddress = await adminSigner.getAddress()

        const result = await deployGovernance(adminSigner)

        await result.accessControl.grantRole(PAUSER_ROLE, adminAccountAddress)
        await result.accessControl.grantRole(
            HASH_TIMESTAMP_ROLE,
            adminAccountAddress
        )

        return {
            adminAccount: adminSigner,
            hashTimestamp: result.hashTimestamp,
            pause: result.pause,
            accessControl: result.accessControl,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        adminAccount = contracts.adminAccount
        hashTimestamp = contracts.hashTimestamp
        pause = contracts.pause
        accessControl = contracts.accessControl
    })

    describe('Timestamping hashes', function () {
        it('GIVEN a Hash Timestamp WHEN timestamp hash THEN succeeds', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)
            await connectedHashTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            await expect(connectedHashTimestamp.timestampHash(HASH))
                .to.emit(hashTimestamp, 'HashTimestamped')
                .withArgs(
                    HASH,
                    await adminAccount.getAddress(),
                    BLOCK_TIMESTAMP
                )

            expect(await hashTimestamp.exists(HASH)).to.equal(true)
            expect(await hashTimestamp.getTimestamp(HASH)).to.equal(
                BLOCK_TIMESTAMP
            )
        })

        it('GIVEN a Hash Timestamp WHEN hash is already timestamped THEN fails', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)

            await connectedHashTimestamp.timestampHash(HASH)

            expect(await hashTimestamp.exists(HASH)).to.equal(true)

            await expect(
                connectedHashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'HashAlreadyExists')
        })

        it('GIVEN a Hash Timestamp WHEN contract is paused THEN fails', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)
            await pause.pause()

            await expect(
                connectedHashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'IsPaused')
        })

        it('GIVEN a Hash Timestamp WHEN account has no roles THEN fails', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)

            await accessControl.revokeRole(
                HASH_TIMESTAMP_ROLE,
                await adminAccount.getAddress()
            )

            await expect(
                connectedHashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'AccountHasNoRole')
        })
    })

    describe('Mixed DID and Address Role Access', function () {
        let didWallet: HDNodeWallet
        let did: string
        let addressAccount: Signer
        let addressAccountAddress: string
        let useCaseAccessControlDid: IAccessControlDid

        function walletOfFirstSigner(): HDNodeWallet {
            const mnemonic = (
                config.networks.hardhat.accounts as {
                    mnemonic: string
                    path: string
                }
            ).mnemonic
            return ethers.Wallet.fromPhrase(mnemonic)
        }

        async function deployMixedFixture() {
            const [admin, addressAcc] = await ethers.getSigners()
            const adminAddr = await admin.getAddress()
            const addressAccAddr = await addressAcc.getAddress()

            // Create test wallet and DID
            const baseWallet = walletOfFirstSigner()
            const wallet = baseWallet.derivePath('300')

            // Deploy governance with DID registry AND use case
            const govResult = await deployGovernance(
                admin,
                [],
                CONFIGURATION_ID_ERC20
            )

            // Grant DID registry role
            await govResult.accessControlGovernance!.grantRole(
                DID_REGISTRY_ROLE,
                adminAddr
            )

            // Initialize DID registry
            const governanceAddress =
                await govResult.accessControlGovernance!.getAddress()
            const didRegistryWithSigner = IDidRegistry__factory.connect(
                governanceAddress,
                admin
            )
            await didRegistryWithSigner.initializeDiDRegistry(
                EllipticType.SECP_256_K1
            )

            // Insert DID document - Use fixed timestamp in the past to avoid race conditions
            const notBefore = 5
            const notAfter = notBefore + 1000000000000 // Very large to never expire

            const publicKey = wallet.signingKey.publicKey
            const proof = generateProof(wallet)
            const didId = proofToDid(proof)
            const vMethodId = ethers.id(`vmethod:${didId}`)

            await didRegistryWithSigner.insertFirstDidDocument(
                didId,
                `document:${didId}`,
                vMethodId,
                proof,
                publicKey,
                EllipticType.SECP_256_K1,
                notBefore,
                notAfter,
                ''
            )

            // Set mock timestamp to valid period
            const mockTimestampWithSigner =
                govResult.mockTimestamp.connect(admin)
            await mockTimestampWithSigner.setMockedTimestamp(notBefore + 1)

            // Get AccessControlDid interface for use case
            const AccessControlDidFactory = await ethers.getContractFactory(
                'AccessControlDidFacet'
            )
            const useCaseAccessControlDid = AccessControlDidFactory.attach(
                await govResult.accessControl.getAddress()
            ) as IAccessControlDid

            // Grant HASH_TIMESTAMP_ROLE to address
            await govResult.accessControl.grantRole(
                HASH_TIMESTAMP_ROLE,
                addressAccAddr
            )

            // Grant HASH_TIMESTAMP_ROLE to DID
            await govResult.accessControl.grantRole(
                HASH_TIMESTAMP_ROLE,
                adminAddr
            )
            await useCaseAccessControlDid.grantDidRole(
                HASH_TIMESTAMP_ROLE,
                didId
            )

            // Fund DID wallet
            await admin.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther('1.0'),
            })

            return {
                adminAccount: admin,
                hashTimestamp: govResult.hashTimestamp,
                pause: govResult.pause,
                accessControl: govResult.accessControl,
                useCaseAccessControlDid,
                didWallet: wallet,
                did: didId,
                addressAccount: addressAcc,
                addressAccountAddress: addressAccAddr,
                mockTimestamp: govResult.mockTimestamp,
            }
        }

        beforeEach(async function () {
            const contracts = await loadFixture(deployMixedFixture)
            adminAccount = contracts.adminAccount
            hashTimestamp = contracts.hashTimestamp
            pause = contracts.pause
            accessControl = contracts.accessControl
            useCaseAccessControlDid = contracts.useCaseAccessControlDid
            didWallet = contracts.didWallet
            did = contracts.did
            addressAccount = contracts.addressAccount
            addressAccountAddress = contracts.addressAccountAddress
        })

        it('GIVEN role granted to address and DID WHEN both execute timestampHash THEN both succeed', async function () {
            const hash1 = randomBytes32()
            const hash2 = randomBytes32()

            // Address executes
            const connectedHashTimestampAddress =
                hashTimestamp.connect(addressAccount)
            await expect(
                connectedHashTimestampAddress.timestampHash(hash1)
            ).to.emit(hashTimestamp, 'HashTimestamped')

            // DID wallet executes
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedHashTimestampDid = hashTimestamp.connect(didSigner)
            await expect(
                connectedHashTimestampDid.timestampHash(hash2)
            ).to.emit(hashTimestamp, 'HashTimestamped')

            expect(await hashTimestamp.exists(hash1)).to.equal(true)
            expect(await hashTimestamp.exists(hash2)).to.equal(true)
        })

        it('GIVEN role granted to DID WHEN hasRole checks address THEN returns true', async function () {
            // Check if DID wallet address has role via DID resolution
            const hasRole = await accessControl.hasRole(
                HASH_TIMESTAMP_ROLE,
                didWallet.address
            )
            expect(hasRole).to.be.true
        })

        it('GIVEN role revoked from DID WHEN DID wallet executes THEN fails', async function () {
            // Revoke role from DID
            await useCaseAccessControlDid.revokeDidRole(
                HASH_TIMESTAMP_ROLE,
                did
            )

            // DID wallet should fail
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedHashTimestampDid = hashTimestamp.connect(didSigner)
            await expect(
                connectedHashTimestampDid.timestampHash(randomBytes32())
            ).to.be.revertedWithCustomError(hashTimestamp, 'AccountHasNoRole')
        })

        it('GIVEN role revoked from address WHEN address executes THEN fails but DID still works', async function () {
            // Revoke role from address
            await accessControl.revokeRole(
                HASH_TIMESTAMP_ROLE,
                addressAccountAddress
            )

            // Address should fail
            const connectedHashTimestampAddress =
                hashTimestamp.connect(addressAccount)
            await expect(
                connectedHashTimestampAddress.timestampHash(randomBytes32())
            ).to.be.revertedWithCustomError(hashTimestamp, 'AccountHasNoRole')

            // DID wallet should still work
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedHashTimestampDid = hashTimestamp.connect(didSigner)
            await expect(
                connectedHashTimestampDid.timestampHash(randomBytes32())
            ).to.emit(hashTimestamp, 'HashTimestamped')
        })

        it('GIVEN DID has role WHEN checking hasRoleForDid THEN returns true', async function () {
            // Check role directly for DID
            const hasRoleForDid = await useCaseAccessControlDid.hasRoleForDid(
                HASH_TIMESTAMP_ROLE,
                did
            )
            expect(hasRoleForDid).to.be.true
        })
    })
})
