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
    AccessControlDidGovernanceFacet,
    AccessControl,
    ISBEPauseFacet,
    ISBEPauseFacet__factory,
    IDidRegistry,
    IDidRegistry__factory,
    IIsbeFactory,
    ClientFiltering,
    ENS,
    ENS__factory,
    DidDocumentDetailedFacet,
    DidControllerFacet,
    DidVerificationRelationshipFacet,
    DidVerificationMethodFacet,
    DidRegistryQueryFacet,
    DidRegistryQueryFacet__factory,
    EnsRegistryFacet__factory,
    DidVerificationRelationshipFacet__factory,
    DidVerificationMethodFacet__factory,
    DidControllerFacet__factory,
    DidDocumentDetailedFacet__factory,
    TrustedIssuersRegistryFacet__factory,
    TrustedIssuersRegistryFacet,
    ITrustedIssuersRegistry__factory,
    ITrustedIssuersRegistry,
    ClientFilteringFacet__factory,
    TimeStampingRegistry,
    MockTimestampFacet,
    MockTimestampFacet__factory,
    EnsRegistryFacet,
    TimeStampingRegistryTestWrapper__factory,
    TimeStampingRegistryFacet,
    BesuNodeManagerFacet,
    BesuNodeManagerFacetTestWrapper__factory,
    AnchoringCoreFacet__factory,
    AnchoringCoreFacet,
    NetworkDirectoryFacet,
    NetworkDirectoryFacet__factory,
} from '../../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    PROXY_DEPLOYER_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_MANAGER_ROLE,
    ISBE_PAUSER_ROLE,
    PAUSER_ROLE,
    DID_REGISTRY_ROLE,
    TRUSTED_ISSUERS_REGISTRY_ROLE,
    ENS_MANAGER_ROLE,
    CLIENT_FILTERING_ROLE,
    TIMESTAMPING_REGISTRY_ROLE,
    BESU_NODE_MANAGER_ROLE,
    NETWORK_DIRECTORY_ROLE,
    CONFIGURATION_ID_ERC20,
    CONFIGURATION_ID_ERC721,
    CONFIGURATION_ID_ERC3643,
    CONFIGURATION_ID_ENS_REGISTRY,
    CONFIGURATION_ID_DID_REGISTRY,
    CONFIGURATION_ID_CLIENT_FILTERING,
    CONFIGURATION_ID_TIMESTAMPING_REGISTRY,
    CONFIGURATION_ID_PROXY_TESTS,
    CONFIGURATION_ID_KNOWN_DID_TEST,
    CONFIGURATION_ID_BESU_NODE_MANAGER,
    ANCHORER_ROLE,
    METADATA_MANAGER_ROLE,
    CONFIGURATION_ID_NETWORK_DIRECTORY,
} from '../../utils/constants'
import { getIsbeFactory } from '../../scripts/utils/getIsbeFactory'
import {
    deployERC20UseCasesFacets,
    deployProxyTestsUseCaseFacets,
} from './erc20'
import { deployERC721UseCasesFacets } from './erc721'
import { deployKnownDidTestWrapperUseCaseFacets } from './knownDid'

let BusinessLogicFactoryFacetFactory: BusinessLogicFactoryFacet__factory
let EIP2535AccessControlFactory: EIP2535AccessControl__factory
let ISBEPauseFacetFactory: ISBEPauseFacet__factory
let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let GlobalIsbePauseFacetFactory: GlobalIsbePauseFacet__factory
let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
let ConfigMgmtFacetFactory: ConfigurationManagementFacet__factory
let DidDocumentDetailedFacetFactory: DidDocumentDetailedFacet__factory
let DidControllerFacetFactory: DidControllerFacet__factory
let DidVerificationMethodFacetFactory: DidVerificationMethodFacet__factory
let DidVerificationRelationshipFacetFactory: DidVerificationRelationshipFacet__factory
let TrustedIssuersRegistryFacetFactory: TrustedIssuersRegistryFacet__factory
let DidRegistryQueryFacetFactory: DidRegistryQueryFacet__factory
let EnsRegistryFacetFactory: EnsRegistryFacet__factory
let ClientFilteringFacetFactory: ClientFilteringFacet__factory
let TimeStampingRegistryFacetFactory: TimeStampingRegistryTestWrapper__factory
let MockTimestampFacetFactory: MockTimestampFacet__factory
let BesuNodeManagerFacetFactory: BesuNodeManagerFacetTestWrapper__factory
let AnchoringCoreFacetFactory: AnchoringCoreFacet__factory
let NetworkDirectoryFacetFactory: NetworkDirectoryFacet__factory
let isbeFactory: IIsbeFactory

