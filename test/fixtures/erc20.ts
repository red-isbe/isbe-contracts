import { ethers } from 'hardhat'
import { Signer, ContractFactory } from 'ethers'
import {
    ERC20SnapshotFacet,
    ERC20BurnableFacet,
    ERC20CappedFacet,
    ERC20ControllerFacet,
    ERC20Facet,
    AssetEventTrackerTestWrapper,
    HashTimestampTestWrapper,
    MockTimestampFacet,
    OwnableFacet,
    Ownable2StepFacet,
    AccessControlFacet,
    ISBEPauseFacet,
    ISBEPauseFacet__factory,
    IDidRegistry,
    IDidRegistry__factory,
    IIsbeFactory,
    AccessControlDidFacet,
} from '../../typechain-types'
import {
    OWNABLE_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    ERC20_BURNABLE_RESOLVER_KEY,
    ERC20_CAPPED_RESOLVER_KEY,
    ERC20_CONTROLLER_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    CONFIGURATION_ID_ERC20,
    CONFIGURATION_ID_PROXY_TESTS,
} from '../../utils/constants'
import { getEvent } from '../../scripts/utils/getEvent'

async function deployBusinessLogicFromFactory(
    isbeFactory: IIsbeFactory,
    resolverKey: string,
    contractFactory: ContractFactory
) {
    const deployTx = await (
        await isbeFactory.deploy(resolverKey, contractFactory.bytecode)
    ).wait()
    if (!deployTx) {
        throw new Error('Deployment transaction failed')
    }

    const businessAddress = deployTx.logs.filter(
        (log) =>
            log.topics[0] ===
            '0xe50cdcfd1b693a28ae23bc9a7b0614b649a9caaa7164a4aa2e8161ab6c8cd7a4'
    )[0] as {
        args: {
            businessAddress: string
        }
    }
    return contractFactory.attach(businessAddress.args.businessAddress)
}

