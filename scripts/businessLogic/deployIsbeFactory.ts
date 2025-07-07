import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
    ProxyFactoryFacet__factory,
    ProxyFactoryFacet,
    AccessControlFacet__factory,
    ISBEPauseFacet__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondLoupeFacet__factory,
    GlobalIsbePauseFacet__factory,
    GlobalIsbePauseFacet,
    AccessControlFacet,
    ISBEPauseFacet,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet,
} from '../../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
} from '../../test/constants'

let AccessControlFacetFactory: AccessControlFacet__factory
let IsbePausableFacetFactory: ISBEPauseFacet__factory
let GlobalIsbePauseFacetFactory: GlobalIsbePauseFacet__factory
let EIP2535AccessControlFactory: EIP2535AccessControl__factory
let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
let DiamondCutFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let diamondProxy: EIP2535AccessControl
let businessLogicFactoryFacet: BusinessLogicFactoryFacet
let proxyFactoryFacet: ProxyFactoryFacet
let globalIsbePauseFacet: GlobalIsbePauseFacet
let accessControlFacet: AccessControlFacet
let pauseFacet: ISBEPauseFacet
let diamondCutFacet: DiamondCutAccessControlFacet
let diamondLoupeFacet: DiamondLoupeFacet

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
    AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    IsbePausableFacetFactory = await ethers.getContractFactory('ISBEPauseFacet')
    DiamondCutFacetFactory = await ethers.getContractFactory(
        'DiamondCutAccessControlFacet'
    )
    DiamondLoupeFacetFactory =
        await ethers.getContractFactory('DiamondLoupeFacet')

    businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
    proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
    globalIsbePauseFacet = await GlobalIsbePauseFacetFactory.deploy()
    accessControlFacet = await AccessControlFacetFactory.deploy()
    pauseFacet = await IsbePausableFacetFactory.deploy()
    diamondCutFacet = await DiamondCutFacetFactory.deploy()
    diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()

    await businessLogicFactoryFacet.waitForDeployment()
    await proxyFactoryFacet.waitForDeployment()
    await globalIsbePauseFacet.waitForDeployment()
    await accessControlFacet.waitForDeployment()
    await pauseFacet.waitForDeployment()
    await diamondCutFacet.waitForDeployment()
    await diamondLoupeFacet.waitForDeployment()
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
        //await configurationManagementFacet.getAddress(),
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
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
        ],
        init: ethers.ZeroAddress,
        initCalldata: initCalldata,
    })
    const address = await diamondProxy.getAddress()

    return address
}
