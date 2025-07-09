import { ethers } from 'hardhat'
import {
    BusinessLogicFactoryFacet,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet,
    AccessControl,
    ISBEPause,
    AssetEventTrackerTestWrapper,
    Ownable2Step,
    Ownable,
    HashTimestampTestWrapper,
    ERC20Snapshot,
    ERC20Burnable,
    ERC20Capped,
    ERC20Controller,
    ERC20,
    MockTimestampFacet,
    EIP2535AccessControl__factory,
    BusinessLogicFactoryFacet__factory,
} from '../typechain-types'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    ERC20_BURNABLE_RESOLVER_KEY,
    ERC20_CAPPED_RESOLVER_KEY,
    ERC20_CONTROLLER_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    ISBE_ROLE,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    PAUSER_ROLE,
} from './constants'
import { ContractFactory } from 'ethers'
import { ContractTransactionReceipt } from 'ethers/src.ts/contract/wrappers'

let BusinessLogicFactoryFacetFactory: BusinessLogicFactoryFacet__factory
let EIP2535AccessControlFactory: EIP2535AccessControl__factory
let factory: BusinessLogicFactoryFacet

async function deployFactory(
    facets: string[],
    owners: string[]
): Promise<BusinessLogicFactoryFacet> {
    const diamondAddress = await EIP2535AccessControlFactory.deploy(facets, {
        rbacs: [
            {
                role: DEFAULT_ADMIN_ROLE,
                members: owners,
            },
            {
                role: ISBE_ROLE,
                members: owners,
            },
            {
                role: PAUSER_ROLE,
                members: owners,
            },
        ],
        init: ethers.ZeroAddress,
        initCalldata: '0x',
    })
    return BusinessLogicFactoryFacetFactory.attach(diamondAddress)
}

async function deployBusinessLogicFromFactory(
    resolverKey: string,
    contractFactory: ContractFactory
) {
    const deployTx: ContractTransactionReceipt = await (
        await factory.deploy(resolverKey, contractFactory.bytecode)
    ).wait()
    const businessAddress = deployTx.logs.filter(
        (log) =>
            log.topics[0] ===
            '0xe50cdcfd1b693a28ae23bc9a7b0614b649a9caaa7164a4aa2e8161ab6c8cd7a4'
    )[0].args.businessAddress
    return contractFactory.attach(businessAddress)
}

export async function deployAll(
    isOwnable: boolean = false,
    isGovernance: boolean = false
) {
    const [owner] = await ethers.getSigners()

    BusinessLogicFactoryFacetFactory = await ethers.getContractFactory(
        'BusinessLogicFactoryFacet'
    )
    EIP2535AccessControlFactory = await ethers.getContractFactory(
        'EIP2535AccessControl'
    )
    const DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
        'DiamondCutAccessControlFacet'
    )
    const DiamondLoupeFacetFactory =
        await ethers.getContractFactory('DiamondLoupeFacet')

    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlGovernanceFacetFactory = await ethers.getContractFactory(
        'AccessControlGovernanceFacet'
    )
    const Ownable2StepFacetFactory =
        await ethers.getContractFactory('Ownable2StepFacet')
    const OwnableFacetFactory = await ethers.getContractFactory('OwnableFacet')
    const ISBEPauseFacetFactory =
        await ethers.getContractFactory('ISBEPauseFacet')
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

    const businessLogicFactoryFacet: BusinessLogicFactoryFacet =
        await BusinessLogicFactoryFacetFactory.deploy()
    await businessLogicFactoryFacet.waitForDeployment()
    factory = await deployFactory(
        [await businessLogicFactoryFacet.getAddress()],
        [await owner.getAddress()]
    )
    const diamondCutFacet = await deployBusinessLogicFromFactory(
        DIAMOND_CUT_RESOLVER_KEY,
        DiamondCutAccessControlFacetFactory
    )
    const diamondLoupeFacet = await deployBusinessLogicFromFactory(
        DIAMOND_LOUPE_RESOLVER_KEY,
        DiamondLoupeFacetFactory
    )
    const accessControlFacet = !isGovernance
        ? await deployBusinessLogicFromFactory(
              ACCESS_CONTROL_RESOLVER_KEY,
              AccessControlFacetFactory
          )
        : await deployBusinessLogicFromFactory(
              ACCESS_CONTROL_RESOLVER_KEY,
              AccessControlGovernanceFacetFactory
          )
    const ownable2StepFacet = await deployBusinessLogicFromFactory(
        OWNABLE_RESOLVER_KEY,
        Ownable2StepFacetFactory
    )
    const ownableFacet = await deployBusinessLogicFromFactory(
        OWNABLE_RESOLVER_KEY,
        OwnableFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )
    //const erc20Facet = await ERC20TestWrapperFactory.deploy()
    const erc20SnapshotFacet = await deployBusinessLogicFromFactory(
        ERC20_SNAPSHOT_RESOLVER_KEY,
        ERC20SnapshotFacetFactory
    )
    const erc20BurnableFacet = await deployBusinessLogicFromFactory(
        ERC20_BURNABLE_RESOLVER_KEY,
        ERC20BurnableFacetFactory
    )
    const erc20CappedFacet = await deployBusinessLogicFromFactory(
        ERC20_CAPPED_RESOLVER_KEY,
        ERC20CappedFacetFactory
    )
    const erc20ControllerFacet = await deployBusinessLogicFromFactory(
        ERC20_CONTROLLER_RESOLVER_KEY,
        ERC20ControllerFacetFactory
    )
    const erc20Facet = await deployBusinessLogicFromFactory(
        ERC20_RESOLVER_KEY,
        ERC20FacetFactory
    )
    const assetEventTrackerFacet = await deployBusinessLogicFromFactory(
        ASSET_EVENT_TRACKER_RESOLVER_KEY,
        AssetEventTrackerTestWrapperFactory
    )
    const hashTimestampFacet = await deployBusinessLogicFromFactory(
        HASH_TIMESTAMP_RESOLVER_KEY,
        HashTimestampTestWrapperFactory
    )
    const mockTimestampFacet = await deployBusinessLogicFromFactory(
        MOCK_TIMESTAMP_RESOLVER_KEY,
        MockTimestampFacetFactory
    )

    const facetAddresses = [
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await accessControlFacet.getAddress(),
        isOwnable
            ? await ownableFacet.getAddress()
            : await ownable2StepFacet.getAddress(),
        await pauseFacet.getAddress(),
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
    ) as MockTimestampFacet

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
