import { ethers } from 'hardhat'
import {
    //ERC20TestWrapper,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet,
    AccessControl,
    ISBEPause,
    AssetEventTrackerTestWrapper,
    Ownable2Step,
    Ownable,
    MockTimestamp,
    HashTimestampTestWrapper,
    ERC20Snapshot,
    ERC20Burnable,
    ERC20Capped,
    ERC20Controller,
    ERC20,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE } from './constants'

export async function deployAll(isOwnable: boolean = false) {
    const [owner] = await ethers.getSigners()

    const EIP2535AccessControlFactory = await ethers.getContractFactory(
        'EIP2535AccessControl'
    )
    const DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
        'DiamondCutAccessControlFacet'
    )
    const DiamondLoupeFacetFactory =
        await ethers.getContractFactory('DiamondLoupeFacet')

    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const Ownable2StepFacetFactory =
        await ethers.getContractFactory('Ownable2StepFacet')
    const OwnableFacetFactory = await ethers.getContractFactory('OwnableFacet')
    const ISBEPauseFacetFactory =
        await ethers.getContractFactory('ISBEPauseFacet')
    /*const ERC20TestWrapperFactory =
        await ethers.getContractFactory('ERC20TestWrapper')*/
    const ERC20SnapshotFacetFactory =
        await ethers.getContractFactory('ERC20SnapshotFacet')
    const ERC20BurnableFacetFactory =
        await ethers.getContractFactory('ERC20BurnableFacet')
    const ERC20CappedFacetFactory =
        await ethers.getContractFactory('ERC20CappedFacet')
    const ERC20ControllerFacetFactory = await ethers.getContractFactory(
        'ERC20ControllerFacet'
    )
    const ERC20FacetFactory = await ethers.getContractFactory('ERC20Facet')

    const AssetEventTrackerTestWrapperFactory = await ethers.getContractFactory(
        'AssetEventTrackerTestWrapper'
    )
    const HashTimestampTestWrapperFactory = await ethers.getContractFactory(
        'HashTimestampTestWrapper'
    )
    const MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')

    const diamondCutFacet = await DiamondCutAccessControlFacetFactory.deploy()
    const diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
    const accessControlFacet = await AccessControlFacetFactory.deploy()
    const ownable2StepFacet = await Ownable2StepFacetFactory.deploy()
    const ownableFacet = await OwnableFacetFactory.deploy()
    const pauseFacet = await ISBEPauseFacetFactory.deploy()
    //const erc20Facet = await ERC20TestWrapperFactory.deploy()
    const erc20SnapshotFacet = await ERC20SnapshotFacetFactory.deploy()
    const erc20BurnableFacet = await ERC20BurnableFacetFactory.deploy()
    const erc20CappedFacet = await ERC20CappedFacetFactory.deploy()
    const erc20ControllerFacet = await ERC20ControllerFacetFactory.deploy()
    const erc20Facet = await ERC20FacetFactory.deploy()
    const assetEventTrackerFacet =
        await AssetEventTrackerTestWrapperFactory.deploy()
    const hashTimestampFacet = await HashTimestampTestWrapperFactory.deploy()
    const mockTimestampFacet = await MockTimestampFacetFactory.deploy()

    await diamondCutFacet.waitForDeployment()
    await diamondLoupeFacet.waitForDeployment()
    await accessControlFacet.waitForDeployment()
    await ownable2StepFacet.waitForDeployment()
    await ownableFacet.waitForDeployment()
    await pauseFacet.waitForDeployment()
    //await erc20Facet.waitForDeployment()
    await erc20SnapshotFacet.waitForDeployment()
    await erc20BurnableFacet.waitForDeployment()
    await erc20CappedFacet.waitForDeployment()
    await erc20ControllerFacet.waitForDeployment()
    await erc20Facet.waitForDeployment()
    await assetEventTrackerFacet.waitForDeployment()
    await hashTimestampFacet.waitForDeployment()
    await mockTimestampFacet.waitForDeployment()

    const facetAddresses = [
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await accessControlFacet.getAddress(),
        isOwnable == true
            ? await ownableFacet.getAddress()
            : await ownable2StepFacet.getAddress(),
        await pauseFacet.getAddress(),
        //await erc20Facet.getAddress(),
        await erc20SnapshotFacet.getAddress(),
        await erc20BurnableFacet.getAddress(),
        await erc20CappedFacet.getAddress(),
        await erc20ControllerFacet.getAddress(),
        await erc20Facet.getAddress(),
        await assetEventTrackerFacet.getAddress(),
        await hashTimestampFacet.getAddress(),
        await mockTimestampFacet.getAddress(),
    ]

    const diamondProxy = await EIP2535AccessControlFactory.deploy(
        facetAddresses,
        {
            rbacs: [
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [owner],
                },
            ],
            init: ethers.ZeroAddress,
            initCalldata: '0x',
        }
    )
    await diamondProxy.waitForDeployment()

    /*const erc20 = ERC20TestWrapperFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20TestWrapper*/
    const erc20Snapshot = ERC20SnapshotFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20Snapshot
    const erc20Burnable = ERC20BurnableFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20Burnable
    const erc20Capped = ERC20CappedFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20Capped
    const erc20Controller = ERC20ControllerFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20Controller
    const erc20 = ERC20FacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20

    const pause = ISBEPauseFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ISBEPause

    const accessControl = AccessControlFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as AccessControl

    const ownable2Step = Ownable2StepFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as Ownable2Step

    const ownable = OwnableFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as Ownable

    const assetEventTracker = AssetEventTrackerTestWrapperFactory.attach(
        await diamondProxy.getAddress()
    ) as AssetEventTrackerTestWrapper

    const hashTimestamp = HashTimestampTestWrapperFactory.attach(
        await diamondProxy.getAddress()
    ) as HashTimestampTestWrapper

    const diamondCutAccessControl = DiamondCutAccessControlFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as DiamondCutAccessControlFacet

    const diamondLoupe = DiamondLoupeFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as DiamondLoupeFacet

    const mockTimestamp = MockTimestampFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as MockTimestamp

    return {
        diamondProxy,
        erc20,
        erc20Snapshot,
        erc20Burnable,
        erc20Capped,
        erc20Controller,
        pause,
        accessControl,
        ownable2Step,
        ownable,
        assetEventTracker,
        hashTimestamp,
        diamondCutAccessControl,
        diamondLoupe,
        mockTimestamp,
        erc20Facet,
        erc20SnapshotFacet,
        erc20BurnableFacet,
        erc20CappedFacet,
        erc20ControllerFacet,
        pauseFacet,
        accessControlFacet,
        ownable2StepFacet,
        ownableFacet,
        assetEventTrackerFacet,
        hashTimestampFacet,
        diamondCutFacet,
        diamondLoupeFacet,
    }
}
