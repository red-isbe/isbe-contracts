import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    BusinessLogicFactoryFacet,
    BusinessLogicFactoryFacet__factory,
    GlobalIsbePauseFacet,
    ProxyFactoryFacet,
    ConfigurationManagementFacet,
    DiamondCutAccessControlFacet,
    DiamondCutAccessControlFacet__factory,
    DiamondLoupeFacet,
    DiamondLoupeFacet__factory,
    AccessControlGovernanceFacet,
    ISBEPauseFacet,
    ISBEPauseFacet__factory,
    ERC20SnapshotFacet,
    ERC20BurnableFacet,
    ERC20CappedFacet,
    ERC20ControllerFacet,
    ERC20Facet,
    AssetEventTrackerTestWrapper,
    HashTimestampTestWrapper,
    MockTimestampFacet,
    OwnableFacet,
    Ownable2StepFacet,
    AccessControlFacet,
    IIsbeFactory,
} from '../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    PROXY_DEPLOYER_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_MANAGER_ROLE,
    ISBE_PAUSER_ROLE,
    OWNABLE_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    ERC20_BURNABLE_RESOLVER_KEY,
    ERC20_CAPPED_RESOLVER_KEY,
    ERC20_CONTROLLER_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
} from './constants'
import { getEvent } from '../scripts/utils/getEvent'
import { getIsbeFactory } from '../scripts/utils/getIsbeFactory'

const CONFIG_ID_1 =
    '0x0000000000000000000000000000000000000000000000000000000000000001'

let BusinessLogicFactoryFacetFactory: BusinessLogicFactoryFacet__factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EIP2535AccessControlFactory: any
let ISBEPauseFacetFactory: ISBEPauseFacet__factory
let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let isbeFactory: IIsbeFactory

/*async function deployFactory(
    facets: string[],
    owners: string[]
): Promise<IIsbeFactory> {
    const diamondAddress = await EIP2535AccessControlFactory.deploy(facets, {
        rbacs: [
            {
                role: DEFAULT_ADMIN_ROLE,
                members: owners,
            },
            {
                role: BUSINESS_LOGIC_DEPLOYER_ROLE,
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
}*/

async function deployBusinessLogicFromFactory(
    resolverKey: string,
    contractFactory: ethers.ContractFactory
) {
    await isbeFactory.deploy(resolverKey, contractFactory.bytecode)
    const deployTx = await (
        await isbeFactory.deploy(resolverKey, contractFactory.bytecode)
    ).wait()
    if (!deployTx) {
        throw new Error('Deployment transaction failed')
    }

    const businessAddress = deployTx.logs.filter(
        (log) =>
            log.topics[0] ===
            '0xe50cdcfd1b693a28ae23bc9a7b0614b649a9caaa7164a4aa2e8161ab6c8cd7a4'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )[0] as any
    return contractFactory.attach(businessAddress.args.businessAddress)
}

