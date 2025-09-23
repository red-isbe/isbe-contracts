import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    EIP2535AccessControl__factory,
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
    IDidRegistry,
    IIsbeFactory,
    ERC721TestWrapperFacet,
    ERC721Facet,
    ERC721CappedFacet,
    ERC721SnapshotFacet,
    ERC721BurnableFacet,
    ERC721ControllerFacet,
    ERC721EnumerableFacet,
    ERC721RoyaltyFacet,
    ERC721ConsecutiveFacet,
    IDidRegistry__factory,
    ClientFiltering,
    ClientFiltering__factory,
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
    ERC721_BURNABLE_RESOLVER_KEY,
    ERC721_CONTROLLER_RESOLVER_KEY,
    ERC721_ENUMERABLE_RESOLVER_KEY,
    ERC721_ROYALTY_RESOLVER_KEY,
    ERC721_CONSECUTIVE_RESOLVER_KEY,
    DID_DOCUMENT_DETAILED_RESOLVER_KEY,
    DID_CONTROLLER_RESOLVER_KEY,
    DID_VERIFICATION_METHOD_RESOLVER_KEY,
    DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY,
    CLIENT_FILTERING_RESOLVER_KEY,
} from './constants'
import { getEvent } from '../scripts/utils/getEvent'
import { getIsbeFactory } from '../scripts/utils/getIsbeFactory'

export const CONFIGURATION_ID_ERC20 =
    '0x0000000000000000000000000000000000000000000000000000000000000020'
export const CONFIGURATION_ID_ERC721 =
    '0x0000000000000000000000000000000000000000000000000000000000000721'
export const CONFIGURATION_ID_DID_REGISTRY =
    '0x00000000000000000000000000000000000000004449445F5245474953545259'
export const CONFIGURATION_ID_CLIENT_FILTERING =
    '0x0000000000000000000000000000000000436C69656E7446696C746572696E67'

