import { ethers } from 'hardhat'
import { Signer, ContractFactory, Log } from 'ethers'
import {
    ERC20Facet,
    AccessControlFacet,
    ISBEPauseFacet,
    ERC3643MetadataFacet,
    ERC3643FreezeFacet,
    ERC3643RecoveryFacet,
    ERC203643CappedFacet,
    ERC203643ControllerFacet,
    ERC3643ComplianceFacet,
    ERC3643ComplianceMaxBalanceFacet,
    ERC3643ComplianceDMLimFacet,
    IIsbeFactory,
    ISBEPauseFacet__factory,
    AccessControlDidFacet,
} from '../../typechain-types'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    ERC3643_METADATA_RESOLVER_KEY,
    ERC3643_FREEZE_RESOLVER_KEY,
    ERC3643_RECOVERY_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    ERC203643_CONTROLLER_RESOLVER_KEY,
    ERC3643_COMPLIANCE_RESOLVER_KEY,
    ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
    ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
    ERC3643_COMPLIANCE_BURN_TEST_WRAPPER_RESOLVER_KEY,
    CONFIGURATION_ID_ERC3643,
    CONFIGURATION_ID_PROXY_TESTS,
} from '../../utils/constants'
import { deployGovernance as deployGovernanceBase } from './governance'
import { getEvent } from '../../scripts/utils/getEvent'

export { CONFIGURATION_ID_ERC3643 }

/**
 * Deploy ERC3643 governance with all facets
 */
