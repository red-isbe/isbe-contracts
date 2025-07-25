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
    ConfigurationManagementFacet__factory,
    ConfigurationManagementFacet,
    IsbeProxy__factory,
    IsbeProxy,
    IsbeCutFacet__factory,
    IsbeCutFacet,
    IsbeLoupeFacet__factory,
    IsbeLoupeFacet,
    ISBEPauseFacet,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    HASH_TIMESTAMP_RESOLVER_KEY,
    ISBE_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    CONFIGURATION_MANAGER_ROLE,
    RANDOM_HASH_FOR_CONFIGURATION_ID,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    PAUSER_ROLE,
    FORBIDDEN_ERC165_INTERFACE_ID,
} from '../constants'

describe('IsbeProxy', function () {
    let admin: Signer
    let adminAddress: string
    let isbe: Signer
    let isbeAddress: string
    let businessLogicDeployer: Signer
    let businessLogicDeployerAddress: string
    let configurationManager: Signer
    let configurationManagerAddress: string
    let AccessControlFactory: AccessControlFacet__factory
    let IsbePausableFactory: ISBEPause__factory
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
    let ConfigurationManagerFacetFactory: ConfigurationManagementFacet__factory
    let HashTimestampFactory: HashTimestampFacet__factory
    let AssetEventTrackerFactory: AssetEventTrackerTestWrapper__factory
    let Ownable2StepFacetFactory: Ownable2StepFacet__factory
    let IsbeProxyFactory: IsbeProxy__factory
    let IsbeCutFacetFactory: IsbeCutFacet__factory
    let IsbeLoupeFacetFactory: IsbeLoupeFacet__factory
    let diamondProxy: EIP2535AccessControl
    let businessLogicFactoryFacet: BusinessLogicFactoryFacet
    let configurationManagementFacet: ConfigurationManagementFacet
    let isbeFactory: IIsbeFactory
    let isbeFactoryAddress: string
    let isbeProxy: IsbeProxy
    let isbeCutFacet: IsbeCutFacet
    let isbeLoupeFacet: IsbeLoupeFacet
    let pauseFacet: ISBEPauseFacet

    async function deployInitial() {
        ;[admin, isbe, businessLogicDeployer, configurationManager] =
            await ethers.getSigners()
        adminAddress = await admin.getAddress()
        isbeAddress = await isbe.getAddress()
        configurationManagerAddress = await configurationManager.getAddress()
        businessLogicDeployerAddress = await businessLogicDeployer.getAddress()
        // Despliegue AccessControl logic
        BusinessLogicFactoryFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        ConfigurationManagerFacetFactory = await ethers.getContractFactory(
            'ConfigurationManagementFacet'
        )
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
        IsbeProxyFactory = await ethers.getContractFactory('IsbeProxy')
        IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
        IsbeLoupeFacetFactory =
            await ethers.getContractFactory('IsbeLoupeFacet')
        businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
        configurationManagementFacet =
            await ConfigurationManagerFacetFactory.deploy()
        isbeCutFacet = await IsbeCutFacetFactory.deploy()
        isbeLoupeFacet = await IsbeLoupeFacetFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        await configurationManagementFacet.waitForDeployment()
        await isbeCutFacet.waitForDeployment()
        await isbeLoupeFacet.waitForDeployment()
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
        isbeFactoryAddress = await diamondProxy.getAddress()
        isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            isbeFactoryAddress
        )
    }

    before(async () => {
        await deployInitial()
        await deployIsbeFactory()
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(ISBE_CUT_RESOLVER_KEY, IsbeCutFacetFactory.bytecode)
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(ISBE_LOUPE_RESOLVER_KEY, IsbeLoupeFacetFactory.bytecode)
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(ACCESS_CONTROL_RESOLVER_KEY, AccessControlFactory.bytecode)
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(PAUSE_RESOLVER_KEY, IsbePausableFactory.bytecode)
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(OWNABLE_RESOLVER_KEY, Ownable2StepFacetFactory.bytecode)
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(HASH_TIMESTAMP_RESOLVER_KEY, HashTimestampFactory.bytecode)
        await isbeFactory
            .connect(businessLogicDeployer)
            .deploy(
                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                AssetEventTrackerFactory.bytecode
            )
        pauseFacet = IsbePausableFactory.attach(
            await isbeFactory.getBusinessLogicAddress(PAUSE_RESOLVER_KEY, 0)
        )
        await isbeFactory
            .connect(configurationManager)
            .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                {
                    businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                    version: 0,
                },
                {
                    businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
                    version: 0,
                },
            ])
    })

    describe('IsbeProxy', () => {
        it('GIVEN deployed governance proxy WHEN deploy Zero configuration management THEN it fails', async () => {
            try {
                isbeProxy = await IsbeProxyFactory.deploy({
                    configurationManagement: ethers.ZeroAddress,
                    configurationId: ethers.ZeroHash,
                    version: 0,
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [adminAddress],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    data: '0x',
                })
                await isbeProxy.waitForDeployment()
            } catch (error) {
                expect(error.message).to.contains('AddressZero')
            }
        })

        it('GIVEN deployed governance proxy WHEN deploy Zero configuration management address THEN it fails', async () => {
            try {
                isbeProxy = await IsbeProxyFactory.deploy({
                    configurationManagement: isbeFactoryAddress,
                    configurationId: ethers.ZeroHash,
                    version: 0,
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [adminAddress],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    data: '0x',
                })
                await isbeProxy.waitForDeployment()
            } catch (error) {
                expect(error.message).to.contains('EmptyBytes32')
            }
        })

        it('GIVEN deployed governance proxy WHEN deploy Zero configuration management address THEN it fails', async () => {
            const init = await pauseFacet.getAddress()
            const data = '0x89787423'
            try {
                isbeProxy = await IsbeProxyFactory.deploy({
                    configurationManagement: isbeFactoryAddress,
                    configurationId: RANDOM_HASH_FOR_CONFIGURATION_ID,
                    version: 0,
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [adminAddress],
                        },
                    ],
                    init,
                    data,
                })
                await isbeProxy.waitForDeployment()
            } catch (error) {
                expect(error.message).to.contains(
                    `InitializationFunctionReverted("${init}", "${data}", "0x")'`
                )
            }
        })

        async function extracted(isbeProxyAddress: string) {
            const businessLogics = [
                HASH_TIMESTAMP_RESOLVER_KEY,
                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                ACCESS_CONTROL_RESOLVER_KEY,
                PAUSE_RESOLVER_KEY,
                ISBE_CUT_RESOLVER_KEY,
                ISBE_LOUPE_RESOLVER_KEY,
            ]
            const loupe: IsbeLoupeFacet =
                IsbeLoupeFacetFactory.attach(isbeProxyAddress)
            const facets = await loupe.facets()
            const facetAddresses = await loupe.facetAddresses()
            for (const facetIndex in facets) {
                const facet = facets[facetIndex]
                expect(facet.facetAddress).to.be.equal(
                    facetAddresses[facetIndex]
                )
                const introspection: IEIP2535Introspection =
                    await ethers.getContractAt(
                        'IEIP2535Introspection',
                        facet.facetAddress
                    )
                const businessId = await introspection.businessIdIntrospection()
                const selectors = await introspection.selectorsIntrospection()
                const intefaces = await introspection.interfacesIntrospection()
                expect(businessId).to.be.equal(businessLogics[facetIndex])
                expect(facet.functionSelectors).to.be.deep.equal(selectors)
                expect(
                    await loupe.facetFunctionSelectors(facet.facetAddress)
                ).to.be.deep.equal(selectors)
                for (const selector of selectors) {
                    expect(await loupe.facetAddress(selector)).to.be.equal(
                        facet.facetAddress
                    )
                }
                for (const interfaceId of intefaces) {
                    expect(await loupe.supportsInterface(interfaceId)).to.be
                        .true
                }
            }
            expect(await loupe.supportsInterface(FORBIDDEN_ERC165_INTERFACE_ID))
                .to.be.false
        }

        it('GIVEN deployed governance proxy WHEN set correct configuration THEN it success', async () => {
            isbeProxy = await IsbeProxyFactory.deploy({
                configurationManagement: isbeFactoryAddress,
                configurationId: RANDOM_HASH_FOR_CONFIGURATION_ID,
                version: 0,
                rbacs: [
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [adminAddress],
                    },
                ],
                init: ethers.ZeroAddress,
                data: '0x',
            })
            await isbeProxy.waitForDeployment()
            const isbeProxyAddress = await isbeProxy.getAddress()
            await extracted(isbeProxyAddress)
        })

        describe('IsbeCut', () => {
            let isbeProxyAddress: string
            let cut: IsbeCutFacet
            let pauseFacet: ISBEPauseFacet
            before(async () => {
                isbeProxy = await IsbeProxyFactory.deploy({
                    configurationManagement: isbeFactoryAddress,
                    configurationId: RANDOM_HASH_FOR_CONFIGURATION_ID,
                    version: 1,
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [adminAddress],
                        },
                        {
                            role: PAUSER_ROLE,
                            members: [adminAddress],
                        },
                        {
                            role: CONFIGURATION_MANAGER_ROLE,
                            members: [configurationManagerAddress],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    data: '0x',
                })
                await isbeProxy.waitForDeployment()
                isbeProxyAddress = await isbeProxy.getAddress()
                cut = IsbeCutFacetFactory.attach(isbeProxyAddress)
                pauseFacet = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    isbeProxyAddress
                )
                await pauseFacet.connect(admin).pause()
            })

            it('GIVEN a deployed isbe proxy WHEN set configuration without roles THEN it fails', async () => {
                await expect(
                    cut.setIsbeProxyConfiguration(
                        isbeFactoryAddress,
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0
                    )
                )
                    .revertedWithCustomError(cut, 'AccountHasNoRole')
                    .withArgs(adminAddress, CONFIGURATION_MANAGER_ROLE)
            })

            it('GIVEN a paused isbe proxy WHEN set configuration THEN it fails', async () => {
                await expect(
                    cut
                        .connect(configurationManager)
                        .setIsbeProxyConfiguration(
                            isbeFactoryAddress,
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            0
                        )
                ).revertedWithCustomError(cut, 'IsPaused')

                await pauseFacet.connect(admin).unpause()
            })

            it('GIVEN a deployed isbe proxy WHEN set configuration without non existen configuration THEN it fails', async () => {
                await expect(
                    cut
                        .connect(configurationManager)
                        .setIsbeProxyConfiguration(
                            isbeFactoryAddress,
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            3
                        )
                )
                    .revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(RANDOM_HASH_FOR_CONFIGURATION_ID, 3)
            })

            it('GIVEN a deployed isbe proxy WHEN set configuration THEN it success', async () => {
                expect(
                    await cut
                        .connect(configurationManager)
                        .setIsbeProxyConfiguration(
                            isbeFactoryAddress,
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            0
                        )
                )
                    .to.emit(cut, 'IsbeProxyConfigurationSet')
                    .withArgs(
                        isbeFactoryAddress,
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0
                    )
                await extracted(isbeProxyAddress)
            })
        })
    })
})
