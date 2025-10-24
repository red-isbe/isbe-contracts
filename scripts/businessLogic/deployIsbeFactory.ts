import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
    ProxyFactoryFacet__factory,
    ProxyFactoryFacet,
    AccessControlGovernanceFacet__factory,
    ISBEPauseFacet__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondLoupeFacet__factory,
    GlobalIsbePauseFacet__factory,
    GlobalIsbePauseFacet,
    AccessControlGovernanceFacet,
    ISBEPauseFacet,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet,
    ConfigurationManagementFacet,
    ConfigurationManagementFacet__factory,
    DidDocumentDetailedFacet,
    DidDocumentDetailedFacet__factory,
    DidControllerFacet__factory,
    DidVerificationMethodFacet__factory,
    DidVerificationRelationshipFacet__factory,
    DidVerificationMethodFacet,
    DidControllerFacet,
    DidVerificationRelationshipFacet,
    ClientFilteringFacet,
    EnsRegistryFacet,
    EnsRegistryFacet__factory,
    ClientFilteringFacet__factory,
    TimeStampingRegistryFacet__factory,
    TimeStampingRegistryFacet,
} from '../../typechain-types'
import {
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    DEFAULT_ADMIN_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_MANAGER_ROLE,
    ISBE_PAUSER_ROLE,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
    DID_REGISTRY_ROLE,
    ENS_MANAGER_ROLE,
    CLIENT_FILTERING_ROLE,
    TIMESTAMPING_REGISTRY_ROLE,
} from '../../utils/constants'

let AccessControlFacetFactory: AccessControlGovernanceFacet__factory
let IsbePausableFacetFactory: ISBEPauseFacet__factory
let GlobalIsbePauseFacetFactory: GlobalIsbePauseFacet__factory
let EIP2535AccessControlFactory: EIP2535AccessControl__factory
let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
let DiamondCutFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let ConfigMgmtFacetFactory: ConfigurationManagementFacet__factory
let DidDocumentDetailedFacetFactory: DidDocumentDetailedFacet__factory
let DidControllerFacetFactory: DidControllerFacet__factory
let DidVerificationMethodFacetFactory: DidVerificationMethodFacet__factory
let DidVerificationRelationshipFacetFactory: DidVerificationRelationshipFacet__factory
let EnsRegistryFacetFactory: EnsRegistryFacet__factory
let TimeStampingRegistryFacetFactory: TimeStampingRegistryFacet__factory
let ClientFilteringFacetFactory: ClientFilteringFacet__factory

