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
    IsbeCutFacet__factory,
    IsbeLoupeFacet__factory,
    GlobalIsbePauseFacet__factory,
    GlobalIsbePauseFacet,
    ConfigurationManagementFacet__factory,
    ConfigurationManagementFacet,
} from '../../typechain-types'
import { Contract, Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    HASH_TIMESTAMP_ROLE,
    ISBE_PAUSER_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    PROXY_DEPLOYER_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    RANDOM_HASH_FOR_CONFIGURATION_ID,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
} from '../constants'

describe('GlobalIsbePause', function () {
    let admin: Signer
    let adminAddress: string
    let isbe: Signer
    let isbeAddress: string
    let isbePauser: Signer
    let isbePauserAddress: string
    let businessLogicDeployer: Signer
    let businessLogicDeployerAddress: string
    let configurationManager: Signer
    let configurationManagerAddress: string
    let proxyDeployer: Signer
    let proxyDeployerAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let AccessControlFacetFactory: AccessControlFacet__factory
    let IsbePausableFactory: ISBEPause__factory
    let GlobalIsbePauseFactory: GlobalIsbePauseFacet__factory
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFacetFactory: BusinessLogicFactoryFacet__factory
    let ConfigurationManagementFacetFactory: ConfigurationManagementFacet__factory
    let ProxyFactoryFacetFactory: ProxyFactoryFacet__factory
    let IsbeCutFacetFactory: IsbeCutFacet__factory
    let IsbeLoupeFacetFactory: IsbeLoupeFacet__factory
    let HashTimestampFactory: HashTimestampFacet__factory
    let AssetEventTrackerFactory: AssetEventTrackerTestWrapper__factory
    let Ownable2StepFacetFactory: Ownable2StepFacet__factory
    let diamondProxy: EIP2535AccessControl
    let businessLogicFactoryFacet: BusinessLogicFactoryFacet
    let configurationManagementFacet: ConfigurationManagementFacet
    let proxyFactoryFacet: ProxyFactoryFacet
    let globalIsbePauseFacet: GlobalIsbePauseFacet
    let isbeFactory: IIsbeFactory
    let deployedProxyAddress: string
    let pause: Contract

    async function deployInitial() {
        ;[
            admin,
            isbe,
            proxyDeployer,
            configurationManager,
            businessLogicDeployer,
            isbePauser,
            nonAdmin,
        ] = await ethers.getSigners()
        adminAddress = await admin.getAddress()
        isbeAddress = await isbe.getAddress()
        isbePauserAddress = await isbePauser.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()
        proxyDeployerAddress = await proxyDeployer.getAddress()
        businessLogicDeployerAddress = await businessLogicDeployer.getAddress()
        configurationManagerAddress = await configurationManager.getAddress()
        // Despliegue AccessControl logic
        BusinessLogicFacetFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        ConfigurationManagementFacetFactory = await ethers.getContractFactory(
            'ConfigurationManagementFacet'
        )
        ProxyFactoryFacetFactory =
            await ethers.getContractFactory('ProxyFactoryFacet')
        GlobalIsbePauseFactory = await ethers.getContractFactory(
            'GlobalIsbePauseFacet'
        )
        IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
        IsbeLoupeFacetFactory =
            await ethers.getContractFactory('IsbeLoupeFacet')
        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        AccessControlFacetFactory =
            await ethers.getContractFactory('AccessControlFacet')
        IsbePausableFactory = await ethers.getContractFactory('ISBEPauseFacet')
        HashTimestampFactory =
            await ethers.getContractFactory('HashTimestampFacet')
        AssetEventTrackerFactory = await ethers.getContractFactory(
            'AssetEventTrackerTestWrapper'
        )
        Ownable2StepFacetFactory =
            await ethers.getContractFactory('Ownable2StepFacet')
        businessLogicFactoryFacet = await BusinessLogicFacetFactory.deploy()
        configurationManagementFacet =
            await ConfigurationManagementFacetFactory.deploy()
        proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
        globalIsbePauseFacet = await GlobalIsbePauseFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        await proxyFactoryFacet.waitForDeployment()
        expect(
            await globalIsbePauseFacet.businessIdIntrospection()
        ).to.be.equal(GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY)
        expect(
            await globalIsbePauseFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x64dc7c77'])
    }

    async function deployIsbeFactory(initCalldata: string = '0x') {
        const GlobalIsbePauseFacetAddress =
            await globalIsbePauseFacet.getAddress()
        const facetAddresses = [
            await businessLogicFactoryFacet.getAddress(),
            await configurationManagementFacet.getAddress(),
            await proxyFactoryFacet.getAddress(),
            GlobalIsbePauseFacetAddress,
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
                    {
                        role: ISBE_PAUSER_ROLE,
                        members: [isbePauserAddress],
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

    describe('GlboalIsbePauable', () => {
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
                    AccessControlFacetFactory.bytecode
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
            const businessIds = [
                {
                    businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                    version: 0,
                },
                {
                    businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
                    version: 0,
                },
                {
                    businessId: OWNABLE_RESOLVER_KEY,
                    version: 0,
                },
            ]
            await isbeFactory
                .connect(configurationManager)
                .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, businessIds)
            const rbacs = [
                {
                    role: HASH_TIMESTAMP_ROLE,
                    members: [nonAdminAddress],
                },
            ]

            const deployTx = await isbeFactory
                .connect(proxyDeployer)
                .deployUseCase(
                    RANDOM_HASH_FOR_CONFIGURATION_ID,
                    0,
                    rbacs,
                    ethers.ZeroHash,
                    '0x'
                )
            const waitedTx = await deployTx.wait()
            const diamondDeployedEvent = waitedTx.logs.find(
                (l) =>
                    l.topics[0] ==
                    isbeFactory.interface.getEvent('UseCaseDeployed').topicHash
            )
            expect(deployTx).to.emit(isbeFactory, 'DiamondDeployed')
            deployedProxyAddress = diamondDeployedEvent.args.proxy
            pause = await ethers.getContractAt('IPause', deployedProxyAddress)
        })

        describe('Global ISBE pausable', () => {
            it('GIVEN governance proxy WHEN try to pause without right THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(adminAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory.connect(isbe).pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(isbeAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(proxyDeployerAddress, ISBE_PAUSER_ROLE)
            })
            it('GIVEN governance proxy WHEN try to unpause without right THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(adminAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory.connect(isbe).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(isbeAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(proxyDeployerAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory.connect(nonAdmin).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(nonAdminAddress, ISBE_PAUSER_ROLE)
            })

            it('GIVEN governance proxy WHEN try to pause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .pauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })
            it('GIVEN governance proxy WHEN try to unpause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .unpauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })

            it('GIVEN governance proxy WHEN try to pause a non deployed proxy THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .pauseIsbe(await isbeFactory.getAddress())
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(await isbeFactory.getAddress())
            })
            it('GIVEN governance proxy WHEN try to unpause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .unpauseIsbe(await isbeFactory.getAddress())
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(await isbeFactory.getAddress())
            })
            // new
            it('GIVEN governance proxy WHEN try to pause a deployed proxy THEN it is paused', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .pauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbePaused')
                    .withArgs(deployedProxyAddress, isbePauserAddress)
                expect(await pause.paused()).to.be.true
            })
            it('GIVEN governance proxy WHEN try to unpause a deployed proxy THEN it is unpaused', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .unpauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbeUnpaused')
                    .withArgs(deployedProxyAddress, isbePauserAddress)
                expect(await pause.paused()).to.be.false
            })
        })
    })
})
