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
    AssetEventTrackerTestWrapper,
    AccessControl,
    ISBEPause,
    MockTimestamp,
    IAccessControlDid,
    IDidRegistry__factory,
} from '../typechain-types'
import {
    ASSET_EVENT_TRACKER_ROLE,
    PAUSER_ROLE,
    DID_REGISTRY_ROLE,
    CONFIGURATION_ID_ERC20,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { EllipticType } from './types/identity'
import { config } from 'hardhat'
import { generateProof, proofToDid } from './support'

describe('Asset Event Tracker', function () {
    const STATE_1 = 1
    const STATE_2 = 2
    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let assetEventTracker: AssetEventTrackerTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl
    let mockTimestamp: MockTimestamp

    function walletOfFirstSigner(): HDNodeWallet {
        const mnemonic = (
            config.networks.hardhat.accounts as {
                mnemonic: string
                path: string
            }
        ).mnemonic
        return ethers.Wallet.fromPhrase(mnemonic)
    }

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAccountAddress = await adminSigner.getAddress()

        const result = await deployGovernance(adminSigner)

        // Grant DID registry role
        await result.accessControlGovernance!.grantRole(
            DID_REGISTRY_ROLE,
            adminAccountAddress
        )

        // Initialize DID registry
        const governanceAddress =
            await result.accessControlGovernance!.getAddress()
        const didRegistryWithSigner = IDidRegistry__factory.connect(
            governanceAddress,
            adminSigner
        )
        await didRegistryWithSigner.initializeDiDRegistry(
            EllipticType.SECP_256_K1
        )

        // Register admin as DID - Use fixed timestamp in the past to avoid race conditions
        const baseWallet = walletOfFirstSigner()
        const notBefore = 5
        const notAfter = notBefore + 1000000000000 // Very large to never expire

        const publicKey = baseWallet.signingKey.publicKey
        const proof = generateProof(baseWallet)
        const adminDidId = proofToDid(proof)
        const vMethodId = ethers.id(`vmethod:${adminDidId}`)

        await didRegistryWithSigner.insertFirstDidDocument(
            adminDidId,
            `document:${adminDidId}`,
            vMethodId,
            proof,
            publicKey,
            EllipticType.SECP_256_K1,
            notBefore,
            notAfter,
            ''
        )

        // Set mock timestamp to valid period
        await result.mockTimestamp
            .connect(adminSigner)
            .setMockedTimestamp(notBefore + 1)

        await result.accessControl.grantRole(PAUSER_ROLE, adminAccountAddress)
        await result.accessControl.grantRole(
            ASSET_EVENT_TRACKER_ROLE,
            adminAccountAddress
        )

        return {
            adminAccount: adminSigner,
            assetEventTracker: result.assetEventTracker,
            pause: result.pause,
            accessControl: result.accessControl,
            mockTimestamp: result.mockTimestamp,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        adminAccount = contracts.adminAccount
        assetEventTracker = contracts.assetEventTracker
        pause = contracts.pause
        accessControl = contracts.accessControl
        mockTimestamp = contracts.mockTimestamp
    })

    describe('Recording states', function () {
        it('GIVEN a Asset Event Tracker WHEN record a state THEN succeeds', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)
            mockTimestamp = mockTimestamp.connect(adminAccount)

            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            await expect(assetEventTracker.recordState(STATE_1))
                .to.emit(assetEventTracker, 'StateRecorded')
                .withArgs(
                    STATE_1,
                    BLOCK_TIMESTAMP,
                    await adminAccount.getAddress()
                )

            expect(await assetEventTracker.getLatestAssetEvent()).to.deep.equal(
                [STATE_1, BLOCK_TIMESTAMP]
            )
            expect(await assetEventTracker.getCurrentState()).to.equal(STATE_1)
            expect(await assetEventTracker.getAssetEvents(0, 10)).to.deep.equal(
                [[STATE_1, BLOCK_TIMESTAMP]]
            )
        })

        it('GIVEN a Asset Event Tracker WHEN record a not allowed state THEN fails', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            await expect(assetEventTracker.recordState(STATE_2))
                .to.emit(assetEventTracker, 'StateRecorded')
                .withArgs(
                    STATE_2,
                    BLOCK_TIMESTAMP,
                    await adminAccount.getAddress()
                )

            expect(await assetEventTracker.getLatestAssetEvent()).to.deep.equal(
                [STATE_2, BLOCK_TIMESTAMP]
            )
            expect(await assetEventTracker.getCurrentState()).to.equal(STATE_2)
            expect(await assetEventTracker.getAssetEvents(0, 10)).to.deep.equal(
                [[STATE_2, BLOCK_TIMESTAMP]]
            )

            await expect(
                assetEventTracker.recordState(STATE_1)
            ).to.be.revertedWithCustomError(
                assetEventTracker,
                'StateChangeNotAllowed'
            )
        })

        it('GIVEN a Asset Event Tracker WHEN contract is paused THEN fails', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)

            await pause.pause()

            await expect(
                assetEventTracker.recordState(STATE_1)
            ).to.be.revertedWithCustomError(assetEventTracker, 'IsPaused')
        })

        it('GIVEN a Asset Event Tracker WHEN account has no roles THEN fails', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)
            await accessControl.revokeRole(
                ASSET_EVENT_TRACKER_ROLE,
                adminAccount.getAddress()
            )

            await expect(
                assetEventTracker.recordState(STATE_1)
            ).to.be.revertedWithCustomError(
                assetEventTracker,
                'AccountHasNoRole'
            )
        })
    })

    describe('Checking if state change is allowed', function () {
        it('GIVEN a Asset Event Tracker WHEN current state is lower than new THEN succeeds', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)

            await assetEventTracker.recordState(STATE_1)

            expect(
                await assetEventTracker.isStateChangeAllowed(STATE_2)
            ).to.equal(true)
        })

        it('GIVEN a Asset Event Tracker WHEN current state is higher than new THEN succeeds', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)

            await assetEventTracker.recordState(STATE_2)

            expect(
                await assetEventTracker.isStateChangeAllowed(STATE_1)
            ).to.equal(false)
        })
    })

    describe('Getting asset events', function () {
        it('GIVEN a Asset Event Tracker WHEN gets page higher than existing asset events THEN succeeds', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)

            await assetEventTracker.recordState(STATE_1)

            expect(await assetEventTracker.getAssetEvents(1, 10)).to.deep.equal(
                []
            )
        })

        it('GIVEN a Asset Event Tracker WHEN gets results per page equals than existing asset events THEN succeeds', async function () {
            assetEventTracker = assetEventTracker.connect(adminAccount)
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            await assetEventTracker.recordState(STATE_1)

            expect(await assetEventTracker.getAssetEvents(0, 1)).to.deep.equal([
                [STATE_1, BLOCK_TIMESTAMP],
            ])
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
            const wallet = baseWallet.derivePath('301')

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

            // Grant ASSET_EVENT_TRACKER_ROLE to address
            await govResult.accessControl.grantRole(
                ASSET_EVENT_TRACKER_ROLE,
                addressAccAddr
            )

            // Grant ASSET_EVENT_TRACKER_ROLE to DID
            await govResult.accessControl.grantRole(
                ASSET_EVENT_TRACKER_ROLE,
                adminAddr
            )
            await useCaseAccessControlDid.grantDidRole(
                ASSET_EVENT_TRACKER_ROLE,
                didId
            )

            // Fund DID wallet
            await admin.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther('1.0'),
            })

            return {
                adminAccount: admin,
                assetEventTracker: govResult.assetEventTracker,
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
            assetEventTracker = contracts.assetEventTracker
            pause = contracts.pause
            accessControl = contracts.accessControl
            useCaseAccessControlDid = contracts.useCaseAccessControlDid
            didWallet = contracts.didWallet
            did = contracts.did
            addressAccount = contracts.addressAccount
            addressAccountAddress = contracts.addressAccountAddress
            mockTimestamp = contracts.mockTimestamp
        })

        it('GIVEN role granted to address and DID WHEN both execute recordState THEN both succeed', async function () {
            // Set timestamp
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            // Address executes
            const connectedAssetEventTrackerAddress =
                assetEventTracker.connect(addressAccount)
            await expect(connectedAssetEventTrackerAddress.recordState(STATE_1))
                .to.emit(assetEventTracker, 'StateRecorded')
                .withArgs(STATE_1, BLOCK_TIMESTAMP, addressAccountAddress)

            // DID wallet executes
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                assetEventTracker.connect(didSigner)
            await expect(connectedAssetEventTrackerDid.recordState(STATE_2))
                .to.emit(assetEventTracker, 'StateRecorded')
                .withArgs(STATE_2, BLOCK_TIMESTAMP, didWallet.address)
        })

        it('GIVEN role granted to DID WHEN hasRole checks address THEN returns true', async function () {
            // Check if DID wallet address has role via DID resolution
            const hasRole = await accessControl.hasRole(
                ASSET_EVENT_TRACKER_ROLE,
                didWallet.address
            )
            expect(hasRole).to.be.true
        })

        it('GIVEN role revoked from DID WHEN DID wallet executes THEN fails', async function () {
            // Revoke role from DID
            await useCaseAccessControlDid.revokeDidRole(
                ASSET_EVENT_TRACKER_ROLE,
                did
            )

            // DID wallet should fail
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                assetEventTracker.connect(didSigner)
            await expect(
                connectedAssetEventTrackerDid.recordState(STATE_1)
            ).to.be.revertedWithCustomError(
                assetEventTracker,
                'AccountHasNoRole'
            )
        })

        it('GIVEN role revoked from address WHEN address executes THEN fails but DID still works', async function () {
            // Revoke role from address
            await accessControl.revokeRole(
                ASSET_EVENT_TRACKER_ROLE,
                addressAccountAddress
            )

            // Address should fail
            const connectedAssetEventTrackerAddress =
                assetEventTracker.connect(addressAccount)
            await expect(
                connectedAssetEventTrackerAddress.recordState(STATE_1)
            ).to.be.revertedWithCustomError(
                assetEventTracker,
                'AccountHasNoRole'
            )

            // DID wallet should still work
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                assetEventTracker.connect(didSigner)
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)
            await expect(
                connectedAssetEventTrackerDid.recordState(STATE_1)
            ).to.emit(assetEventTracker, 'StateRecorded')
        })

        it('GIVEN DID has role WHEN checking hasRoleForDid THEN returns true', async function () {
            // Check role directly for DID
            const hasRoleForDid = await useCaseAccessControlDid.hasRoleForDid(
                ASSET_EVENT_TRACKER_ROLE,
                did
            )
            expect(hasRoleForDid).to.be.true
        })
    })

    describe('DID Validation with onlyKnownDid', function () {
        let didWallet: HDNodeWallet
        let unknownAccount: Signer
        let unknownAccountAddress: string

        function walletOfFirstSigner(): HDNodeWallet {
            const mnemonic = (
                config.networks.hardhat.accounts as {
                    mnemonic: string
                    path: string
                }
            ).mnemonic
            return ethers.Wallet.fromPhrase(mnemonic)
        }

        async function deployDidValidationFixture() {
            const [admin, unknownAcc] = await ethers.getSigners()
            const adminAddr = await admin.getAddress()
            const unknownAccAddr = await unknownAcc.getAddress()

            // Create test wallet and DID
            const baseWallet = walletOfFirstSigner()
            const wallet = baseWallet.derivePath('401')

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

            // Grant ASSET_EVENT_TRACKER_ROLE to DID
            await govResult.accessControl.grantRole(
                ASSET_EVENT_TRACKER_ROLE,
                adminAddr
            )
            await useCaseAccessControlDid.grantDidRole(
                ASSET_EVENT_TRACKER_ROLE,
                didId
            )

            // Grant ASSET_EVENT_TRACKER_ROLE to unknown account (but it's not a DID)
            await govResult.accessControl.grantRole(
                ASSET_EVENT_TRACKER_ROLE,
                unknownAccAddr
            )

            // Fund DID wallet
            await admin.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther('1.0'),
            })

            // Fund unknown account
            await admin.sendTransaction({
                to: unknownAccAddr,
                value: ethers.parseEther('1.0'),
            })

            return {
                adminAccount: admin,
                assetEventTracker: govResult.assetEventTracker,
                accessControl: govResult.accessControl,
                useCaseAccessControlDid,
                didWallet: wallet,
                did: didId,
                unknownAccount: unknownAcc,
                unknownAccountAddress: unknownAccAddr,
                didRegistry: didRegistryWithSigner,
                mockTimestamp: govResult.mockTimestamp,
                vMethodId,
                notAfter,
            }
        }

        beforeEach(async function () {
            const contracts = await loadFixture(deployDidValidationFixture)
            adminAccount = contracts.adminAccount
            assetEventTracker = contracts.assetEventTracker
            accessControl = contracts.accessControl
            didWallet = contracts.didWallet
            unknownAccount = contracts.unknownAccount
            unknownAccountAddress = contracts.unknownAccountAddress
            mockTimestamp = contracts.mockTimestamp
        })

        it('GIVEN known DID with role WHEN recordState THEN succeeds', async function () {
            // Set timestamp
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            // DID wallet executes
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                assetEventTracker.connect(didSigner)
            await expect(
                connectedAssetEventTrackerDid.recordState(STATE_1)
            ).to.emit(assetEventTracker, 'StateRecorded')
        })

        it('GIVEN unknown address with role WHEN recordState THEN succeeds', async function () {
            // Unknown account has role but not registered as DID
            // Since onlyKnownDid is not enforced in base AssetEventTracker,
            // having the role is sufficient
            const hasRole = await accessControl.hasRole(
                ASSET_EVENT_TRACKER_ROLE,
                unknownAccountAddress
            )
            expect(hasRole).to.be.true

            // Set timestamp
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            // Should succeed with just the role
            const connectedAssetEventTrackerUnknown =
                assetEventTracker.connect(unknownAccount)
            await expect(connectedAssetEventTrackerUnknown.recordState(STATE_1))
                .to.emit(assetEventTracker, 'StateRecorded')
                .withArgs(STATE_1, BLOCK_TIMESTAMP, unknownAccountAddress)
        })

        it('GIVEN address with revoked vMethod WHEN recordState THEN fails with AccountHasNoRole', async function () {
            const contracts = await loadFixture(deployDidValidationFixture)

            // Revoke verification method - must use didWallet which is controller of the DID
            const currentTime = Math.floor(Date.now() / 1000)
            const didWalletConnected = new ethers.Wallet(
                contracts.didWallet.privateKey,
                ethers.provider
            )
            const didRegistryWithDidWallet =
                contracts.didRegistry.connect(didWalletConnected)
            await didRegistryWithDidWallet.revokeVerificationMethod(
                contracts.did,
                contracts.vMethodId,
                currentTime
            )

            // Should fail - note: AccountHasNoRole is checked before AddressNotKnown
            const didSigner = new ethers.Wallet(
                contracts.didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                contracts.assetEventTracker.connect(didSigner)
            await expect(
                connectedAssetEventTrackerDid.recordState(STATE_1)
            ).to.be.revertedWithCustomError(
                contracts.assetEventTracker,
                'AccountHasNoRole'
            )
        })

        it('GIVEN address with expired capability invocation WHEN recordState THEN fails with AccountHasNoRole', async function () {
            const contracts = await loadFixture(deployDidValidationFixture)

            // Expire verification method using a time halfway to original notAfter
            const currentTime = Math.floor(Date.now() / 1000)
            const midTime =
                currentTime + Math.floor((contracts.notAfter - currentTime) / 2)
            // Use didWallet which is controller of the DID
            const didWalletConnected = new ethers.Wallet(
                contracts.didWallet.privateKey,
                ethers.provider
            )
            const didRegistryWithDidWallet =
                contracts.didRegistry.connect(didWalletConnected)
            await didRegistryWithDidWallet.expireVerificationMethod(
                contracts.did,
                contracts.vMethodId,
                midTime
            )

            // Set mock timestamp past the mid expiration
            await contracts.mockTimestamp.setMockedTimestamp(midTime + 1)

            // Should fail - note: AccountHasNoRole is checked before AddressNotKnown
            const didSigner = new ethers.Wallet(
                contracts.didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                contracts.assetEventTracker.connect(didSigner)
            await expect(
                connectedAssetEventTrackerDid.recordState(STATE_1)
            ).to.be.revertedWithCustomError(
                contracts.assetEventTracker,
                'AccountHasNoRole'
            )
        })

        it('GIVEN known DID via factory resolution WHEN recordState THEN succeeds', async function () {
            // Set timestamp
            await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            // This test verifies the factory DID resolution path works
            // The DID wallet is registered and should resolve via factory
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedAssetEventTrackerDid =
                assetEventTracker.connect(didSigner)

            // Verify it's recognized via factory
            const isKnownDid = await accessControl.hasRole(
                ASSET_EVENT_TRACKER_ROLE,
                didWallet.address
            )
            expect(isKnownDid).to.be.true

            // Should succeed
            await expect(
                connectedAssetEventTrackerDid.recordState(STATE_1)
            ).to.emit(assetEventTracker, 'StateRecorded')
        })
    })
})
