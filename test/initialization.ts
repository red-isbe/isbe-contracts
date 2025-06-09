import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    ERC20TestWrapper,
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    ERC20TestWrapper__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet__factory,
    DiamondLoupeFacet,
    AccessControlFacet__factory,
    AccessControlFacet,
    ISBEPauseFacet__factory,
    ISBEPauseFacet,
    AccessControl,
    ISBEPause,
    Ownable2StepFacet__factory,
    OwnableFacet__factory,
    AssetEventTrackerTestWrapper__factory,
    HashTimestampTestWrapper__factory,
    AssetEventTrackerTestWrapper,
    HashTimestamp,
    Ownable2StepFacet,
    Ownable2Step,
    OwnableFacet,
    Ownable,
    MockTimestampFacet__factory,
    MockTimestampFacet,
    MockTimestamp,
    HashTimestampTestWrapper,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE } from './constants'

export async function deployAll(isOwnable: boolean = false) {
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let AccessControlFacetFactory: AccessControlFacet__factory
    let Ownable2StepFacetFactory: Ownable2StepFacet__factory
    let OwnableFacetFactory: OwnableFacet__factory
    let ISBEPauseFacetFactory: ISBEPauseFacet__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let AssetEventTrackerTestWrapperFactory: AssetEventTrackerTestWrapper__factory
    let HashTimestampTestWrapperFactory: HashTimestampTestWrapper__factory
    let MockTimestampFacetFactory: MockTimestampFacet__factory

    let diamondCutFacet: DiamondCutAccessControlFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let accessControlFacet: AccessControlFacet
    let ownable2StepFacet: Ownable2StepFacet
    let ownableFacet: OwnableFacet
    let pauseFacet: ISBEPauseFacet
    let erc20Facet: ERC20TestWrapper
    let assetEventTrackerFacet: AssetEventTrackerTestWrapper
    let hashTimestampFacet: HashTimestamp
    let mockTimestampFacet: MockTimestampFacet

    let diamondProxy: EIP2535AccessControl

    let facetAddresses: string[]

    let erc20: ERC20TestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl
    let hashTimestamp: HashTimestamp
    let assetEventTracker: AssetEventTrackerTestWrapper
    let ownable2Step: Ownable2Step
    let ownable: Ownable
    let diamondCutAccessControl: DiamondCutAccessControlFacet
    let diamondLoupe: DiamondLoupeFacet
    let mockTimestamp: MockTimestamp

    let owner: Signer
    ;[owner] = await ethers.getSigners()

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
    Ownable2StepFacetFactory =
        await ethers.getContractFactory('Ownable2StepFacet')
    OwnableFacetFactory = await ethers.getContractFactory('OwnableFacet')
    ISBEPauseFacetFactory = await ethers.getContractFactory('ISBEPauseFacet')
    ERC20TestWrapperFactory =
        await ethers.getContractFactory('ERC20TestWrapper')
    AssetEventTrackerTestWrapperFactory = await ethers.getContractFactory(
        'AssetEventTrackerTestWrapper'
    )
    HashTimestampTestWrapperFactory = await ethers.getContractFactory(
        'HashTimestampTestWrapper'
    )
    MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')

    diamondCutFacet = await DiamondCutAccessControlFacetFactory.deploy()
    diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
    accessControlFacet = await AccessControlFacetFactory.deploy()
    ownable2StepFacet = await Ownable2StepFacetFactory.deploy()
    ownableFacet = await OwnableFacetFactory.deploy()
    pauseFacet = await ISBEPauseFacetFactory.deploy()
    erc20Facet = await ERC20TestWrapperFactory.deploy()
    assetEventTrackerFacet = await AssetEventTrackerTestWrapperFactory.deploy()
    hashTimestampFacet = await HashTimestampTestWrapperFactory.deploy()
    mockTimestampFacet = await MockTimestampFacetFactory.deploy()

    await diamondCutFacet.waitForDeployment()
    await diamondLoupeFacet.waitForDeployment()
    await accessControlFacet.waitForDeployment()
    await ownable2StepFacet.waitForDeployment()
    await ownableFacet.waitForDeployment()
    await pauseFacet.waitForDeployment()
    await erc20Facet.waitForDeployment()
    await assetEventTrackerFacet.waitForDeployment()
    await hashTimestampFacet.waitForDeployment()
    await mockTimestampFacet.waitForDeployment()

    facetAddresses = [
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await accessControlFacet.getAddress(),
        isOwnable == true
            ? await ownable2StepFacet.getAddress()
            : await ownableFacet.getAddress(),
        await pauseFacet.getAddress(),
        await erc20Facet.getAddress(),
        await assetEventTrackerFacet.getAddress(),
        await hashTimestampFacet.getAddress(),
        await mockTimestampFacet.getAddress(),
    ]

    diamondProxy = await EIP2535AccessControlFactory.deploy(facetAddresses, {
        rbacs: [
            {
                role: DEFAULT_ADMIN_ROLE,
                members: [owner],
            },
        ],
        init: ethers.ZeroAddress,
        initCalldata: '0x',
    })
    await diamondProxy.waitForDeployment()

    erc20 = ERC20TestWrapperFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20TestWrapper

    pause = ISBEPauseFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ISBEPause

    accessControl = AccessControlFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as AccessControl

    ownable2Step = Ownable2StepFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as Ownable2Step

    ownable = OwnableFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as Ownable

    assetEventTracker = AssetEventTrackerTestWrapperFactory.attach(
        await diamondProxy.getAddress()
    ) as AssetEventTrackerTestWrapper

    hashTimestamp = HashTimestampTestWrapperFactory.attach(
        await diamondProxy.getAddress()
    ) as HashTimestampTestWrapper

    diamondCutAccessControl = DiamondCutAccessControlFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as DiamondCutAccessControlFacet

    diamondLoupe = DiamondLoupeFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as DiamondLoupeFacet

    mockTimestamp = MockTimestampFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as MockTimestamp

    return {
        diamondProxy,
        erc20,
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
