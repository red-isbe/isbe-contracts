import { ethers } from 'hardhat'
import { Signer, ContractFactory } from 'ethers'
import {
    AccessControlFacet,
    ISBEPauseFacet,
    ISBEPauseFacet__factory,
    MockTimestampFacet,
    IIsbeFactory,
    IPublicResolver,
    IPublicResolver__factory,
} from '../../typechain-types'
import {
    ENS_RESOLVER_RESOLVER_KEY,
    ENS_NAME_RESOLVER_RESOLVER_KEY,
    ENS_TEXT_RESOLVER_RESOLVER_KEY,
    ENS_PUBKEY_RESOLVER_RESOLVER_KEY,
    ACCESS_CONTROL_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    CONFIGURATION_ID_ENS_PUBLIC_RESOLVER,
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

export async function deployEnsPublicResolverUseCaseFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    owner: Signer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[]
) {
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const MockTimestampFacetFactory =
        await ethers.getContractFactory('MockTimestampFacet')

    // ENS Resolver Facets
    const EnsResolverFacetFactory =
        await ethers.getContractFactory('EnsResolverFacet')
    const NameResolverFacetFactory =
        await ethers.getContractFactory('NameResolverFacet')
    const TextResolverFacetFactory =
        await ethers.getContractFactory('TextResolverFacet')
    const PubkeyResolverFacetFactory = await ethers.getContractFactory(
        'PubkeyResolverFacet'
    )

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
    const pauseFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )

    // Deploy ENS Resolver facets
    const ensResolverFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ENS_RESOLVER_RESOLVER_KEY,
        EnsResolverFacetFactory
    )
    const nameResolverFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ENS_NAME_RESOLVER_RESOLVER_KEY,
        NameResolverFacetFactory
    )
    const textResolverFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ENS_TEXT_RESOLVER_RESOLVER_KEY,
        TextResolverFacetFactory
    )
    const pubkeyResolverFacet = await deployBusinessLogicFromFactory(
        isbeFactory,
        ENS_PUBKEY_RESOLVER_RESOLVER_KEY,
        PubkeyResolverFacetFactory
    )

    // Deploy MockTimestamp for testing
    await deployBusinessLogicFromFactory(
        isbeFactory,
        MOCK_TIMESTAMP_RESOLVER_KEY,
        MockTimestampFacetFactory
    )

    await isbeFactory.setConfiguration(CONFIGURATION_ID_ENS_PUBLIC_RESOLVER, [
        {
            businessId: MOCK_TIMESTAMP_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ENS_RESOLVER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ENS_NAME_RESOLVER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ENS_TEXT_RESOLVER_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ENS_PUBKEY_RESOLVER_RESOLVER_KEY,
            version: 1,
        },
    ])

    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_ENS_PUBLIC_RESOLVER,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet
    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet
    const mockTimestamp = MockTimestampFacetFactory.attach(
        proxy
    ) as MockTimestampFacet

    // Attach ENS Resolver facets
    const ensResolver = EnsResolverFacetFactory.attach(proxy)
    const nameResolver = NameResolverFacetFactory.attach(proxy)
    const textResolver = TextResolverFacetFactory.attach(proxy)
    const pubkeyResolver = PubkeyResolverFacetFactory.attach(proxy)

    // Connect the IPublicResolver interface to the proxy
    const publicResolver: IPublicResolver = IPublicResolver__factory.connect(
        proxy,
        owner
    ) as IPublicResolver

    return {
        pause,
        accessControl,
        mockTimestamp,
        pauseFacet,
        accessControlFacet,
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
        ensResolverFacet,
        ensResolver,
        nameResolverFacet,
        nameResolver,
        textResolverFacet,
        textResolver,
        pubkeyResolverFacet,
        pubkeyResolver,
        publicResolver,
    }
}
