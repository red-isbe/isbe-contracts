import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapper,
    ERC20TestWrapper__factory,
    EIP2535AccessControl__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondLoupeFacet__factory,
    EIP2535AccessControl,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet,
    IEIP2535Introspection,
    ISBEPauseFacet__factory,
    ISBEPauseFacet,
    AccessControlFacet__factory,
    AccessControlFacet,
} from '../typechain-types'
import { Signer } from 'ethers'
import {
    DEFAULT_ADMIN_ROLE,
    DIAMOND_CUT_RESOLVER_KEY,
    DIAMOND_LOUPE_RESOLVER_KEY,
    ISBE_ROLE,
    PAUSER_ROLE,
} from './constants'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('EIP2535AccessControlProxy', function () {
    let admin: Signer
    let nonAdmin: Signer
    let pauser: Signer
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let ISBEPauseFacetFactory: ISBEPauseFacet__factory
    let erc20Impl: ERC20TestWrapper
    let pauseFacet: ISBEPauseFacet
    let erc20: ERC20TestWrapper
    let diamondProxy: EIP2535AccessControl
    let diamondCutFacet: DiamondCutAccessControlFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let facetList: IEIP2535Introspection[]
    let facetAddresses: string[]

    async function deployInitial() {
        ;[admin, nonAdmin, pauser] = await ethers.getSigners()
        // Despliegue AccessControl logic
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')
        DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
            'DiamondCutAccessControlFacet'
        )
        DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')
        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')
        erc20Impl = await ERC20TestWrapperFactory.deploy()
        diamondCutFacet = await DiamondCutAccessControlFacetFactory.deploy()
        diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        pauseFacet = await ISBEPauseFacetFactory.deploy()
        await erc20Impl.waitForDeployment()
        await diamondCutFacet.waitForDeployment()
        await diamondLoupeFacet.waitForDeployment()
        await pauseFacet.waitForDeployment()
        expect(await diamondCutFacet.businessIdIntrospection()).to.be.equal(
            DIAMOND_CUT_RESOLVER_KEY
        )
        expect(await diamondLoupeFacet.businessIdIntrospection()).to.be.equal(
            DIAMOND_LOUPE_RESOLVER_KEY
        )
    }

    before(async () => {
        await deployInitial()
    })

    describe('Initialization', () => {
        it('GIVEN a set of facet WHEN try to deploy with duplicated roles THEN revert', async () => {
            facetAddresses = [await diamondCutFacet.getAddress()]
            await expect(
                EIP2535AccessControlFactory.deploy(facetAddresses, {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [await admin.getAddress()],
                        },
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [await admin.getAddress()],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    initCalldata: '0x',
                })
            )
                .revertedWithCustomError(
                    EIP2535AccessControlFactory,
                    'RoleMustBeUnique'
                )
                .withArgs(DEFAULT_ADMIN_ROLE)
        })
        it('GIVEN a set of facet WHEN try to deploy with duplicated account in role THEN revert', async () => {
            facetAddresses = [await diamondCutFacet.getAddress()]
            await expect(
                EIP2535AccessControlFactory.deploy(facetAddresses, {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [
                                await admin.getAddress(),
                                await admin.getAddress(),
                            ],
                        },
                        {
                            role: PAUSER_ROLE,
                            members: [await admin.getAddress()],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    initCalldata: '0x',
                })
            )
                .revertedWithCustomError(
                    EIP2535AccessControlFactory,
                    'RoleMemberMustBeUnique'
                )
                .withArgs(DEFAULT_ADMIN_ROLE, await admin.getAddress())
        })

        it('GIVEN a set of facet WHEN try to deploy with zero address in role THEN revert', async () => {
            facetAddresses = [await diamondCutFacet.getAddress()]
            await expect(
                EIP2535AccessControlFactory.deploy(facetAddresses, {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [
                                await admin.getAddress(),
                                await nonAdmin.getAddress(),
                            ],
                        },
                        {
                            role: PAUSER_ROLE,
                            members: [
                                await admin.getAddress(),
                                await pauser.getAddress(),
                                ethers.ZeroAddress,
                            ],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    initCalldata: '0x',
                })
            ).revertedWithCustomError(
                EIP2535AccessControlFactory,
                'AddressZero'
            )
        })

        it('GIVEN set of facets WHEN deploy with incorrect facet action THEN fails', async () => {
            facetAddresses = [await pauseFacet.getAddress()]
            await expect(
                EIP2535AccessControlFactory.deploy(facetAddresses, {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [await admin.getAddress()],
                        },
                    ],
                    init: await pauseFacet.getAddress(),
                    initCalldata:
                        ISBEPauseFacetFactory.interface.encodeFunctionData(
                            pauseFacet.pause.fragment,
                            []
                        ),
                })
            )
                .revertedWithCustomError(pauseFacet, 'AccountHasNoRoles')
                .withArgs(await admin.getAddress(), [PAUSER_ROLE, ISBE_ROLE])
        })

        it('GIVEN set of facets WHEN deploy with incorrect payload THEN fails', async () => {
            facetAddresses = [await diamondCutFacet.getAddress()]
            await expect(
                EIP2535AccessControlFactory.deploy(facetAddresses, {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [await admin.getAddress()],
                        },
                    ],
                    init: await diamondCutFacet.getAddress(),
                    initCalldata:
                        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                })
            )
                .revertedWithCustomError(
                    EIP2535AccessControlFactory,
                    'InitializationFunctionReverted'
                )
                .withArgs(
                    await diamondCutFacet.getAddress(),
                    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
                )
        })

        describe('Full coverage in diamondCut', () => {
            let diamondCut: DiamondCutAccessControlFacet
            beforeEach(async () => {
                facetAddresses = [await diamondCutFacet.getAddress()]
                diamondProxy = await EIP2535AccessControlFactory.deploy(
                    facetAddresses,
                    {
                        rbacs: [
                            {
                                role: DEFAULT_ADMIN_ROLE,
                                members: [await admin.getAddress()],
                            },
                        ],
                        init: ethers.ZeroAddress,
                        initCalldata: '0x',
                    }
                )
                await diamondProxy.waitForDeployment()
                diamondCut = DiamondCutAccessControlFacetFactory.attach(
                    await diamondProxy.getAddress()
                ) as DiamondCutAccessControlFacet
            })

            it('GIVEN a deployed EIP2535 WHEN functionSelectos is empty THEN revert', async () => {
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress: ethers.ZeroAddress,
                                action: 0,
                                items: [],
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'NoItemsProvidedForUpdate'
                    )
                    .withArgs(ethers.ZeroAddress)
            })

            it('GIVEN a deployed EIP2535 WHEN Zero facetAddress is empty THEN revert', async () => {
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress: ethers.ZeroAddress,
                                action: 0,
                                items: ['0x01234567'],
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotAddItemsToZeroAddress'
                    )
                    .withArgs(['0x01234567'])
            })

            it('GIVEN a deployed EIP2535 WHEN try to add an existent signature THEN revert', async () => {
                const facetAddress = await diamondLoupeFacet.getAddress()
                const items = [
                    (await diamondCutFacet.selectorsIntrospection())[0],
                ]
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 0,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotAddItemToDiamondThatAlreadyExists'
                    )
                    .withArgs(items[0])
            })

            it.skip('GIVEN a deployed EIP2535 WHEN try to add an existent signature to the same address THEN success', async () => {
                const facetAddress = await diamondCutFacet.getAddress()
                const selector = (
                    await diamondCutFacet.selectorsIntrospection()
                )[0]
                const items = [selector]

                await diamondCut.diamondCut(
                    [
                        {
                            facetAddress,
                            action: 0,
                            items,
                        },
                    ],
                    ethers.ZeroAddress,
                    '0x'
                )

                const result = await diamondLoupeFacet.facetAddress(selector)

                expect(result).to.be.equal(facetAddress)
            })

            it('GIVEN a deployed EIP2535 WHEN try to add a Zero signature THEN revert', async () => {
                const facetAddress = await diamondCutFacet.getAddress()
                const items = ['0x00000000']
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 0,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(diamondCut, 'ZeroItem')
                    .withArgs(facetAddress, 0)
            })

            it('GIVEN a deployed EIP2535 WHEN try to add signature to a non contract THEN revert', async () => {
                const facetAddress = await nonAdmin.getAddress()
                const items = [
                    (await diamondCutFacet.selectorsIntrospection())[0],
                ]
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 0,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'NoBytecodeAtAddress'
                    )
                    .withArgs(
                        facetAddress,
                        'LibDiamondCut: Add facet has no code'
                    )
            })

            it('GIVEN a deployed EIP2535 WHEN try to replace ZeroAddress THEN revert', async () => {
                const facetAddress = ethers.ZeroAddress
                const items = [
                    (await diamondCutFacet.selectorsIntrospection())[0],
                ]
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 1,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotReplaceItemsFromFacetWithZeroAddress'
                    )
                    .withArgs(items)
            })

            it('GIVEN a deployed EIP2535 WHEN try to replace non contract address THEN revert', async () => {
                const facetAddress = await nonAdmin.getAddress()
                const items = [
                    (await diamondCutFacet.selectorsIntrospection())[0],
                ]
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 1,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'NoBytecodeAtAddress'
                    )
                    .withArgs(
                        facetAddress,
                        'LibDiamondCut: Replace facet has no code'
                    )
            })

            it('GIVEN a deployed EIP2535 WHEN try to replace shelf assigned selector THEN revert', async () => {
                const facetAddress = await diamondProxy.getAddress()
                const items = ['0x98765432']
                await diamondCut.diamondCut(
                    [
                        {
                            facetAddress,
                            action: 0,
                            items,
                        },
                    ],
                    ethers.ZeroAddress,
                    '0x'
                )
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 1,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotReplaceImmutableItems'
                    )
                    .withArgs(items[0])
            })

            it('GIVEN a deployed EIP2535 WHEN try to replace selector to same facet THEN revert', async () => {
                const facetAddress = await diamondCutFacet.getAddress()
                const items = [
                    (await diamondCutFacet.selectorsIntrospection())[0],
                ]
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 1,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotReplaceItemWithTheSameItemFromTheSameFacet'
                    )
                    .withArgs(items[0])
            })

            it('GIVEN a deployed EIP2535 WHEN try to replace non existent selector THEN revert', async () => {
                const facetAddress = await diamondCutFacet.getAddress()
                const items = ['0x98765432']
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 1,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotReplaceItemThatDoesNotExists'
                    )
                    .withArgs(items[0])
            })

            it('GIVEN a deployed EIP2535 WHEN try to delete with zero address THEN revert', async () => {
                const facetAddress = await diamondCutFacet.getAddress()
                const items = ['0x98765432']
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 2,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'RemoveFacetAddressMustBeZeroAddress'
                    )
                    .withArgs(facetAddress)
            })

            it('GIVEN a deployed EIP2535 WHEN try to delete with non existent selector THEN revert', async () => {
                const facetAddress = ethers.ZeroAddress
                const items = ['0x98765432']
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 2,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotRemoveItemThatDoesNotExist'
                    )
                    .withArgs(items[0])
            })

            it('GIVEN a deployed EIP2535 WHEN try to remove shelf assigned selector THEN revert', async () => {
                const facetAddress = await diamondProxy.getAddress()
                const items = ['0x98765432']
                await diamondCut.diamondCut(
                    [
                        {
                            facetAddress,
                            action: 0,
                            items,
                        },
                    ],
                    ethers.ZeroAddress,
                    '0x'
                )
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress: ethers.ZeroAddress,
                                action: 2,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                )
                    .to.be.revertedWithCustomError(
                        diamondCut,
                        'CannotRemoveImmutableItem'
                    )
                    .withArgs(items[0])
            })
        })
    })

    describe('EIP2535AccessControl', () => {
        beforeEach(async () => {
            facetList = [diamondCutFacet, diamondLoupeFacet, erc20Impl]
            facetAddresses = [
                await diamondCutFacet.getAddress(),
                await diamondLoupeFacet.getAddress(),
                await erc20Impl.getAddress(),
                await pauseFacet.getAddress(),
            ]
            diamondProxy = await EIP2535AccessControlFactory.deploy(
                facetAddresses,
                {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [await admin.getAddress()],
                        },
                        {
                            role: PAUSER_ROLE,
                            members: [await admin.getAddress()],
                        },
                    ],
                    init: await erc20Impl.getAddress(),
                    initCalldata:
                        ERC20TestWrapperFactory.interface.encodeFunctionData(
                            erc20Impl.initializeErc20.fragment,
                            [NAME, SYMBOL, DECIMALS]
                        ),
                }
            )
            await diamondProxy.waitForDeployment()
            erc20 = ERC20TestWrapperFactory.attach(
                await diamondProxy.getAddress()
            ) as ERC20TestWrapper
            await erc20.initializeCap(10000)
        })

        it('GIVEN an ERC20 deployed WHEN deploy a EIP2535 proxy THEN cant use DiamondCut without DEFAULT_ADMIN_ROLE', async () => {
            const diamondCut: DiamondCutAccessControlFacet =
                DiamondCutAccessControlFacetFactory.attach(
                    await diamondProxy.getAddress()
                )
            await expect(
                diamondCut
                    .connect(nonAdmin)
                    .diamondCut([], ethers.ZeroAddress, '0x')
            )
                .to.be.revertedWithCustomError(diamondCut, 'AccountHasNoRole')
                .withArgs(await nonAdmin.getAddress(), DEFAULT_ADMIN_ROLE)
            await expect(
                diamondCut
                    .connect(nonAdmin)
                    .facetUpdates([], ethers.ZeroAddress, '0x')
            )
                .to.be.revertedWithCustomError(diamondCut, 'AccountHasNoRole')
                .withArgs(await nonAdmin.getAddress(), DEFAULT_ADMIN_ROLE)
        })

        it('GIVEN deployed EIP2535 proxy WHEN pause THEN cant use DiamondCut', async () => {
            const pause: ISBEPauseFacet = ISBEPauseFacetFactory.attach(
                await diamondProxy.getAddress()
            )
            await pause.pause()
            const diamondCut: DiamondCutAccessControlFacet =
                DiamondCutAccessControlFacetFactory.attach(
                    await diamondProxy.getAddress()
                )
            await expect(diamondCut.diamondCut([], ethers.ZeroAddress, '0x'))
                .to.be.revertedWithCustomError(diamondCut, 'IsPaused')
                .withArgs()
            await expect(diamondCut.facetUpdates([], ethers.ZeroAddress, '0x'))
                .to.be.revertedWithCustomError(diamondCut, 'IsPaused')
                .withArgs()
        })

        it('GIVEN an ERC20 deployed WHEN deploy a EIP2535 proxy THEN it can be initialized', async () => {
            const diamondLoupe: DiamondLoupeFacet =
                DiamondLoupeFacetFactory.attach(await diamondProxy.getAddress())
            const facets = await diamondLoupe.facets()
            for (const index in facetList) {
                expect(facets[index].facetAddress).to.equal(
                    await facetList[index].getAddress()
                )
                expect(facets[index].functionSelectors).to.deep.equal(
                    await facetList[index].selectorsIntrospection()
                )
                expect(
                    await diamondLoupe.facetFunctionSelectors(
                        await facetList[index].getAddress()
                    )
                ).to.deep.equal(await facetList[index].selectorsIntrospection())
                expect(
                    await diamondLoupe.facetAddress(
                        (await facetList[index].selectorsIntrospection())[0]
                    )
                ).to.be.equal(await facetList[index].getAddress())
            }
            expect([...(await diamondLoupe.facetAddresses())]).to.deep.equal(
                facetAddresses
            )
            expect(await diamondLoupe.supportsInterface('0x1626ba7e')).to.be
                .false
        })

        it('GIVEN an ERC20 deployed WHEN deploy a EIP2535 proxy THEN it can be initialized', async () => {
            expect(await erc20.name()).to.equal(NAME)
            expect(await erc20.symbol()).to.equal(SYMBOL)
            expect(await erc20.decimals()).to.equal(DECIMALS)
        })

        it('GIVEN an ERC20 deployed linked to a EIP2535 proxy WHEN update THEN it can be updated', async () => {
            const diamondCut = DiamondCutAccessControlFacetFactory.attach(
                await diamondProxy.getAddress()
            ) as DiamondCutAccessControlFacet
            await diamondCut.facetUpdates(
                [
                    await diamondCutFacet.getAddress(),
                    await diamondLoupeFacet.getAddress(),
                    await erc20Impl.getAddress(),
                ],
                ethers.ZeroAddress,
                '0x'
            )
            expect(await erc20.name()).to.equal(NAME)
            expect(await erc20.symbol()).to.equal(SYMBOL)
            expect(await erc20.decimals()).to.equal(DECIMALS)
        })

        it('GIVEN an ERC20 deployed linked to a EIP2535 proxy WHEN add new AccessControl THEN it can be used', async () => {
            const AccessControlFacetFactory: AccessControlFacet__factory =
                await ethers.getContractFactory('AccessControlFacet')
            const accessControlFacetImpl: AccessControlFacet =
                await AccessControlFacetFactory.deploy()
            await accessControlFacetImpl.waitForDeployment()
            const diamondCut = DiamondCutAccessControlFacetFactory.attach(
                await diamondProxy.getAddress()
            ) as DiamondCutAccessControlFacet
            await diamondCut.diamondCut(
                [
                    {
                        facetAddress: await accessControlFacetImpl.getAddress(),
                        action: 0,
                        items: [
                            ...(await accessControlFacetImpl.selectorsIntrospection()),
                        ],
                    },
                ],
                ethers.ZeroAddress,
                '0x'
            )
            const diamondLoupe: DiamondLoupeFacet =
                DiamondLoupeFacetFactory.attach(await diamondProxy.getAddress())
            const facets = await diamondLoupe.facets()
            expect(facets[4].facetAddress).to.equal(
                await accessControlFacetImpl.getAddress()
            )
            expect(facets[4].functionSelectors).to.deep.equal(
                await accessControlFacetImpl.selectorsIntrospection()
            )
            const accessControl: AccessControlFacet =
                AccessControlFacetFactory.attach(
                    await diamondProxy.getAddress()
                )
            expect(
                await accessControl.hasRole(
                    DEFAULT_ADMIN_ROLE,
                    await admin.getAddress()
                )
            ).to.be.true
            expect(
                await accessControl.hasRole(
                    PAUSER_ROLE,
                    await admin.getAddress()
                )
            ).to.be.true
            expect(
                await accessControl.hasRole(
                    DEFAULT_ADMIN_ROLE,
                    await nonAdmin.getAddress()
                )
            ).to.be.false
            expect(
                await accessControl.hasRole(
                    PAUSER_ROLE,
                    await nonAdmin.getAddress()
                )
            ).to.be.false
            expect(await erc20.name()).to.equal(NAME)
            expect(await erc20.symbol()).to.equal(SYMBOL)
            expect(await erc20.decimals()).to.equal(DECIMALS)
            const pause: ISBEPauseFacet = ISBEPauseFacetFactory.attach(
                await diamondProxy.getAddress()
            )
            await pause.pause()
            await expect(
                accessControl.grantRole(
                    PAUSER_ROLE,
                    await nonAdmin.getAddress()
                )
            ).revertedWithCustomError(accessControl, 'IsPaused')
            await expect(
                accessControl.revokeRole(
                    PAUSER_ROLE,
                    await nonAdmin.getAddress()
                )
            ).revertedWithCustomError(accessControl, 'IsPaused')
            await expect(
                accessControl.setRoleAdmin(PAUSER_ROLE, DEFAULT_ADMIN_ROLE)
            ).revertedWithCustomError(accessControl, 'IsPaused')
            await expect(
                accessControl.renounceRole(PAUSER_ROLE)
            ).revertedWithCustomError(accessControl, 'IsPaused')
        })

        describe('diamondCut success', () => {
            it('GIVEN a deployed EIP2535 WHEN replace a selector THEN success', async () => {
                const diamondCut = DiamondCutAccessControlFacetFactory.attach(
                    await diamondProxy.getAddress()
                ) as DiamondCutAccessControlFacet

                const erc20Impl_2 = await ERC20TestWrapperFactory.deploy()
                await erc20Impl_2.waitForDeployment()

                const facetAddress = await erc20Impl_2.getAddress()
                const items = [(await erc20Impl_2.selectorsIntrospection())[2]]
                await diamondCut.diamondCut(
                    [
                        {
                            facetAddress,
                            action: 1,
                            items,
                        },
                    ],
                    ethers.ZeroAddress,
                    '0x'
                )
                const diamondLoupe: DiamondLoupeFacet =
                    DiamondLoupeFacetFactory.attach(
                        await diamondProxy.getAddress()
                    )
                expect(
                    await diamondLoupe.facetFunctionSelectors(facetAddress)
                ).to.deep.equal(items)
                expect(await diamondLoupe.facetAddress(items[0])).to.be.equal(
                    facetAddress
                )
                expect(await erc20.name()).to.equal(NAME)
                expect(await erc20.symbol()).to.equal(SYMBOL)
                expect(await erc20.decimals()).to.equal(DECIMALS)
            })

            it('GIVEN a deployed EIP2535 WHEN delete a selector and try to see it THEN it success', async () => {
                const diamondCut = DiamondCutAccessControlFacetFactory.attach(
                    await diamondProxy.getAddress()
                ) as DiamondCutAccessControlFacet
                const facetAddress = ethers.ZeroAddress
                const items = [...(await erc20Impl.selectorsIntrospection())]
                const diamondLoupe: DiamondLoupeFacet =
                    DiamondLoupeFacetFactory.attach(
                        await diamondProxy.getAddress()
                    )
                await expect(
                    diamondCut.diamondCut(
                        [
                            {
                                facetAddress,
                                action: 2,
                                items,
                            },
                        ],
                        ethers.ZeroAddress,
                        '0x'
                    )
                ).to.emit(diamondCut, 'DiamondCut')
                await expect(erc20.initializeErc20('newName', 'newSymbol', 8))
                    .to.revertedWithCustomError(
                        diamondProxy,
                        'FunctionNotFound'
                    )
                    .withArgs('0xa2872645')
                expect(await diamondLoupe.facetAddress(items[1])).to.be.equal(
                    ethers.ZeroAddress
                )
            })
        })
    })
})
