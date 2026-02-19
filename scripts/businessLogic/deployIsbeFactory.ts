/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
    DidRegistryQueryFacet,
    DidRegistryQueryFacet__factory,
    AccessControlDidFacet__factory,
    BesuNodeManagerFacet,
    BesuNodeManagerFacet__factory,
    AnchoringCoreFacet,
    AnchoringCoreFacet__factory,
    AccessControlDidGovernanceFacet,
    TrustedIssuersRegistryFacet,
    NetworkDirectoryFacet,
    TrustedIssuersRegistryFacet__factory,
    NetworkDirectoryFacet__factory,
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
    BESU_NODE_MANAGER_ROLE,
    ANCHORER_ROLE,
    METADATA_MANAGER_ROLE,
    TRUSTED_ISSUERS_REGISTRY_ROLE,
    NETWORK_DIRECTORY_ROLE,
} from '../../utils/constants'

let AccessControlFacetFactory: AccessControlGovernanceFacet__factory
let AccessControlDidFacetFactory: AccessControlDidFacet__factory
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
let DidRegistryQueryFacetFactory: DidRegistryQueryFacet__factory
let TrustedIssuersRegistryFacetFactory: TrustedIssuersRegistryFacet__factory
let EnsRegistryFacetFactory: EnsRegistryFacet__factory
let TimeStampingRegistryFacetFactory: TimeStampingRegistryFacet__factory
let NetworkDirectoryFacetFactory: NetworkDirectoryFacet__factory
let ClientFilteringFacetFactory: ClientFilteringFacet__factory
let BesuNodeManagerFacetFactory: BesuNodeManagerFacet__factory

