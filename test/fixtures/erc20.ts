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
import { ethers } from 'hardhat'
import { Signer, ContractFactory } from 'ethers'
import {
    ERC20SnapshotFacet,
    ERC20BurnableFacet,
    ERC203643CappedFacet,
    ERC203643ControllerFacet,
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
    BasicWhitelistFacet,
    ERC203643TransferSigned,
    ERC203643CappedSigned,
    ERC20BurnableSigned, // Add this import
} from '../../typechain-types'
import {
    OWNABLE_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    ERC20_BURNABLE_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    ERC203643_CONTROLLER_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    BASIC_WHITELIST_RESOLVER_KEY,
    CONFIGURATION_ID_ERC20,
    CONFIGURATION_ID_PROXY_TESTS,
    ERC203643_TRANSFER_SIGNED_RESOLVER_KEY,
    ERC203643_CAPPED_SIGNED_RESOLVER_KEY,
    ERC20_BURNABLE_SIGNED_RESOLVER_KEY,
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
    )[0] as unknown as {
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
    const ERC203643CappedFacetFactory = await ethers.getContractFactory(
        'ERC203643CappedFacet'
    )
    const ERC203643ControllerFacetFactory = await ethers.getContractFactory(
        'ERC203643ControllerFacet'
    )
    const ERC203643TransferSignedFacetFactory = await ethers.getContractFactory(
        'ERC203643TransferSignedFacet'
    )
    // Add the new factory
    const ERC203643CappedSignedFacetFactory = await ethers.getContractFactory(
        'ERC203643CappedSignedFacet'
    )
    const ERC20BurnableSignedFacetFactory = await ethers.getContractFactory(
        'ERC20BurnableSignedFacet'
    )
    const ERC20FacetFactory = await ethers.getContractFactory('ERC20Facet')
    const BasicWhitelistFacetFactory = await ethers.getContractFactory(
        'BasicWhitelistFacet'
    )
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
    const erc203643CappedFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC203643_CAPPED_RESOLVER_KEY,
        ERC203643CappedFacetFactory
    )
    const erc203643ControllerFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC203643_CONTROLLER_RESOLVER_KEY,
        ERC203643ControllerFacetFactory
    )
    const erc203643TransferSignedFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC203643_TRANSFER_SIGNED_RESOLVER_KEY,
        ERC203643TransferSignedFacetFactory
    )
    // Deploy the new facet
    const erc203643CappedSignedFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC203643_CAPPED_SIGNED_RESOLVER_KEY,
        ERC203643CappedSignedFacetFactory
    )
    const erc20BurnableSignedFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_BURNABLE_SIGNED_RESOLVER_KEY,
        ERC20BurnableSignedFacetFactory
    )
    const erc20Facet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ERC20_RESOLVER_KEY,
        ERC20FacetFactory
    )
    const basicWhitelistFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        BASIC_WHITELIST_RESOLVER_KEY,
        BasicWhitelistFacetFactory
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
            businessId: ERC203643_CAPPED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC203643_CONTROLLER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC203643_TRANSFER_SIGNED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC203643_CAPPED_SIGNED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_BURNABLE_SIGNED_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC20_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: BASIC_WHITELIST_RESOLVER_KEY,
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
    const erc203643Capped = ERC203643CappedFacetFactory.attach(
        proxy
    ) as ERC203643CappedFacet
    const erc203643Controller = ERC203643ControllerFacetFactory.attach(
        proxy
    ) as ERC203643ControllerFacet
    const erc203643TransferSigned = ERC203643TransferSignedFacetFactory.attach(
        proxy
    ) as ERC203643TransferSigned
    const erc203643CappedSigned = ERC203643CappedSignedFacetFactory.attach(
        proxy
    ) as ERC203643CappedSigned
    const erc20BurnableSinged = ERC20BurnableSignedFacetFactory.attach(
        proxy
    ) as ERC20BurnableSigned
    const erc20 = ERC20FacetFactory.attach(proxy) as ERC20Facet

    const basicWhitelist = BasicWhitelistFacetFactory.attach(
        proxy
    ) as BasicWhitelistFacet

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
        erc203643Capped,
        erc203643Controller,
        erc203643TransferSigned,
        erc203643CappedSigned,
        erc20BurnableSinged,
        basicWhitelist,
        pause,
        accessControl,
        ownable,
        assetEventTracker,
        hashTimestamp,
        mockTimestamp,
        erc20Facet,
        erc20SnapshotFacet,
        erc20BurnableFacet,
        erc203643CappedFacet,
        erc203643ControllerFacet,
        erc203643TransferSignedFacet,
        erc203643CappedSignedFacet,
        erc20BurnableSignedFacet,
        basicWhitelistFacet,
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
