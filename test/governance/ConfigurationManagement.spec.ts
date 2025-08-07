import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
    ISBEPause__factory,
    AccessControlFacet__factory,
    IIsbeFactory,
    IEIP2535Introspection,
    HashTimestampFacet__factory,
    AssetEventTrackerTestWrapper__factory,
    Ownable2StepFacet__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondLoupeFacet__factory,
    ConfigurationManagementFacet__factory,
    ConfigurationManagementFacet,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    ISBE_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    CONFIGURATION_MANAGEMENT_RESOLVER_KEY,
    RANDOM_HASH_FOR_CONFIGURATION_ID,
} from '../constants'

describe('ConfigurationManagement', function () {
    let admin: Signer
    let adminAddress: string
    let isbe: Signer
    let isbeAddress: string
    let businessLogicDeployer: Signer
    let businessLogicDeployerAddress: string
    let configurationManager: Signer
    let configurationManagerAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let AccessControlFactory: AccessControlFacet__factory
    let IsbePausableFactory: ISBEPause__factory
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
    let ConfigurationManagerFacetFactory: ConfigurationManagementFacet__factory
    let DiamondCutFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let HashTimestampFactory: HashTimestampFacet__factory
    let AssetEventTrackerFactory: AssetEventTrackerTestWrapper__factory
    let Ownable2StepFacetFactory: Ownable2StepFacet__factory
    let diamondProxy: EIP2535AccessControl
    let businessLogicFactoryFacet: BusinessLogicFactoryFacet
    let configurationManagementFacet: ConfigurationManagementFacet
    let isbeFactory: IIsbeFactory

    async function deployInitial() {
        ;[admin, isbe, businessLogicDeployer, configurationManager, nonAdmin] =
            await ethers.getSigners()
        adminAddress = await admin.getAddress()
        isbeAddress = await isbe.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()
        configurationManagerAddress = await configurationManager.getAddress()
        businessLogicDeployerAddress = await businessLogicDeployer.getAddress()
        // Despliegue AccessControl logic
        BusinessLogicFactoryFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        ConfigurationManagerFacetFactory = await ethers.getContractFactory(
            'ConfigurationManagementFacet'
        )
        DiamondCutFacetFactory = await ethers.getContractFactory(
            'DiamondCutAccessControlFacet'
        )
        DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')
        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        AccessControlFactory =
            await ethers.getContractFactory('AccessControlFacet')
        IsbePausableFactory = await ethers.getContractFactory('ISBEPauseFacet')
        HashTimestampFactory =
            await ethers.getContractFactory('HashTimestampFacet')
        AssetEventTrackerFactory = await ethers.getContractFactory(
            'AssetEventTrackerTestWrapper'
        )
        Ownable2StepFacetFactory =
            await ethers.getContractFactory('Ownable2StepFacet')
        businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
        configurationManagementFacet =
            await ConfigurationManagerFacetFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        await configurationManagementFacet.waitForDeployment()
        expect(
            await configurationManagementFacet.businessIdIntrospection()
        ).to.be.equal(CONFIGURATION_MANAGEMENT_RESOLVER_KEY)
        expect(
            await configurationManagementFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x41ac63ff'])
    }

    async function deployIsbeFactory(initCalldata: string = '0x') {
        const proxyFactoryAddress =
            await configurationManagementFacet.getAddress()
        const facetAddresses = [
            await businessLogicFactoryFacet.getAddress(),
            proxyFactoryAddress,
        ]
        diamondProxy = await EIP2535AccessControlFactory.deploy(
            facetAddresses,
            {
                rbacs: [
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [adminAddress],
                    },
                    {
                        role: ISBE_ROLE,
                        members: [isbeAddress],
                    },
                    {
                        role: BUSINESS_LOGIC_DEPLOYER_ROLE,
                        members: [businessLogicDeployerAddress],
                    },
                    {
                        role: GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
                        members: [configurationManagerAddress],
                    },
                ],
                init: ethers.ZeroAddress,
                initCalldata: initCalldata,
            }
        )
        await diamondProxy.waitForDeployment()
        isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await diamondProxy.getAddress()
        )
    }

    before(async () => {
        await deployInitial()
    })

    describe('ConfigurationManagement', () => {
        before(async () => {
            await deployIsbeFactory()
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(
                    DIAMOND_CUT_RESOLVER_KEY,
                    DiamondCutFacetFactory.bytecode
                )
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(
                    DIAMOND_LOUPE_RESOLVER_KEY,
                    DiamondLoupeFacetFactory.bytecode
                )
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(
                    ACCESS_CONTROL_RESOLVER_KEY,
                    AccessControlFactory.bytecode
                )
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(PAUSE_RESOLVER_KEY, IsbePausableFactory.bytecode)
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(OWNABLE_RESOLVER_KEY, Ownable2StepFacetFactory.bytecode)
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(
                    HASH_TIMESTAMP_RESOLVER_KEY,
                    HashTimestampFactory.bytecode
                )
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(
                    ASSET_EVENT_TRACKER_RESOLVER_KEY,
                    AssetEventTrackerFactory.bytecode
                )
        })

        describe('Configure Use Case', () => {
            it('GIVEN deployed isbe factory WHEN try to configure use case without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(ethers.ZeroHash, [])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(
                        adminAddress,
                        GOVERNANCE_CONFIGURATION_MANAGER_ROLE
                    )
                await expect(
                    isbeFactory
                        .connect(isbe)
                        .setConfiguration(ethers.ZeroHash, [])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(
                        isbeAddress,
                        GOVERNANCE_CONFIGURATION_MANAGER_ROLE
                    )
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .setConfiguration(ethers.ZeroHash, [])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(
                        nonAdminAddress,
                        GOVERNANCE_CONFIGURATION_MANAGER_ROLE
                    )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with empty configurationId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(ethers.ZeroHash, [])
                ).to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with Zero facets THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [])
                ).to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'NotEmptyBusinessIds'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with Zero businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: ethers.ZeroHash,
                                version: 0,
                            },
                        ])
                ).to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with a default facet THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: ACCESS_CONTROL_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(ACCESS_CONTROL_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: PAUSE_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(PAUSE_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: DIAMOND_CUT_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(DIAMOND_CUT_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: DIAMOND_LOUPE_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(DIAMOND_LOUPE_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with non existent businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: RANDOM_HASH_FOR_CONFIGURATION_ID,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'CurrentIdNotRegistered'
                    )
                    .withArgs(RANDOM_HASH_FOR_CONFIGURATION_ID)
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                                version: 2,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'CurrentIdNotRegistered'
                    )
                    .withArgs(HASH_TIMESTAMP_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with duplicated businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                                version: 0,
                            },
                            {
                                businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                                version: 1,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'DuplicatedBusinessId'
                    )
                    .withArgs(HASH_TIMESTAMP_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with duplicated businessId THEN it fails', async () => {
                const businessDatas = [
                    {
                        businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                        version: 0,
                    },
                    {
                        businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
                        version: 0,
                    },
                ]
                expect(
                    await isbeFactory
                        .connect(configurationManager)
                        .setConfiguration(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            businessDatas
                        )
                )
                    .to.emit(configurationManagementFacet, 'UseCaseConfigured')
                    .withArgs(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        businessDatas,
                        1
                    )
                businessDatas.push(
                    ...[
                        {
                            businessId: ACCESS_CONTROL_RESOLVER_KEY,
                            version: 0,
                        },
                        {
                            businessId: PAUSE_RESOLVER_KEY,
                            version: 0,
                        },
                        {
                            businessId: DIAMOND_CUT_RESOLVER_KEY,
                            version: 0,
                        },
                        {
                            businessId: DIAMOND_LOUPE_RESOLVER_KEY,
                            version: 0,
                        },
                    ]
                )
                for (const version of [0, 1]) {
                    const storedBusinessDatas =
                        await isbeFactory.getConfiguration(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            version
                        )
                    expect(storedBusinessDatas.length).to.be.equal(
                        businessDatas.length
                    )
                    for (const index in storedBusinessDatas) {
                        expect(
                            storedBusinessDatas[index].businessId
                        ).to.be.deep.equal(businessDatas[index].businessId)
                        expect(
                            storedBusinessDatas[index].version
                        ).to.be.deep.equal(businessDatas[index].version)
                    }
                }
                expect(
                    await isbeFactory.getConfiguration(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        2
                    )
                ).to.be.deep.equal([])
                const facets = await isbeFactory.facets(
                    RANDOM_HASH_FOR_CONFIGURATION_ID,
                    0
                )
                expect(facets.length).to.be.equal(businessDatas.length)
                let instrospection: IEIP2535Introspection
                const facetAddresses: string[] = []
                for (const index in facets) {
                    instrospection = await ethers.getContractAt(
                        'IEIP2535Introspection',
                        facets[index].facetAddress
                    )
                    expect(
                        await instrospection.businessIdIntrospection()
                    ).to.be.equal(businessDatas[index].businessId)
                    const selectors =
                        await instrospection.selectorsIntrospection()
                    expect(facets[index].functionSelectors).to.be.deep.equal(
                        selectors
                    )
                    expect(
                        await isbeFactory.facetFunctionSelectors(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            0,
                            facets[index].facetAddress
                        )
                    ).to.be.deep.equal(selectors)
                    expect(
                        await isbeFactory.facetFunctionSelectors(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            1,
                            facets[index].facetAddress
                        )
                    ).to.be.deep.equal(selectors)
                    expect(
                        await isbeFactory.facetFunctionSelectors(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            2,
                            facets[index].facetAddress
                        )
                    ).to.be.deep.equal([])
                    for (const selector of selectors) {
                        expect(
                            await isbeFactory.facetAddress(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                0,
                                selector
                            )
                        ).to.be.equal(facets[index].facetAddress)
                        expect(
                            await isbeFactory.facetAddress(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                1,
                                selector
                            )
                        ).to.be.equal(facets[index].facetAddress)
                        expect(
                            await isbeFactory.facetAddress(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                2,
                                selector
                            )
                        ).to.be.equal(ethers.ZeroAddress)
                    }
                    const interfaces =
                        await instrospection.interfacesIntrospection()
                    for (const current of interfaces) {
                        expect(
                            await isbeFactory.facetSupportsInterface(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                0,
                                current
                            )
                        ).to.be.true
                        expect(
                            await isbeFactory.facetSupportsInterface(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                1,
                                current
                            )
                        ).to.be.true
                        expect(
                            await isbeFactory.facetSupportsInterface(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                2,
                                current
                            )
                        ).to.be.false
                    }
                    facetAddresses.push(facets[index].facetAddress)
                }
                expect(
                    await isbeFactory.facetAddresses(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0
                    )
                ).to.be.deep.equal(facetAddresses)
                expect(
                    await isbeFactory.facetAddresses(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1
                    )
                ).to.be.deep.equal(facetAddresses)
                expect(
                    await isbeFactory.facetAddresses(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        2
                    )
                ).to.be.deep.equal([])
            })
        })
    })
})