export async function deployGovernance(
    owner: Signer,
    rbacsUseCase: Array<{
        role: string
        members: Array<string | Signer>
    }> = [],
    configurationId: string = CONFIGURATION_ID_ERC20,
    init_pause: boolean = false,
    initCalldata: string = '0x',
    init_BusinessId_UseCase: string[] = [],
    init_CallData_UseCase: string[] = [],
    isUseCaseOwnable: boolean = false
) {
    const ownerAddress = await owner.getAddress()
    const rbacs = [
        {
            role: DEFAULT_ADMIN_ROLE,
            members: [ownerAddress],
        },
        {
            role: PROXY_DEPLOYER_ROLE,
            members: [ownerAddress],
        },
        {
            role: BUSINESS_LOGIC_DEPLOYER_ROLE,
            members: [ownerAddress],
        },
        {
            role: CONFIGURATION_MANAGER_ROLE,
            members: [ownerAddress],
        },
        {
            role: GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
            members: [ownerAddress],
        },
        {
            role: GOVERNANCE_MANAGER_ROLE,
            members: [ownerAddress],
        },
        {
            role: ISBE_PAUSER_ROLE,
            members: [ownerAddress],
        },
        { role: PAUSER_ROLE, members: [ownerAddress] },
        { role: DID_REGISTRY_ROLE, members: [ownerAddress] },
        { role: TRUSTED_ISSUERS_REGISTRY_ROLE, members: [ownerAddress] },
        { role: ENS_MANAGER_ROLE, members: [ownerAddress] },
        { role: CLIENT_FILTERING_ROLE, members: [ownerAddress] },
        { role: TIMESTAMPING_REGISTRY_ROLE, members: [ownerAddress] },
        { role: BESU_NODE_MANAGER_ROLE, members: [ownerAddress] },
        { role: ANCHORER_ROLE, members: [ownerAddress] },
        { role: METADATA_MANAGER_ROLE, members: [ownerAddress] },
        { role: NETWORK_DIRECTORY_ROLE, members: [ownerAddress] },
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
    DidDocumentDetailedFacetFactory = await ethers.getContractFactory(
        'DidDocumentDetailedTestWrapperFacet'
    )
    DidControllerFacetFactory = await ethers.getContractFactory(
        'DidControllerTestWrapperFacet'
    )
    DidVerificationMethodFacetFactory = await ethers.getContractFactory(
        'DidVerificationMethodTestWrapperFacet'
    )
    DidVerificationRelationshipFacetFactory = await ethers.getContractFactory(
        'DidVerificationRelationshipTestWrapperFacet'
    )
    DidRegistryQueryFacetFactory = await ethers.getContractFactory(
        'DidRegistryQueryTestWrapperFacet'
    )
    TrustedIssuersRegistryFacetFactory = await ethers.getContractFactory(
        'TrustedIssuersRegistryTestWrapperFacet'
    )
    EnsRegistryFacetFactory =
        await ethers.getContractFactory('EnsRegistryFacet')
    ClientFilteringFacetFactory = await ethers.getContractFactory(
        'ClientFilteringFacet'
    )
    TimeStampingRegistryFacetFactory = await ethers.getContractFactory(
        'TimeStampingRegistryTestWrapper'
    )
    BesuNodeManagerFacetFactory = await ethers.getContractFactory(
        'BesuNodeManagerFacetTestWrapper'
    )
    AnchoringCoreFacetFactory =
        await ethers.getContractFactory('AnchoringCoreFacet')
    NetworkDirectoryFacetFactory = await ethers.getContractFactory(
        'NetworkDirectoryFacet'
    )
    MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')

    const AccessControlGovernanceFacetFactory = await ethers.getContractFactory(
        'AccessControlGovernanceFacet'
    )
    const AccessControlDidGovernanceFacetFactory =
        await ethers.getContractFactory('AccessControlDidGovernanceFacet')
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

    const accessControlDidGovernanceFacet: AccessControlDidGovernanceFacet =
        await AccessControlDidGovernanceFacetFactory.deploy()
    await accessControlDidGovernanceFacet.waitForDeployment()

    const iSBEPauseFacet: ISBEPauseFacet = await ISBEPauseFacetFactory.deploy()
    await iSBEPauseFacet.waitForDeployment()

    const didDocumentDetailedFacet: DidDocumentDetailedFacet =
        await DidDocumentDetailedFacetFactory.deploy()
    const didControllerFacet: DidControllerFacet =
        await DidControllerFacetFactory.deploy()
    const didVerificationMethodFacet: DidVerificationMethodFacet =
        await DidVerificationMethodFacetFactory.deploy()
    const didVerificationRelationshipFacet: DidVerificationRelationshipFacet =
        await DidVerificationRelationshipFacetFactory.deploy()
    const didRegistryQueryFacet: DidRegistryQueryFacet =
        await DidRegistryQueryFacetFactory.deploy()
    const trustedIssuersRegistryFacet: TrustedIssuersRegistryFacet =
        await TrustedIssuersRegistryFacetFactory.deploy()
    const ensRegistryFacet: EnsRegistryFacet =
        await EnsRegistryFacetFactory.deploy()
    const clientFilteringFacet: ClientFiltering =
        await ClientFilteringFacetFactory.deploy()
    const timeStampingRegistryFacet: TimeStampingRegistryFacet =
        await TimeStampingRegistryFacetFactory.deploy()
    const besuNodeManagerFacet: BesuNodeManagerFacet =
        await BesuNodeManagerFacetFactory.deploy()
    const anchoringCoreFacet: AnchoringCoreFacet =
        await AnchoringCoreFacetFactory.deploy()
    const networkDirectoryFacet: NetworkDirectoryFacet =
        await NetworkDirectoryFacetFactory.deploy()
    const mockTimestampFacet: MockTimestampFacet =
        await MockTimestampFacetFactory.deploy()

    await didDocumentDetailedFacet.waitForDeployment()
    await didControllerFacet.waitForDeployment()
    await didVerificationMethodFacet.waitForDeployment()
    await didVerificationRelationshipFacet.waitForDeployment()
    await didRegistryQueryFacet.waitForDeployment()
    await trustedIssuersRegistryFacet.waitForDeployment()
    await ensRegistryFacet.waitForDeployment()
    await clientFilteringFacet.waitForDeployment()
    await timeStampingRegistryFacet.waitForDeployment()
    await besuNodeManagerFacet.waitForDeployment()
    await anchoringCoreFacet.waitForDeployment()
    await networkDirectoryFacet.waitForDeployment()

    const governanceFacets = [
        await businessLogicFactoryFacet.getAddress(),
        await globalIsbePauseFacet.getAddress(),
        await proxyFactoryFacet.getAddress(),
        await configMgmtFacet.getAddress(),
        await diamondCutAccessControlFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await accessControlGovernanceFacet.getAddress(),
        await accessControlDidGovernanceFacet.getAddress(),
        await iSBEPauseFacet.getAddress(),
        await didDocumentDetailedFacet.getAddress(),
        await didControllerFacet.getAddress(),
        await didVerificationMethodFacet.getAddress(),
        await didVerificationRelationshipFacet.getAddress(),
        await didRegistryQueryFacet.getAddress(),
        await trustedIssuersRegistryFacet.getAddress(),
        await ensRegistryFacet.getAddress(),
        await clientFilteringFacet.getAddress(),
        await timeStampingRegistryFacet.getAddress(),
        await besuNodeManagerFacet.getAddress(),
        await anchoringCoreFacet.getAddress(),
        await networkDirectoryFacet.getAddress(),
        await mockTimestampFacet.getAddress(),
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
                    isbeFactory,
                    ISBEPauseFacetFactory,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase,
                    isUseCaseOwnable
                )
            case CONFIGURATION_ID_PROXY_TESTS:
                return await deployProxyTestsUseCaseFacets(
                    isbeFactory,
                    ISBEPauseFacetFactory,
                    owner,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
            case CONFIGURATION_ID_ERC721:
                return await deployERC721UseCasesFacets(
                    isbeFactory,
                    ISBEPauseFacetFactory,
                    owner,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
            case CONFIGURATION_ID_ERC3643: {
                const { deployERC3643UseCasesFacets } =
                    await import('./erc3643')
                return await deployERC3643UseCasesFacets(
                    isbeFactory,
                    ISBEPauseFacetFactory,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
            }

            case CONFIGURATION_ID_KNOWN_DID_TEST:
                return await deployKnownDidTestWrapperUseCaseFacets(
                    isbeFactory,
                    ISBEPauseFacetFactory,
                    rbacsUseCase,
                    init_pause,
                    init_BusinessId_UseCase,
                    init_CallData_UseCase
                )
            case CONFIGURATION_ID_ENS_REGISTRY:
            case CONFIGURATION_ID_DID_REGISTRY:
            case CONFIGURATION_ID_CLIENT_FILTERING:
            case CONFIGURATION_ID_TIMESTAMPING_REGISTRY:
            case CONFIGURATION_ID_BESU_NODE_MANAGER:
            case CONFIGURATION_ID_NETWORK_DIRECTORY:
                break
            default:
                throw new Error(`Unknown configuration id ${configurationId}`)
        }
    }

    const useCaseDeployment = await deployUseCase()
    const governanceAddress = await isbeFactory.getAddress()
    const accessControlInstance = (await ethers.getContractAt(
        'AccessControl',
        governanceAddress,
        owner
    )) as AccessControl
    const accessControlFromUseCase = (
        useCaseDeployment as {
            accessControl?: AccessControl
        }
    )?.accessControl

    return {
        // Governance core
        governanceContract,
        configMgmtFacet,
        globalIsbePauseFacet,
        proxyFactoryFacet,
        diamondCutAccessControlFacet,
        diamondLoupeFacet,
        accessControlGovernanceFacet,
        accessControlGovernance: AccessControlGovernanceFacetFactory.attach(
            governanceAddress
        ).connect(owner) as AccessControlGovernanceFacet,
        diamondCutAccessControl: DiamondCutAccessControlFacetFactory.attach(
            governanceAddress
        ) as DiamondCutAccessControlFacet,
        diamondLoupe: DiamondLoupeFacetFactory.attach(
            governanceAddress
        ) as DiamondLoupeFacet,
        globalIsbePause: GlobalIsbePauseFacetFactory.attach(
            governanceAddress
        ) as GlobalIsbePauseFacet,
        pauseGovernance: ISBEPauseFacetFactory.attach(
            governanceAddress
        ) as ISBEPauseFacet,
        mockTimestamp: MockTimestampFacetFactory.attach(
            governanceAddress
        ) as MockTimestampFacet,

        // DID Registry
        didDocumentDetailedFacet,
        didControllerFacet,
        didVerificationMethodFacet,
        didVerificationRelationshipFacet,
        didRegistryQueryFacet,
        didRegistry: IDidRegistry__factory.connect(
            governanceAddress,
            owner
        ) as IDidRegistry,

        trustedIssuersRegistryFacet,
        trustedIssuersRegistry: ITrustedIssuersRegistry__factory.connect(
            governanceAddress,
            owner
        ) as ITrustedIssuersRegistry,

        // ENS
        ensRegistryFacet,
        ensRegistry: ENS__factory.connect(governanceAddress, owner) as ENS,

        // Client Filtering
        clientFilteringFacet,
        clientFiltering: ClientFilteringFacetFactory.attach(
            governanceAddress
        ) as ClientFiltering,

        // Time Stamping
        timeStampingRegistryFacet,
        timeStampingRegistry: TimeStampingRegistryFacetFactory.attach(
            governanceAddress
        ) as TimeStampingRegistry,

        // Besu Node Manager
        besuNodeManagerFacet,
        besuNodeManager: BesuNodeManagerFacetFactory.attach(
            governanceAddress
        ) as BesuNodeManagerFacet,

        // Anchoring Core
        anchoringCoreFacet,
        anchoringCore: AnchoringCoreFacetFactory.attach(
            governanceAddress
        ) as AnchoringCoreFacet,

        // Network directory
        networkDirectoryFacet,

        // Use case deployment (spread all properties)
        ...(useCaseDeployment || {}),
        // Access Control (for tests that don't use a use case)
        accessControl: accessControlFromUseCase ?? accessControlInstance,
        accessControlFacet: accessControlGovernanceFacet,
        useCaseProxy: useCaseDeployment?.proxy,
    }
}