let diamondProxy: EIP2535AccessControl
let businessLogicFactoryFacet: BusinessLogicFactoryFacet
let proxyFactoryFacet: ProxyFactoryFacet
let globalIsbePauseFacet: GlobalIsbePauseFacet
let accessControlFacet: AccessControlGovernanceFacet
let pauseFacet: ISBEPauseFacet
let diamondCutFacet: DiamondCutAccessControlFacet
let diamondLoupeFacet: DiamondLoupeFacet
let configMgmtFacet: ConfigurationManagementFacet
let didDocumentDetailedFacet: DidDocumentDetailedFacet
let didControllerFacet: DidControllerFacet
let didVerificationMethodFacet: DidVerificationMethodFacet
let didVerificationRelationshipFacet: DidVerificationRelationshipFacet
let ensRegistryFacet: EnsRegistryFacet
let timeStampingRegistryFacet: TimeStampingRegistryFacet
let clientFilteringFacet: ClientFilteringFacet

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deployInitial(ethers: any) {
    BusinessLogicFactoryFactory = await ethers.getContractFactory(
        'BusinessLogicFactoryFacet'
    )
    ProxyFactoryFacetFactory =
        await ethers.getContractFactory('ProxyFactoryFacet')
    EIP2535AccessControlFactory = await ethers.getContractFactory(
        'EIP2535AccessControl'
    )
    GlobalIsbePauseFacetFactory = await ethers.getContractFactory(
        'GlobalIsbePauseFacet'
    )
    AccessControlFacetFactory = await ethers.getContractFactory(
        'AccessControlGovernanceFacet'
    )
    IsbePausableFacetFactory = await ethers.getContractFactory('ISBEPauseFacet')
    DiamondCutFacetFactory = await ethers.getContractFactory(
        'DiamondCutAccessControlFacet'
    )
    DiamondLoupeFacetFactory =
        await ethers.getContractFactory('DiamondLoupeFacet')
    ConfigMgmtFacetFactory = await ethers.getContractFactory(
        'ConfigurationManagementFacet'
    )
    DidDocumentDetailedFacetFactory = await ethers.getContractFactory(
        'DidDocumentDetailedFacet'
    )
    DidControllerFacetFactory =
        await ethers.getContractFactory('DidControllerFacet')
    DidVerificationMethodFacetFactory = await ethers.getContractFactory(
        'DidVerificationMethodFacet'
    )
    DidVerificationRelationshipFacetFactory = await ethers.getContractFactory(
        'DidVerificationRelationshipFacet'
    )
    EnsRegistryFacetFactory =
        await ethers.getContractFactory('EnsRegistryFacet')
    TimeStampingRegistryFacetFactory = await ethers.getContractFactory(
        'TimeStampingRegistryFacet'
    )
    ClientFilteringFacetFactory = await ethers.getContractFactory(
        'ClientFilteringFacet'
    )

    // Add explicit gas limit to fix Internal error with non-validator nodes
    const deployOptions = { gasLimit: 25_000_000 }

    businessLogicFactoryFacet =
        await BusinessLogicFactoryFactory.deploy(deployOptions)
    proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy(deployOptions)
    globalIsbePauseFacet =
        await GlobalIsbePauseFacetFactory.deploy(deployOptions)
    accessControlFacet = await AccessControlFacetFactory.deploy(deployOptions)
    pauseFacet = await IsbePausableFacetFactory.deploy(deployOptions)
    diamondCutFacet = await DiamondCutFacetFactory.deploy(deployOptions)
    diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy(deployOptions)
    configMgmtFacet = await ConfigMgmtFacetFactory.deploy(deployOptions)
    didDocumentDetailedFacet =
        await DidDocumentDetailedFacetFactory.deploy(deployOptions)
    didControllerFacet = await DidControllerFacetFactory.deploy(deployOptions)
    didVerificationMethodFacet =
        await DidVerificationMethodFacetFactory.deploy(deployOptions)
    didVerificationRelationshipFacet =
        await DidVerificationRelationshipFacetFactory.deploy(deployOptions)
    ensRegistryFacet = await EnsRegistryFacetFactory.deploy(deployOptions)
    timeStampingRegistryFacet =
        await TimeStampingRegistryFacetFactory.deploy(deployOptions)
    clientFilteringFacet =
        await ClientFilteringFacetFactory.deploy(deployOptions)

    await businessLogicFactoryFacet.waitForDeployment()
    await proxyFactoryFacet.waitForDeployment()
    await globalIsbePauseFacet.waitForDeployment()
    await accessControlFacet.waitForDeployment()
    await pauseFacet.waitForDeployment()
    await diamondCutFacet.waitForDeployment()
    await diamondLoupeFacet.waitForDeployment()
    await configMgmtFacet.waitForDeployment()
    await didDocumentDetailedFacet.waitForDeployment()
    await didControllerFacet.waitForDeployment()
    await didVerificationMethodFacet.waitForDeployment()
    await didVerificationRelationshipFacet.waitForDeployment()
    await ensRegistryFacet.waitForDeployment()
    await timeStampingRegistryFacet.waitForDeployment()
    await clientFilteringFacet.waitForDeployment()
}

export async function deployIsbeFactory(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any,
    accountAddress: string,
    initCalldata: string = '0x'
): Promise<string> {
    const ethers = hre.ethers
    await deployInitial(ethers)

    const facetAddresses = [
        await businessLogicFactoryFacet.getAddress(),
        await globalIsbePauseFacet.getAddress(),
        await accessControlFacet.getAddress(),
        await pauseFacet.getAddress(),
        await proxyFactoryFacet.getAddress(),
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await configMgmtFacet.getAddress(),
        await didDocumentDetailedFacet.getAddress(),
        await didControllerFacet.getAddress(),
        await didVerificationMethodFacet.getAddress(),
        await didVerificationRelationshipFacet.getAddress(),
        await ensRegistryFacet.getAddress(),
        await timeStampingRegistryFacet.getAddress(),
        await clientFilteringFacet.getAddress(),
    ]
    diamondProxy = await EIP2535AccessControlFactory.deploy(
        facetAddresses,
        {
            rbacs: [
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ISBE_ROLE,
                    members: [accountAddress],
                },
                {
                    role: PROXY_DEPLOYER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: BUSINESS_LOGIC_DEPLOYER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ISBE_PAUSER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: GOVERNANCE_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: DID_REGISTRY_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ENS_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: CLIENT_FILTERING_ROLE,
                    members: [accountAddress],
                },
                {
                    role: TIMESTAMPING_REGISTRY_ROLE,
                    members: [accountAddress],
                },
            ],
            init: ethers.ZeroAddress,
            initCalldata: initCalldata,
        },
        // Add explicit gas limit to fix Internal error with non-validator nodes
        { gasLimit: 25_000_000 }
    )

    await diamondProxy.waitForDeployment()
    return await diamondProxy.getAddress()
}
