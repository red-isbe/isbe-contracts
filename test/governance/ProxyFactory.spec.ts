import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
    ProxyFactoryFacet__factory,
    ProxyFactoryFacet,
    ISBEPause__factory,
    AccessControlFacet__factory,
    IIsbeFactory,
    IsbeCutFacet__factory,
    IsbeLoupeFacet__factory,
    ConfigurationManagementFacet,
    ConfigurationManagementFacet__factory,
    ERC20Facet__factory,
    IsbeLoupeFacet,
    IERC20Isbe,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    ISBE_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    PAUSE_RESOLVER_KEY,
    PROXY_DEPLOYER_ROLE,
    PROXY_FACTORY_RESOLVER_KEY,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    RANDOM_HASH_FOR_CONFIGURATION_ID,
    CONFIGURATION_MANAGER_ROLE,
} from '../constants'
import {
    randomAddress,
    randomHash,
} from 'hardhat/internal/hardhat-network/provider/utils/random'

describe('ProxyFactory', function () {
    let admin: Signer
    let adminAddress: string
    let isbe: Signer
    let isbeAddress: string
    let businessLogicDeployer: Signer
    let businessLogicDeployerAddress: string
    let configurationManager: Signer
    let configurationManagerAddress: string
    let proxyDeployer: Signer
    let proxyDeployerAddress: string
    let AccessControlFactory: AccessControlFacet__factory
    let IsbePausableFactory: ISBEPause__factory
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
    let ConfigurationManagerFacetFactory: ConfigurationManagementFacet__factory
    let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
    let IsbeCutFacetFactory: IsbeCutFacet__factory
    let IsbeLoupeFacetFactory: IsbeLoupeFacet__factory
    let Erc20FacetFactory: ERC20Facet__factory
    let diamondProxy: EIP2535AccessControl
    let businessLogicFactoryFacet: BusinessLogicFactoryFacet
    let configurationManagementFacet: ConfigurationManagementFacet
    let proxyFactoryFacet: ProxyFactoryFacet
    let isbeFactory: IIsbeFactory

    async function deployInitial() {
        ;[
            admin,
            isbe,
            businessLogicDeployer,
            configurationManager,
            proxyDeployer,
        ] = await ethers.getSigners()
        adminAddress = await admin.getAddress()
        isbeAddress = await isbe.getAddress()
        proxyDeployerAddress = await proxyDeployer.getAddress()
        businessLogicDeployerAddress = await businessLogicDeployer.getAddress()
        configurationManagerAddress = await configurationManager.getAddress()
        // Despliegue AccessControl logic
        BusinessLogicFactoryFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        ConfigurationManagerFacetFactory = await ethers.getContractFactory(
            'ConfigurationManagementFacet'
        )
        ProxyFactoryFacetFactory =
            await ethers.getContractFactory('ProxyFactoryFacet')
        IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
        IsbeLoupeFacetFactory =
            await ethers.getContractFactory('IsbeLoupeFacet')
        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        AccessControlFactory =
            await ethers.getContractFactory('AccessControlFacet')
        IsbePausableFactory = await ethers.getContractFactory('ISBEPauseFacet')
        Erc20FacetFactory = await ethers.getContractFactory('ERC20Facet')
        businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
        configurationManagementFacet =
            await ConfigurationManagerFacetFactory.deploy()
        proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        await configurationManagementFacet.waitForDeployment()
        await proxyFactoryFacet.waitForDeployment()
        expect(await proxyFactoryFacet.businessIdIntrospection()).to.be.equal(
            PROXY_FACTORY_RESOLVER_KEY
        )
        expect(
            await proxyFactoryFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x5ec663a4'])
    }

    async function deployIsbeFactory(initCalldata: string = '0x') {
        const proxyFactoryAddress = await proxyFactoryFacet.getAddress()
        const facetAddresses = [
            await businessLogicFactoryFacet.getAddress(),
            await configurationManagementFacet.getAddress(),
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
                    {
                        role: PROXY_DEPLOYER_ROLE,
                        members: [proxyDeployerAddress],
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

    describe('ProxyFactory', () => {
        before(async () => {
            await deployIsbeFactory()
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(ISBE_CUT_RESOLVER_KEY, IsbeCutFacetFactory.bytecode)
            await isbeFactory
                .connect(businessLogicDeployer)
                .deploy(ISBE_LOUPE_RESOLVER_KEY, IsbeLoupeFacetFactory.bytecode)
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
                .deploy(ERC20_RESOLVER_KEY, Erc20FacetFactory.bytecode)
            await isbeFactory
                .connect(configurationManager)
                .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                    { businessId: ERC20_RESOLVER_KEY, version: 0 },
                ])
        })

        describe('ProxyFactory', () => {
            it('GIVEN deployed isbe factory WHEN try to deploy without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCase(
                            ethers.ZeroHash,
                            0,
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(adminAddress, PROXY_DEPLOYER_ROLE)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy empty configurationId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployUseCase(
                            ethers.ZeroHash,
                            0,
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                ).to.be.revertedWithCustomError(
                    proxyFactoryFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to deploy configuration than not exists THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployUseCase(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            3,
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'InvalidConfiguration'
                    )
                    .withArgs(RANDOM_HASH_FOR_CONFIGURATION_ID, 3)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy with invalid roles THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(proxyDeployer).deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        [
                            {
                                role: DEFAULT_ADMIN_ROLE,
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        ethers.ZeroHash,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'ForbiddenRole'
                    )
                    .withArgs(DEFAULT_ADMIN_ROLE)
                await expect(
                    isbeFactory.connect(proxyDeployer).deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        [
                            {
                                role: ISBE_ROLE,
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        ethers.ZeroHash,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'ForbiddenRole'
                    )
                    .withArgs(ISBE_ROLE)
                await expect(
                    isbeFactory.connect(proxyDeployer).deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        [
                            {
                                role: CONFIGURATION_MANAGER_ROLE,
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        ethers.ZeroHash,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'ForbiddenRole'
                    )
                    .withArgs(CONFIGURATION_MANAGER_ROLE)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy non existent init businessId THEN it fails', async () => {
                const initBusinessId = randomHash().toString()
                await expect(
                    isbeFactory.connect(proxyDeployer).deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0,
                        [
                            {
                                role: randomHash().toString(),
                                members: [randomAddress().toString()],
                            },
                        ],
                        initBusinessId,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'FacetNotFound'
                    )
                    .withArgs(initBusinessId)
            })

            it('GIVEN deployed isbe factory WHEN deploy with correct initialization THEN it success', async () => {
                const name = 'Test'
                const symbol = 'TST'
                const decimals = 18
                const rbacs = [
                    {
                        role: randomHash().toString(),
                        members: [randomAddress().toString()],
                    },
                ]
                const deployTx = await isbeFactory
                    .connect(proxyDeployer)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0,
                        rbacs,
                        ERC20_RESOLVER_KEY,
                        Erc20FacetFactory.interface.encodeFunctionData(
                            'initializeErc20',
                            [name, symbol, decimals]
                        )
                    )
                expect(await deployTx)
                    .to.emit(Erc20FacetFactory, 'Erc20Initialized')
                    .withArgs(name, symbol, decimals)
                const waitedTx = await deployTx.wait()

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )
                const proxyAddress = diamondDeployedEvent.args.proxy
                expect(deployTx)
                    .to.emit(isbeFactory, 'Deployed')
                    .withArgs(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0,
                        rbacs,
                        proxyAddress
                    )
                const accessControl = AccessControlFactory.attach(proxyAddress)
                expect(
                    await accessControl.hasRole(
                        rbacs[0].role,
                        rbacs[0].members[0]
                    )
                ).to.be.true
                expect(
                    await accessControl.hasRole(
                        DEFAULT_ADMIN_ROLE,
                        await isbeFactory.getAddress()
                    )
                ).to.be.true
                expect(
                    await accessControl.hasRole(
                        DEFAULT_ADMIN_ROLE,
                        proxyDeployerAddress
                    )
                ).to.be.true
                expect(
                    await accessControl.hasRole(
                        ISBE_ROLE,
                        await isbeFactory.getAddress()
                    )
                ).to.be.true
                expect(
                    await accessControl.hasRole(
                        CONFIGURATION_MANAGER_ROLE,
                        await isbeFactory.getAddress()
                    )
                ).to.be.true
                expect(await IsbePausableFactory.attach(proxyAddress).paused())
                    .to.be.false
                expect(
                    await isbeFactory.getDeployedProxiesByConfiguration(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0
                    )
                ).to.be.deep.equal([proxyAddress])
                expect(
                    await isbeFactory.getConfigurationByProxy(proxyAddress)
                ).to.be.deep.equal([RANDOM_HASH_FOR_CONFIGURATION_ID, 0])
                const erc20: IERC20Isbe = Erc20FacetFactory.attach(proxyAddress)
                expect(await erc20.name()).to.be.equal(name)
                expect(await erc20.symbol()).to.be.equal(symbol)
                expect(await erc20.decimals()).to.be.equal(decimals)
                const loupe: IsbeLoupeFacet =
                    IsbeLoupeFacetFactory.attach(proxyAddress)
                const facets = await loupe.facets()
                expect(facets.length).to.be.equal(5)
            })
        })
    })
})
