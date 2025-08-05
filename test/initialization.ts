import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    BusinessLogicFactoryFacet,
    BusinessLogicFactoryFacet__factory,
    GlobalIsbePauseFacet,
    GlobalIsbePauseFacet__factory,
    ProxyFactoryFacet,
    ProxyFactoryFacet__factory,
    ConfigurationManagementFacet,
    ConfigurationManagementFacet__factory,
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
    IERC721Isbe__factory,
    IERC721Isbe,
    ERC721TestWrapperFacet,
    ERC721CappedFacet,
    ERC721SnapshotFacet,
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
    ERC721_RESOLVER_KEY,
    ERC721_TEST_WRAPPER_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    ERC721_CAPPED_RESOLVER_KEY,
    ERC721_SNAPSHOT_RESOLVER_KEY,
} from './constants'
import { getEvent } from '../scripts/utils/getEvent'
import { getIsbeFactory } from '../scripts/utils/getIsbeFactory'

export const CONFIGURATION_ID_ERC20 =
    '0x0000000000000000000000000000000000000000000000000000000000000020'
export const CONFIGURATION_ID_ERC721 =
    '0x0000000000000000000000000000000000000000000000000000000000000721'

let BusinessLogicFactoryFacetFactory: BusinessLogicFactoryFacet__factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EIP2535AccessControlFactory: any
let ISBEPauseFacetFactory: ISBEPauseFacet__factory
let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let GlobalIsbePauseFacetFactory: GlobalIsbePauseFacet__factory
let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
let ConfigMgmtFacetFactory: ConfigurationManagementFacet__factory
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
    configurationId: string = CONFIGURATION_ID_ERC20,
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
    GlobalIsbePauseFacetFactory = await ethers.getContractFactory(
        'GlobalIsbePauseFacet'
    )
    ProxyFactoryFacetFactory =
        await ethers.getContractFactory('ProxyFactoryFacet')

    ConfigMgmtFacetFactory = await ethers.getContractFactory(
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

    const useCaseDeployment =
        configurationId == CONFIGURATION_ID_ERC20
            ? await deployERC20UseCasesFacets(
                  rbacsUseCase,
                  init_pause,
                  init_BusinessId_UseCase,
                  init_CallData_UseCase,
                  isUseCaseOwnable
              )
            : await deployERC721UseCasesFacets(
                  owner,
                  rbacsUseCase,
                  init_pause,
                  init_BusinessId_UseCase,
                  init_CallData_UseCase,
                  isUseCaseOwnable
              )

    const accessControlGovernance = AccessControlGovernanceFacetFactory.attach(
        await isbeFactory.getAddress()
    ) as AccessControlGovernanceFacet

    const diamondCutAccessControl = DiamondCutAccessControlFacetFactory.attach(
        await isbeFactory.getAddress()
    ) as DiamondCutAccessControlFacet

    const diamondLoupe = DiamondLoupeFacetFactory.attach(
        await isbeFactory.getAddress()
    ) as DiamondLoupeFacet

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
        configMgmtFacet,
        globalIsbePauseFacet,
        proxyFactoryFacet,
        ownable: useCaseDeployment.ownable,
        assetEventTracker: useCaseDeployment.assetEventTracker,
        hashTimestamp: useCaseDeployment.hashTimestamp,
        diamondCutAccessControl,
        diamondLoupe,
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
        erc721Facet: useCaseDeployment.erc721Facet,
        erc721TestWrapperFacet: useCaseDeployment.erc721TestWrapperFacet,
        erc721CappedFacet: useCaseDeployment.erc721CappedFacet,
        erc721SnapshotFacet: useCaseDeployment.erc721SnapshotFacet,
        erc721: useCaseDeployment.erc721,
        erc721TestWrapper: useCaseDeployment.erc721TestWrapper,
        erc721Capped: useCaseDeployment.erc721Capped,
        erc721Snapshot: useCaseDeployment.erc721Snapshot,
        diamondCutAccessControlFacet,
        diamondLoupeFacet,
        accessControlGovernanceFacet,
        useCaseProxy: useCaseDeployment.proxy,
    }
}

export async function deployERC20UseCasesFacets(
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
    await deployBusinessLogicFromFactory(
        MOCK_TIMESTAMP_RESOLVER_KEY,
        MockTimestampFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_ERC20, [
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
        CONFIGURATION_ID_ERC20,
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
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
    }
}

export async function deployERC721UseCasesFacets(
    owner: Signer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[]
) {
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const ERC721FacetFactory = await ethers.getContractFactory('ERC721Facet')
    const ERC721TestWrapperFacetFactory = await ethers.getContractFactory(
        'ERC721TestWrapperFacet'
    )
    const ERC721CappedFacetFactory =
        await ethers.getContractFactory('ERC721CappedFacet')
    const ERC721SnapshotFacetFactory = await ethers.getContractFactory(
        'ERC721SnapshotFacet'
    )

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

    const erc721Facet = await deployBusinessLogicFromFactory(
        ERC721_RESOLVER_KEY,
        ERC721FacetFactory
    )
    const erc721TestWrapperFacet = await deployBusinessLogicFromFactory(
        ERC721_TEST_WRAPPER_RESOLVER_KEY,
        ERC721TestWrapperFacetFactory
    )
    const erc721CappedFacet = await deployBusinessLogicFromFactory(
        ERC721_CAPPED_RESOLVER_KEY,
        ERC721CappedFacetFactory
    )
    const erc721SnapshotFacet = await deployBusinessLogicFromFactory(
        ERC721_SNAPSHOT_RESOLVER_KEY,
        ERC721SnapshotFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_ERC721, [
        {
            businessId: ERC721_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_TEST_WRAPPER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_CAPPED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_SNAPSHOT_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_ERC721,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const erc721 = IERC721Isbe__factory.connect(proxy, owner) as IERC721Isbe
    const erc721TestWrapper = ERC721TestWrapperFacetFactory.attach(
        proxy
    ) as ERC721TestWrapperFacet
    const erc721Capped = ERC721CappedFacetFactory.attach(
        proxy
    ) as ERC721CappedFacet
    const erc721Snapshot = ERC721SnapshotFacetFactory.attach(
        proxy
    ) as ERC721SnapshotFacet

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    return {
        erc721,
        erc721TestWrapper,
        erc721Capped,
        erc721Snapshot,
        pause,
        accessControl,
        erc721Facet,
        erc721TestWrapperFacet,
        erc721CappedFacet,
        erc721SnapshotFacet,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
    }
}