let BusinessLogicFactoryFacetFactory: BusinessLogicFactoryFacet__factory
let EIP2535AccessControlFactory: EIP2535AccessControl__factory
let ISBEPauseFacetFactory: ISBEPauseFacet__factory
let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let GlobalIsbePauseFacetFactory: GlobalIsbePauseFacet__factory
let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
let ConfigMgmtFacetFactory: ConfigurationManagementFacet__factory
let isbeFactory: IIsbeFactory

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

    async function deployUseCase() {
        switch (configurationId) {
            case CONFIGURATION_ID_ERC20:
                return await deployERC20UseCasesFacets(
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase,
                    isUseCaseOwnable
                )
            case CONFIGURATION_ID_ERC721:
                return await deployERC721UseCasesFacets(
                    owner,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
            case CONFIGURATION_ID_DID_REGISTRY:
                return await deployDidRegistryUseCaseFacets(
                    owner,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
            case CONFIGURATION_ID_CLIENT_FILTERING:
                return await deployClientFilteringUseCaseFacets(
                    owner,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
        }
        return {}
    }

    const useCaseDeployment = await deployUseCase()

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
        erc721BurnFacet: useCaseDeployment.erc721BurnFacet,
        erc721ControllerFacet: useCaseDeployment.erc721ControllerFacet,
        erc721EnumerableFacet: useCaseDeployment.erc721EnumerableFacet,
        erc721RoyaltyFacet: useCaseDeployment.erc721RoyaltyFacet,
        erc721ConsecutiveFacet: useCaseDeployment.erc721ConsecutiveFacet,
        erc721: useCaseDeployment.erc721,
        erc721TestWrapper: useCaseDeployment.erc721TestWrapper,
        erc721Capped: useCaseDeployment.erc721Capped,
        erc721Burn: useCaseDeployment.erc721Burn,
        erc721Snapshot: useCaseDeployment.erc721Snapshot,
        erc721Controller: useCaseDeployment.erc721Controller,
        erc721Enumerable: useCaseDeployment.erc721Enumerable,
        erc721Royalty: useCaseDeployment.erc721Royalty,
        erc721Consecutive: useCaseDeployment.erc721Consecutive,
        didDocumentDetailedFacet: useCaseDeployment.didDocumentDetailedFacet,
        didControllerFacet: useCaseDeployment.didControllerFacet,
        didVerificationMethodFacet:
            useCaseDeployment.didVerificationMethodFacet,
        didVerificationRelationshipFacet:
            useCaseDeployment.didVerificationRelationshipFacet,
        didRegistry: useCaseDeployment.didRegistry,
        erc721Capped: useCaseDeployment.erc721Capped,
        clientFilteringFacet: useCaseDeployment.clientFilteringFacet,
        clientFiltering: useCaseDeployment.clientFiltering,
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
    const didRegistry: IDidRegistry = IDidRegistry__factory.connect(proxy)

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
        didRegistry,
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
    const ERC721BurnFacetFactory = await ethers.getContractFactory(
        'ERC721BurnableFacet'
    )
    const ERC721ControllerFacetFactory = await ethers.getContractFactory(
        'ERC721ControllerFacet'
    )
    const ERC721EnumerableFacetFactory = await ethers.getContractFactory(
        'ERC721EnumerableFacet'
    )
    const ERC721RoyaltyFacetFactory =
        await ethers.getContractFactory('ERC721RoyaltyFacet')
    const ERC721ConsecutiveFacetFactory = await ethers.getContractFactory(
        'ERC721ConsecutiveFacet'
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
    const erc721BurnFacet = await deployBusinessLogicFromFactory(
        ERC721_BURNABLE_RESOLVER_KEY,
        ERC721BurnFacetFactory
    )
    const erc721ControllerFacet = await deployBusinessLogicFromFactory(
        ERC721_CONTROLLER_RESOLVER_KEY,
        ERC721ControllerFacetFactory
    )
    const erc721EnumerableFacet = await deployBusinessLogicFromFactory(
        ERC721_ENUMERABLE_RESOLVER_KEY,
        ERC721EnumerableFacetFactory
    )
    const erc721RoyaltyFacet = await deployBusinessLogicFromFactory(
        ERC721_ROYALTY_RESOLVER_KEY,
        ERC721RoyaltyFacetFactory
    )
    const erc721ConsecutiveFacet = await deployBusinessLogicFromFactory(
        ERC721_CONSECUTIVE_RESOLVER_KEY,
        ERC721ConsecutiveFacetFactory
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
        {
            businessId: ERC721_BURNABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_CONTROLLER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_ENUMERABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_ROYALTY_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC721_CONSECUTIVE_RESOLVER_KEY,
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

    const erc721 = ERC721FacetFactory.attach(proxy) as ERC721Facet
    const erc721TestWrapper = ERC721TestWrapperFacetFactory.attach(
        proxy
    ) as ERC721TestWrapperFacet
    const erc721Capped = ERC721CappedFacetFactory.attach(
        proxy
    ) as ERC721CappedFacet
    const erc721Snapshot = ERC721SnapshotFacetFactory.attach(
        proxy
    ) as ERC721SnapshotFacet
    const erc721Burn = ERC721BurnFacetFactory.attach(
        proxy
    ) as ERC721BurnableFacet
    const erc721Controller = ERC721ControllerFacetFactory.attach(
        proxy
    ) as ERC721ControllerFacet
    const erc721Enumerable = ERC721EnumerableFacetFactory.attach(
        proxy
    ) as ERC721EnumerableFacet
    const erc721Royalty = ERC721RoyaltyFacetFactory.attach(
        proxy
    ) as ERC721RoyaltyFacet
    const erc721Consecutive = ERC721ConsecutiveFacetFactory.attach(
        proxy
    ) as ERC721ConsecutiveFacet

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    return {
        erc721,
        erc721TestWrapper,
        erc721Capped,
        erc721Snapshot,
        erc721Burn,
        erc721Controller,
        erc721Enumerable,
        erc721Royalty,
        erc721Consecutive,
        pause,
        accessControl,
        erc721Facet,
        erc721TestWrapperFacet,
        erc721CappedFacet,
        erc721SnapshotFacet,
        erc721BurnFacet,
        erc721ControllerFacet,
        erc721EnumerableFacet,
        erc721RoyaltyFacet,
        erc721ConsecutiveFacet,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
    }
}

export async function deployDidRegistryUseCaseFacets(
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
    const MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')
    const DidDocumentDetailedFacetFactory = await ethers.getContractFactory(
        'DidDocumentDetailedTestWrapperFacet'
    )
    const DidControllerFacetFactory = await ethers.getContractFactory(
        'DidControllerTestWrapperFacet'
    )
    const DidVerificationMethodFactory = await ethers.getContractFactory(
        'DidVerificationMethodTestWrapperFacet'
    )
    const DidVerificationRelationshipFactory = await ethers.getContractFactory(
        'DidVerificationRelationshipTestWrapperFacet'
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

    const didDocumentDetailedFacet = await deployBusinessLogicFromFactory(
        DID_DOCUMENT_DETAILED_RESOLVER_KEY,
        DidDocumentDetailedFacetFactory
    )

    const didControllerFacet = await deployBusinessLogicFromFactory(
        DID_CONTROLLER_RESOLVER_KEY,
        DidControllerFacetFactory
    )

    const didVerificationMethodFacet = await deployBusinessLogicFromFactory(
        DID_VERIFICATION_METHOD_RESOLVER_KEY,
        DidVerificationMethodFactory
    )

    const didVerificationRelationshipFacet =
        await deployBusinessLogicFromFactory(
            DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY,
            DidVerificationRelationshipFactory
        )

    // Deploy all business logic contracts before setting configuration
    await deployBusinessLogicFromFactory(
        MOCK_TIMESTAMP_RESOLVER_KEY,
        MockTimestampFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_DID_REGISTRY, [
        {
            businessId: MOCK_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: DID_DOCUMENT_DETAILED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: DID_CONTROLLER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: DID_VERIFICATION_METHOD_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_DID_REGISTRY,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    const mockTimestamp = MockTimestampFacetFactory.attach(
        proxy
    ) as MockTimestampFacet
    const didRegistry: IDidRegistry = IDidRegistry__factory.connect(
        proxy,
        owner
    ) as IDidRegistry

    return {
        pause,
        accessControl,
        mockTimestamp,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
        didDocumentDetailedFacet,
        didControllerFacet,
        didVerificationMethodFacet,
        didVerificationRelationshipFacet,
        didRegistry,
    }
}

export async function deployClientFilteringUseCaseFacets(
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
    const ClientFilteringFacet = await ethers.getContractFactory(
        'ClientFilteringFacet'
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

    const clientFilteringFacet = await deployBusinessLogicFromFactory(
        CLIENT_FILTERING_RESOLVER_KEY,
        ClientFilteringFacet
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_CLIENT_FILTERING, [
        {
            businessId: CLIENT_FILTERING_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_CLIENT_FILTERING,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    const clientFiltering: ClientFiltering = ClientFiltering__factory.connect(
        proxy,
        owner
    ) as ClientFiltering

    return {
        pause,
        accessControl,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
        clientFilteringFacet,
        clientFiltering,
    }
}
