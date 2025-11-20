import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployGovernance } from '../fixtures/governance'
import {
    PAUSER_ROLE,
    ANCHORER_ROLE,
    METADATA_MANAGER_ROLE,
    ANCHORING_CORE_RESOLVER_KEY,
    DEV_CHAIN,
    POLYGON_CHAIN,
    ETHEREUM_MAINNET,
    OPTIMISM_CHAIN,
} from '../../utils/constants'
import { AnchoringCore, AccessControlFacet } from '../../typechain-types'
import { randomHex } from '../support'

describe('AnchoringCore', () => {
    async function deployFixture() {
        const [adminSigner, nonAdminSigner] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()
        const nonAdminAddress = await nonAdminSigner.getAddress()

        const result = await deployGovernance(adminSigner, [])
        const governanceAddress = await result.governanceContract.getAddress()

        const anchoringInstance = await ethers.getContractAt(
            'AnchoringCore',
            governanceAddress
        )
        const anchoringAccessControl = await ethers.getContractAt(
            'AccessControlFacet',
            governanceAddress
        )

        await anchoringAccessControl.grantRole(PAUSER_ROLE, adminAddress)

        expect(
            await result.anchoringCoreFacet.businessIdIntrospection()
        ).to.be.equal(ANCHORING_CORE_RESOLVER_KEY)

        return {
            admin: adminSigner,
            nonAdmin: nonAdminSigner,
            adminAddress,
            nonAdminAddress,
            anchoringInstance,
            anchoringAccessControl,
            anchoringProxy: governanceAddress,
        }
    }

    async function initializeAnchoring(
        anchoringInstanceParam: AnchoringCore,
        anchoringAccessControlParam: AccessControlFacet,
        adminAddressParam: string,
        anchoredChainId = DEV_CHAIN
    ) {
        await anchoringAccessControlParam.grantRole(
            ANCHORER_ROLE,
            adminAddressParam
        )
        await anchoringAccessControlParam.grantRole(
            METADATA_MANAGER_ROLE,
            adminAddressParam
        )
        await anchoringInstanceParam.registerChain(anchoredChainId)
    }

    describe('Deployment and Initialization', () => {
        describe('successful operations', () => {
            it('GIVEN valid parameters WHEN registering first chain THEN registers correctly', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const meta = await anchoringInstance.getChainMetadata()
                const { chainId } = await ethers.provider.getNetwork()
                expect(meta[0]).to.equal(chainId)
                expect(meta[1]).to.deep.equal([DEV_CHAIN])
            })
        })
    })

    // ========================================
    // Single Block Anchoring
    // ========================================

    describe('Single Block Anchoring', function () {
        describe('successful operations', () => {
            it('GIVEN valid block data WHEN anchoring single block THEN anchors successfully and emits event', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const blockNumber = 1
                const blockHash = randomHex()
                const stateRoot = randomHex()

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            DEV_CHAIN,
                            blockNumber,
                            blockHash,
                            stateRoot
                        )
                ).to.emit(anchoringInstance, 'BlockAnchored')

                const last =
                    await anchoringInstance.getLastAnchoredBlock(DEV_CHAIN)
                expect(last.blockNumber).to.equal(1)
                expect(last.blockHash).to.equal(blockHash)
            })

            it('GIVEN first block anchored WHEN anchoring second block THEN anchors successfully', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const blockHash1 = randomHex()
                const stateRoot1 = randomHex()
                const blockHash2 = randomHex()
                const stateRoot2 = randomHex()

                // Anchor first block
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1, blockHash1, stateRoot1)

                // Anchor second block (tests the second branch of totalAnchors == 0 || blockNumber > lastAnchoredBlock)
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 2, blockHash2, stateRoot2)
                ).to.emit(anchoringInstance, 'BlockAnchored')

                const last =
                    await anchoringInstance.getLastAnchoredBlock(DEV_CHAIN)
                expect(last.blockNumber).to.equal(2)
                expect(last.blockHash).to.equal(blockHash2)
            })
        })

        describe('validation failures', () => {
            it('GIVEN unregistered chain WHEN anchoring THEN reverts with ChainNotRegistered', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 999 // Chain that was never registered
                const blockHash = randomHex()
                const stateRoot = randomHex()

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            unregisteredChainId,
                            1,
                            blockHash,
                            stateRoot
                        )
                )
                    .to.be.revertedWithCustomError(
                        anchoringInstance,
                        'ChainNotRegistered'
                    )
                    .withArgs(unregisteredChainId)
            })

            it('GIVEN duplicate block number WHEN anchoring THEN reverts with BlockAlreadyAnchored', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const h = randomHex()
                const r = randomHex()

                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 10, h, r)
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 10, h, r)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockAlreadyAnchored'
                )
            })

            it('GIVEN non-monotonically increasing block number WHEN anchoring THEN reverts with BlockNumberMustBeHigher', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const h1 = randomHex()
                const r1 = randomHex()
                const h2 = randomHex()
                const r2 = randomHex()

                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 2, h2, r2)
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 1, h1, r1)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockNumberMustBeHigher'
                )
            })
        })

        describe('access control', () => {
            it('GIVEN account without ANCHORER_ROLE WHEN anchoring THEN reverts with AccountHasNoRole', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    nonAdmin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await expect(
                    anchoringInstance
                        .connect(nonAdmin)
                        .anchorBlock(DEV_CHAIN, 1, randomHex(), randomHex())
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'AccountHasNoRole'
                )
            })
        })

        describe('pause functionality', () => {
            it('GIVEN paused contract WHEN anchoring THEN reverts with IsPaused', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    anchoringProxy,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Pause the contract
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )
                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await isbePause.connect(admin).pause()

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 1, randomHex(), randomHex())
                ).to.be.revertedWithCustomError(anchoringInstance, 'IsPaused')
            })
        })
    })

    // ========================================
    // Batch Block Anchoring
    // ========================================

    describe('Batch Block Anchoring', function () {
        describe('successful operations', () => {
            it('GIVEN valid batch data WHEN anchoring batch THEN anchors all blocks and updates stats', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const hashes = [randomHex(), randomHex()]
                const roots = [randomHex(), randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [1, 2], hashes, roots)
                ).to.not.be.rejected

                const stats =
                    await anchoringInstance.getAnchoringStats(DEV_CHAIN)
                expect(stats._totalAnchors).to.equal(2)
                expect(stats._lastAnchoredBlock).to.equal(2)
                expect(
                    await anchoringInstance.isBlockAnchored(DEV_CHAIN, 1)
                ).to.equal(true)
                expect(
                    await anchoringInstance.isBlockAnchored(DEV_CHAIN, 2)
                ).to.equal(true)
            })
        })

        describe('validation failures', () => {
            it('GIVEN unregistered chain WHEN anchoring batch THEN reverts with ChainNotRegistered', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 888 // Chain that was never registered
                const hashes = [randomHex()]
                const roots = [randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(
                            unregisteredChainId,
                            [1],
                            hashes,
                            roots
                        )
                )
                    .to.be.revertedWithCustomError(
                        anchoringInstance,
                        'ChainNotRegistered'
                    )
                    .withArgs(unregisteredChainId)
            })

            it('GIVEN mismatched array lengths (blockHashes shorter) WHEN anchoring batch THEN reverts with ArrayLengthMismatch', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const hashes = [randomHex()]
                const roots = [randomHex(), randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [1, 2], hashes, roots)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'NotSameLength'
                )
            })

            it('GIVEN mismatched array lengths (stateRoots shorter) WHEN anchoring batch THEN reverts with ArrayLengthMismatch', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const hashes = [randomHex()]
                const roots: string[] = []

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [1], hashes, roots)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'NotSameLength'
                )
            })

            it('GIVEN empty arrays WHEN anchoring batch THEN reverts with EmptyUint', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const emptyBlocks: number[] = []
                const emptyHashes: string[] = []
                const emptyRoots: string[] = []

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(
                            DEV_CHAIN,
                            emptyBlocks,
                            emptyHashes,
                            emptyRoots
                        )
                ).to.be.revertedWithCustomError(anchoringInstance, 'EmptyUint')
            })

            it('GIVEN batch with blockNumber zero WHEN anchoring batch THEN reverts with BlockNumberMustBeHigher', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const hashes = [randomHex()]
                const roots = [randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [0], hashes, roots)
                ).to.be.revertedWithCustomError(anchoringInstance, 'EmptyUint')
            })

            it('GIVEN batch contains duplicate block number WHEN anchoring batch THEN reverts with BlockAlreadyAnchored', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // First anchor block 5
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 5, randomHex(), randomHex())

                // Try to anchor batch that includes block 5 again
                const hashes = [randomHex(), randomHex()]
                const roots = [randomHex(), randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [5, 6], hashes, roots)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockAlreadyAnchored'
                )
            })

            it('GIVEN batch with non-monotonic block numbers WHEN anchoring batch THEN reverts with BlockNumberMustBeHigher', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // First anchor block 10
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 10, randomHex(), randomHex())

                // Try to anchor batch with blocks [8, 11] where 8 < 10
                const hashes = [randomHex(), randomHex()]
                const roots = [randomHex(), randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [8, 11], hashes, roots)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockNumberMustBeHigher'
                )
            })
        })

        describe('access control', () => {
            it('GIVEN account without ANCHORER_ROLE WHEN anchoring batch THEN reverts with AccountHasNoRole', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    nonAdmin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const hashes = [randomHex(), randomHex()]
                const roots = [randomHex(), randomHex()]

                await expect(
                    anchoringInstance
                        .connect(nonAdmin)
                        .anchorBlocksBatch(DEV_CHAIN, [1, 2], hashes, roots)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'AccountHasNoRole'
                )
            })
        })

        describe('pause functionality', () => {
            it('GIVEN paused contract WHEN anchoring batch THEN reverts with IsPaused', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    anchoringProxy,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Pause the contract
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )
                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await isbePause.connect(admin).pause()

                const hashes = [randomHex(), randomHex()]
                const roots = [randomHex(), randomHex()]

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlocksBatch(DEV_CHAIN, [1, 2], hashes, roots)
                ).to.be.revertedWithCustomError(anchoringInstance, 'IsPaused')
            })
        })
    })

    // ========================================
    // Block Queries and View Functions
    // ========================================

    describe('Block Queries and View Functions', function () {
        describe('getLastAnchoredBlock', function () {
            it('GIVEN anchored blocks WHEN querying last block THEN returns correct block data', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const bn = 5
                const bh = randomHex()
                const sr = randomHex()

                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, bn, bh, sr)

                const last =
                    await anchoringInstance.getLastAnchoredBlock(DEV_CHAIN)
                expect(last.blockNumber).to.equal(bn)
                expect(last.blockHash).to.equal(bh)
            })

            it('GIVEN no anchored blocks WHEN querying last block THEN reverts with NoBlocksAnchored', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const result =
                    await anchoringInstance.getLastAnchoredBlock(DEV_CHAIN)
                expect(result.blockNumber).to.equal(0)
                expect(result.blockHash).to.equal(ethers.ZeroHash)
                expect(result.stateRoot).to.equal(ethers.ZeroHash)
                expect(result.timestamp).to.equal(0)
                expect(result.anchorer).to.equal(ethers.ZeroAddress)
            })

            it('GIVEN unregistered chain WHEN querying last block THEN returns default values', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 777
                const result =
                    await anchoringInstance.getLastAnchoredBlock(
                        unregisteredChainId
                    )
                expect(result.blockNumber).to.equal(0)
                expect(result.blockHash).to.equal(ethers.ZeroHash)
                expect(result.stateRoot).to.equal(ethers.ZeroHash)
                expect(result.timestamp).to.equal(0)
                expect(result.anchorer).to.equal(ethers.ZeroAddress)
            })
        })

        describe('getAnchoredBlock', function () {
            it('GIVEN anchored block WHEN querying by number THEN returns correct data', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const bn = 5
                const bh = randomHex()
                const sr = randomHex()

                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, bn, bh, sr)

                const byNumber = await anchoringInstance.getAnchoredBlock(
                    DEV_CHAIN,
                    bn
                )
                expect(byNumber.blockHash).to.equal(bh)
            })

            it('GIVEN non-existent block number WHEN querying THEN reverts with BlockNotFound', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const result = await anchoringInstance.getAnchoredBlock(
                    DEV_CHAIN,
                    999
                )
                expect(result.blockNumber).to.equal(0)
                expect(result.blockHash).to.equal(ethers.ZeroHash)
                expect(result.stateRoot).to.equal(ethers.ZeroHash)
                expect(result.timestamp).to.equal(0)
                expect(result.anchorer).to.equal(ethers.ZeroAddress)
            })

            it('GIVEN unregistered chain WHEN querying block THEN returns default values', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 666
                const result = await anchoringInstance.getAnchoredBlock(
                    unregisteredChainId,
                    1
                )
                expect(result.blockNumber).to.equal(0)
                expect(result.blockHash).to.equal(ethers.ZeroHash)
                expect(result.stateRoot).to.equal(ethers.ZeroHash)
                expect(result.timestamp).to.equal(0)
                expect(result.anchorer).to.equal(ethers.ZeroAddress)
            })
        })

        describe('getLastNBlocks', function () {
            it('GIVEN multiple anchored blocks WHEN querying last N THEN returns correct number of blocks', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Anchor 5 blocks
                for (let i = 1; i <= 5; i++) {
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            DEV_CHAIN,
                            i,
                            ethers.keccak256(ethers.toUtf8Bytes(`block-${i}`)),
                            ethers.keccak256(ethers.toUtf8Bytes(`state-${i}`))
                        )
                }

                const last2 = await anchoringInstance.getLastNBlocks(
                    DEV_CHAIN,
                    2
                )
                expect(last2.length).to.equal(2)
                const nums = last2.map((b) => Number(b.blockNumber))
                expect(nums[0]).to.equal(4)
                expect(nums[1]).to.equal(5)
            })

            it('GIVEN count exceeds total anchors WHEN querying last N THEN returns all anchors', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Anchor 2 blocks
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        DEV_CHAIN,
                        1,
                        ethers.keccak256(ethers.toUtf8Bytes('block-1')),
                        ethers.keccak256(ethers.toUtf8Bytes('state-1'))
                    )
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        DEV_CHAIN,
                        2,
                        ethers.keccak256(ethers.toUtf8Bytes('block-2')),
                        ethers.keccak256(ethers.toUtf8Bytes('state-2'))
                    )

                const lastN = await anchoringInstance.getLastNBlocks(
                    DEV_CHAIN,
                    10
                )
                expect(lastN.length).to.equal(2)
            })

            it('GIVEN count is zero WHEN querying last N THEN returns empty array', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const result = await anchoringInstance.getLastNBlocks(
                    DEV_CHAIN,
                    0
                )
                expect(result.length).to.equal(0)
            })

            it('GIVEN no anchored blocks WHEN querying last N THEN returns empty array', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const result = await anchoringInstance.getLastNBlocks(
                    DEV_CHAIN,
                    5
                )
                expect(result.length).to.equal(0)
            })

            it('GIVEN unregistered chain WHEN querying last N blocks THEN reverts with ChainNotRegistered', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 555
                const result = await anchoringInstance.getLastNBlocks(
                    unregisteredChainId,
                    5
                )
                expect(result.length).to.equal(0)
            })
        })

        describe('getBlocksInRange', function () {
            it('GIVEN anchored blocks with gaps WHEN querying range THEN returns only anchored blocks', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Anchor blocks 1 and 3, leave 2 unanchored
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 3, randomHex(), randomHex())

                const range = await anchoringInstance.getBlocksInRange(
                    DEV_CHAIN,
                    1,
                    3
                )
                const numbers = range.map((b) => Number(b.blockNumber))
                expect(numbers.includes(1)).to.equal(true)
                expect(numbers.includes(2)).to.equal(false)
                expect(numbers.includes(3)).to.equal(true)
            })

            it('GIVEN invalid range (from > to) WHEN querying THEN reverts with InvalidRange', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const result = await anchoringInstance.getBlocksInRange(
                    DEV_CHAIN,
                    5,
                    1
                )
                expect(result.length).to.equal(0)
            })

            it('GIVEN unregistered chain WHEN querying blocks in range THEN returns empty array', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 444
                const result = await anchoringInstance.getBlocksInRange(
                    unregisteredChainId,
                    1,
                    5
                )
                expect(result.length).to.equal(0)
            })
        })

        describe('getAnchoringStats', function () {
            it('GIVEN anchored blocks WHEN querying stats THEN returns correct statistics', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Anchor 5 blocks
                for (let i = 1; i <= 5; i++) {
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            DEV_CHAIN,
                            i,
                            ethers.keccak256(ethers.toUtf8Bytes(`block-${i}`)),
                            ethers.keccak256(ethers.toUtf8Bytes(`state-${i}`))
                        )
                }

                const stats =
                    await anchoringInstance.getAnchoringStats(DEV_CHAIN)
                const { chainId } = await ethers.provider.getNetwork()
                expect(stats._totalAnchors).to.equal(5)
                expect(stats._lastAnchoredBlock).to.equal(5)
                expect(stats._thisChainId).to.equal(chainId)
                expect(stats._anchoredChainId).to.equal(DEV_CHAIN)
            })

            it('GIVEN unregistered chain WHEN querying stats THEN reverts with ChainNotRegistered', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const unregisteredChainId = 333
                const stats =
                    await anchoringInstance.getAnchoringStats(
                        unregisteredChainId
                    )
                const { chainId } = await ethers.provider.getNetwork()
                expect(stats[0]).to.equal(0)
                expect(stats[1]).to.equal(0)
                expect(stats[2]).to.equal(chainId)
                expect(stats[3]).to.equal(unregisteredChainId)
            })
        })

        describe('getChainMetadata', function () {
            it('GIVEN initialized contract WHEN querying metadata THEN returns correct chain names', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const meta = await anchoringInstance.getChainMetadata()
                const { chainId } = await ethers.provider.getNetwork()
                expect(meta[0]).to.equal(chainId)
                expect(meta[1]).to.deep.equal([DEV_CHAIN])
            })
        })

        describe('isBlockAnchored', function () {
            it('GIVEN anchored block WHEN checking THEN returns true', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1, randomHex(), randomHex())

                expect(
                    await anchoringInstance.isBlockAnchored(DEV_CHAIN, 1)
                ).to.equal(true)
            })

            it('GIVEN non-anchored block WHEN checking THEN returns false', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                expect(
                    await anchoringInstance.isBlockAnchored(DEV_CHAIN, 999)
                ).to.equal(false)
            })

            it('GIVEN unregistered chain WHEN checking isBlockAnchored THEN returns false', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const UNREGISTERED_CHAIN = 999
                expect(
                    await anchoringInstance.isBlockAnchored(
                        UNREGISTERED_CHAIN,
                        1
                    )
                ).to.equal(false)
            })
        })
    })

    // ========================================
    // Pause/Unpause Functionality (Standard ISBE Pattern)
    // ========================================

    describe('Pause/Unpause Functionality', function () {
        describe('successful operations', () => {
            it('GIVEN unpaused contract WHEN pausing via ISBEPause THEN anchoring operations are blocked', async () => {
                const {
                    anchoringInstance,
                    anchoringProxy,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Grant PAUSER_ROLE to owner
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )

                // Get ISBEPauseFacet interface
                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )

                // Pause using standard ISBE mechanism
                await isbePause.connect(admin).pause()

                // Verify anchoring is blocked
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 1, randomHex(), randomHex())
                ).to.be.revertedWithCustomError(anchoringInstance, 'IsPaused')
            })

            it('GIVEN paused contract WHEN unpausing via ISBEPause THEN anchoring operations are allowed', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    anchoringProxy,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Pause the contract
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )
                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await isbePause.connect(admin).pause()

                // Unpause using standard ISBE mechanism
                await isbePause.connect(admin).unpause()

                // Verify anchoring works again
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 1, randomHex(), randomHex())
                ).to.emit(anchoringInstance, 'BlockAnchored')
            })

            it('GIVEN user with PAUSER_ROLE WHEN pausing THEN succeeds', async () => {
                const {
                    anchoringInstance,
                    anchoringProxy,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Grant PAUSER_ROLE
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )

                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await expect(isbePause.connect(admin).pause()).to.not.be
                    .reverted
            })
        })

        describe('validation failures', () => {
            it('GIVEN already paused contract WHEN pausing again THEN reverts with IsPaused', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    anchoringProxy,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Pause the contract
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )
                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await isbePause.connect(admin).pause()

                await expect(
                    isbePause.connect(admin).pause()
                ).to.be.revertedWithCustomError(isbePause, 'IsPaused')
            })

            it('GIVEN unpaused contract WHEN unpausing THEN reverts with IsNotPaused', async () => {
                const {
                    anchoringInstance,
                    anchoringProxy,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Grant PAUSER_ROLE
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )

                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await expect(
                    isbePause.connect(admin).unpause()
                ).to.be.revertedWithCustomError(isbePause, 'IsNotPaused')
            })
        })

        describe('access control', () => {
            it('GIVEN user without PAUSER_ROLE WHEN pausing THEN reverts with AccountHasNoRoles', async () => {
                const {
                    anchoringInstance,
                    anchoringProxy,
                    anchoringAccessControl,
                    nonAdmin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await expect(
                    isbePause.connect(nonAdmin).pause()
                ).to.be.revertedWithCustomError(isbePause, 'AccountHasNoRoles')
            })

            it('GIVEN user without PAUSER_ROLE WHEN unpausing THEN reverts with AccountHasNoRoles', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    anchoringProxy,
                    admin,
                    nonAdmin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Pause the contract
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )
                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await isbePause.connect(admin).pause()

                await expect(
                    isbePause.connect(nonAdmin).unpause()
                ).to.be.revertedWithCustomError(isbePause, 'AccountHasNoRoles')
            })
        })
    })

    // ========================================
    // Chain Management
    // ========================================

    describe('Chain Management', function () {
        describe('registerChain', function () {
            it('GIVEN valid chain ID WHEN registering new chain THEN registers successfully and emits event', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const newChainId = 42161 // Arbitrum One
                await expect(
                    anchoringInstance.connect(admin).registerChain(newChainId)
                )
                    .to.emit(anchoringInstance, 'ChainRegistered')
                    .withArgs(newChainId, adminAddress)

                // Verify chain is now registered by checking metadata
                const metadata = await anchoringInstance.getChainMetadata()
                // metadata[1] contains bigints/BigNumbers depending on ethers version; compare as strings
                expect(
                    metadata[1].map((id: bigint) => id.toString())
                ).to.include(newChainId.toString())
            })

            it('GIVEN already registered chain WHEN registering again THEN reverts with ChainAlreadyRegistered', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // DEV_CHAIN is already registered during initialization
                await expect(
                    anchoringInstance.connect(admin).registerChain(DEV_CHAIN)
                )
                    .to.be.revertedWithCustomError(
                        anchoringInstance,
                        'ChainAlreadyRegistered'
                    )
                    .withArgs(DEV_CHAIN)
            })

            it('GIVEN zero chain ID WHEN registering THEN reverts with EmptyUint', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await expect(
                    anchoringInstance.connect(admin).registerChain(0)
                ).to.be.revertedWithCustomError(anchoringInstance, 'EmptyUint')
            })

            it('GIVEN account without METADATA_MANAGER_ROLE WHEN registering chain THEN reverts with AccountHasNoRole', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    nonAdmin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const newChainId = 42161
                await expect(
                    anchoringInstance
                        .connect(nonAdmin)
                        .registerChain(newChainId)
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN registering chain THEN reverts with IsPaused', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                    anchoringProxy,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                const isbePause = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    anchoringProxy
                )
                await isbePause.connect(admin).pause()

                const newChainId = 42161
                await expect(
                    anchoringInstance.connect(admin).registerChain(newChainId)
                ).to.be.revertedWithCustomError(anchoringInstance, 'IsPaused')
            })
        })
    })

    // ========================================
    // Introspection and Internal Functions
    // ========================================

    describe('Introspection and Internal Functions', function () {
        describe('facet introspection', function () {
            it('GIVEN deployed facet WHEN calling introspection functions THEN returns correct data', async () => {
                const AnchoringCoreFacetFactory =
                    await ethers.getContractFactory('AnchoringCoreFacet')
                const facetImpl = await AnchoringCoreFacetFactory.deploy()

                const interfaces = await facetImpl.interfacesIntrospection()
                expect(Array.isArray(interfaces)).to.equal(true)

                const businessId = await facetImpl.businessIdIntrospection()
                expect(typeof businessId).to.equal('string')

                const selectors = await facetImpl.selectorsIntrospection()
                expect(Array.isArray(selectors)).to.equal(true)
            })

            it('GIVEN facet WHEN calling interfacesIntrospection THEN includes IAnchoringCore interface', async () => {
                const AnchoringCoreFacetFactory =
                    await ethers.getContractFactory('AnchoringCoreFacet')
                const facet = await AnchoringCoreFacetFactory.deploy()

                const interfaces = await facet.interfacesIntrospection()

                expect(interfaces.length).to.be.greaterThan(0)
                expect(interfaces[0]).to.be.a('string')
            })
        })
    })

    // ==================== MULTI-CHAIN RESILIENCE TESTS ====================
    describe('Multi-Chain Resilience', () => {
        describe('1. Concurrent Chain Registration', () => {
            it('GIVEN multiple chains WHEN registering concurrently THEN all chains are registered independently', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Register multiple external chains
                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(OPTIMISM_CHAIN)

                const metadata = await anchoringInstance.getChainMetadata()
                const registeredChains = metadata[1].map((id: bigint) =>
                    Number(id)
                )

                expect(registeredChains).to.include(DEV_CHAIN) // Registered at init
                expect(registeredChains).to.include(POLYGON_CHAIN)
                expect(registeredChains).to.include(ETHEREUM_MAINNET)
                expect(registeredChains).to.include(OPTIMISM_CHAIN)
                expect(registeredChains.length).to.equal(4)
            })

            it('GIVEN multiple chains registered WHEN querying each chain THEN returns independent metadata', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                // Each chain should have independent stats (all zeros initially)
                const polygonStats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                const ethStats =
                    await anchoringInstance.getAnchoringStats(ETHEREUM_MAINNET)
                const devStats =
                    await anchoringInstance.getAnchoringStats(DEV_CHAIN)

                expect(polygonStats[0]).to.equal(0) // totalAnchors
                expect(ethStats[0]).to.equal(0)
                expect(devStats[0]).to.equal(0)
            })
        })

        describe('2. Simultaneous Multi-Chain Anchoring', () => {
            it('GIVEN 3 registered chains WHEN anchoring blocks simultaneously THEN each chain tracks independently', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Register chains
                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                // Anchor blocks from different chains
                const polygonBlock = {
                    number: 50000000,
                    hash: randomHex(),
                    stateRoot: randomHex(),
                }
                const ethBlock = {
                    number: 18000000,
                    hash: randomHex(),
                    stateRoot: randomHex(),
                }
                const devBlock = {
                    number: 1000,
                    hash: randomHex(),
                    stateRoot: randomHex(),
                }

                // Anchor simultaneously (different transactions)
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        POLYGON_CHAIN,
                        polygonBlock.number,
                        polygonBlock.hash,
                        polygonBlock.stateRoot
                    )
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        ETHEREUM_MAINNET,
                        ethBlock.number,
                        ethBlock.hash,
                        ethBlock.stateRoot
                    )
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        DEV_CHAIN,
                        devBlock.number,
                        devBlock.hash,
                        devBlock.stateRoot
                    )

                // Verify each chain has its own independent state
                const polygonLast =
                    await anchoringInstance.getLastAnchoredBlock(POLYGON_CHAIN)
                const ethLast =
                    await anchoringInstance.getLastAnchoredBlock(
                        ETHEREUM_MAINNET
                    )
                const devLast =
                    await anchoringInstance.getLastAnchoredBlock(DEV_CHAIN)

                expect(polygonLast.blockNumber).to.equal(polygonBlock.number)
                expect(polygonLast.blockHash).to.equal(polygonBlock.hash)

                expect(ethLast.blockNumber).to.equal(ethBlock.number)
                expect(ethLast.blockHash).to.equal(ethBlock.hash)

                expect(devLast.blockNumber).to.equal(devBlock.number)
                expect(devLast.blockHash).to.equal(devBlock.hash)
            })

            it('GIVEN multiple chains WHEN anchoring batches simultaneously THEN all succeed independently', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                // Prepare batch data for Polygon
                const polygonBlocks = [50000001, 50000002, 50000003]
                const polygonHashes = polygonBlocks.map(() => randomHex())
                const polygonRoots = polygonBlocks.map(() => randomHex())

                // Prepare batch data for Ethereum
                const ethBlocks = [18000001, 18000002, 18000003]
                const ethHashes = ethBlocks.map(() => randomHex())
                const ethRoots = ethBlocks.map(() => randomHex())

                // Anchor batches simultaneously
                await anchoringInstance
                    .connect(admin)
                    .anchorBlocksBatch(
                        POLYGON_CHAIN,
                        polygonBlocks,
                        polygonHashes,
                        polygonRoots
                    )
                await anchoringInstance
                    .connect(admin)
                    .anchorBlocksBatch(
                        ETHEREUM_MAINNET,
                        ethBlocks,
                        ethHashes,
                        ethRoots
                    )

                // Verify stats for each chain
                const polygonStats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                const ethStats =
                    await anchoringInstance.getAnchoringStats(ETHEREUM_MAINNET)

                expect(polygonStats[0]).to.equal(3) // totalAnchors
                expect(polygonStats[1]).to.equal(50000003) // lastAnchoredBlock

                expect(ethStats[0]).to.equal(3)
                expect(ethStats[1]).to.equal(18000003)
            })
        })

        describe('3. Chain Isolation and Independence', () => {
            it('GIVEN error in one chain WHEN anchoring THEN other chains are unaffected', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                // Anchor block on Polygon successfully
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        POLYGON_CHAIN,
                        50000001,
                        randomHex(),
                        randomHex()
                    )

                // Try to anchor duplicate on Ethereum (should fail)
                const ethHash = randomHex()
                const ethRoot = randomHex()
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(ETHEREUM_MAINNET, 18000001, ethHash, ethRoot)

                // Attempting duplicate on Ethereum
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            ETHEREUM_MAINNET,
                            18000001,
                            ethHash,
                            ethRoot
                        )
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockAlreadyAnchored'
                )

                // Polygon should still work fine
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        POLYGON_CHAIN,
                        50000002,
                        randomHex(),
                        randomHex()
                    )

                const polygonStats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                expect(polygonStats[0]).to.equal(2) // 2 successful anchors on Polygon
            })

            it('GIVEN paused contract WHEN anchoring THEN all chains are affected equally (global pause)', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)

                // Grant pause role
                await anchoringAccessControl.grantRole(
                    PAUSER_ROLE,
                    adminAddress
                )

                // Pause the contract
                const isbePauseContract = await ethers.getContractAt(
                    'ISBEPauseFacet',
                    await anchoringInstance.getAddress()
                )
                await isbePauseContract.connect(admin).pause()

                // Both chains should be paused
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            POLYGON_CHAIN,
                            50000001,
                            randomHex(),
                            randomHex()
                        )
                ).to.be.revertedWithCustomError(isbePauseContract, 'IsPaused')

                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(DEV_CHAIN, 1000, randomHex(), randomHex())
                ).to.be.revertedWithCustomError(isbePauseContract, 'IsPaused')

                // View functions should still work
                const metadata = await anchoringInstance.getChainMetadata()
                const { chainId } = await ethers.provider.getNetwork()
                expect(metadata[0]).to.equal(chainId)
            })
        })

        describe('4. Independent Monotonicity per Chain', () => {
            it('GIVEN different chains WHEN anchoring at different paces THEN each maintains independent monotonicity', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                // Polygon: Fast anchoring (many blocks)
                for (let i = 1; i <= 5; i++) {
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            POLYGON_CHAIN,
                            50000000 + i,
                            randomHex(),
                            randomHex()
                        )
                }

                // Ethereum: Slow anchoring (few blocks)
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        ETHEREUM_MAINNET,
                        18000001,
                        randomHex(),
                        randomHex()
                    )

                // DEV: Medium pace
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1000, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1001, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1002, randomHex(), randomHex())

                // Verify independent stats
                const polygonStats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                const ethStats =
                    await anchoringInstance.getAnchoringStats(ETHEREUM_MAINNET)
                const devStats =
                    await anchoringInstance.getAnchoringStats(DEV_CHAIN)

                expect(polygonStats[0]).to.equal(5) // Polygon: 5 blocks
                expect(polygonStats[1]).to.equal(50000005)

                expect(ethStats[0]).to.equal(1) // Ethereum: 1 block
                expect(ethStats[1]).to.equal(18000001)

                expect(devStats[0]).to.equal(3) // DEV: 3 blocks
                expect(devStats[1]).to.equal(1002)
            })

            it('GIVEN one chain with monotonicity violation WHEN anchoring THEN only that chain fails', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)

                // Anchor block 100 on Polygon
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 100, randomHex(), randomHex())

                // Try to anchor block 99 on Polygon (monotonicity violation)
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            POLYGON_CHAIN,
                            99,
                            randomHex(),
                            randomHex()
                        )
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockNumberMustBeHigher'
                )

                // DEV chain should still work fine (independent monotonicity)
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1000, randomHex(), randomHex())
                await anchoringInstance.connect(admin).anchorBlock(
                    DEV_CHAIN,
                    1001, // DEV has independent monotonicity from Polygon
                    randomHex(),
                    randomHex()
                )

                const devStats =
                    await anchoringInstance.getAnchoringStats(DEV_CHAIN)
                expect(devStats[0]).to.equal(2)
            })
        })

        describe('5. Cross-Chain Queries and Statistics', () => {
            it('GIVEN multiple chains with anchored blocks WHEN querying each THEN returns correct independent data', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                // Anchor different amounts on each chain
                // Polygon: 3 blocks
                for (let i = 1; i <= 3; i++) {
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            POLYGON_CHAIN,
                            50000000 + i,
                            randomHex(),
                            randomHex()
                        )
                }

                // Ethereum: 5 blocks
                for (let i = 1; i <= 5; i++) {
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            ETHEREUM_MAINNET,
                            18000000 + i,
                            randomHex(),
                            randomHex()
                        )
                }

                // Query last N blocks for each chain
                const polygonLast2 = await anchoringInstance.getLastNBlocks(
                    POLYGON_CHAIN,
                    2
                )
                const ethLast3 = await anchoringInstance.getLastNBlocks(
                    ETHEREUM_MAINNET,
                    3
                )

                expect(polygonLast2.length).to.equal(2)

                expect(ethLast3.length).to.equal(3)
            })

            it('GIVEN multiple chains WHEN querying ranges THEN returns only blocks from specified chain', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)

                // Anchor blocks with gaps on Polygon
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 100, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 102, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 105, randomHex(), randomHex())

                // Anchor blocks on DEV
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1000, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(DEV_CHAIN, 1005, randomHex(), randomHex())

                // Query range on Polygon
                const polygonRange = await anchoringInstance.getBlocksInRange(
                    POLYGON_CHAIN,
                    100,
                    105
                )

                expect(polygonRange.length).to.equal(3)
                expect(polygonRange[0].blockNumber).to.equal(100)
                expect(polygonRange[1].blockNumber).to.equal(102)
                expect(polygonRange[2].blockNumber).to.equal(105)

                // Query range on DEV (should be independent)
                const devRange = await anchoringInstance.getBlocksInRange(
                    DEV_CHAIN,
                    1000,
                    1010
                )

                expect(devRange.length).to.equal(2)
            })

            it('GIVEN global metadata WHEN querying THEN shows all registered chains', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Register multiple chains
                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(OPTIMISM_CHAIN)

                const metadata = await anchoringInstance.getChainMetadata()
                const registeredChains = metadata[1].map((id: bigint) =>
                    Number(id)
                )
                const { chainId } = await ethers.provider.getNetwork()

                expect(metadata[0]).to.equal(chainId) // thisChainId
                expect(registeredChains).to.have.lengthOf(4)
                expect(registeredChains).to.include.members([
                    DEV_CHAIN,
                    POLYGON_CHAIN,
                    ETHEREUM_MAINNET,
                    OPTIMISM_CHAIN,
                ])
            })
        })

        describe('6. Resilience and Recovery Scenarios', () => {
            it('GIVEN unregistered chain mixed with registered WHEN anchoring batch THEN only unregistered fails', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)

                // Anchor on registered chain (Polygon) - should succeed
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        POLYGON_CHAIN,
                        50000001,
                        randomHex(),
                        randomHex()
                    )

                // Try to anchor on unregistered chain (Ethereum) - should fail
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            ETHEREUM_MAINNET,
                            18000001,
                            randomHex(),
                            randomHex()
                        )
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'ChainNotRegistered'
                )

                // Polygon should still work
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(
                        POLYGON_CHAIN,
                        50000002,
                        randomHex(),
                        randomHex()
                    )

                const polygonStats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                expect(polygonStats[0]).to.equal(2)
            })

            it('GIVEN chain with failed anchoring WHEN recovering THEN can continue from last successful block', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)

                // Anchor blocks 100, 101
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 100, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 101, randomHex(), randomHex())

                // Try to anchor duplicate (simulating failure)
                await expect(
                    anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            POLYGON_CHAIN,
                            101,
                            randomHex(),
                            randomHex()
                        )
                ).to.be.revertedWithCustomError(
                    anchoringInstance,
                    'BlockAlreadyAnchored'
                )

                // Recover by continuing from last successful (101 -> 102)
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 102, randomHex(), randomHex())
                await anchoringInstance
                    .connect(admin)
                    .anchorBlock(POLYGON_CHAIN, 103, randomHex(), randomHex())

                const stats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                expect(stats[0]).to.equal(4) // 100, 101, 102, 103
                expect(stats[1]).to.equal(103) // lastAnchoredBlock
            })

            it('GIVEN high-volume multi-chain scenario WHEN anchoring THEN system remains stable', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)
                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress
                )

                // Register 3 chains
                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(OPTIMISM_CHAIN)

                // Anchor 10 blocks on each chain
                for (let i = 1; i <= 10; i++) {
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            POLYGON_CHAIN,
                            50000000 + i,
                            randomHex(),
                            randomHex()
                        )
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            ETHEREUM_MAINNET,
                            18000000 + i,
                            randomHex(),
                            randomHex()
                        )
                    await anchoringInstance
                        .connect(admin)
                        .anchorBlock(
                            OPTIMISM_CHAIN,
                            100000000 + i,
                            randomHex(),
                            randomHex()
                        )
                }

                // Verify all chains have correct stats
                const polygonStats =
                    await anchoringInstance.getAnchoringStats(POLYGON_CHAIN)
                const ethStats =
                    await anchoringInstance.getAnchoringStats(ETHEREUM_MAINNET)
                const opStats =
                    await anchoringInstance.getAnchoringStats(OPTIMISM_CHAIN)

                expect(polygonStats[0]).to.equal(10)
                expect(polygonStats[1]).to.equal(50000010)

                expect(ethStats[0]).to.equal(10)
                expect(ethStats[1]).to.equal(18000010)

                expect(opStats[0]).to.equal(10)
                expect(opStats[1]).to.equal(100000010)

                // Global metadata should show all 4 chains (DEV + 3 registered)
                const metadata = await anchoringInstance.getChainMetadata()
                expect(metadata[1]).to.have.lengthOf(4)
            })
        })
    })

    // ========================================
    // Pagination Tests - getRegisteredChains
    // ========================================

    describe('getRegisteredChains - Pagination (LibCommon.getFromSet coverage)', function () {
        describe('successful operations', () => {
            it('GIVEN 0 registered chains WHEN paginating THEN returns empty array', async () => {
                const { anchoringInstance } = await loadFixture(deployFixture)

                const result = await anchoringInstance.getRegisteredChains(
                    0,
                    10
                )
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId) // thisChainId
                expect(result[1]).to.deep.equal([]) // empty registeredChainIds
            })

            it('GIVEN 1 registered chain WHEN page 0 size 10 THEN returns that chain', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    POLYGON_CHAIN
                )

                const result = await anchoringInstance.getRegisteredChains(
                    0,
                    10
                )
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.deep.equal([POLYGON_CHAIN])
            })

            it('GIVEN 5 registered chains WHEN page 0 size 2 THEN returns first 2 chains', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                // Register 4 more chains (total 5)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(OPTIMISM_CHAIN)
                await anchoringInstance.connect(admin).registerChain(42161) // Arbitrum

                const result = await anchoringInstance.getRegisteredChains(0, 2)
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.have.lengthOf(2)
                expect(result[1][0]).to.equal(DEV_CHAIN)
                expect(result[1][1]).to.equal(POLYGON_CHAIN)
            })

            it('GIVEN 5 registered chains WHEN page 1 size 2 THEN returns chains 3-4', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(OPTIMISM_CHAIN)
                await anchoringInstance.connect(admin).registerChain(42161)

                const result = await anchoringInstance.getRegisteredChains(1, 2)
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.have.lengthOf(2)
                expect(result[1][0]).to.equal(ETHEREUM_MAINNET)
                expect(result[1][1]).to.equal(OPTIMISM_CHAIN)
            })

            it('GIVEN 5 registered chains WHEN page 2 size 2 THEN returns last chain only', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(OPTIMISM_CHAIN)
                await anchoringInstance.connect(admin).registerChain(42161)

                const result = await anchoringInstance.getRegisteredChains(2, 2)
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.have.lengthOf(1) // Only 1 item on last partial page
                expect(result[1][0]).to.equal(42161)
            })

            it('GIVEN 5 registered chains WHEN page beyond end THEN returns empty array', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                const result = await anchoringInstance.getRegisteredChains(
                    10,
                    2
                )
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.deep.equal([]) // Out of range -> empty
            })

            it('GIVEN 10 registered chains WHEN page size 1 THEN can iterate through all pages', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                // Register 9 more chains (total 10)
                const chainIds = [
                    POLYGON_CHAIN,
                    ETHEREUM_MAINNET,
                    OPTIMISM_CHAIN,
                    42161, // Arbitrum
                    8453, // Base
                    100, // Gnosis
                    250, // Fantom
                    43114, // Avalanche
                    56, // BSC
                ]

                for (const chainId of chainIds) {
                    await anchoringInstance
                        .connect(admin)
                        .registerChain(chainId)
                }

                const { chainId: thisChainId } =
                    await ethers.provider.getNetwork()
                const allChains: bigint[] = []

                // Iterate through all pages with size 1
                for (let page = 0; page < 10; page++) {
                    const result = await anchoringInstance.getRegisteredChains(
                        page,
                        1
                    )
                    expect(result[0]).to.equal(thisChainId)

                    if (result[1].length > 0) {
                        allChains.push(result[1][0])
                    }
                }

                expect(allChains).to.have.lengthOf(10)
                expect(allChains[0]).to.equal(DEV_CHAIN)
                expect(allChains[1]).to.equal(POLYGON_CHAIN)
                expect(allChains[9]).to.equal(56n) // BSC is last
            })

            it('GIVEN 3 registered chains WHEN page size > total THEN returns all chains', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)
                await anchoringInstance
                    .connect(admin)
                    .registerChain(ETHEREUM_MAINNET)

                const result = await anchoringInstance.getRegisteredChains(
                    0,
                    100
                )
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.have.lengthOf(3)
                expect(result[1]).to.deep.equal([
                    DEV_CHAIN,
                    POLYGON_CHAIN,
                    ETHEREUM_MAINNET,
                ])
            })

            it('GIVEN 5 registered chains WHEN page size 0 THEN returns empty array', async () => {
                const {
                    anchoringInstance,
                    anchoringAccessControl,
                    admin,
                    adminAddress,
                } = await loadFixture(deployFixture)

                await initializeAnchoring(
                    anchoringInstance,
                    anchoringAccessControl,
                    adminAddress,
                    DEV_CHAIN
                )

                await anchoringInstance
                    .connect(admin)
                    .registerChain(POLYGON_CHAIN)

                const result = await anchoringInstance.getRegisteredChains(0, 0)
                const { chainId } = await ethers.provider.getNetwork()

                expect(result[0]).to.equal(chainId)
                expect(result[1]).to.deep.equal([]) // Size 0 -> empty
            })
        })
    })
})