export async function deployGovernance(
    owner: Signer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacsUseCase: any[] = [],
    init_pause: boolean = false,
    initCalldata: string = '0x',
    init_BusinessId_UseCase: string[] = [],
    init_CallData_UseCase: string[] = [],
    isUseCaseOwnable: boolean = false
) {
    const rbacs = [
        {
            role: DEFAULT_ADMIN_ROLE,
            members: [owner],
        },
        {
            role: PROXY_DEPLOYER_ROLE,
            members: [owner],
        },
        {
            role: BUSINESS_LOGIC_DEPLOYER_ROLE,
            members: [owner],
        },
        {
            role: CONFIGURATION_MANAGER_ROLE,
            members: [owner],
        },
        {
            role: GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
            members: [owner],
        },
        {
            role: GOVERNANCE_MANAGER_ROLE,
            members: [owner],
        },
        {
            role: ISBE_PAUSER_ROLE,
            members: [owner],
        },
    ]

    BusinessLogicFactoryFacetFactory = await ethers.getContractFactory(
        'BusinessLogicFactoryFacet'
    )
    EIP2535AccessControlFactory = await ethers.getContractFactory(
        'EIP2535AccessControl'
    )
    const GlobalIsbePauseFacetFactory = await ethers.getContractFactory(
        'GlobalIsbePauseFacet'
    )
    const ProxyFactoryFacetFactory =
        await ethers.getContractFactory('ProxyFactoryFacet')
    const ConfigMgmtFacetFactory = await ethers.getContractFactory(
        'ConfigurationManagementFacet'
    )
    DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
        'DiamondCutAccessControlFacet'
    )
    DiamondLoupeFacetFactory =
        await ethers.getContractFactory('DiamondLoupeFacet')

    const AccessControlGovernanceFacetFactory = await ethers.getContractFactory(
        'AccessControlGovernanceFacet'
    )
    ISBEPauseFacetFactory = await ethers.getContractFactory('ISBEPauseFacet')

    const businessLogicFactoryFacet: BusinessLogicFactoryFacet =
        await BusinessLogicFactoryFacetFactory.deploy()
    await businessLogicFactoryFacet.waitForDeployment()

    const globalIsbePauseFacet: GlobalIsbePauseFacet =
        await GlobalIsbePauseFacetFactory.deploy()
    await globalIsbePauseFacet.waitForDeployment()

    const proxyFactoryFacet: ProxyFactoryFacet =
        await ProxyFactoryFacetFactory.deploy()
    await proxyFactoryFacet.waitForDeployment()

    const configMgmtFacet: ConfigurationManagementFacet =
        await ConfigMgmtFacetFactory.deploy()
    await configMgmtFacet.waitForDeployment()

    const diamondCutAccessControlFacet: DiamondCutAccessControlFacet =
        await DiamondCutAccessControlFacetFactory.deploy()
    await diamondCutAccessControlFacet.waitForDeployment()

    const diamondLoupeFacet: DiamondLoupeFacet =
        await DiamondLoupeFacetFactory.deploy()
    await diamondLoupeFacet.waitForDeployment()

    const accessControlGovernanceFacet: AccessControlGovernanceFacet =
        await AccessControlGovernanceFacetFactory.deploy()
    await accessControlGovernanceFacet.waitForDeployment()

    const iSBEPauseFacet: ISBEPauseFacet = await ISBEPauseFacetFactory.deploy()
    await iSBEPauseFacet.waitForDeployment()

    const governanceFacets = [
        await businessLogicFactoryFacet.getAddress(),
        await globalIsbePauseFacet.getAddress(),
        await proxyFactoryFacet.getAddress(),
        await configMgmtFacet.getAddress(),
        await diamondCutAccessControlFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await accessControlGovernanceFacet.getAddress(),
        await iSBEPauseFacet.getAddress(),
    ]

    const governanceContractDiamond = await EIP2535AccessControlFactory.deploy(
        governanceFacets,
        {
            rbacs: rbacs,
            init: ethers.ZeroAddress,
            initCalldata,
        }
    )

    const governanceContract =
        await governanceContractDiamond.waitForDeployment()

    isbeFactory = await getIsbeFactory(
        await governanceContractDiamond.getAddress(),
        owner
    )

    const useCaseDeployment = await deployAllUseCasesFacets(
        rbacsUseCase,
        init_pause,
        init_BusinessId_UseCase,
        init_CallData_UseCase,
        isUseCaseOwnable
    )

    const accessControlGovernance = AccessControlGovernanceFacetFactory.attach(
        await isbeFactory.getAddress()
    ) as AccessControlGovernanceFacet

    const globalIsbePause = GlobalIsbePauseFacetFactory.attach(
        await isbeFactory.getAddress()
    ) as GlobalIsbePauseFacet

    return {
        governanceContract,
        erc20: useCaseDeployment.erc20,
        erc20Snapshot: useCaseDeployment.erc20Snapshot,
        erc20Burnable: useCaseDeployment.erc20Burnable,
        erc20Capped: useCaseDeployment.erc20Capped,
        erc20Controller: useCaseDeployment.erc20Controller,
        pause: useCaseDeployment.pause,
        globalIsbePause,
        accessControl: useCaseDeployment.accessControl,
        accessControlGovernance,
        ownable: useCaseDeployment.ownable,
        assetEventTracker: useCaseDeployment.assetEventTracker,
        hashTimestamp: useCaseDeployment.hashTimestamp,
        diamondCutAccessControl: useCaseDeployment.diamondCutAccessControl,
        diamondLoupe: useCaseDeployment.diamondLoupe,
        mockTimestamp: useCaseDeployment.mockTimestamp,
        erc20Facet: useCaseDeployment.erc20Facet,
        erc20SnapshotFacet: useCaseDeployment.erc20SnapshotFacet,
        erc20BurnableFacet: useCaseDeployment.erc20BurnableFacet,
        erc20CappedFacet: useCaseDeployment.erc20CappedFacet,
        erc20ControllerFacet: useCaseDeployment.erc20ControllerFacet,
        pauseFacet: useCaseDeployment.pauseFacet,
        accessControlFacet: useCaseDeployment.accessControlFacet,
        ownableFacet: useCaseDeployment.ownableFacet,
        assetEventTrackerFacet: useCaseDeployment.assetEventTrackerFacet,
        hashTimestampFacet: useCaseDeployment.hashTimestampFacet,
        diamondCutAccessControlFacet,
        diamondLoupeFacet,
        accessControlGovernanceFacet,
        useCaseProxy: useCaseDeployment.proxy,
    }
}

