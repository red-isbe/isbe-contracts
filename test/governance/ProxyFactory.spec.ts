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
    HashTimestampFacet__factory,
    AssetEventTrackerTestWrapper__factory,
    Ownable2StepFacet__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondLoupeFacet__factory,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    COUNTER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    HASH_TIMESTAMP_ROLE,
    ISBE_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    PROXY_DEPLOYER_ROLE,
    PROXY_FACTORY_RESOLVER_KEY,
} from '../constants'

describe('ProxyFactory', function () {
    let admin: Signer
    let adminAddress: string
    let isbe: Signer
    let isbeAddress: string
    let businessLogicDeployer: Signer
    let businessLogicDeployerAddress: string
    let proxyDeployer: Signer
    let proxyDeployerAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let AccessControlFactory: AccessControlFacet__factory
    let IsbePausableFactory: ISBEPause__factory
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
    let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
    let DiamondCutFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let HashTimestampFactory: HashTimestampFacet__factory
    let AssetEventTrackerFactory: AssetEventTrackerTestWrapper__factory
    let Ownable2StepFacetFactory: Ownable2StepFacet__factory
    let diamondProxy: EIP2535AccessControl
    let businessLogicFactoryFacet: BusinessLogicFactoryFacet
    let proxyFactoryFacet: ProxyFactoryFacet
    let isbeFactory: IIsbeFactory

    async function deployInitial() {
        ;[admin, isbe, businessLogicDeployer, proxyDeployer, nonAdmin] =
            await ethers.getSigners()
        adminAddress = await admin.getAddress()
        isbeAddress = await isbe.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()
        proxyDeployerAddress = await proxyDeployer.getAddress()
        businessLogicDeployerAddress = await businessLogicDeployer.getAddress()
        // Despliegue AccessControl logic
        BusinessLogicFactoryFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        ProxyFactoryFacetFactory =
            await ethers.getContractFactory('ProxyFactoryFacet')
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
        proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        await proxyFactoryFacet.waitForDeployment()
        expect(await proxyFactoryFacet.businessIdIntrospection()).to.be.equal(
            PROXY_FACTORY_RESOLVER_KEY
        )
        expect(
            await proxyFactoryFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0xadc233cb'])
    }

    async function deployIsbeFactory(initCalldata: string = '0x') {
        const proxyFactoryAddress = await proxyFactoryFacet.getAddress()
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

        describe('Diamond proxy', () => {
            it('GIVEN deployed isbe factory WHEN try to deploy without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .deployDiamond(
                            [ethers.ZeroHash],
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
                await expect(
                    isbeFactory
                        .connect(isbe)
                        .deployDiamond(
                            [ethers.ZeroHash],
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(isbeAddress, PROXY_DEPLOYER_ROLE)
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .deployDiamond(
                            [ethers.ZeroHash],
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(nonAdminAddress, PROXY_DEPLOYER_ROLE)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy empty businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond([], [], ethers.ZeroHash, '0x')
                ).to.be.revertedWithCustomError(
                    proxyFactoryFacet,
                    'NotEmptyBusinessIds'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to deploy Zero businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [ethers.ZeroHash],
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                ).to.be.revertedWithCustomError(
                    proxyFactoryFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to deploy with a governance businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [PAUSE_RESOLVER_KEY],
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(PAUSE_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy non existent businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [COUNTER_RESOLVER_KEY],
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'CurrentIdNotRegistered'
                    )
                    .withArgs(COUNTER_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy with duplicated businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [
                                HASH_TIMESTAMP_RESOLVER_KEY,
                                HASH_TIMESTAMP_RESOLVER_KEY,
                            ],
                            [],
                            ethers.ZeroHash,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'DuplicatedBusinessId'
                    )
                    .withArgs(HASH_TIMESTAMP_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy with non valid init businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [
                                HASH_TIMESTAMP_RESOLVER_KEY,
                                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                            ],
                            [],
                            COUNTER_RESOLVER_KEY,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'InitializationFacetNotFound'
                    )
                    .withArgs(COUNTER_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to deploy using governance init businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [
                                HASH_TIMESTAMP_RESOLVER_KEY,
                                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                            ],
                            [],
                            PAUSE_RESOLVER_KEY,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'InitializationFacetNotFound'
                    )
                    .withArgs(PAUSE_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [
                                HASH_TIMESTAMP_RESOLVER_KEY,
                                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                            ],
                            [],
                            ACCESS_CONTROL_RESOLVER_KEY,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'InitializationFacetNotFound'
                    )
                    .withArgs(ACCESS_CONTROL_RESOLVER_KEY)
            })

            it('GIVEN deployed isbe factory WHEN try to deploy with non valid init businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .deployDiamond(
                            [ASSET_EVENT_TRACKER_RESOLVER_KEY],
                            [],
                            COUNTER_RESOLVER_KEY,
                            '0x'
                        )
                )
                    .to.be.revertedWithCustomError(
                        proxyFactoryFacet,
                        'InitializationFacetNotFound'
                    )
                    .withArgs(COUNTER_RESOLVER_KEY)
            })

            it('GIVEN deployed isbe factory WHEN try to deploy with governance roles THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(proxyDeployer).deployDiamond(
                        [
                            HASH_TIMESTAMP_RESOLVER_KEY,
                            ASSET_EVENT_TRACKER_RESOLVER_KEY,
                            OWNABLE_RESOLVER_KEY,
                        ],
                        [
                            {
                                role: DEFAULT_ADMIN_ROLE,
                                members: [adminAddress],
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
                    isbeFactory.connect(proxyDeployer).deployDiamond(
                        [OWNABLE_RESOLVER_KEY],
                        [
                            {
                                role: ISBE_ROLE,
                                members: [isbeAddress],
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
            })

            it('GIVEN deployed isbe factory WHEN try to deploy with bad calldata THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(proxyDeployer).deployDiamond(
                        [HASH_TIMESTAMP_RESOLVER_KEY],
                        [
                            {
                                role: HASH_TIMESTAMP_ROLE,
                                members: [nonAdminAddress],
                            },
                        ],
                        HASH_TIMESTAMP_RESOLVER_KEY,
                        '0x02030456'
                    )
                ).to.be.revertedWithCustomError(
                    proxyFactoryFacet,
                    'InitializationFunctionReverted'
                )
            })

            it('GIVEN deployed isbe factory WHEN deploy with correct initialization THEN it success', async () => {
                const businessIds = [
                    HASH_TIMESTAMP_RESOLVER_KEY,
                    ASSET_EVENT_TRACKER_RESOLVER_KEY,
                    OWNABLE_RESOLVER_KEY,
                ]
                const rbacs = [
                    {
                        role: HASH_TIMESTAMP_ROLE,
                        members: [nonAdminAddress],
                    },
                ]
                const deployTx = await isbeFactory
                    .connect(proxyDeployer)
                    .deployDiamond(businessIds, rbacs, ethers.ZeroHash, '0x')
                const waitedTx = await deployTx.wait()

                const diamondDeployedEvent = waitedTx.logs.find(
                    (l) =>
                        l.topics[0] ==
                        isbeFactory.interface.getEvent('DiamondDeployed')
                            .topicHash
                )
                const proxyAddress = diamondDeployedEvent.args.proxy
                expect(deployTx)
                    .to.emit(isbeFactory, 'Deployed')
                    .withArgs(businessIds, rbacs, proxyAddress)
                const accessControl = AccessControlFactory.attach(proxyAddress)
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
                        HASH_TIMESTAMP_ROLE,
                        nonAdminAddress
                    )
                ).to.be.true
                expect(await IsbePausableFactory.attach(proxyAddress).paused())
                    .to.be.false
                expect(
                    await isbeFactory.getDeployedProxiesByBusinessId(
                        HASH_TIMESTAMP_RESOLVER_KEY
                    )
                ).to.be.deep.equal([proxyAddress])
                expect(
                    await isbeFactory.getDeployedProxiesByBusinessId(
                        ASSET_EVENT_TRACKER_RESOLVER_KEY
                    )
                ).to.be.deep.equal([proxyAddress])
                expect(
                    await isbeFactory.getDeployedProxiesByBusinessId(
                        OWNABLE_RESOLVER_KEY
                    )
                ).to.be.deep.equal([proxyAddress])
                expect(
                    await isbeFactory.getBusinessIdsByProxy(proxyAddress)
                ).to.be.deep.equal([
                    HASH_TIMESTAMP_RESOLVER_KEY,
                    ASSET_EVENT_TRACKER_RESOLVER_KEY,
                    OWNABLE_RESOLVER_KEY,
                ])
            })
        })
    })
})