let AnchoringCoreFacetFactory: AnchoringCoreFacet__factory
let diamondProxy: EIP2535AccessControl
let businessLogicFactoryFacet: BusinessLogicFactoryFacet
let proxyFactoryFacet: ProxyFactoryFacet
let globalIsbePauseFacet: GlobalIsbePauseFacet
let accessControlGovernanceFacet: AccessControlGovernanceFacet
let accessControlDidGovernanceFacet: AccessControlDidGovernanceFacet
let pauseFacet: ISBEPauseFacet
let diamondCutFacet: DiamondCutAccessControlFacet
let diamondLoupeFacet: DiamondLoupeFacet
let configMgmtFacet: ConfigurationManagementFacet
let didDocumentDetailedFacet: DidDocumentDetailedFacet
let didControllerFacet: DidControllerFacet
let didVerificationMethodFacet: DidVerificationMethodFacet
let didVerificationRelationshipFacet: DidVerificationRelationshipFacet
let didRegistryQueryFacet: DidRegistryQueryFacet
let trustedIssuersRegistryFacet: TrustedIssuersRegistryFacet
let ensRegistryFacet: EnsRegistryFacet
let timeStampingRegistryFacet: TimeStampingRegistryFacet
let clientFilteringFacet: ClientFilteringFacet
let networkDirectoryFacet: NetworkDirectoryFacet
let besuNodeManagerFacet: BesuNodeManagerFacet
let anchoringCoreFacet: AnchoringCoreFacet

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
    AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidGovernanceFacet'
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
    DidRegistryQueryFacetFactory = await ethers.getContractFactory(
        'DidRegistryQueryFacet'
    )
    TrustedIssuersRegistryFacetFactory = await ethers.getContractFactory(
        'TrustedIssuersRegistryFacet'
    )
    EnsRegistryFacetFactory =
        await ethers.getContractFactory('EnsRegistryFacet')
    TimeStampingRegistryFacetFactory = await ethers.getContractFactory(
        'TimeStampingRegistryFacet'
    )
    ClientFilteringFacetFactory = await ethers.getContractFactory(
        'ClientFilteringFacet'
    )
    NetworkDirectoryFacetFactory = await ethers.getContractFactory(
        'NetworkDirectoryFacet'
    )
    BesuNodeManagerFacetFactory = await ethers.getContractFactory(
        'BesuNodeManagerFacet'
    )
    AnchoringCoreFacetFactory =
        await ethers.getContractFactory('AnchoringCoreFacet')

    // Add explicit gas limit to fix Internal error with non-validator nodes
    // Note: Hardhat caps transaction gas at ~50% of blockGasLimit (30M) = 15M max
    const deployOptions = { gasLimit: 15_000_000 }

    businessLogicFactoryFacet =
        await BusinessLogicFactoryFactory.deploy(deployOptions)
    proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy(deployOptions)
    globalIsbePauseFacet =
        await GlobalIsbePauseFacetFactory.deploy(deployOptions)
    accessControlGovernanceFacet =
        await AccessControlFacetFactory.deploy(deployOptions)
    accessControlDidGovernanceFacet =
        await AccessControlDidFacetFactory.deploy(deployOptions)
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
    didRegistryQueryFacet =
        await DidRegistryQueryFacetFactory.deploy(deployOptions)
    trustedIssuersRegistryFacet =
        await TrustedIssuersRegistryFacetFactory.deploy(deployOptions)
    ensRegistryFacet = await EnsRegistryFacetFactory.deploy(deployOptions)
    timeStampingRegistryFacet =
        await TimeStampingRegistryFacetFactory.deploy(deployOptions)
    clientFilteringFacet =
        await ClientFilteringFacetFactory.deploy(deployOptions)
    networkDirectoryFacet =
        await NetworkDirectoryFacetFactory.deploy(deployOptions)
    besuNodeManagerFacet =
        await BesuNodeManagerFacetFactory.deploy(deployOptions)
    anchoringCoreFacet = await AnchoringCoreFacetFactory.deploy()

    await businessLogicFactoryFacet.waitForDeployment()
    await proxyFactoryFacet.waitForDeployment()
    await globalIsbePauseFacet.waitForDeployment()
    await accessControlGovernanceFacet.waitForDeployment()
    await accessControlDidGovernanceFacet.waitForDeployment()
    await pauseFacet.waitForDeployment()
    await diamondCutFacet.waitForDeployment()
    await diamondLoupeFacet.waitForDeployment()
    await configMgmtFacet.waitForDeployment()
    await didDocumentDetailedFacet.waitForDeployment()
    await didControllerFacet.waitForDeployment()
    await didVerificationMethodFacet.waitForDeployment()
    await didVerificationRelationshipFacet.waitForDeployment()
    await didRegistryQueryFacet.waitForDeployment()
    await trustedIssuersRegistryFacet.waitForDeployment()
    await ensRegistryFacet.waitForDeployment()
    await timeStampingRegistryFacet.waitForDeployment()
    await clientFilteringFacet.waitForDeployment()
    await networkDirectoryFacet.waitForDeployment()
    await besuNodeManagerFacet.waitForDeployment()
    await anchoringCoreFacet.waitForDeployment()
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
        await proxyFactoryFacet.getAddress(),
        await globalIsbePauseFacet.getAddress(),
        await accessControlGovernanceFacet.getAddress(),
        await accessControlDidGovernanceFacet.getAddress(),
        await pauseFacet.getAddress(),
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await configMgmtFacet.getAddress(),
        await didDocumentDetailedFacet.getAddress(),
        await didControllerFacet.getAddress(),
        await didVerificationMethodFacet.getAddress(),
        await didVerificationRelationshipFacet.getAddress(),
        await didRegistryQueryFacet.getAddress(),
        await trustedIssuersRegistryFacet.getAddress(),
        await ensRegistryFacet.getAddress(),
        await timeStampingRegistryFacet.getAddress(),
        await clientFilteringFacet.getAddress(),
        await networkDirectoryFacet.getAddress(),
        await besuNodeManagerFacet.getAddress(),
        await anchoringCoreFacet.getAddress(),
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
                    role: TRUSTED_ISSUERS_REGISTRY_ROLE,
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
                {
                    role: NETWORK_DIRECTORY_ROLE,
                    members: [accountAddress],
                },
                {
                    role: BESU_NODE_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ANCHORER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: METADATA_MANAGER_ROLE,
                    members: [accountAddress],
                },
            ],
            init: ethers.ZeroAddress,
            initCalldata: initCalldata,
        },
        // Add explicit gas limit to fix Internal error with non-validator nodes
        { gasLimit: 15_000_000 }
    )

    await diamondProxy.waitForDeployment()
    return await diamondProxy.getAddress()
}
