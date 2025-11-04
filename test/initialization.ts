export async function deployERC3643UseCasesFacets(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rbacs: any[],
    init_pause: boolean,
    init_BusinessIds: string[],
    init_CallData: string[]
) {
    // Facet Factories
    const IsbeCutFacetFactory = await ethers.getContractFactory('IsbeCutFacet')
    const IsbeLoupeFacetFactory =
        await ethers.getContractFactory('IsbeLoupeFacet')
    const AccessControlFacetFactory =
        await ethers.getContractFactory('AccessControlFacet')

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

    // Deploy all business logic contracts before setting configuration
    const isbeCutFacet = await deployBusinessLogicFromFactory(
        ISBE_CUT_RESOLVER_KEY,
        IsbeCutFacetFactory
    )
    const isbeLoupeFacet = await deployBusinessLogicFromFactory(
        ISBE_LOUPE_RESOLVER_KEY,
        IsbeLoupeFacetFactory
    )
    const accessControlFacet = await deployBusinessLogicFromFactory(
        ACCESS_CONTROL_RESOLVER_KEY,
        AccessControlFacetFactory
    )
    const pauseFacet = await deployBusinessLogicFromFactory(
        PAUSE_RESOLVER_KEY,
        ISBEPauseFacetFactory
    )
    const erc20Facet = await deployBusinessLogicFromFactory(
        ERC20_RESOLVER_KEY,
        ERC20FacetFactory
    )
    const erc3643MetadataFacet = await deployBusinessLogicFromFactory(
        ERC3643_METADATA_RESOLVER_KEY,
        ERC3643MetadataFacetFactory
    )
    const erc3643FreezeFacet = await deployBusinessLogicFromFactory(
        ERC3643_FREEZE_RESOLVER_KEY,
        ERC3643FreezeFacetFactory
    )
    const erc3643RecoveryFacet = await deployBusinessLogicFromFactory(
        ERC3643_RECOVERY_RESOLVER_KEY,
        ERC3643RecoveryFacetFactory
    )
    const erc203643CappedFacet = await deployBusinessLogicFromFactory(
        ERC203643_CAPPED_RESOLVER_KEY,
        ERC203643CappedFacetFactory
    )
    const erc203643ControllerFacet = await deployBusinessLogicFromFactory(
        ERC203643_CONTROLLER_RESOLVER_KEY,
        ERC203643ControllerFacetFactory
    )
    const erc3643ComplianceFacet = await deployBusinessLogicFromFactory(
        ERC3643_COMPLIANCE_RESOLVER_KEY,
        ERC3643ComplianceFacetFactory
    )

    const erc3643ComplianceMaxBalanceFacet =
        await deployBusinessLogicFromFactory(
            ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
            ERC3643ComplianceMaxBalanceFacetFactory
        )

    const erc3643ComplianceDMLimFacet = await deployBusinessLogicFromFactory(
        ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
        ERC3643ComplianceDMLimFacetFactory
    )

    // Set configuration for ERC3643

    await isbeFactory.setConfiguration(CONFIGURATION_ID_ERC3643, [
        {
            businessId: ERC20_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC3643_METADATA_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC3643_FREEZE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC3643_RECOVERY_RESOLVER_KEY,
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
            businessId: ERC3643_COMPLIANCE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
            version: 1,
        },
        {
            businessId: ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
            version: 1,
        },
    ])

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

    return {
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
        isbeCutFacet,
        isbeLoupeFacet,
        proxy,
        accessControlFacet,
        pauseFacet,
        erc20Facet,
        erc3643MetadataFacet,
        erc3643FreezeFacet,
        erc203643CappedFacet,
        erc203643ControllerFacet,
        erc3643RecoveryFacet,
        erc3643ComplianceFacet,
        erc3643ComplianceMaxBalanceFacet,
        erc3643ComplianceDMLimFacet,
    }
}
