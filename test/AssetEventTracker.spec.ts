import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { AssetEventTrackerTestWrapper } from '../typechain-types'
import { ASSET_EVENT_TRACKER_ROLE, PAUSER_ROLE } from './constants'

describe('Asset Event Tracker', function () {
    const STATE_1 = 1
    const STATE_2 = 2
    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let assetEventTracker: AssetEventTrackerTestWrapper
    let assetEventTrackerImplementation: AssetEventTrackerTestWrapper

    async function deploy() {
        ;[adminAccount] = await ethers.getSigners()
        const adminAccountAddress = await adminAccount.getAddress()

        const AssetEventTracker = await ethers.getContractFactory(
            'AssetEventTrackerTestWrapper'
        )
        assetEventTrackerImplementation = await AssetEventTracker.deploy()
        expect(await assetEventTrackerImplementation.selectorsIntrospection())
            .to.not.be.undefined

        const Proxy = await ethers.getContractFactory('IsbeERC1967Proxy')
        const proxy = await Proxy.deploy(assetEventTrackerImplementation)
        await proxy.waitForDeployment()

        assetEventTracker = (await AssetEventTracker.attach(
            await proxy.getAddress()
        )) as AssetEventTrackerTestWrapper

        await assetEventTracker.initializeAccessControl(adminAccountAddress)

        assetEventTracker = assetEventTracker.connect(adminAccount)
        await assetEventTracker.grantRole(
            ASSET_EVENT_TRACKER_ROLE,
            adminAccountAddress
        )
        await assetEventTracker.grantRole(PAUSER_ROLE, adminAccountAddress)

        await assetEventTracker.initializePause(false)
    }

    describe('Recording states', function () {
        it('GIVEN a Asset Event Tracker WHEN record a state THEN succeeds', async function () {
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)
            await assetEventTracker.setMockedTimestamp(BLOCK_TIMESTAMP)

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
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)
            await assetEventTracker.setMockedTimestamp(BLOCK_TIMESTAMP)

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
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)
            await assetEventTracker.pause()

            await expect(
                assetEventTracker.recordState(STATE_1)
            ).to.be.revertedWithCustomError(assetEventTracker, 'IsPaused')
        })

        it('GIVEN a Asset Event Tracker WHEN account has no roles THEN fails', async function () {
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)
            await assetEventTracker.revokeRole(
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
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)

            await assetEventTracker.recordState(STATE_1)

            expect(
                await assetEventTracker.isStateChangeAllowed(STATE_2)
            ).to.equal(true)
        })

        it('GIVEN a Asset Event Tracker WHEN current state is higher than new THEN succeeds', async function () {
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)

            await assetEventTracker.recordState(STATE_2)

            expect(
                await assetEventTracker.isStateChangeAllowed(STATE_1)
            ).to.equal(false)
        })
    })

    describe('Getting asset events', function () {
        it('GIVEN a Asset Event Tracker WHEN gets page higher than existing asset events THEN succeeds', async function () {
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)

            await assetEventTracker.recordState(STATE_1)

            expect(await assetEventTracker.getAssetEvents(1, 10)).to.deep.equal(
                []
            )
        })

        it('GIVEN a Asset Event Tracker WHEN gets results per page equals than existing asset events THEN succeeds', async function () {
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)
            await assetEventTracker.setMockedTimestamp(BLOCK_TIMESTAMP)

            await assetEventTracker.recordState(STATE_1)

            expect(await assetEventTracker.getAssetEvents(0, 1)).to.deep.equal([
                [STATE_1, BLOCK_TIMESTAMP],
            ])
        })
    })
})
