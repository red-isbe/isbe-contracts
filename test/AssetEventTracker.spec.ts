import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    AssetEventTrackerTestWrapper,
    AccessControl,
    ISBEPause,
    MockTimestamp,
} from '../typechain-types'
import { ASSET_EVENT_TRACKER_ROLE, PAUSER_ROLE } from './constants'
import { deployGovernance } from './initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

describe('Asset Event Tracker', function () {
    const STATE_1 = 1
    const STATE_2 = 2
    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let assetEventTracker: AssetEventTrackerTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl
    let mockTimestamp: MockTimestamp

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAccountAddress = await adminSigner.getAddress()

        const result = await deployGovernance(adminSigner)

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
})
