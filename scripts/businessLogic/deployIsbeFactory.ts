import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
    ProxyFactoryFacet__factory,
    ProxyFactoryFacet,
} from '../../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
} from '../../test/constants'

/*let AccessControlFactory: AccessControlFacet__factory
let IsbePausableFactory: ISBEPause__factory*/
let EIP2535AccessControlFactory: EIP2535AccessControl__factory
let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
/*let DiamondCutFacetFactory: DiamondCutAccessControlFacet__factory
let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
let HashTimestampFactory: HashTimestampFacet__factory
let AssetEventTrackerFactory: AssetEventTrackerTestWrapper__factory
let Ownable2StepFacetFactory: Ownable2StepFacet__factory*/
let diamondProxy: EIP2535AccessControl
let businessLogicFactoryFacet: BusinessLogicFactoryFacet
let proxyFactoryFacet: ProxyFactoryFacet

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
    businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
    proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
    await businessLogicFactoryFacet.waitForDeployment()
    await proxyFactoryFacet.waitForDeployment()
}

export async function deployIsbeFactory(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any,
    accountAddress: string,
    initCalldata: string = '0x'
): Promise<string> {
    const ethers = hre.ethers
    await deployInitial(ethers)
    const proxyFactoryAddress = await proxyFactoryFacet.getAddress()
    const facetAddresses = [
        await businessLogicFactoryFacet.getAddress(),
        proxyFactoryAddress,
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

    console.log(address)

    return address
}