export async function deployGovernance(
    owner: Signer,
    rbacsUseCase: Array<{
        role: string
        members: Array<string | Signer>
    }> = [],
    configurationId: string = CONFIGURATION_ID_ERC3643,
    init_pause: boolean = false,
    initCalldata: string = '0x',
    init_BusinessId_UseCase: string[] = [],
    init_CallData_UseCase: string[] = [],
    isUseCaseOwnable: boolean = false
) {
    return deployGovernanceBase(
        owner,
        rbacsUseCase,
        configurationId,
        init_pause,
        initCalldata,
        init_BusinessId_UseCase,
        init_CallData_UseCase,
        isUseCaseOwnable
    )
}

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
        (log: unknown) =>
            (log as Log).topics[0] ===
            '0xe50cdcfd1b693a28ae23bc9a7b0614b649a9caaa7164a4aa2e8161ab6c8cd7a4'
    )[0] as unknown as {
        args: {
            businessAddress: string
        }
    }
    return contractFactory.attach(businessAddress.args.businessAddress)
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
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidFacet'
    )
    const ERC20FacetFactory = await ethers.getContractFactory('ERC20Facet')

    // Deploy minimal business logic contracts
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

    // Set minimal configuration for proxy tests
    await isbeFactory.setConfiguration(CONFIGURATION_ID_PROXY_TESTS, [
        {
            businessId: ERC20_RESOLVER_KEY,
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

    return {
        erc20,
        pause,
        accessControl,
        accessControlDid,
        erc20Facet,
        pauseFacet,
        accessControlFacet,
        accessControlDidFacet,
    }
}

/**
 * Deploy ERC3643 use case with all facets for testing
 * This follows the same pattern as deployERC20UseCasesFacets
 */
export async function deployERC3643UseCasesFacets(
    isbeFactory: IIsbeFactory,
    ISBEPauseFacetFactory: ISBEPauseFacet__factory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[]
) {
    // Factory instances
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')
    const AccessControlDidFacetFactory = await ethers.getContractFactory(
        'AccessControlDidFacet'
    )
    const ERC20FacetFactory = await ethers.getContractFactory('ERC20Facet')
    const ERC3643MetadataFacetFactory = await ethers.getContractFactory(
        'ERC3643MetadataFacet'
    )
    const ERC3643FreezeFacetFactory =
        await ethers.getContractFactory('ERC3643FreezeFacet')
    const ERC3643RecoveryFacetFactory = await ethers.getContractFactory(
        'ERC3643RecoveryFacet'
    )
    const ERC203643CappedFacetFactory = await ethers.getContractFactory(
        'ERC203643CappedFacet'
    )
    const ERC203643ControllerFacetFactory = await ethers.getContractFactory(
        'ERC203643ControllerFacet'
    )
    const ERC3643ComplianceFacetFactory = await ethers.getContractFactory(
        'ERC3643ComplianceFacet'
    )
    const ERC3643ComplianceMaxBalanceFacetFactory =
        await ethers.getContractFactory('ERC3643ComplianceMaxBalanceFacet')
    const ERC3643ComplianceDMLimFacetFactory = await ethers.getContractFactory(
        'ERC3643ComplianceDMLimFacet'
    )
    const ERC3643ComplianceBurnTestWrapperFacetFactory =
        await ethers.getContractFactory('ERC3643ComplianceBurnTestWrapperFacet')

    // Helper function to deploy business logic from factory
    async function deployBusinessLogicFromFactoryLocal(
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
            (log: unknown) =>
                (log as Log).topics[0] ===
                '0xe50cdcfd1b693a28ae23bc9a7b0614b649a9caaa7164a4aa2e8161ab6c8cd7a4'
        )[0] as unknown as {
            args: {
                businessAddress: string
            }
        }
        return contractFactory.attach(businessAddress.args.businessAddress)
    }

    // Deploy all business logics
    await deployBusinessLogicFromFactoryLocal(
        ISBE_CUT_RESOLVER_KEY,
        IsbeCutFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ISBE_LOUPE_RESOLVER_KEY,
        IsbeLoupeFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ACCESS_CONTROL_RESOLVER_KEY,
        AccessControlFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ACCESS_CONTROL_DID_RESOLVER_KEY,
        AccessControlDidFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC20_RESOLVER_KEY,
        ERC20FacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_METADATA_RESOLVER_KEY,
        ERC3643MetadataFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_FREEZE_RESOLVER_KEY,
        ERC3643FreezeFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_RECOVERY_RESOLVER_KEY,
        ERC3643RecoveryFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC203643_CAPPED_RESOLVER_KEY,
        ERC203643CappedFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC203643_CONTROLLER_RESOLVER_KEY,
        ERC203643ControllerFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_COMPLIANCE_RESOLVER_KEY,
        ERC3643ComplianceFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
        ERC3643ComplianceMaxBalanceFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
        ERC3643ComplianceDMLimFacetFactory
    )
    await deployBusinessLogicFromFactoryLocal(
        ERC3643_COMPLIANCE_BURN_TEST_WRAPPER_RESOLVER_KEY,
        ERC3643ComplianceBurnTestWrapperFacetFactory
    )

    // Set configuration for ERC3643
    await isbeFactory.setConfiguration(CONFIGURATION_ID_ERC3643, [
        { businessId: ERC20_RESOLVER_KEY, version: 1 },
        { businessId: ERC3643_METADATA_RESOLVER_KEY, version: 1 },
        { businessId: ERC3643_FREEZE_RESOLVER_KEY, version: 1 },
        { businessId: ERC3643_RECOVERY_RESOLVER_KEY, version: 1 },
        { businessId: ERC203643_CAPPED_RESOLVER_KEY, version: 1 },
        { businessId: ERC203643_CONTROLLER_RESOLVER_KEY, version: 1 },
        { businessId: ERC3643_COMPLIANCE_RESOLVER_KEY, version: 1 },
        { businessId: ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY, version: 1 },
        { businessId: ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY, version: 1 },
        {
            businessId: ERC3643_COMPLIANCE_BURN_TEST_WRAPPER_RESOLVER_KEY,
            version: 1,
        },
    ])

    // Deploy use case
    const tx = await isbeFactory.deployUseCase(
        CONFIGURATION_ID_ERC3643,
        1,
        rbacs,
        init_pause,
        init_BusinessIds,
        init_CallData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, isbeFactory)
    const { proxy } = deployedEvent.args

    // Attach facets to proxy
    const pause = ISBEPauseFacetFactory.attach(proxy) as ISBEPauseFacet
    const accessControl = AccessControlFacetFactory.attach(
        proxy
    ) as AccessControlFacet
    const erc20 = ERC20FacetFactory.attach(proxy) as ERC20Facet
    const erc3643Metadata = ERC3643MetadataFacetFactory.attach(
        proxy
    ) as ERC3643MetadataFacet
    const erc3643Freeze = ERC3643FreezeFacetFactory.attach(
        proxy
    ) as ERC3643FreezeFacet
    const erc3643Recovery = ERC3643RecoveryFacetFactory.attach(
        proxy
    ) as ERC3643RecoveryFacet
    const erc203643Capped = ERC203643CappedFacetFactory.attach(
        proxy
    ) as ERC203643CappedFacet
    const erc203643Controller = ERC203643ControllerFacetFactory.attach(
        proxy
    ) as ERC203643ControllerFacet
    const erc3643Compliance = ERC3643ComplianceFacetFactory.attach(
        proxy
    ) as ERC3643ComplianceFacet
    const erc3643ComplianceMaxBalance =
        ERC3643ComplianceMaxBalanceFacetFactory.attach(
            proxy
        ) as ERC3643ComplianceMaxBalanceFacet
    const erc3643ComplianceDMLim = ERC3643ComplianceDMLimFacetFactory.attach(
        proxy
    ) as ERC3643ComplianceDMLimFacet
    const erc3643ComplianceBurnTestWrapper =
        ERC3643ComplianceBurnTestWrapperFacetFactory.attach(proxy)

    return {
        proxy,
        pause,
        accessControl,
        erc20,
        erc3643Metadata,
        erc3643Freeze,
        erc3643Recovery,
        erc203643Capped,
        erc203643Controller,
        erc3643Compliance,
        erc3643ComplianceMaxBalance,
        erc3643ComplianceDMLim,
        erc3643ComplianceBurnTestWrapper,
    }
}