export async function deployAllUseCasesFacets(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[],
    isOwnable: boolean = false
) {
    const HashTimestampTestWrapperFactory = await ethers.getContractFactory(
        'HashTimestampTestWrapper'
    )

    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const Ownable2StepFacetFactory =
        await ethers.getContractFactory('Ownable2StepFacet')
    const OwnableFacetFactory = await ethers.getContractFactory('OwnableFacet')
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
    const MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')

    const isbeCutFacet = await deployBusinessLogicFromFactory(
        ISBE_CUT_RESOLVER_KEY,
        IsbeCutFacetFactory
    )
    const isbeLoupeFacet = await deployBusinessLogicFromFactory(
        ISBE_LOUPE_RESOLVER_KEY,
        IsbeLoupeFacetFactory
    )

    const accessControlFacet = await deployBusinessLogicFromFactory(
        ACCESS_CONTROL_RESOLVER_KEY,
        AccessControlFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )

    const ownableFactory = isOwnable
        ? OwnableFacetFactory
        : Ownable2StepFacetFactory

    const ownableFacet = await deployBusinessLogicFromFactory(
        OWNABLE_RESOLVER_KEY,
        ownableFactory
    )

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
    const diamondCutAccessControlFacet = await deployBusinessLogicFromFactory(
        DIAMOND_CUT_RESOLVER_KEY,
        DiamondCutAccessControlFacetFactory
    )
    const diamondLoupeFacet = await deployBusinessLogicFromFactory(
        DIAMOND_LOUPE_RESOLVER_KEY,
        DiamondLoupeFacetFactory
    )

    // Deploy all business logic contracts before setting configuration
    await deployBusinessLogicFromFactory(OWNABLE_RESOLVER_KEY, ownableFactory)
    await deployBusinessLogicFromFactory(
        ERC20_SNAPSHOT_RESOLVER_KEY,
        ERC20SnapshotFacetFactory
    )
    await deployBusinessLogicFromFactory(
        ERC20_BURNABLE_RESOLVER_KEY,
        ERC20BurnableFacetFactory
    )
    await deployBusinessLogicFromFactory(
        ERC20_CAPPED_RESOLVER_KEY,
        ERC20CappedFacetFactory
    )
    await deployBusinessLogicFromFactory(
        ERC20_CONTROLLER_RESOLVER_KEY,
        ERC20ControllerFacetFactory
    )
    await deployBusinessLogicFromFactory(ERC20_RESOLVER_KEY, ERC20FacetFactory)
    await deployBusinessLogicFromFactory(
        ASSET_EVENT_TRACKER_RESOLVER_KEY,
        AssetEventTrackerTestWrapperFactory
    )
    await deployBusinessLogicFromFactory(
        HASH_TIMESTAMP_RESOLVER_KEY,
        HashTimestampTestWrapperFactory
    )
    await deployBusinessLogicFromFactory(
        MOCK_TIMESTAMP_RESOLVER_KEY,
        MockTimestampFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIG_ID_1, [
        {
            businessId: OWNABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_SNAPSHOT_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_BURNABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_CAPPED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_CONTROLLER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: MOCK_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIG_ID_1,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const erc20Snapshot = ERC20SnapshotFacetFactory.attach(
        proxy
    ) as ERC20SnapshotFacet
    const erc20Burnable = ERC20BurnableFacetFactory.attach(
        proxy
    ) as ERC20BurnableFacet
    const erc20Capped = ERC20CappedFacetFactory.attach(
        proxy
    ) as ERC20CappedFacet
    const erc20Controller = ERC20ControllerFacetFactory.attach(
        proxy
    ) as ERC20ControllerFacet
    const erc20 = ERC20FacetFactory.attach(proxy) as ERC20Facet

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    const ownable = isOwnable
        ? (OwnableFacetFactory.attach(proxy) as OwnableFacet)
        : (Ownable2StepFacetFactory.attach(proxy) as Ownable2StepFacet)

    const assetEventTracker = AssetEventTrackerTestWrapperFactory.attach(
        proxy
    ) as AssetEventTrackerTestWrapper

    const hashTimestamp = HashTimestampTestWrapperFactory.attach(
        proxy
    ) as HashTimestampTestWrapper

    const diamondCutAccessControl = DiamondCutAccessControlFacetFactory.attach(
        proxy
    ) as DiamondCutAccessControlFacet

    const diamondLoupe = DiamondLoupeFacetFactory.attach(
        proxy
    ) as DiamondLoupeFacet

    const mockTimestamp = MockTimestampFacetFactory.attach(
        proxy
    ) as MockTimestampFacet

    return {
        erc20,
        erc20Snapshot,
        erc20Burnable,
        erc20Capped,
        erc20Controller,
        pause,
        accessControl,
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
        ownableFacet,
        assetEventTrackerFacet,
        hashTimestampFacet,
        diamondCutAccessControlFacet,
        diamondLoupeFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
    }
}

/*export async function deployAll(
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
    isbeFactory = await deployFactory(
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

    const erc20Snapshot = ERC20SnapshotFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20SnapshotFacet
    const erc20Burnable = ERC20BurnableFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20BurnableFacet
    const erc20Capped = ERC20CappedFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20CappedFacet
    const erc20Controller = ERC20ControllerFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20ControllerFacet
    const erc20 = ERC20FacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ERC20Facet

    const pause = ISBEPauseFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as AccessControlFacet

    const ownable2Step = Ownable2StepFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as Ownable2StepFacet

    const ownable = OwnableFacetFactory.attach(
        await diamondProxy.getAddress()
    ) as OwnableFacet

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
}*/
