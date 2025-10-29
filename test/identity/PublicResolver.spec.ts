import { expect } from 'chai'
import { Signer, ZeroAddress, ZeroHash } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControlFacet,
    ISBEPauseFacet,
    IPublicResolver,
    EnsResolverFacet,
    NameResolverFacet,
    TextResolverFacet,
    PubkeyResolverFacet,
    ENS,
} from '../../typechain-types'
import {
    ENS_MANAGER_ROLE,
    ENS_RESOLVER_RESOLVER_KEY,
    PAUSER_ROLE,
    CONFIGURATION_ID_ENS_REGISTRY,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'
import { deployEnsPublicResolverUseCaseFacets } from '../fixtures/ens'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { randomEnsName, randomTextRecord, randomPubkeyPair } from '../support'

describe('ENS Public Resolver', () => {
    let account_2: Signer
    let account_3: Signer
    let adminAccountAddress: string
    let account_2Address: string
    let account_3Address: string
    let publicResolver: IPublicResolver
    let ensResolver: EnsResolverFacet
    let nameResolver: NameResolverFacet
    let textResolver: TextResolverFacet
    let pubkeyResolver: PubkeyResolverFacet
    let pause: ISBEPauseFacet
    let accessControl: AccessControlFacet
    let ensRegistry: ENS

    // Test data
    const ROOT_NODE = ethers.ZeroHash
    const TEST_LABEL = ethers.keccak256(ethers.toUtf8Bytes('test'))
    const SUB_NODE = ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32'],
        [ZeroHash, TEST_LABEL]
    )
    let TEST_NAME: string
    let TEST_TEXT_KEY: string
    let TEST_TEXT_VALUE: string
    let TEST_PUBKEY_X: string
    let TEST_PUBKEY_Y: string

    async function deployFixture(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rbacsUseCase: any[] = [
            {
                role: PAUSER_ROLE,
                members: [],
            },
            {
                role: ENS_MANAGER_ROLE,
                members: [],
            },
        ],
        init_pause: boolean = false
    ) {
        const [adminAccountSigner, account2Signer, account3Signer] =
            await ethers.getSigners()
        const adminAccountAddress = await adminAccountSigner.getAddress()
        const account2Address = await account2Signer.getAddress()
        const account3Address = await account3Signer.getAddress()

        // Initialize randomized test data
        const testName = randomEnsName()
        const textRecord = randomTextRecord()
        const testTextKey = textRecord.key
        const testTextValue = textRecord.value
        const pubkeyPair = randomPubkeyPair()
        const testPubkeyX = pubkeyPair.x
        const testPubkeyY = pubkeyPair.y

        // Update rbacs with actual addresses
        const updatedRbacs = rbacsUseCase.map((rbac) => ({
            ...rbac,
            members:
                rbac.members.length > 0 ? rbac.members : [adminAccountAddress],
        }))

        // Deploy ENS Registry first
        const registryResult = await deployGovernance(
            adminAccountSigner,
            updatedRbacs,
            CONFIGURATION_ID_ENS_REGISTRY,
            false
        )

        // Grant ENS roles to admin for registry
        await registryResult.accessControlGovernance!.grantRole(
            ENS_MANAGER_ROLE,
            adminAccountAddress
        )

        // Initialize ENS Registry (connect with signer first)
        const ensRegistryWithSigner =
            registryResult.ensRegistry!.connect(adminAccountSigner)
        await ensRegistryWithSigner.initialiseEnsRegistry(adminAccountAddress)

        // Get isbeFactory and ISBEPauseFacetFactory for ENS Public Resolver deployment
        const isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await registryResult.governanceContract.getAddress()
        )
        const ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')

        // Deploy Public Resolver using the dedicated function
        const result = await deployEnsPublicResolverUseCaseFacets(
            isbeFactory,
            ISBEPauseFacetFactory,
            adminAccountSigner,
            updatedRbacs,
            init_pause,
            [],
            []
        )

        return {
            adminAccount: adminAccountSigner,
            account_2: account2Signer,
            account_3: account3Signer,
            adminAccountAddress,
            account_2Address: account2Address,
            account_3Address: account3Address,
            publicResolver: result.publicResolver!,
            ensResolver: result.ensResolverFacet!,
            nameResolver: result.nameResolverFacet!,
            textResolver: result.textResolverFacet!,
            pubkeyResolver: result.pubkeyResolverFacet!,
            pause: result.pause!,
            accessControl: result.accessControl!,
            ensRegistry: registryResult.ensRegistry!.connect(
                adminAccountSigner
            ) as typeof registryResult.ensRegistry,
            TEST_NAME: testName,
            TEST_TEXT_KEY: testTextKey,
            TEST_TEXT_VALUE: testTextValue,
            TEST_PUBKEY_X: testPubkeyX,
            TEST_PUBKEY_Y: testPubkeyY,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        const adminAccount = contracts.adminAccount
        account_2 = contracts.account_2
        account_3 = contracts.account_3
        adminAccountAddress = contracts.adminAccountAddress
        account_2Address = contracts.account_2Address
        account_3Address = contracts.account_3Address
        publicResolver = contracts.publicResolver
        ensResolver = contracts.ensResolver
        nameResolver = contracts.nameResolver
        textResolver = contracts.textResolver
        pubkeyResolver = contracts.pubkeyResolver
        pause = contracts.pause
        accessControl = contracts.accessControl
        ensRegistry = contracts.ensRegistry.connect(
            adminAccount
        ) as typeof contracts.ensRegistry
        TEST_NAME = contracts.TEST_NAME
        TEST_TEXT_KEY = contracts.TEST_TEXT_KEY
        TEST_TEXT_VALUE = contracts.TEST_TEXT_VALUE
        TEST_PUBKEY_X = contracts.TEST_PUBKEY_X
        TEST_PUBKEY_Y = contracts.TEST_PUBKEY_Y
    })

    describe('Paused', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await pause.pause()
            }
            await loadFixture(fixture)
        })

        it('GIVEN paused resolver WHEN try to setApprovalForAll THEN it fails', async () => {
            await expect(
                publicResolver.setApprovalForAll(account_2Address, true)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN paused resolver WHEN try to approve THEN it fails', async () => {
            await expect(
                publicResolver.approve(ROOT_NODE, account_2Address, true)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN paused resolver WHEN try to setName THEN it fails', async () => {
            await expect(
                publicResolver.setName(ROOT_NODE, TEST_NAME)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN paused resolver WHEN try to setText THEN it fails', async () => {
            await expect(
                publicResolver.setText(
                    ROOT_NODE,
                    TEST_TEXT_KEY,
                    TEST_TEXT_VALUE
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN paused resolver WHEN try to setPubkey THEN it fails', async () => {
            await expect(
                publicResolver.setPubkey(
                    ROOT_NODE,
                    TEST_PUBKEY_X,
                    TEST_PUBKEY_Y
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
    })

    describe('AddressZero error', () => {
        it('GIVEN PublicResolver deployed WHEN try to initialize with zero address THEN it fails', async () => {
            await expect(
                publicResolver.initializePublicResolver(ZeroAddress)
            ).to.be.revertedWithCustomError(ensResolver, 'AddressZero')
        })

        it('GIVEN deployed resolver WHEN try to setApprovalForAll with operator to zero THEN it fails', async () => {
            await expect(
                publicResolver.setApprovalForAll(ZeroAddress, true)
            ).to.be.revertedWithCustomError(ensResolver, 'AddressZero')
        })

        it('GIVEN deployed resolver WHEN try to approve with delegate to zero THEN it fails', async () => {
            await expect(
                publicResolver.approve(ROOT_NODE, ZeroAddress, true)
            ).to.be.revertedWithCustomError(ensResolver, 'AddressZero')
        })
    })

    describe('Unauthorized', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        it('GIVEN resolver initialized WHEN try to approve and is unauthorized THEN it fails', async () => {
            await expect(
                publicResolver
                    .connect(account_2)
                    .approve(ROOT_NODE, account_3Address, true)
            )
                .to.be.revertedWithCustomError(
                    publicResolver,
                    'NotAuthorisedForNode'
                )
                .withArgs(ROOT_NODE, account_2Address)
        })

        it('GIVEN resolver initialized WHEN try to setName and is unauthorized THEN it fails', async () => {
            await expect(
                publicResolver.connect(account_2).setName(ROOT_NODE, TEST_NAME)
            )
                .to.be.revertedWithCustomError(
                    publicResolver,
                    'NotAuthorisedForNode'
                )
                .withArgs(ROOT_NODE, account_2Address)
        })

        it('GIVEN resolver initialized WHEN try to setText and is unauthorized THEN it fails', async () => {
            await expect(
                publicResolver
                    .connect(account_2)
                    .setText(ROOT_NODE, TEST_TEXT_KEY, TEST_TEXT_VALUE)
            )
                .to.be.revertedWithCustomError(
                    publicResolver,
                    'NotAuthorisedForNode'
                )
                .withArgs(ROOT_NODE, account_2Address)
        })

        it('GIVEN resolver initialized WHEN try to setPubkey and is unauthorized THEN it fails', async () => {
            await expect(
                publicResolver
                    .connect(account_2)
                    .setPubkey(ROOT_NODE, TEST_PUBKEY_X, TEST_PUBKEY_Y)
            )
                .to.be.revertedWithCustomError(
                    publicResolver,
                    'NotAuthorisedForNode'
                )
                .withArgs(ROOT_NODE, account_2Address)
        })
    })

    describe('Initialization', () => {
        it('GIVEN PublicResolver deployed WHEN try to initialize twice THEN it fails', async () => {
            expect(
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            )
            await expect(
                publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            )
                .to.be.revertedWithCustomError(
                    ensResolver,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(ENS_RESOLVER_RESOLVER_KEY)
        })

        it('GIVEN PublicResolver deployed WHEN initialize THEN success', async () => {
            expect(
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            )
                .to.emit(ensResolver, 'PublicResolverInitialized')
                .withArgs(await ensRegistry.getAddress())
        })
    })

    describe('EnsResolver Functionality', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        describe('setApprovalForAll', () => {
            it('GIVEN initialized resolver WHEN approve operator THEN success', async () => {
                expect(
                    await publicResolver.setApprovalForAll(
                        account_2Address,
                        true
                    )
                )
                    .to.emit(ensResolver, 'ApprovalForAll')
                    .withArgs(adminAccountAddress, account_2Address, true)

                expect(
                    await publicResolver.isApprovedForAll(
                        adminAccountAddress,
                        account_2Address
                    )
                ).to.be.true
            })

            it('GIVEN operator approved WHEN revoke approval THEN success', async () => {
                await publicResolver.setApprovalForAll(account_2Address, true)

                expect(
                    await publicResolver.setApprovalForAll(
                        account_2Address,
                        false
                    )
                )
                    .to.emit(ensResolver, 'ApprovalForAll')
                    .withArgs(adminAccountAddress, account_2Address, false)

                expect(
                    await publicResolver.isApprovedForAll(
                        adminAccountAddress,
                        account_2Address
                    )
                ).to.be.false
            })
        })

        describe('approve', () => {
            it('GIVEN initialized resolver WHEN approve delegate THEN success', async () => {
                expect(
                    await publicResolver.approve(
                        ROOT_NODE,
                        account_2Address,
                        true
                    )
                )
                    .to.emit(ensResolver, 'Approved')
                    .withArgs(
                        adminAccountAddress,
                        ROOT_NODE,
                        account_2Address,
                        true
                    )

                expect(
                    await publicResolver.isApprovedFor(
                        adminAccountAddress,
                        ROOT_NODE,
                        account_2Address
                    )
                ).to.be.true
            })

            it('GIVEN delegate approved WHEN revoke approval THEN success', async () => {
                await publicResolver.approve(ROOT_NODE, account_2Address, true)

                expect(
                    await publicResolver.approve(
                        ROOT_NODE,
                        account_2Address,
                        false
                    )
                )
                    .to.emit(ensResolver, 'Approved')
                    .withArgs(
                        adminAccountAddress,
                        ROOT_NODE,
                        account_2Address,
                        false
                    )

                expect(
                    await publicResolver.isApprovedFor(
                        adminAccountAddress,
                        ROOT_NODE,
                        account_2Address
                    )
                ).to.be.false
            })
        })
    })

    describe('NameResolver Functionality', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        describe('setName', () => {
            it('GIVEN initialized resolver WHEN set name THEN success', async () => {
                expect(await publicResolver.setName(ROOT_NODE, TEST_NAME))
                    .to.emit(nameResolver, 'NameChanged')
                    .withArgs(ROOT_NODE, TEST_NAME)

                expect(await publicResolver.name(ROOT_NODE)).to.equal(TEST_NAME)
            })

            it('GIVEN name set WHEN update name THEN success', async () => {
                await publicResolver.setName(ROOT_NODE, TEST_NAME)
                const newName = 'updated.eth'

                expect(await publicResolver.setName(ROOT_NODE, newName))
                    .to.emit(nameResolver, 'NameChanged')
                    .withArgs(ROOT_NODE, newName)

                expect(await publicResolver.name(ROOT_NODE)).to.equal(newName)
            })

            it('GIVEN name set WHEN clear name THEN success', async () => {
                await publicResolver.setName(ROOT_NODE, TEST_NAME)

                expect(await publicResolver.setName(ROOT_NODE, ''))
                    .to.emit(nameResolver, 'NameChanged')
                    .withArgs(ROOT_NODE, '')

                expect(await publicResolver.name(ROOT_NODE)).to.equal('')
            })
        })
    })

    describe('TextResolver Functionality', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        describe('setText', () => {
            it('GIVEN initialized resolver WHEN set text THEN success', async () => {
                expect(
                    await publicResolver.setText(
                        ROOT_NODE,
                        TEST_TEXT_KEY,
                        TEST_TEXT_VALUE
                    )
                )
                    .to.emit(textResolver, 'TextChanged')
                    .withArgs(
                        ROOT_NODE,
                        TEST_TEXT_KEY,
                        TEST_TEXT_KEY,
                        TEST_TEXT_VALUE
                    )

                expect(
                    await publicResolver.text(ROOT_NODE, TEST_TEXT_KEY)
                ).to.equal(TEST_TEXT_VALUE)
            })

            it('GIVEN text set WHEN update text THEN success', async () => {
                await publicResolver.setText(
                    ROOT_NODE,
                    TEST_TEXT_KEY,
                    TEST_TEXT_VALUE
                )
                const newValue = randomTextRecord().value

                expect(
                    await publicResolver.setText(
                        ROOT_NODE,
                        TEST_TEXT_KEY,
                        newValue
                    )
                )
                    .to.emit(textResolver, 'TextChanged')
                    .withArgs(ROOT_NODE, TEST_TEXT_KEY, TEST_TEXT_KEY, newValue)

                expect(
                    await publicResolver.text(ROOT_NODE, TEST_TEXT_KEY)
                ).to.equal(newValue)
            })

            it('GIVEN text set WHEN clear text THEN success', async () => {
                await publicResolver.setText(
                    ROOT_NODE,
                    TEST_TEXT_KEY,
                    TEST_TEXT_VALUE
                )

                expect(
                    await publicResolver.setText(ROOT_NODE, TEST_TEXT_KEY, '')
                )
                    .to.emit(textResolver, 'TextChanged')
                    .withArgs(ROOT_NODE, TEST_TEXT_KEY, TEST_TEXT_KEY, '')

                expect(
                    await publicResolver.text(ROOT_NODE, TEST_TEXT_KEY)
                ).to.equal('')
            })

            it('GIVEN resolver initialized WHEN set multiple text records THEN success', async () => {
                // Generate multiple random text records
                const records = [
                    randomTextRecord(),
                    randomTextRecord(),
                    randomTextRecord(),
                ]
                const keys = records.map((r) => r.key)
                const values = records.map((r) => r.value)

                for (let i = 0; i < keys.length; i++) {
                    await publicResolver.setText(ROOT_NODE, keys[i], values[i])
                    expect(
                        await publicResolver.text(ROOT_NODE, keys[i])
                    ).to.equal(values[i])
                }
            })
        })
    })

    describe('PubkeyResolver Functionality', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        describe('setPubkey', () => {
            it('GIVEN initialized resolver WHEN set pubkey THEN success', async () => {
                expect(
                    await publicResolver.setPubkey(
                        ROOT_NODE,
                        TEST_PUBKEY_X,
                        TEST_PUBKEY_Y
                    )
                )
                    .to.emit(pubkeyResolver, 'PubkeyChanged')
                    .withArgs(ROOT_NODE, TEST_PUBKEY_X, TEST_PUBKEY_Y)

                const [x, y] = await publicResolver.pubkey(ROOT_NODE)
                expect(x).to.equal(TEST_PUBKEY_X)
                expect(y).to.equal(TEST_PUBKEY_Y)
            })

            it('GIVEN pubkey set WHEN update pubkey THEN success', async () => {
                await publicResolver.setPubkey(
                    ROOT_NODE,
                    TEST_PUBKEY_X,
                    TEST_PUBKEY_Y
                )
                const newPubkeyPair = randomPubkeyPair()
                const newX = newPubkeyPair.x
                const newY = newPubkeyPair.y

                expect(await publicResolver.setPubkey(ROOT_NODE, newX, newY))
                    .to.emit(pubkeyResolver, 'PubkeyChanged')
                    .withArgs(ROOT_NODE, newX, newY)

                const [x, y] = await publicResolver.pubkey(ROOT_NODE)
                expect(x).to.equal(newX)
                expect(y).to.equal(newY)
            })

            it('GIVEN pubkey set WHEN clear pubkey THEN success', async () => {
                await publicResolver.setPubkey(
                    ROOT_NODE,
                    TEST_PUBKEY_X,
                    TEST_PUBKEY_Y
                )

                expect(
                    await publicResolver.setPubkey(
                        ROOT_NODE,
                        ZeroHash,
                        ZeroHash
                    )
                )
                    .to.emit(pubkeyResolver, 'PubkeyChanged')
                    .withArgs(ROOT_NODE, ZeroHash, ZeroHash)

                const [x, y] = await publicResolver.pubkey(ROOT_NODE)
                expect(x).to.equal(ZeroHash)
                expect(y).to.equal(ZeroHash)
            })
        })
    })

    describe('Authorization with Operators and Delegates', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        describe('Operator Authorization', () => {
            it('GIVEN operator approved WHEN operator sets name THEN success', async () => {
                await publicResolver.setApprovalForAll(account_2Address, true)

                await publicResolver
                    .connect(account_2)
                    .setName(ROOT_NODE, TEST_NAME)

                expect(await publicResolver.name(ROOT_NODE)).to.equal(TEST_NAME)
            })

            it('GIVEN operator approved WHEN operator sets text THEN success', async () => {
                await publicResolver.setApprovalForAll(account_2Address, true)

                await publicResolver
                    .connect(account_2)
                    .setText(ROOT_NODE, TEST_TEXT_KEY, TEST_TEXT_VALUE)

                expect(
                    await publicResolver.text(ROOT_NODE, TEST_TEXT_KEY)
                ).to.equal(TEST_TEXT_VALUE)
            })

            it('GIVEN operator approved WHEN operator sets pubkey THEN success', async () => {
                await publicResolver.setApprovalForAll(account_2Address, true)

                await publicResolver
                    .connect(account_2)
                    .setPubkey(ROOT_NODE, TEST_PUBKEY_X, TEST_PUBKEY_Y)

                const [x, y] = await publicResolver.pubkey(ROOT_NODE)
                expect(x).to.equal(TEST_PUBKEY_X)
                expect(y).to.equal(TEST_PUBKEY_Y)
            })
        })

        describe('Delegate Authorization', () => {
            it('GIVEN delegate approved WHEN delegate sets name THEN success', async () => {
                await publicResolver.approve(ROOT_NODE, account_2Address, true)

                await publicResolver
                    .connect(account_2)
                    .setName(ROOT_NODE, TEST_NAME)

                expect(await publicResolver.name(ROOT_NODE)).to.equal(TEST_NAME)
            })

            it('GIVEN delegate approved WHEN delegate sets text THEN success', async () => {
                await publicResolver.approve(ROOT_NODE, account_2Address, true)

                await publicResolver
                    .connect(account_2)
                    .setText(ROOT_NODE, TEST_TEXT_KEY, TEST_TEXT_VALUE)

                expect(
                    await publicResolver.text(ROOT_NODE, TEST_TEXT_KEY)
                ).to.equal(TEST_TEXT_VALUE)
            })

            it('GIVEN delegate approved WHEN delegate sets pubkey THEN success', async () => {
                await publicResolver.approve(ROOT_NODE, account_2Address, true)

                await publicResolver
                    .connect(account_2)
                    .setPubkey(ROOT_NODE, TEST_PUBKEY_X, TEST_PUBKEY_Y)

                const [x, y] = await publicResolver.pubkey(ROOT_NODE)
                expect(x).to.equal(TEST_PUBKEY_X)
                expect(y).to.equal(TEST_PUBKEY_Y)
            })
        })
    })

    describe('ENS Manager Role Authorization', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
            }
            await loadFixture(initialize)
        })

        it('GIVEN account with ENS_MANAGER_ROLE WHEN perform operations THEN success', async () => {
            await accessControl.grantRole(ENS_MANAGER_ROLE, account_2Address)

            // Test all operations with ENS_MANAGER_ROLE
            await publicResolver
                .connect(account_2)
                .setName(ROOT_NODE, TEST_NAME)
            await publicResolver
                .connect(account_2)
                .setText(ROOT_NODE, TEST_TEXT_KEY, TEST_TEXT_VALUE)
            await publicResolver
                .connect(account_2)
                .setPubkey(ROOT_NODE, TEST_PUBKEY_X, TEST_PUBKEY_Y)

            expect(await publicResolver.name(ROOT_NODE)).to.equal(TEST_NAME)
            expect(
                await publicResolver.text(ROOT_NODE, TEST_TEXT_KEY)
            ).to.equal(TEST_TEXT_VALUE)
            const [x, y] = await publicResolver.pubkey(ROOT_NODE)
            expect(x).to.equal(TEST_PUBKEY_X)
            expect(y).to.equal(TEST_PUBKEY_Y)

            // Revoke role and test failure
            await accessControl.revokeRole(ENS_MANAGER_ROLE, account_2Address)
            await expect(
                publicResolver
                    .connect(account_2)
                    .setName(ROOT_NODE, randomEnsName())
            )
                .to.be.revertedWithCustomError(
                    publicResolver,
                    'NotAuthorisedForNode'
                )
                .withArgs(ROOT_NODE, account_2Address)
        })
    })

    describe('Integration with ENS Registry', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await publicResolver.initializePublicResolver(
                    await ensRegistry.getAddress()
                )
                // Set up a subnode in ENS registry
                await ensRegistry.setSubnodeRecord(
                    ROOT_NODE,
                    TEST_LABEL,
                    account_2Address, // account_2 owns the subnode
                    await publicResolver.getAddress(),
                    3600
                )
            }
            await loadFixture(initialize)
        })

        it('GIVEN node owner in ENS WHEN perform resolver operations THEN success', async () => {
            // account_2 owns SUB_NODE, should be able to set resolver data
            const testName = randomEnsName()
            const testTextRecord = randomTextRecord()

            await publicResolver.connect(account_2).setName(SUB_NODE, testName)
            await publicResolver
                .connect(account_2)
                .setText(SUB_NODE, testTextRecord.key, testTextRecord.value)

            expect(await publicResolver.name(SUB_NODE)).to.equal(testName)
            expect(
                await publicResolver.text(SUB_NODE, testTextRecord.key)
            ).to.equal(testTextRecord.value)
        })

        it('GIVEN non-owner in ENS WHEN perform resolver operations THEN fails', async () => {
            // account_3 doesn't own SUB_NODE, should fail
            await expect(
                publicResolver
                    .connect(account_3)
                    .setName(SUB_NODE, randomEnsName())
            )
                .to.be.revertedWithCustomError(
                    publicResolver,
                    'NotAuthorisedForNode'
                )
                .withArgs(SUB_NODE, account_3Address)
        })
    })
})
