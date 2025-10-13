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
} from '../../typechain-types'
import {
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    DEFAULT_ADMIN_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_MANAGER_ROLE,
    ISBE_PAUSER_ROLE,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
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
let diamondProxy: EIP2535AccessControl
let businessLogicFactoryFacet: BusinessLogicFactoryFacet
let proxyFactoryFacet: ProxyFactoryFacet
let globalIsbePauseFacet: GlobalIsbePauseFacet
let accessControlFacet: AccessControlGovernanceFacet
let pauseFacet: ISBEPauseFacet
let diamondCutFacet: DiamondCutAccessControlFacet
let diamondLoupeFacet: DiamondLoupeFacet
let configMgmtFacet: ConfigurationManagementFacet

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

    businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
    proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
    globalIsbePauseFacet = await GlobalIsbePauseFacetFactory.deploy()
    accessControlFacet = await AccessControlFacetFactory.deploy()
    pauseFacet = await IsbePausableFacetFactory.deploy()
    diamondCutFacet = await DiamondCutFacetFactory.deploy()
    diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
    configMgmtFacet = await ConfigMgmtFacetFactory.deploy()

    await businessLogicFactoryFacet.waitForDeployment()
    await proxyFactoryFacet.waitForDeployment()
    await globalIsbePauseFacet.waitForDeployment()
    await accessControlFacet.waitForDeployment()
    await pauseFacet.waitForDeployment()
    await diamondCutFacet.waitForDeployment()
    await diamondLoupeFacet.waitForDeployment()
    await configMgmtFacet.waitForDeployment()
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
    ]
    diamondProxy = await EIP2535AccessControlFactory.deploy(facetAddresses, {
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
        ],
        init: ethers.ZeroAddress,
        initCalldata: initCalldata,
        gasLimit: 2000000,
        gasPrice: 875000000,
    })

    await diamondProxy.waitForDeployment()
    return await diamondProxy.getAddress()
}