export async function deployERC20UseCasesFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[],
    isOwnable: boolean = false
) {
    const HashTimestampTestWrapperFactory = await ethers.getContractFactory(
        'HashTimestampTestWrapper'
    )
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidFacet'
    )
    const Ownable2StepFacetFactory =
        await ethers.getContractFactory('Ownable2StepFacet')
    const OwnableFacetFactory = await ethers.getContractFactory('OwnableFacet')
    const ERC20SnapshotFacetFactory =
        await ethers.getContractFactory('ERC20SnapshotFacet')
    const ERC20BurnableFacetFactory =
        await ethers.getContractFactory('ERC20BurnableFacet')
    const ERC20CappedFacetFactory =
        await ethers.getContractFactory('ERC20CappedFacet')
    const ERC20ControllerFacetFactory = await ethers.getContractFactory(
        'ERC20ControllerFacet'
    )
    const ERC20FacetFactory = await ethers.getContractFactory('ERC20Facet')
    const AssetEventTrackerTestWrapperFactory = await ethers.getContractFactory(
        'AssetEventTrackerTestWrapper'
    )
    const MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')

    const isbeCutFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ISBE_CUT_RESOLVER_KEY,
        IsbeCutFacetFactory
    )
    const isbeLoupeFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ISBE_LOUPE_RESOLVER_KEY,
        IsbeLoupeFacetFactory
    )

    const accessControlFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_RESOLVER_KEY,
        AccessControlFacetFactory
    )
    await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_DID_RESOLVER_KEY,
        AccessControlDidFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )

    const ownableFactory = isOwnable
        ? OwnableFacetFactory
        : Ownable2StepFacetFactory

    const ownableFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        OWNABLE_RESOLVER_KEY,
        ownableFactory
    )

    const erc20SnapshotFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_SNAPSHOT_RESOLVER_KEY,
        ERC20SnapshotFacetFactory
    )
    const erc20BurnableFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_BURNABLE_RESOLVER_KEY,
        ERC20BurnableFacetFactory
    )
    const erc20CappedFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_CAPPED_RESOLVER_KEY,
        ERC20CappedFacetFactory
    )
    const erc20ControllerFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_CONTROLLER_RESOLVER_KEY,
        ERC20ControllerFacetFactory
    )
    const erc20Facet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_RESOLVER_KEY,
        ERC20FacetFactory
    )
    const assetEventTrackerFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ASSET_EVENT_TRACKER_RESOLVER_KEY,
        AssetEventTrackerTestWrapperFactory
    )
    const hashTimestampFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        HASH_TIMESTAMP_RESOLVER_KEY,
        HashTimestampTestWrapperFactory
    )
    await deployBusinessLogicFromFactory(
        isbeFactory,
        MOCK_TIMESTAMP_RESOLVER_KEY,
        MockTimestampFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_ERC20, [
        {
            businessId: OWNABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_SNAPSHOT_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_BURNABLE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_CAPPED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_CONTROLLER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: MOCK_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_ERC20,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const erc20Snapshot = ERC20SnapshotFacetFactory.attach(
        proxy
    ) as ERC20SnapshotFacet
    const erc20Burnable = ERC20BurnableFacetFactory.attach(
        proxy
    ) as ERC20BurnableFacet
    const erc20Capped = ERC20CappedFacetFactory.attach(
        proxy
    ) as ERC20CappedFacet
    const erc20Controller = ERC20ControllerFacetFactory.attach(
        proxy
    ) as ERC20ControllerFacet
    const erc20 = ERC20FacetFactory.attach(proxy) as ERC20Facet

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet

    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet

    const ownable = isOwnable
        ? (OwnableFacetFactory.attach(proxy) as OwnableFacet)
        : (Ownable2StepFacetFactory.attach(proxy) as Ownable2StepFacet)

    const assetEventTracker = AssetEventTrackerTestWrapperFactory.attach(
        proxy
    ) as AssetEventTrackerTestWrapper

    const hashTimestamp = HashTimestampTestWrapperFactory.attach(
        proxy
    ) as HashTimestampTestWrapper

    const mockTimestamp = MockTimestampFacetFactory.attach(
        proxy
    ) as MockTimestampFacet
    const didRegistry: IDidRegistry = IDidRegistry__factory.connect(proxy)

    return {
        erc20,
        erc20Snapshot,
        erc20Burnable,
        erc20Capped,
        erc20Controller,
        pause,
        accessControl,
        ownable,
        assetEventTracker,
        hashTimestamp,
        mockTimestamp,
        erc20Facet,
        erc20SnapshotFacet,
        erc20BurnableFacet,
        erc20CappedFacet,
        erc20ControllerFacet,
        pauseFacet,
        accessControlFacet,
        ownableFacet,
        assetEventTrackerFacet,
        hashTimestampFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
        didRegistry,
    }
}

export async function deployProxyTestsUseCaseFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    owner: Signer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[]
) {
    // Minimal set of factories for proxy testing
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidFacet'
    )
    const ERC20FacetFactory = await ethers.getContractFactory('ERC20Facet')
    const HashTimestampTestWrapperFactory = await ethers.getContractFactory(
        'HashTimestampTestWrapper'
    )
    const AssetEventTrackerTestWrapperFactory = await ethers.getContractFactory(
        'AssetEventTrackerTestWrapper'
    )

    // Deploy minimal business logic contracts
    const isbeCutFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ISBE_CUT_RESOLVER_KEY,
        IsbeCutFacetFactory
    )
    const isbeLoupeFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ISBE_LOUPE_RESOLVER_KEY,
        IsbeLoupeFacetFactory
    )
    const accessControlFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_RESOLVER_KEY,
        AccessControlFacetFactory
    )
    const accessControlDidFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ACCESS_CONTROL_DID_RESOLVER_KEY,
        AccessControlDidFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )
    const erc20Facet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_RESOLVER_KEY,
        ERC20FacetFactory
    )
    const assetEventTrackerFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ASSET_EVENT_TRACKER_RESOLVER_KEY,
        AssetEventTrackerTestWrapperFactory
    )
    const hashTimestampFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        HASH_TIMESTAMP_RESOLVER_KEY,
        HashTimestampTestWrapperFactory
    )

    // Set minimal configuration for proxy tests
    await isbeFactory.setConfiguration(CONFIGURATION_ID_PROXY_TESTS, [
        {
            businessId: ERC20_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: HASH_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_PROXY_TESTS,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    // Attach minimal contracts to proxy
    const erc20 = ERC20FacetFactory.attach(proxy) as ERC20Facet
    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet
    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet
    const accessControlDid = AccessControlDidFacetFactory.attach(
        proxy
    ) as AccessControlDidFacet
    const assetEventTracker = AssetEventTrackerTestWrapperFactory.attach(
        proxy
    ) as AssetEventTrackerTestWrapper
    const hashTimestamp = HashTimestampTestWrapperFactory.attach(
        proxy
    ) as HashTimestampTestWrapper

    return {
        erc20,
        pause,
        accessControl,
        accessControlDid,
        assetEventTracker,
        hashTimestamp,
        erc20Facet,
        pauseFacet,
        accessControlFacet,
        accessControlDidFacet,
        assetEventTrackerFacet,
        hashTimestampFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
    }
}
