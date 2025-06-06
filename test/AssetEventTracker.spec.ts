import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    AssetEventTrackerTestWrapper__factory,
    AssetEventTrackerTestWrapper,
    DiamondCutAccessControlFacet__factory,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet__factory,
    DiamondLoupeFacet,
    AccessControlFacet__factory,
    AccessControl,
    ISBEPauseFacet__factory,
    ISBEPause,
    AccessControlFacet,
    ISBEPauseFacet,
} from '../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    ASSET_EVENT_TRACKER_ROLE,
    PAUSER_ROLE,
} from './constants'

describe('Asset Event Tracker', function () {
    const STATE_1 = 1
    const STATE_2 = 2
    const BLOCK_TIMESTAMP = 1234567890

    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let AccessControlFacetFactory: AccessControlFacet__factory
    let ISBEPauseFacetFactory: ISBEPauseFacet__factory
    let AssetEventTrackerTestWrapperFactory: AssetEventTrackerTestWrapper__factory

    let diamondCutFacet: DiamondCutAccessControlFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let accessControlFacet: AccessControlFacet
    let pauseFacet: ISBEPauseFacet
    let assetEventTrackerFacet: AssetEventTrackerTestWrapper

    let diamondProxy: EIP2535AccessControl

    let facetAddresses: string[]
    let adminAccount: Signer
    let assetEventTracker: AssetEventTrackerTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl

    async function deploy() {
        ;[adminAccount] = await ethers.getSigners()
        const adminAccountAddress = await adminAccount.getAddress()

        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
            'DiamondCutAccessControlFacet'
        )
        DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')

        AccessControlFacetFactory =
            await ethers.getContractFactory('AccessControlFacet')
        ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')
        AssetEventTrackerTestWrapperFactory = await ethers.getContractFactory(
            'AssetEventTrackerTestWrapper'
        )

        diamondCutFacet = await DiamondCutAccessControlFacetFactory.deploy()
        diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        accessControlFacet = await AccessControlFacetFactory.deploy()
        pauseFacet = await ISBEPauseFacetFactory.deploy()
        assetEventTrackerFacet =
            await AssetEventTrackerTestWrapperFactory.deploy()

        await diamondCutFacet.waitForDeployment()
        await diamondLoupeFacet.waitForDeployment()
        await accessControlFacet.waitForDeployment()
        await pauseFacet.waitForDeployment()
        await assetEventTrackerFacet.waitForDeployment()

        facetAddresses = [
            await diamondCutFacet.getAddress(),
            await diamondLoupeFacet.getAddress(),
            await accessControlFacet.getAddress(),
            await pauseFacet.getAddress(),
            await assetEventTrackerFacet.getAddress(),
        ]

        diamondProxy = await EIP2535AccessControlFactory.deploy(
            facetAddresses,
            {
                rbacs: [
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [adminAccountAddress],
                    },
                    {
                        role: PAUSER_ROLE,
                        members: [adminAccountAddress],
                    },
                    {
                        role: ASSET_EVENT_TRACKER_ROLE,
                        members: [adminAccountAddress],
                    },
                ],
                init: ethers.ZeroAddress,
                initCalldata: '0x',
            }
        )
        await diamondProxy.waitForDeployment()
        assetEventTracker = AssetEventTrackerTestWrapperFactory.attach(
            await diamondProxy.getAddress()
        ) as AssetEventTrackerTestWrapper
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
            pause = ISBEPauseFacetFactory.attach(
                await diamondProxy.getAddress()
            ) as ISBEPause
            await pause.pause()

            await expect(
                assetEventTracker.recordState(STATE_1)
            ).to.be.revertedWithCustomError(assetEventTracker, 'IsPaused')
        })

        it('GIVEN a Asset Event Tracker WHEN account has no roles THEN fails', async function () {
            await deploy()

            assetEventTracker = assetEventTracker.connect(adminAccount)
            accessControl = AccessControlFacetFactory.attach(
                await diamondProxy.getAddress()
            ) as AccessControl
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
