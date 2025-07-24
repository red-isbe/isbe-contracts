import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    IIsbeFactory,
    IEIP2535Introspection,
    ConfigurationManagementFacet,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    RANDOM_HASH_FOR_CONFIGURATION_ID,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
} from '../constants'
import { deployGovernance } from '../initialization'

describe('ConfigurationManagement', function () {
    let admin: Signer
    let isbe: Signer
    let isbeAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let configurationManagementFacet: ConfigurationManagementFacet
    let isbeFactory: IIsbeFactory

    async function deployInitial() {
        ;[admin, isbe, nonAdmin] = await ethers.getSigners()
        isbeAddress = await isbe.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()

        await deployIsbeFactory()
    }

    async function deployIsbeFactory() {
        const result = await deployGovernance(admin)

        isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await result.governanceContract.getAddress()
        )

        configurationManagementFacet = await ethers.getContractAt(
            'ConfigurationManagementFacet',
            await result.governanceContract.getAddress()
        )
    }

    beforeEach(async () => {
        await deployInitial()
    })

    describe('ConfigurationManagement', () => {
        describe('Configure Use Case', () => {
            it('GIVEN deployed isbe factory WHEN try to configure use case without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .setConfiguration(ethers.ZeroHash, [])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(
                        nonAdminAddress,
                        GOVERNANCE_CONFIGURATION_MANAGER_ROLE
                    )
                await expect(
                    isbeFactory
                        .connect(isbe)
                        .setConfiguration(ethers.ZeroHash, [])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(
                        isbeAddress,
                        GOVERNANCE_CONFIGURATION_MANAGER_ROLE
                    )
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .setConfiguration(ethers.ZeroHash, [])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(
                        nonAdminAddress,
                        GOVERNANCE_CONFIGURATION_MANAGER_ROLE
                    )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with empty configurationId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(ethers.ZeroHash, [])
                ).to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with Zero facets THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [])
                ).to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'NotEmptyBusinessIds'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with Zero businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: ethers.ZeroHash,
                                version: 0,
                            },
                        ])
                ).to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with a default facet THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: ACCESS_CONTROL_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(ACCESS_CONTROL_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: PAUSE_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(PAUSE_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: DIAMOND_CUT_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(DIAMOND_CUT_RESOLVER_KEY)
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: DIAMOND_LOUPE_RESOLVER_KEY,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'FacetNotPermitted'
                    )
                    .withArgs(DIAMOND_LOUPE_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with non existent businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: RANDOM_HASH_FOR_CONFIGURATION_ID,
                                version: 0,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'CurrentIdNotRegistered'
                    )
                    .withArgs(RANDOM_HASH_FOR_CONFIGURATION_ID)
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with duplicated businessId THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .setConfiguration(RANDOM_HASH_FOR_CONFIGURATION_ID, [
                            {
                                businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                                version: 0,
                            },
                            {
                                businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                                version: 1,
                            },
                        ])
                )
                    .to.be.revertedWithCustomError(
                        configurationManagementFacet,
                        'DuplicatedBusinessId'
                    )
                    .withArgs(HASH_TIMESTAMP_RESOLVER_KEY)
            })
            it('GIVEN deployed isbe factory WHEN try to configure use case with duplicated businessId THEN it fails', async () => {
                const businessDatas = [
                    {
                        businessId: HASH_TIMESTAMP_RESOLVER_KEY,
                        version: 0,
                    },
                    {
                        businessId: ASSET_EVENT_TRACKER_RESOLVER_KEY,
                        version: 0,
                    },
                ]
                expect(
                    await isbeFactory
                        .connect(admin)
                        .setConfiguration(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            businessDatas
                        )
                )
                    .to.emit(configurationManagementFacet, 'UseCaseConfigured')
                    .withArgs(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        businessDatas,
                        1
                    )
                businessDatas.push(
                    ...[
                        {
                            businessId: ACCESS_CONTROL_RESOLVER_KEY,
                            version: 0,
                        },
                        {
                            businessId: PAUSE_RESOLVER_KEY,
                            version: 0,
                        },
                        {
                            businessId: ISBE_CUT_RESOLVER_KEY,
                            version: 0,
                        },
                        {
                            businessId: ISBE_LOUPE_RESOLVER_KEY,
                            version: 0,
                        },
                    ]
                )
                for (const version of [0, 1]) {
                    const storedBusinessDatas =
                        await isbeFactory.getConfiguration(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            version
                        )
                    expect(storedBusinessDatas.length).to.be.equal(
                        businessDatas.length
                    )
                    for (const index in storedBusinessDatas) {
                        expect(
                            storedBusinessDatas[index].businessId
                        ).to.be.deep.equal(businessDatas[index].businessId)
                        expect(
                            storedBusinessDatas[index].version
                        ).to.be.deep.equal(businessDatas[index].version)
                    }
                }
                expect(
                    await isbeFactory.getConfiguration(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        2
                    )
                ).to.be.deep.equal([])
                const facets = await isbeFactory.facets(
                    RANDOM_HASH_FOR_CONFIGURATION_ID,
                    0
                )
                expect(facets.length).to.be.equal(businessDatas.length)
                let instrospection: IEIP2535Introspection
                const facetAddresses: string[] = []
                for (const index in facets) {
                    instrospection = await ethers.getContractAt(
                        'IEIP2535Introspection',
                        facets[index].facetAddress
                    )
                    expect(
                        await instrospection.businessIdIntrospection()
                    ).to.be.equal(businessDatas[index].businessId)
                    const selectors =
                        await instrospection.selectorsIntrospection()
                    expect(facets[index].functionSelectors).to.be.deep.equal(
                        selectors
                    )
                    expect(
                        await isbeFactory.facetFunctionSelectors(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            0,
                            facets[index].facetAddress
                        )
                    ).to.be.deep.equal(selectors)
                    expect(
                        await isbeFactory.facetFunctionSelectors(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            1,
                            facets[index].facetAddress
                        )
                    ).to.be.deep.equal(selectors)
                    expect(
                        await isbeFactory.facetFunctionSelectors(
                            RANDOM_HASH_FOR_CONFIGURATION_ID,
                            2,
                            facets[index].facetAddress
                        )
                    ).to.be.deep.equal([])
                    for (const selector of selectors) {
                        expect(
                            await isbeFactory.facetAddress(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                0,
                                selector
                            )
                        ).to.be.equal(facets[index].facetAddress)
                        expect(
                            await isbeFactory.facetAddress(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                1,
                                selector
                            )
                        ).to.be.equal(facets[index].facetAddress)
                        expect(
                            await isbeFactory.facetAddress(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                2,
                                selector
                            )
                        ).to.be.equal(ethers.ZeroAddress)
                    }
                    const interfaces =
                        await instrospection.interfacesIntrospection()
                    for (const current of interfaces) {
                        expect(
                            await isbeFactory.facetSupportsInterface(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                0,
                                current
                            )
                        ).to.be.true
                        expect(
                            await isbeFactory.facetSupportsInterface(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                1,
                                current
                            )
                        ).to.be.true
                        expect(
                            await isbeFactory.facetSupportsInterface(
                                RANDOM_HASH_FOR_CONFIGURATION_ID,
                                2,
                                current
                            )
                        ).to.be.false
                    }
                    facetAddresses.push(facets[index].facetAddress)
                }
                expect(
                    await isbeFactory.facetAddresses(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        0
                    )
                ).to.be.deep.equal(facetAddresses)
                expect(
                    await isbeFactory.facetAddresses(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        1
                    )
                ).to.be.deep.equal(facetAddresses)
                expect(
                    await isbeFactory.facetAddresses(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        2
                    )
                ).to.be.deep.equal([])
                await expect(
                    isbeFactory.checkConfiguration(
                        RANDOM_HASH_FOR_CONFIGURATION_ID,
                        3
                    )
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(RANDOM_HASH_FOR_CONFIGURATION_ID, 3)
            })
        })
    })
})
