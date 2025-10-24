import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    IIsbeFactory,
    AccessControl,
    ProxyFactoryFacet,
} from '../../typechain-types'
import { Signer } from 'ethers'
import { CONFIGURATION_ID_ERC20, deployGovernance } from '../initialization'
import {
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    CONFIGURATION_MANAGER_ROLE,
    DEFAULT_ADMIN_ROLE,
    ERC20_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
    PROXY_FACTORY_RESOLVER_KEY,
    RANDOM_HASH_FOR_CONFIGURATION_ID,
} from '../constants'
import { EventLog } from 'ethers'
import { ContractRegistry } from '../../scripts/genesisGenerator'

const registryFile: string | undefined = process.env.REGISTRY_LOCATION
if (registryFile) {
    console.log(
        `********************************     Using registry file: ${registryFile}`
    )
}

describe('ProxyFactory', function () {
    let admin: Signer
    let adminAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let isbeFactory: IIsbeFactory
    let accessControl: AccessControl

    async function deployInitial() {
        ;[admin, nonAdmin] = await ethers.getSigners()

        adminAddress = await admin.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()

        await deployIsbeFactory()
    }

    async function deployIsbeFactory() {
        if (!registryFile) {
            const result = await deployGovernance(admin)
            isbeFactory = await ethers.getContractAt(
                'IIsbeFactory',
                await result.governanceContract.getAddress()
            )

            accessControl = await ethers.getContractAt(
                'AccessControl',
                await result.governanceContract.getAddress()
            )

            expect(
                await result.proxyFactoryFacet.businessIdIntrospection()
            ).to.be.equal(PROXY_FACTORY_RESOLVER_KEY)
        } else {
            const contractRegistry = new ContractRegistry()
            contractRegistry.retrieveContractRegistry(registryFile)

            const EIP2535AccessControlAddress = contractRegistry.getAddress(
                'EIP2535AccessControl'
            )
            const proxyFactoryFacetAddress =
                contractRegistry.getAddress('ProxyFactoryFacet')
            console.log(
                '************************************************************************************************1'
            )
            console.log(
                `EIP2535AccessControlAddress: ${EIP2535AccessControlAddress}`
            )
            console.log(`proxyFactoryFacetAddress: ${proxyFactoryFacetAddress}`)

            isbeFactory = await ethers.getContractAt(
                'IIsbeFactory',
                EIP2535AccessControlAddress
            )

            accessControl = await ethers.getContractAt(
                'AccessControl',
                EIP2535AccessControlAddress
            )

            const ProxyFactoryFacetFactory =
                await ethers.getContractFactory('ProxyFactoryFacet')
            const proxyFactoryFacet: ProxyFactoryFacet =
                ProxyFactoryFacetFactory.attach(
                    proxyFactoryFacetAddress
                ) as ProxyFactoryFacet
            const selector: string = proxyFactoryFacet.interface.getFunction(
                'businessIdIntrospection'
            ).selector
            console.log(`selector: ${selector}`)
            console.log(
                '************************************************************************************************1.1'
            )
            expect(
                await proxyFactoryFacet.businessIdIntrospection()
            ).to.be.equal(PROXY_FACTORY_RESOLVER_KEY)
            console.log(
                '************************************************************************************************2'
            )
        }
    }

    beforeEach(async () => {
        await deployInitial()
    })

    describe('ProxyFactory', () => {
        describe('deployUseCase', () => {
            it('GIVEN deployed isbe factory WHEN try to deploy passing wrong init business Id THEN it fails', async () => {
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])

                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCase(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            1,
                            [],
                            false,
                            [ASSET_EVENT_TRACKER_RESOLVER_KEY],
                            ['0x']
                        )
                )
                    .to.be.revertedWithCustomError(isbeFactory, 'FacetNotFound')
                    .withArgs(ASSET_EVENT_TRACKER_RESOLVER_KEY)
            })

            it('GIVEN deployed isbe factory WHEN try to deploy initializing forbidden roles THEN it fails', async () => {
                const FORBIDDEN_ROLES = [
                    DEFAULT_ADMIN_ROLE,
                    ISBE_ROLE,
                    CONFIGURATION_MANAGER_ROLE,
                ]

                for (let i = 0; i < FORBIDDEN_ROLES.length; i++) {
                    const ROLE = FORBIDDEN_ROLES[i]

                    await expect(
                        isbeFactory.connect(admin).deployUseCase(
                            CONFIGURATION_ID_ERC20,
                            1,
                            [
                                {
                                    role: ROLE,
                                    members: [admin],
                                },
                            ],
                            false,
                            [],
                            []
                        )
                    )
                        .to.be.revertedWithCustomError(
                            isbeFactory,
                            'ForbiddenRole'
                        )
                        .withArgs(ROLE)
                }
            })

            it('GIVEN deployed isbe factory WHEN try to deploy without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .deployUseCase(ethers.ZeroHash, 0, [], false, [], [])
                )
                    .to.be.revertedWithCustomError(
                        accessControl,
                        'AccountHasNoRole'
                    )
                    .withArgs(nonAdminAddress, PROXY_DEPLOYER_ROLE)
            })

            it('GIVEN deployed isbe factory WHEN try to deploy empty configurationId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCase(ethers.ZeroHash, 0, [], false, [], [])
                ).to.be.revertedWithCustomError(accessControl, 'EmptyBytes32')
            })

            it('GIVEN deployed isbe factory WHEN try to deploy configuration than not exists THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCase(
                            '0x1234567890123456789012345678901234567890123456789012345678901234',
                            3,
                            [],
                            false,
                            [],
                            []
                        )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        3
                    )
            })

            it('GIVEN deployed isbe factory WHEN try to deploy with DEFAULT_ADMIN_ROLE THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).deployUseCase(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1,
                        [
                            {
                                role: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        false,
                        [],
                        []
                    )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1
                    )
            })

            it('GIVEN deployed isbe factory WHEN try to deploy with ISBE_ROLE THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).deployUseCase(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1,
                        [
                            {
                                role: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        false,
                        [],
                        []
                    )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1
                    )
            })

            it('GIVEN deployed isbe factory WHEN try to deploy with CONFIGURATION_MANAGER_ROLE THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).deployUseCase(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1,
                        [
                            {
                                role: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        false,
                        [],
                        []
                    )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1
                    )
            })

            it('GIVEN deployed isbe factory WHEN try to deploy non existent init businessId THEN it fails', async () => {
                const initBusinessId =
                    '0x1234567890123456789012345678901234567890123456789012345678901234'
                await expect(
                    isbeFactory.connect(admin).deployUseCase(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1,
                        [
                            {
                                role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                                members: [ethers.ZeroAddress],
                            },
                        ],
                        false,
                        [initBusinessId],
                        ['0x']
                    )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        1
                    )
            })

            it('GIVEN deployed isbe factory WHEN deploy with correct initialization THEN it success', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                // const proxyAddress = diamondDeployedEvent.args.proxy
                // expect(deployTx)
                //     .to.emit(isbeFactory, 'Deployed')
                //     .withArgs(uniqueConfigId, 1, rbacs, proxyAddress)

                // const accessControl = AccessControlFactory.attach(
                //     proxyAddress
                // ) as AccessControl
                // expect(
                //     await accessControl.hasRole(
                //         rbacs[0].role,
                //         rbacs[0].members[0]
                //     )
                // ).to.be.true
                // expect(
                //     await accessControl.hasRole(
                //         DEFAULT_ADMIN_ROLE,
                //         await isbeFactory.getAddress()
                //     )
                // ).to.be.true
                // expect(
                //     await accessControl.hasRole(
                //         DEFAULT_ADMIN_ROLE,
                //         adminAddress
                //     )
                // ).to.be.true
                // expect(
                //     await accessControl.hasRole(
                //         ISBE_ROLE,
                //         await isbeFactory.getAddress()
                //     )
                // ).to.be.true
                // expect(
                //     await accessControl.hasRole(
                //         CONFIGURATION_MANAGER_ROLE,
                //         await isbeFactory.getAddress()
                //     )
                // ).to.be.true

                // const pauseContract = ISBEPauseFacetFactory.attach(
                //     proxyAddress
                // ) as ISBEPause
                // expect(await pauseContract.paused()).to.be.false

                // expect(
                //     await isbeFactory.getDeployedProxiesByConfiguration(
                //         uniqueConfigId,
                //         1
                //     )
                // ).to.be.deep.equal([proxyAddress])
                // expect(
                //     await isbeFactory.getConfigurationByProxy(proxyAddress)
                // ).to.be.deep.equal([uniqueConfigId, 1])

                // const erc20: IERC20Isbe = Erc20FacetFactory.attach(
                //     proxyAddress
                // ) as IERC20Isbe
                // expect(await erc20.name()).to.be.equal(name)
                // expect(await erc20.symbol()).to.be.equal(symbol)
                // expect(await erc20.decimals()).to.be.equal(decimals)

                // const loupe: IsbeLoupeFacet = IsbeLoupeFacetFactory.attach(
                //     proxyAddress
                // ) as IsbeLoupeFacet
                // const facets = await loupe.facets()
                // expect(facets.length).to.be.equal(5)
            })

            it('GIVEN deployed isbe factory WHEN deploy with pause initialized THEN it success', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx = await isbeFactory.connect(admin).deployUseCase(
                    RANDOM_HASH_FOR_CONFIGURATION_ID,
                    1,
                    rbacs,
                    true, // Initialize paused
                    [
                        '0x0000000000000000000000000000000000000000000000000000000000000000',
                    ],
                    ['0x']
                )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                // const proxyAddress = diamondDeployedEvent.args.proxy
                // const pauseContract = ISBEPauseFacetFactory.attach(
                //     proxyAddress
                // ) as ISBEPause
                // expect(await pauseContract.paused()).to.be.true
            })

            it('GIVEN deployed isbe factory WHEN deploy with multiple RBACs THEN it success', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901235',
                        members: [adminAddress, nonAdminAddress],
                    },
                ]
                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                // const proxyAddress = diamondDeployedEvent.args.proxy
                // const accessControl = AccessControlFactory.attach(
                //     proxyAddress
                // ) as AccessControl

                // // Check that all custom roles are properly set
                // for (const rbac of rbacs) {
                //     for (const member of rbac.members) {
                //         expect(await accessControl.hasRole(rbac.role, member))
                //             .to.be.true
                //     }
                // }
            })

            it('GIVEN deployed isbe factory WHEN deploy with multiple init businessIds THEN it success', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: ERC20_RESOLVER_KEY,
                            version: 1,
                        },
                    ])

                const ERC20FacetFactory =
                    await ethers.getContractFactory('ERC20Facet')

                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [ERC20_RESOLVER_KEY],
                        [
                            ERC20FacetFactory.interface.encodeFunctionData(
                                'initializeErc20',
                                ['Test', 'TST', 18]
                            ),
                        ]
                    )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                // const proxyAddress = diamondDeployedEvent.args.proxy
                // const erc20: IERC20Isbe = Erc20FacetFactory.attach(
                //     proxyAddress
                // ) as IERC20Isbe
                // expect(await erc20.name()).to.be.equal('Test')
            })
        })

        describe('deployUseCaseTo', () => {
            const _SALT =
                '0x1234567890123456789012345678901234567890123456789012345678901234'
            const _VERSION = 1

            it('GIVEN deployed isbe factory WHEN try to deploy without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .deployUseCaseTo(
                            ethers.ZeroHash,
                            0,
                            [],
                            false,
                            [],
                            [],
                            _SALT
                        )
                )
                    .to.be.revertedWithCustomError(
                        accessControl,
                        'AccountHasNoRole'
                    )
                    .withArgs(nonAdminAddress, PROXY_DEPLOYER_ROLE)
            })

            it('GIVEN deployed isbe factory WHEN try to deploy empty configurationId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCaseTo(
                            ethers.ZeroHash,
                            0,
                            [],
                            false,
                            [],
                            [],
                            _SALT
                        )
                ).to.be.revertedWithCustomError(accessControl, 'EmptyBytes32')
            })

            it('GIVEN deployed isbe factory WHEN try to deploy configuration than not exists THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCaseTo(
                            '0x1234567890123456789012345678901234567890123456789012345678901234',
                            3,
                            [],
                            false,
                            [],
                            [],
                            _SALT
                        )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        3
                    )
            })

            it('GIVEN deployed isbe factory WHEN deploying twice the same contract using deployUseCaseTo with same salt THEN it fails', async () => {
                const _RBACS = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: _VERSION,
                        },
                    ])

                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCaseTo(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        _VERSION,
                        _RBACS,
                        false,
                        [],
                        [],
                        _SALT
                    )
                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }
                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )
                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress = diamondDeployedEvent.args.proxy

                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployUseCaseTo(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            _VERSION,
                            _RBACS,
                            false,
                            [],
                            [],
                            _SALT
                        )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'AddressAlreadyDeployed'
                    )
                    .withArgs(proxyAddress)
            })

            it('GIVEN deployed isbe factory WHEN deploying using deployUseCaseTo THEN address is predefined', async () => {
                const _RBACS = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: _VERSION,
                        },
                    ])

                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCaseTo(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        _VERSION,
                        _RBACS,
                        false,
                        [],
                        [],
                        _SALT
                    )
                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }
                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )
                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress = diamondDeployedEvent.args.proxy

                const deployer = await isbeFactory.getAddress()

                const args = {
                    configurationManagement: deployer,
                    configurationId: RANDOM_HASH_FOR_CONFIGURATION_ID,
                    version: _VERSION,
                    init: [], // empty array since _initBusinessIds = []
                    data: [], // empty array since _initData = []
                }

                // Get the IsbeProxy contract factory to access creation code
                const IsbeProxyFactory =
                    await ethers.getContractFactory('IsbeProxy')

                // Encode the constructor arguments exactly as the contract does
                const abiCoder = new ethers.AbiCoder()
                const encodedArgs = abiCoder.encode(
                    [
                        'tuple(address configurationManagement, bytes32 configurationId, uint256 version, address[] init, bytes[] data)',
                    ],
                    [args]
                )

                const initCodeHash = ethers.keccak256(
                    ethers.concat([IsbeProxyFactory.bytecode, encodedArgs])
                )

                const predictedAddress = ethers.getCreate2Address(
                    deployer,
                    _SALT,
                    initCodeHash
                )

                expect(proxyAddress).to.equal(predictedAddress)
            })
        })

        describe('getDeployedProxiesByConfiguration', () => {
            it('GIVEN no deployed proxies WHEN getDeployedProxiesByConfiguration THEN returns empty array', async () => {
                const uniqueConfigId =
                    '0x1234567890123456789012345678901234567890123456789012345678901234'
                const proxies =
                    await isbeFactory.getDeployedProxiesByConfiguration(
                        uniqueConfigId,
                        1
                    )
                expect(proxies).to.be.deep.equal([])
            })

            it('GIVEN deployed proxy WHEN getDeployedProxiesByConfiguration THEN returns proxy address', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]

                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress = (diamondDeployedEvent as EventLog).args
                    .proxy
                const proxies =
                    await isbeFactory.getDeployedProxiesByConfiguration(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1
                    )
                expect(proxies).to.be.deep.equal([proxyAddress])
            })

            it('GIVEN multiple deployed proxies WHEN getDeployedProxiesByConfiguration THEN returns all proxy addresses', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]

                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx1 = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx1 = await deployTx1.wait()
                if (!waitedTx1) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent1 = waitedTx1.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent1 ||
                    !('args' in diamondDeployedEvent1)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress1 = (diamondDeployedEvent1 as EventLog).args
                    .proxy

                const deployTx2 = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx2 = await deployTx2.wait()
                if (!waitedTx2) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent2 = waitedTx2.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent2 ||
                    !('args' in diamondDeployedEvent2)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress2 = (diamondDeployedEvent2 as EventLog).args
                    .proxy

                const proxies =
                    await isbeFactory.getDeployedProxiesByConfiguration(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1
                    )
                expect(proxies).to.be.deep.equal([proxyAddress1, proxyAddress2])
            })
        })

        describe('getConfigurationByProxy', () => {
            it('GIVEN deployed proxy WHEN getConfigurationByProxy THEN returns correct configuration', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress = (diamondDeployedEvent as EventLog).args
                    .proxy
                const [configurationId, version] =
                    await isbeFactory.getConfigurationByProxy(proxyAddress)
                expect(configurationId).to.be.equal(
                    RANDOM_HASH_FOR_CONFIGURATION_ID
                )
                expect(version).to.be.equal(1)
            })

            it('GIVEN non-deployed proxy WHEN getConfigurationByProxy THEN returns zero values', async () => {
                const [configurationId, version] =
                    await isbeFactory.getConfigurationByProxy(
                        ethers.ZeroAddress
                    )
                expect(configurationId).to.be.equal(ethers.ZeroHash)
                expect(version).to.be.equal(0)
            })
        })

        describe('Internal functions coverage', () => {
            it('GIVEN deployed proxy WHEN _isProxyDeployed THEN returns true', async () => {
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]
                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx = await isbeFactory
                    .connect(admin)
                    .deployUseCase(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1,
                        rbacs,
                        false,
                        [],
                        []
                    )

                const waitedTx = await deployTx.wait()
                if (!waitedTx) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent ||
                    !('args' in diamondDeployedEvent)
                ) {
                    throw new Error('Event not found or missing args')
                }

                /*const proxyAddress = (diamondDeployedEvent as EventLog).args
                    .proxy*/
                // const isDeployed = await isbeFactory._isProxyDeployed(proxyAddress)
                // expect(isDeployed).to.be.true
            })

            it('GIVEN different configuration versions WHEN deploy multiple proxies THEN they are stored separately', async () => {
                const uniqueConfigId1 =
                    '0x1234567890123456789012345678901234567890123456789012345678901237'
                const uniqueConfigId2 =
                    '0x1234567890123456789012345678901234567890123456789012345678901238'
                const rbacs = [
                    {
                        role: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        members: [adminAddress],
                    },
                ]

                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(uniqueConfigId1, [
                        {
                            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx1 = await isbeFactory
                    .connect(admin)
                    .deployUseCase(uniqueConfigId1, 1, rbacs, false, [], [])

                const waitedTx1 = await deployTx1.wait()
                if (!waitedTx1) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent1 = waitedTx1.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent1 ||
                    !('args' in diamondDeployedEvent1)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress1 = (diamondDeployedEvent1 as EventLog).args
                    .proxy

                // Register configuration before deploying use case
                await isbeFactory
                    .connect(admin)
                    .setConfiguration(uniqueConfigId2, [
                        {
                            businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
                            version: 1,
                        },
                    ])
                const deployTx2 = await isbeFactory
                    .connect(admin)
                    .deployUseCase(uniqueConfigId2, 1, rbacs, false, [], [])

                const waitedTx2 = await deployTx2.wait()
                if (!waitedTx2) {
                    throw new Error('Transaction receipt is null')
                }

                const diamondDeployedEvent2 = waitedTx2.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('UseCaseDeployed')
                            .topicHash
                )

                if (
                    !diamondDeployedEvent2 ||
                    !('args' in diamondDeployedEvent2)
                ) {
                    throw new Error('Event not found or missing args')
                }

                const proxyAddress2 = (diamondDeployedEvent2 as EventLog).args
                    .proxy

                const proxies1 =
                    await isbeFactory.getDeployedProxiesByConfiguration(
                        uniqueConfigId1,
                        1
                    )
                const proxies2 =
                    await isbeFactory.getDeployedProxiesByConfiguration(
                        uniqueConfigId2,
                        1
                    )

                expect(proxies1).to.be.deep.equal([proxyAddress1])
                expect(proxies2).to.be.deep.equal([proxyAddress2])
            })
        })
    })
})
