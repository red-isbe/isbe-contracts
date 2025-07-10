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
    GlobalIsbePauseFacet__factory,
    GlobalIsbePauseFacet,
} from '../../typechain-types'
import { Contract, Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    HASH_TIMESTAMP_ROLE,
    ISBE_PAUSER_ROLE,
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    PROXY_DEPLOYER_ROLE,
} from '../constants'

describe('GlobalIsbePause', function () {
    let admin: Signer
    let adminAddress: string
    let isbe: Signer
    let isbeAddress: string
    let isbePauser: Signer
    let isbePauserAddress: string
    let proxyDeployer: Signer
    let proxyDeployerAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let AccessControlFactory: AccessControlFacet__factory
    let IsbePausableFactory: ISBEPause__factory
    let GlobalIsbePauseFactory: GlobalIsbePauseFacet__factory
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
    let GlobalIsbePauseFacet: GlobalIsbePauseFacet
    let isbeFactory: IIsbeFactory
    let deployedProxyAddress: string
    let pause: Contract

    async function deployInitial() {
        ;[admin, isbe, proxyDeployer, isbePauser, nonAdmin] =
            await ethers.getSigners()
        adminAddress = await admin.getAddress()
        isbeAddress = await isbe.getAddress()
        isbePauserAddress = await isbePauser.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()
        proxyDeployerAddress = await proxyDeployer.getAddress()
        // Despliegue AccessControl logic
        BusinessLogicFactoryFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        ProxyFactoryFacetFactory =
            await ethers.getContractFactory('ProxyFactoryFacet')
        GlobalIsbePauseFactory = await ethers.getContractFactory(
            'GlobalIsbePauseFacet'
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
        proxyFactoryFacet = await ProxyFactoryFacetFactory.deploy()
        GlobalIsbePauseFacet = await GlobalIsbePauseFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        await proxyFactoryFacet.waitForDeployment()
        expect(
            await GlobalIsbePauseFacet.businessIdIntrospection()
        ).to.be.equal(GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY)
        expect(
            await GlobalIsbePauseFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x64dc7c77'])
    }

    async function deployIsbeFactory(initCalldata: string = '0x') {
        const GlobalIsbePauseFacetAddress =
            await GlobalIsbePauseFacet.getAddress()
        const facetAddresses = [
            await businessLogicFactoryFacet.getAddress(),
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
                        members: [isbeAddress],
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
                .connect(isbe)
                .deploy(
                    DIAMOND_CUT_RESOLVER_KEY,
                    DiamondCutFacetFactory.bytecode
                )
            await isbeFactory
                .connect(isbe)
                .deploy(
                    DIAMOND_LOUPE_RESOLVER_KEY,
                    DiamondLoupeFacetFactory.bytecode
                )
            await isbeFactory
                .connect(isbe)
                .deploy(
                    ACCESS_CONTROL_RESOLVER_KEY,
                    AccessControlFactory.bytecode
                )
            await isbeFactory
                .connect(isbe)
                .deploy(PAUSE_RESOLVER_KEY, IsbePausableFactory.bytecode)
            await isbeFactory
                .connect(isbe)
                .deploy(OWNABLE_RESOLVER_KEY, Ownable2StepFacetFactory.bytecode)
            await isbeFactory
                .connect(isbe)
                .deploy(
                    HASH_TIMESTAMP_RESOLVER_KEY,
                    HashTimestampFactory.bytecode
                )
            await isbeFactory
                .connect(isbe)
                .deploy(
                    ASSET_EVENT_TRACKER_RESOLVER_KEY,
                    AssetEventTrackerFactory.bytecode
                )
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
                    isbeFactory.interface.getEvent('DiamondDeployed').topicHash
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
                        GlobalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(adminAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory.connect(isbe).pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        GlobalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(isbeAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        GlobalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(proxyDeployerAddress, ISBE_PAUSER_ROLE)
            })
            it('GIVEN governance proxy WHEN try to unpause without right THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        GlobalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(adminAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory.connect(isbe).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        GlobalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(isbeAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory
                        .connect(proxyDeployer)
                        .unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        GlobalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(proxyDeployerAddress, ISBE_PAUSER_ROLE)
                await expect(
                    isbeFactory.connect(nonAdmin).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        GlobalIsbePauseFacet,
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
                    GlobalIsbePauseFacet,
                    'AddressZero'
                )
            })
            it('GIVEN governance proxy WHEN try to unpause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .unpauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    GlobalIsbePauseFacet,
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
                        GlobalIsbePauseFacet,
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
                        GlobalIsbePauseFacet,
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
                    .withArgs(deployedProxyAddress)
                expect(await pause.paused()).to.be.true
            })
            it('GIVEN governance proxy WHEN try to unpause a deployed proxy THEN it is unpaused', async () => {
                await expect(
                    isbeFactory
                        .connect(isbePauser)
                        .unpauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbeUnpaused')
                    .withArgs(deployedProxyAddress)
                expect(await pause.paused()).to.be.false
            })
        })
    })
})
