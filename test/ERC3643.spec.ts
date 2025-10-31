import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import '@nomicfoundation/hardhat-chai-matchers'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import {
    METADATA_ROLE,
    FREEZE_ROLE,
    PAUSER_ROLE,
    CONTROLLER_ROLE,
    MINTER_ROLE,
    CAP_ROLE,
    RECOVERY_ROLE,
    COMPLIANCE_ROLE,
} from './constants'
import {
    IERC3643,
    AccessControl,
    ERC20,
    ISBEPause,
    IERC203643Controller,
    IERC203643Capped,
    ERC3643ComplianceFacet,
} from '../typechain-types'
;('../typechain-types')

describe('ERC3643 Token', function () {
    // ====================================================================
    // GLOBAL VARIABLES
    // ====================================================================
    let owner: Signer
    let alice: Signer
    let ownerAddress: string
    let aliceAddress: string
    let erc3643: IERC3643
    let accessControlFacet: AccessControl
    let erc20Facet: ERC20
    let pauseFacet: ISBEPause

    let proxyAddress: string

    const tokenName = 'My3643'
    const tokenSymbol = 'MYX'
    const tokenDecimals = 18
    const version = '3.0.0'
    const emptyString = ''

    // ====================================================================
    // COMMON FIXTURES
    // ====================================================================
    async function deployInitialConfiguration() {
        const signers = await ethers.getSigners()
        owner = signers[0] as unknown as Signer
        alice = signers[1] as unknown as Signer

        ownerAddress = await owner.getAddress()
        aliceAddress = await alice.getAddress()

        const result = await deployGovernance(
            owner,
            [],
            CONFIGURATION_ID_ERC3643,
            false,
            '0x',
            [],
            [],
            false
        )

        // The Diamond proxy contain all ERC3643 facets through the same address
        proxyAddress = await result.useCaseProxy
        erc3643 = (await ethers.getContractAt(
            'IERC3643',
            proxyAddress
        )) as IERC3643

        accessControlFacet = result.accessControl
        erc20Facet = result.erc20
        pauseFacet = result.pause
    }

    beforeEach(async () => {
        await loadFixture(deployInitialConfiguration)
    })

    // ====================================================================
    // METADATA MODULE
    // ====================================================================
    describe('ERC3643 Metadata', () => {
        // --------------------------------------------------------------------
        // when ERC20 not initialized
        // --------------------------------------------------------------------
        describe('when ERC20 not initialized', () => {
            beforeEach(async () => {
                const fixture = async () => {
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(METADATA_ROLE, ownerAddress)
                }
                await loadFixture(fixture)
            })

            describe('InitializeERC3643Metadata', () => {
                it('GIVEN ERC20 not initialized WHEN initializeERC3643Metadata with empty version THEN reverts', async () => {
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(emptyString)
                    ).to.be.reverted
                })

                it('GIVEN metadata already initialized WHEN initializeERC3643Metadata again THEN reverts', async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(version)
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                    ).to.be.reverted
                })

                it('GIVEN ERC20 not initialized WHEN initializeERC3643Metadata THEN emits UpdatedTokenInformation with empty values', async () => {
                    expect(await erc20Facet.name()).to.equal('')
                    expect(await erc20Facet.symbol()).to.equal('')
                    expect(await erc20Facet.decimals()).to.equal(0)

                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                    )
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs('', '', 0, version)

                    expect(await erc3643.version()).to.equal(version)
                })
            })
        })

        // --------------------------------------------------------------------
        // when ERC20 is initialized
        // --------------------------------------------------------------------
        describe('when ERC20 is initialized', () => {
            beforeEach(async () => {
                const fixture = async () => {
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(METADATA_ROLE, ownerAddress)
                    await erc20Facet
                        .connect(owner)
                        .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                    expect(await erc20Facet.name()).to.equal(tokenName)
                    expect(await erc20Facet.symbol()).to.equal(tokenSymbol)
                    expect(await erc20Facet.decimals()).to.equal(tokenDecimals)
                }
                await loadFixture(fixture)
            })

            describe('InitializeERC3643Metadata', () => {
                it('GIVEN ERC20 initialized WHEN initializeERC3643Metadata with empty version THEN reverts', async () => {
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(emptyString)
                    ).to.be.reverted
                })

                it('GIVEN ERC20 initialized WHEN initializeERC3643Metadata THEN emits UpdatedTokenInformation with ERC20 values', async () => {
                    const n = await erc20Facet.name()
                    const s = await erc20Facet.symbol()
                    const d = await erc20Facet.decimals()

                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                    )
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs(n, s, d, version)
                })
            })

            describe('setName', () => {
                beforeEach(async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(version)
                })

                it('GIVEN no TOKEN_OWNER_ROLE WHEN setName THEN reverts', async () => {
                    await accessControlFacet
                        .connect(owner)
                        .revokeRole(METADATA_ROLE, ownerAddress)
                    await expect(erc3643.connect(owner).setName('Nope')).to.be
                        .reverted
                })

                it('GIVEN contract paused WHEN setName THEN reverts', async () => {
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(PAUSER_ROLE, ownerAddress)
                    await pauseFacet.connect(owner).pause()
                    await expect(erc3643.connect(owner).setName('Paused')).to.be
                        .reverted
                })

                it('GIVEN initialized metadata WHEN setName with empty string THEN reverts', async () => {
                    await expect(erc3643.connect(owner).setName(emptyString)).to
                        .be.reverted
                })

                it('GIVEN initialized metadata WHEN setName with valid value THEN updates name and emits UpdatedTokenInformation', async () => {
                    const newName = 'New3643'
                    const s = await erc20Facet.symbol()
                    const d = await erc20Facet.decimals()

                    await expect(erc3643.connect(owner).setName(newName))
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs(newName, s, d, await erc3643.version())

                    expect(await erc20Facet.name()).to.equal(newName)
                })
            })

            describe('setSymbol', () => {
                beforeEach(async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(version)
                })

                it('GIVEN no TOKEN_OWNER_ROLE WHEN setSymbol THEN reverts', async () => {
                    await accessControlFacet
                        .connect(owner)
                        .revokeRole(METADATA_ROLE, ownerAddress)
                    await expect(erc3643.connect(owner).setSymbol('NOPE')).to.be
                        .reverted
                })

                it('GIVEN contract paused WHEN setSymbol THEN reverts', async () => {
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(PAUSER_ROLE, ownerAddress)
                    await pauseFacet.connect(owner).pause()
                    await expect(erc3643.connect(owner).setSymbol('ZZZ')).to.be
                        .reverted
                })

                it('GIVEN initialized metadata WHEN setSymbol with empty string THEN reverts', async () => {
                    await expect(erc3643.connect(owner).setSymbol(emptyString))
                        .to.be.reverted
                })

                it('GIVEN initialized metadata WHEN setSymbol with valid value THEN updates symbol and emits UpdatedTokenInformation', async () => {
                    const newSymbol = 'NMYX'
                    const n = await erc20Facet.name()
                    const d = await erc20Facet.decimals()

                    await expect(erc3643.connect(owner).setSymbol(newSymbol))
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs(n, newSymbol, d, await erc3643.version())

                    expect(await erc20Facet.symbol()).to.equal(newSymbol)
                })
            })

            describe('getters', () => {
                it('GIVEN initialized metadata WHEN call getters THEN return stored values', async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(version)
                    expect(await erc3643.version()).to.equal(version)
                })
            })
        })
    })

    // ====================================================================
    // FREEZE MODULE
    // ====================================================================
    describe('ERC3643 Freeze', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(FREEZE_ROLE, ownerAddress)
            }
            await loadFixture(fixture)
        })

        describe('setAddressFrozen', () => {
            it('GIVEN no TOKEN_AGENT_ROLE WHEN setAddressFrozen THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(FREEZE_ROLE, ownerAddress)

                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, true)
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN setAddressFrozen THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, true)
                ).to.be.reverted
            })

            it('GIVEN already frozen WHEN setAddressFrozen(true) again THEN event emitted and still frozen', async () => {
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, true)

                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, true)
                )
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, true, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)
            })

            it('GIVEN valid input WHEN setAddressFrozen true THEN account is frozen and event emitted', async () => {
                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, true)
                )
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, true, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)
            })

            it('GIVEN frozen account WHEN setAddressFrozen false THEN account is unfrozen and event emitted', async () => {
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, true)

                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, false)
                )
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, false, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(false)
            })

            it('GIVEN already frozen WHEN setAddressFrozen true again THEN stays frozen and emits event', async () => {
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, true)

                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, true)
                )
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, true, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)
            })

            it('GIVEN already unfrozen WHEN setAddressFrozen false again THEN stays unfrozen and emits event', async () => {
                await expect(
                    erc3643.connect(owner).setAddressFrozen(aliceAddress, false)
                )
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, false, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(false)
            })
        })

        describe('freezePartialTokens / unfreezePartialTokens', () => {
            const amount = 100n

            it('GIVEN no TOKEN_AGENT_ROLE WHEN freezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(FREEZE_ROLE, ownerAddress)

                await expect(
                    erc3643
                        .connect(owner)
                        .freezePartialTokens(aliceAddress, amount)
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN freezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643
                        .connect(owner)
                        .freezePartialTokens(aliceAddress, amount)
                ).to.be.reverted
            })
            it('GIVEN no TOKEN_AGENT_ROLE WHEN unfreezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(FREEZE_ROLE, ownerAddress)

                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 10n)
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN unfreezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 10n)
                ).to.be.reverted
            })

            it('GIVEN no frozen tokens WHEN unfreezePartialTokens THEN reverts', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 10n)
                ).to.be.reverted
            })
            it('GIVEN no frozen tokens WHEN unfreezePartialTokens(0) THEN succeeds and emits', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 0n)
                )
                    .to.emit(erc3643, 'TokensUnfrozen')
                    .withArgs(aliceAddress, 0n)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(0n)
            })
            it('GIVEN valid address WHEN freezePartialTokens THEN tokens are frozen and event emitted', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .freezePartialTokens(aliceAddress, amount)
                )
                    .to.emit(erc3643, 'TokensFrozen')
                    .withArgs(aliceAddress, amount)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    amount
                )
            })
            it('GIVEN frozen tokens WHEN unfreezePartialTokens(0) THEN no change but event emitted', async () => {
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, 50n)

                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 0n)
                )
                    .to.emit(erc3643, 'TokensUnfrozen')
                    .withArgs(aliceAddress, 0n)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    50n
                )
            })

            it('GIVEN frozen tokens WHEN unfreezePartialTokens THEN tokens reduced and event emitted', async () => {
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, amount)

                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 40n)
                )
                    .to.emit(erc3643, 'TokensUnfrozen')
                    .withArgs(aliceAddress, 40n)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    60n
                )
            })

            it('GIVEN frozen tokens WHEN unfreeze all THEN balance returns to zero', async () => {
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, amount)

                await erc3643
                    .connect(owner)
                    .unfreezePartialTokens(aliceAddress, amount)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(0n)
            })

            it('GIVEN frozen tokens WHEN unfreeze more than frozen THEN reverts', async () => {
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, 50n)

                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 100n)
                ).to.be.reverted
            })

            it('GIVEN multiple freezes WHEN freezePartialTokens THEN totals accumulate', async () => {
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, 30n)
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, 20n)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    50n
                )
            })

            it('GIVEN amount 0 WHEN freezePartialTokens THEN no effect but event emitted', async () => {
                await expect(
                    erc3643.connect(owner).freezePartialTokens(aliceAddress, 0n)
                )
                    .to.emit(erc3643, 'TokensFrozen')
                    .withArgs(aliceAddress, 0n)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(0n)
            })

            it('GIVEN amount 0 WHEN unfreezePartialTokens THEN no effect but event emitted', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .unfreezePartialTokens(aliceAddress, 0n)
                )
                    .to.emit(erc3643, 'TokensUnfrozen')
                    .withArgs(aliceAddress, 0n)

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(0n)
            })
        })

        describe('batchSetAddressFrozen', () => {
            let bob: Signer
            let charlie: Signer
            let bobAddress: string
            let charlieAddress: string

            beforeEach(async () => {
                const fixture = async () => {
                    const signers = await ethers.getSigners()
                    bob = signers[2] as unknown as Signer
                    charlie = signers[3] as unknown as Signer
                    bobAddress = await bob.getAddress()
                    charlieAddress = await charlie.getAddress()
                }
                await loadFixture(fixture)
            })

            it('GIVEN no FREEZE_ROLE WHEN batchSetAddressFrozen THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(FREEZE_ROLE, ownerAddress)

                await expect(
                    erc3643
                        .connect(owner)
                        .batchSetAddressFrozen([aliceAddress], [true])
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN batchSetAddressFrozen THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643
                        .connect(owner)
                        .batchSetAddressFrozen([aliceAddress], [true])
                ).to.be.reverted
            })

            it('GIVEN arrays length mismatch WHEN batchSetAddressFrozen THEN reverts', async () => {
                const addresses = [aliceAddress, bobAddress]
                const freezeStates = [true]
                await expect(
                    erc3643
                        .connect(owner)
                        .batchSetAddressFrozen(addresses, freezeStates)
                ).to.be.revertedWithCustomError(
                    erc20Facet,
                    'NotSameLengthArray'
                )
            })

            it('GIVEN empty arrays WHEN batchSetAddressFrozen THEN succeeds without operations', async () => {
                await expect(
                    erc3643.connect(owner).batchSetAddressFrozen([], [])
                ).to.not.be.reverted
            })

            it('GIVEN valid batch WHEN batchSetAddressFrozen THEN succeeds and emits multiple AddressFrozen events', async () => {
                const addresses = [aliceAddress, bobAddress, charlieAddress]
                const freezeStates = [true, false, true]

                const tx = await erc3643
                    .connect(owner)
                    .batchSetAddressFrozen(addresses, freezeStates)

                await expect(tx)
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, true, ownerAddress)

                await expect(tx)
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(bobAddress, false, ownerAddress)

                await expect(tx)
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(charlieAddress, true, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)
                expect(await erc3643.isFrozen(bobAddress)).to.equal(false)
                expect(await erc3643.isFrozen(charlieAddress)).to.equal(true)
            })

            it('GIVEN large batch WHEN batchSetAddressFrozen THEN succeeds', async () => {
                const batchSize = 50
                const addresses = []
                const freezeStates = []

                for (let i = 0; i < batchSize; i++) {
                    const wallet = ethers.Wallet.createRandom()
                    addresses.push(wallet.address)
                    freezeStates.push(i % 2 === 0) // Alternate true/false
                }

                await expect(
                    erc3643
                        .connect(owner)
                        .batchSetAddressFrozen(addresses, freezeStates)
                ).to.not.be.reverted
            })

            it('GIVEN already frozen addresses WHEN batchSetAddressFrozen with same state THEN succeeds and emits events', async () => {
                // First freeze alice
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, true)
                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)

                // Batch freeze alice again (already frozen)
                const tx = await erc3643
                    .connect(owner)
                    .batchSetAddressFrozen([aliceAddress], [true])

                await expect(tx)
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, true, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)
            })

            it('GIVEN mixed frozen and unfrozen addresses WHEN batchSetAddressFrozen THEN updates all correctly', async () => {
                // Setup: freeze alice, leave bob unfrozen
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, true)

                // Batch operation: unfreeze alice, freeze bob
                const addresses = [aliceAddress, bobAddress]
                const freezeStates = [false, true]

                const tx = await erc3643
                    .connect(owner)
                    .batchSetAddressFrozen(addresses, freezeStates)

                await expect(tx)
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(aliceAddress, false, ownerAddress)

                await expect(tx)
                    .to.emit(erc3643, 'AddressFrozen')
                    .withArgs(bobAddress, true, ownerAddress)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(false)
                expect(await erc3643.isFrozen(bobAddress)).to.equal(true)
            })
        })

        describe('batchFreezePartialTokens', () => {
            let erc3643Capped: IERC203643Capped
            let bob: Signer
            let charlie: Signer
            let bobAddress: string
            let charlieAddress: string

            beforeEach(async () => {
                const fixture = async () => {
                    const signers = await ethers.getSigners()
                    bob = signers[2] as unknown as Signer
                    charlie = signers[3] as unknown as Signer
                    bobAddress = await bob.getAddress()
                    charlieAddress = await charlie.getAddress()

                    // Get Capped interface
                    erc3643Capped = (await ethers.getContractAt(
                        'IERC203643Capped',
                        proxyAddress
                    )) as unknown as IERC203643Capped

                    // Grant necessary roles
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(MINTER_ROLE, ownerAddress)
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(CAP_ROLE, ownerAddress)

                    // Initialize cap before minting
                    await erc3643Capped.connect(owner).initializeCap('10000')

                    // Mint tokens to alice, bob, and charlie
                    await erc3643Capped
                        .connect(owner)
                        .mint(aliceAddress, '1000')
                    await erc3643Capped.connect(owner).mint(bobAddress, '1000')
                    await erc3643Capped
                        .connect(owner)
                        .mint(charlieAddress, '1000')
                }
                await loadFixture(fixture)
            })

            it('GIVEN no FREEZE_ROLE WHEN batchFreezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(FREEZE_ROLE, ownerAddress)

                await expect(
                    erc3643
                        .connect(owner)
                        .batchFreezePartialTokens([aliceAddress], ['100'])
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN batchFreezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643
                        .connect(owner)
                        .batchFreezePartialTokens([aliceAddress], ['100'])
                ).to.be.reverted
            })

            it('GIVEN arrays length mismatch WHEN batchFreezePartialTokens THEN reverts', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .batchFreezePartialTokens(
                            [aliceAddress, bobAddress],
                            ['100']
                        )
                ).to.be.revertedWithCustomError(
                    erc20Facet,
                    'NotSameLengthArray'
                )
            })

            it('GIVEN empty arrays WHEN batchFreezePartialTokens THEN succeeds without operations', async () => {
                const initialFrozen =
                    await erc3643.getFrozenTokens(aliceAddress)

                await erc3643.connect(owner).batchFreezePartialTokens([], [])

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    initialFrozen
                )
            })

            it('GIVEN valid batch WHEN batchFreezePartialTokens THEN succeeds and emits multiple TokensFrozen events', async () => {
                const freezeAmount1 = '200'
                const freezeAmount2 = '150'

                const tx = await erc3643
                    .connect(owner)
                    .batchFreezePartialTokens(
                        [aliceAddress, bobAddress],
                        [freezeAmount1, freezeAmount2]
                    )

                // Check TokensFrozen events
                await expect(tx)
                    .to.emit(erc3643, 'TokensFrozen')
                    .withArgs(aliceAddress, freezeAmount1)

                await expect(tx)
                    .to.emit(erc3643, 'TokensFrozen')
                    .withArgs(bobAddress, freezeAmount2)

                // Verify frozen tokens increased
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    '200'
                )
                expect(await erc3643.getFrozenTokens(bobAddress)).to.equal(
                    '150'
                )
            })

            // Note: freezePartialTokens does NOT validate against balance
            // It only increments frozen amount. Validation happens on transfer.

            it('GIVEN large batch WHEN batchFreezePartialTokens THEN succeeds', async () => {
                // Create 5 accounts with tokens
                const signers = await ethers.getSigners()
                const batchSize = 5
                const addresses: string[] = []
                const amounts: string[] = []

                for (let i = 0; i < batchSize; i++) {
                    const signer = signers[4 + i] as unknown as Signer
                    const address = await signer.getAddress()
                    addresses.push(address)
                    amounts.push('50')

                    await erc3643Capped.connect(owner).mint(address, '200')
                }

                await erc3643
                    .connect(owner)
                    .batchFreezePartialTokens(addresses, amounts)

                // Verify each freeze
                for (let i = 0; i < batchSize; i++) {
                    expect(
                        await erc3643.getFrozenTokens(addresses[i])
                    ).to.equal('50')
                }
            })

            it('GIVEN same address multiple times WHEN batchFreezePartialTokens THEN processes each independently', async () => {
                const amount1 = '100'
                const amount2 = '150'

                await erc3643.connect(owner).batchFreezePartialTokens(
                    [aliceAddress, aliceAddress], // Same address twice
                    [amount1, amount2]
                )

                // Alice should have both amounts frozen: 100 + 150 = 250
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    '250'
                )
            })

            it('GIVEN zero amount WHEN batchFreezePartialTokens THEN succeeds and emits event', async () => {
                const tx = await erc3643
                    .connect(owner)
                    .batchFreezePartialTokens([aliceAddress], ['0'])

                await expect(tx)
                    .to.emit(erc3643, 'TokensFrozen')
                    .withArgs(aliceAddress, '0')

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    '0'
                )
            })
        })

        describe('batchUnfreezePartialTokens', () => {
            let erc3643Capped: IERC203643Capped
            let bob: Signer
            let charlie: Signer
            let bobAddress: string
            let charlieAddress: string

            beforeEach(async () => {
                const fixture = async () => {
                    const signers = await ethers.getSigners()
                    bob = signers[2] as unknown as Signer
                    charlie = signers[3] as unknown as Signer
                    bobAddress = await bob.getAddress()
                    charlieAddress = await charlie.getAddress()

                    // Get Capped interface
                    erc3643Capped = (await ethers.getContractAt(
                        'IERC203643Capped',
                        proxyAddress
                    )) as unknown as IERC203643Capped

                    // Grant necessary roles
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(MINTER_ROLE, ownerAddress)
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(CAP_ROLE, ownerAddress)

                    // Initialize cap before minting
                    await erc3643Capped.connect(owner).initializeCap('10000')

                    // Mint tokens to alice, bob, and charlie
                    await erc3643Capped
                        .connect(owner)
                        .mint(aliceAddress, '1000')
                    await erc3643Capped.connect(owner).mint(bobAddress, '1000')
                    await erc3643Capped
                        .connect(owner)
                        .mint(charlieAddress, '1000')

                    // Freeze some tokens for testing
                    await erc3643
                        .connect(owner)
                        .freezePartialTokens(aliceAddress, '500')
                    await erc3643
                        .connect(owner)
                        .freezePartialTokens(bobAddress, '300')
                    await erc3643
                        .connect(owner)
                        .freezePartialTokens(charlieAddress, '400')
                }
                await loadFixture(fixture)
            })

            it('GIVEN no FREEZE_ROLE WHEN batchUnfreezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(FREEZE_ROLE, ownerAddress)

                await expect(
                    erc3643
                        .connect(owner)
                        .batchUnfreezePartialTokens([aliceAddress], ['100'])
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN batchUnfreezePartialTokens THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643
                        .connect(owner)
                        .batchUnfreezePartialTokens([aliceAddress], ['100'])
                ).to.be.reverted
            })

            it('GIVEN arrays length mismatch WHEN batchUnfreezePartialTokens THEN reverts', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .batchUnfreezePartialTokens(
                            [aliceAddress, bobAddress],
                            ['100']
                        )
                ).to.be.revertedWithCustomError(
                    erc20Facet,
                    'NotSameLengthArray'
                )
            })

            it('GIVEN empty arrays WHEN batchUnfreezePartialTokens THEN succeeds without operations', async () => {
                const initialFrozen =
                    await erc3643.getFrozenTokens(aliceAddress)

                await erc3643.connect(owner).batchUnfreezePartialTokens([], [])

                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    initialFrozen
                )
            })

            it('GIVEN valid batch WHEN batchUnfreezePartialTokens THEN succeeds and emits multiple TokensUnfrozen events', async () => {
                const unfreezeAmount1 = '200'
                const unfreezeAmount2 = '150'

                const tx = await erc3643
                    .connect(owner)
                    .batchUnfreezePartialTokens(
                        [aliceAddress, bobAddress],
                        [unfreezeAmount1, unfreezeAmount2]
                    )

                // Check TokensUnfrozen events
                await expect(tx)
                    .to.emit(erc3643, 'TokensUnfrozen')
                    .withArgs(aliceAddress, unfreezeAmount1)

                await expect(tx)
                    .to.emit(erc3643, 'TokensUnfrozen')
                    .withArgs(bobAddress, unfreezeAmount2)

                // Verify frozen tokens decreased
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    '300'
                ) // 500 - 200
                expect(await erc3643.getFrozenTokens(bobAddress)).to.equal(
                    '150'
                ) // 300 - 150
            })

            it('GIVEN unfreeze amount exceeds frozen WHEN batchUnfreezePartialTokens THEN reverts entire batch', async () => {
                const validAmount = '100'
                const excessiveAmount = '600' // Bob only has 300 frozen

                await expect(
                    erc3643
                        .connect(owner)
                        .batchUnfreezePartialTokens(
                            [aliceAddress, bobAddress],
                            [validAmount, excessiveAmount]
                        )
                ).to.be.reverted

                // Verify no tokens were unfrozen (atomic operation)
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    '500'
                )
                expect(await erc3643.getFrozenTokens(bobAddress)).to.equal(
                    '300'
                )
            })

            it('GIVEN large batch WHEN batchUnfreezePartialTokens THEN succeeds', async () => {
                // Create 5 accounts with frozen tokens
                const signers = await ethers.getSigners()
                const batchSize = 5
                const addresses: string[] = []
                const amounts: string[] = []

                for (let i = 0; i < batchSize; i++) {
                    const signer = signers[4 + i] as unknown as Signer
                    const address = await signer.getAddress()
                    addresses.push(address)
                    amounts.push('50')

                    await erc3643Capped.connect(owner).mint(address, '200')
                    await erc3643
                        .connect(owner)
                        .freezePartialTokens(address, '100')
                }

                await erc3643
                    .connect(owner)
                    .batchUnfreezePartialTokens(addresses, amounts)

                // Verify each unfreeze
                for (let i = 0; i < batchSize; i++) {
                    expect(
                        await erc3643.getFrozenTokens(addresses[i])
                    ).to.equal('50') // 100 - 50
                }
            })

            it('GIVEN same address multiple times WHEN batchUnfreezePartialTokens THEN processes each independently', async () => {
                const amount1 = '100'
                const amount2 = '150'

                await erc3643.connect(owner).batchUnfreezePartialTokens(
                    [aliceAddress, aliceAddress], // Same address twice
                    [amount1, amount2]
                )

                // Alice should have both amounts unfrozen: 500 - 100 - 150 = 250
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    '250'
                )
            })
        })

        describe('getters', () => {
            it('GIVEN never frozen WHEN call getters THEN return defaults', async () => {
                expect(await erc3643.isFrozen(aliceAddress)).to.equal(false)
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(0n)
            })

            it('GIVEN full freeze and partial freeze WHEN call getters THEN both reflected', async () => {
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, true)
                await erc3643
                    .connect(owner)
                    .freezePartialTokens(aliceAddress, 25n)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(true)
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    25n
                )

                // unfreeze address, tokens remain
                await erc3643
                    .connect(owner)
                    .setAddressFrozen(aliceAddress, false)

                expect(await erc3643.isFrozen(aliceAddress)).to.equal(false)
                expect(await erc3643.getFrozenTokens(aliceAddress)).to.equal(
                    25n
                )
            })
        })
    })
    // ====================================================================
    // CONTROLLER MODULE
    // ====================================================================
    describe('ERC3643 Controller', () => {
        // --------------------------------------------------------------------
        // when ERC3643 is NOT initialized
        // --------------------------------------------------------------------
        describe('when Mode ERC20', () => {
            //** ERC20 module test cover its main use cases. We reserve this space for future implementations that may involve ERC20 behavior not expected by its standard implementation and caused by futures interactions with any logic change from ERC3643 Controller */
        })

        // --------------------------------------------------------------------
        // when ERC3643 is initialized
        // --------------------------------------------------------------------
        describe('when Mode ERC3643', () => {

            describe('when Mode compliance is not active',() => {
                const totalBalance = 1000n
                const frozenAmount = 400n
                const freeBalance = totalBalance - frozenAmount // 600n
                const totalBalanceStr = '1000'
                const frozenAmountStr = '400'
                const freeBalanceStr = '600'

                let erc3643Capped: IERC203643Capped
                let erc3643Controller: IERC203643Controller
                let bob: Signer
                let bobAddress: string

                beforeEach(async () => {
                    const fixture = async () => {
                        const signers = await ethers.getSigners()
                        bob = signers[2] as unknown as Signer
                        bobAddress = await bob.getAddress()

                        // necessary roles of TOKEN_OWNER_ROLE
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(CONTROLLER_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(FREEZE_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 modules
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)

                        // Get controller and capped interfaces
                        erc3643Controller = (await ethers.getContractAt(
                            'IERC203643Controller',
                            proxyAddress
                        )) as IERC203643Controller

                        erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped

                        // Initialize cap before minting
                        await erc3643Capped
                            .connect(owner)
                            .initializeCap(totalBalance * 10n) // Cap 10x the balance to allow minting

                        // Mint tokens to alice (requires identity verification in ERC3643 mode)
                        await erc3643Capped
                            .connect(owner)
                            .mint(aliceAddress, totalBalance)
                    }
                    await loadFixture(fixture)
                })

                describe('forceTransfer', () => {
                    it('GIVEN no CONTROLLER_ROLE WHEN forceTransfer THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(CONTROLLER_ROLE, ownerAddress)

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(aliceAddress, bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN contract paused WHEN forceTransfer THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(PAUSER_ROLE, ownerAddress)
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(aliceAddress, bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN valid inputs WHEN forceTransfer within free balance THEN succeeds and emits ForceTransfer', async () => {
                        const transferAmount = 500n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(
                                    aliceAddress,
                                    bobAddress,
                                    transferAmount
                                )
                        )
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                transferAmount
                            )
                            .and.to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, transferAmount)

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            transferAmount
                        )
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            totalBalance - transferAmount
                        )
                    })

                    it('GIVEN frozen tokens WHEN forceTransfer exceeds free balance THEN auto-unfreezes and emits TokensUnfrozen', async () => {
                        // Freeze part of alice's tokens
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)

                        const transferAmount = 800n // Exceeds free balance (600)
                        const expectedUnfreeze = transferAmount - freeBalance // 200n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(
                                    aliceAddress,
                                    bobAddress,
                                    transferAmount
                                )
                        )
                            .to.emit(erc3643, 'TokensUnfrozen')
                            .withArgs(aliceAddress, expectedUnfreeze)
                            .and.to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                transferAmount
                            )
                            .and.to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, transferAmount)

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            transferAmount
                        )
                        expect(
                            await erc3643.getFrozenTokens(aliceAddress)
                        ).to.equal(frozenAmount - expectedUnfreeze)
                    })

                    it('GIVEN all tokens frozen WHEN forceTransfer entire balance THEN unfreezes all and succeeds', async () => {
                        // Freeze all tokens
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, totalBalance)

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(
                                    aliceAddress,
                                    bobAddress,
                                    totalBalance
                                )
                        )
                            .to.emit(erc3643, 'TokensUnfrozen')
                            .withArgs(aliceAddress, totalBalance)
                            .and.to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                totalBalance
                            )

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            totalBalance
                        )
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            0n
                        )
                        expect(
                            await erc3643.getFrozenTokens(aliceAddress)
                        ).to.equal(0n)
                    })

                    it('GIVEN zero amount WHEN forceTransfer THEN succeeds without unfreeze', async () => {
                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(aliceAddress, bobAddress, 0n)
                        )
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(ownerAddress, aliceAddress, bobAddress, 0n)
                            .and.to.not.emit(erc3643, 'TokensUnfrozen')

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            totalBalance
                        )
                    })

                    it('GIVEN insufficient total balance WHEN forceTransfer THEN reverts', async () => {
                        const excessiveAmount = totalBalance + 1n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(
                                    aliceAddress,
                                    bobAddress,
                                    excessiveAmount
                                )
                        ).to.be.reverted
                    })

                    it('GIVEN recipient is frozen WHEN forceTransfer THEN succeeds (forced transfer ignores recipient freeze)', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(bobAddress, true)

                        const transferAmount = 100n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceTransfer(
                                    aliceAddress,
                                    bobAddress,
                                    transferAmount
                                )
                        )
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                transferAmount
                            )

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            transferAmount
                        )
                    })
                })

                describe('forceBurn', () => {
                    it('GIVEN no CONTROLLER_ROLE WHEN forceBurn THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(CONTROLLER_ROLE, ownerAddress)

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN contract paused WHEN forceBurn THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(PAUSER_ROLE, ownerAddress)
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN valid inputs WHEN forceBurn within free balance THEN succeeds and emits ForceBurn', async () => {
                        const burnAmount = 300n
                        const initialSupply = await erc20Facet.totalSupply()

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, burnAmount)
                        )
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, burnAmount)
                            .and.to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, ZeroAddress, burnAmount)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            totalBalance - burnAmount
                        )
                        expect(await erc20Facet.totalSupply()).to.equal(
                            initialSupply - burnAmount
                        )
                    })

                    it('GIVEN frozen tokens WHEN forceBurn exceeds free balance THEN auto-unfreezes and emits TokensUnfrozen', async () => {
                        // Freeze part of alice's tokens
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)

                        const burnAmount = 700n // Exceeds free balance (600)
                        const expectedUnfreeze = burnAmount - freeBalance // 100n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, burnAmount)
                        )
                            .to.emit(erc3643, 'TokensUnfrozen')
                            .withArgs(aliceAddress, expectedUnfreeze)
                            .and.to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, burnAmount)
                            .and.to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, ZeroAddress, burnAmount)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            totalBalance - burnAmount
                        )
                        expect(
                            await erc3643.getFrozenTokens(aliceAddress)
                        ).to.equal(frozenAmount - expectedUnfreeze)
                    })

                    it('GIVEN all tokens frozen WHEN forceBurn entire balance THEN unfreezes all and succeeds', async () => {
                        // Freeze all tokens
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, totalBalance)

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, totalBalance)
                        )
                            .to.emit(erc3643, 'TokensUnfrozen')
                            .withArgs(aliceAddress, totalBalance)
                            .and.to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, totalBalance)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            0n
                        )
                        expect(
                            await erc3643.getFrozenTokens(aliceAddress)
                        ).to.equal(0n)
                    })

                    it('GIVEN zero amount WHEN forceBurn THEN succeeds without unfreeze', async () => {
                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, 0n)
                        )
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, 0n)
                            .and.to.not.emit(erc3643, 'TokensUnfrozen')

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            totalBalance
                        )
                    })

                    it('GIVEN insufficient total balance WHEN forceBurn THEN reverts', async () => {
                        const excessiveAmount = totalBalance + 1n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, excessiveAmount)
                        ).to.be.reverted
                    })

                    it('GIVEN sender is frozen WHEN forceBurn THEN succeeds (forced burn ignores sender freeze)', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)

                        const burnAmount = 100n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .forceBurn(aliceAddress, burnAmount)
                        )
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, burnAmount)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            totalBalance - burnAmount
                        )
                    })
                })

                describe('batchForceBurn', () => {
                    let charlie: Signer
                    let charlieAddress: string

                    beforeEach(async () => {
                        const signers = await ethers.getSigners()
                        charlie = signers[3] as unknown as Signer
                        charlieAddress = await charlie.getAddress()

                        await erc3643Capped
                            .connect(owner)
                            .mint(charlieAddress, BigInt(totalBalanceStr))
                    })

                    it('GIVEN no CONTROLLER_ROLE WHEN batchForceBurn THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(CONTROLLER_ROLE, ownerAddress)

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceBurn([aliceAddress], [100n])
                        ).to.be.reverted
                    })

                    it('GIVEN contract paused WHEN batchForceBurn THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(PAUSER_ROLE, ownerAddress)
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceBurn([aliceAddress], [100n])
                        ).to.be.reverted
                    })

                    it('GIVEN arrays length mismatch WHEN batchForceBurn THEN reverts', async () => {
                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceBurn([aliceAddress, bobAddress], [100n])
                        ).to.be.revertedWithCustomError(
                            erc20Facet,
                            'NotSameLengthArray'
                        )
                    })

                    it('GIVEN empty arrays WHEN batchForceBurn THEN succeeds without operations', async () => {
                        const initialBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc3643Controller
                            .connect(owner)
                            .batchForceBurn([], [])

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            initialBalance
                        )
                    })

                    it('GIVEN valid batch within free balance WHEN batchForceBurn THEN succeeds and emits multiple ForceBurn events', async () => {
                        const burnAmount1 = 100n
                        const burnAmount2 = 200n

                        const aliceInitialBalance =
                            await erc20Facet.balanceOf(aliceAddress)
                        const charlieInitialBalance =
                            await erc20Facet.balanceOf(charlieAddress)
                        const initialSupply = await erc20Facet.totalSupply()

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceBurn(
                                [aliceAddress, charlieAddress],
                                [burnAmount1, burnAmount2]
                            )

                        // Check ForceBurn events
                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, burnAmount1)

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, charlieAddress, burnAmount2)

                        // Check Transfer events
                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, ZeroAddress, burnAmount1)

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(charlieAddress, ZeroAddress, burnAmount2)

                        // Verify balances
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            aliceInitialBalance - burnAmount1
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            charlieInitialBalance - burnAmount2
                        )

                        // Verify total supply decreased
                        expect(await erc20Facet.totalSupply()).to.equal(
                            initialSupply - burnAmount1 - burnAmount2
                        )
                    })

                    it('GIVEN frozen tokens WHEN batchForceBurn exceeds free balance THEN auto-unfreezes and emits TokensUnfrozen', async () => {
                        // Freeze tokens for alice and charlie
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(
                                aliceAddress,
                                BigInt(frozenAmountStr)
                            )
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(
                                charlieAddress,
                                BigInt(frozenAmountStr)
                            )

                        const aliceBurnAmount = 700n // Exceeds free balance (600)
                        const charlieBurnAmount = 500n // Within free balance

                        const aliceExpectedUnfreeze =
                            aliceBurnAmount - BigInt(freeBalanceStr) // 100n

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceBurn(
                                [aliceAddress, charlieAddress],
                                [aliceBurnAmount, charlieBurnAmount]
                            )

                        // Alice should trigger unfreeze
                        await expect(tx)
                            .to.emit(erc3643, 'TokensUnfrozen')
                            .withArgs(aliceAddress, aliceExpectedUnfreeze)

                        // Charlie should NOT trigger unfreeze (within free balance)
                        const receipt = await tx.wait()
                        const unfreezeEvents = receipt?.logs.filter((log) => {
                            if (!('fragment' in log)) return false
                            return (
                                log.fragment?.name === 'TokensUnfrozen' &&
                                log.args?.[0] === charlieAddress
                            )
                        })
                        expect(unfreezeEvents?.length).to.equal(0)

                        // Verify frozen tokens updated correctly
                        expect(
                            await erc3643.getFrozenTokens(aliceAddress)
                        ).to.equal(BigInt(frozenAmountStr) - aliceExpectedUnfreeze)
                        expect(
                            await erc3643.getFrozenTokens(charlieAddress)
                        ).to.equal(BigInt(frozenAmountStr))

                        // Verify balances
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr) - aliceBurnAmount
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr) - charlieBurnAmount
                        )
                    })

                    it('GIVEN insufficient total balance in one address WHEN batchForceBurn THEN reverts entire batch', async () => {
                        const validAmount = 100n
                        const excessiveAmount = BigInt(totalBalanceStr) + 1n

                        // Alice burn is valid, charlie burn exceeds balance
                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceBurn(
                                    [aliceAddress, charlieAddress],
                                    [validAmount, excessiveAmount]
                                )
                        ).to.be.reverted

                        // Verify no tokens were burned (atomic operation)
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr)
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr)
                        )
                    })

                    it('GIVEN addresses are frozen WHEN batchForceBurn THEN succeeds (ignores address freeze)', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(charlieAddress, true)

                        const burnAmount1 = 100n
                        const burnAmount2 = 150n

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceBurn(
                                [aliceAddress, charlieAddress],
                                [burnAmount1, burnAmount2]
                            )

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, aliceAddress, burnAmount1)

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceBurn')
                            .withArgs(ownerAddress, charlieAddress, burnAmount2)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr) - burnAmount1
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr) - burnAmount2
                        )
                    })

                    it('GIVEN large batch WHEN batchForceBurn THEN succeeds (gas test)', async () => {
                        // Create 5 accounts with tokens
                        const signers = await ethers.getSigners()
                        const batchSize = 5
                        const addresses: string[] = []
                        const amounts: bigint[] = []

                        for (let i = 0; i < batchSize; i++) {
                            const signer = signers[4 + i] as unknown as Signer
                            const address = await signer.getAddress()
                            addresses.push(address)
                            amounts.push(50n)
                            await erc3643Capped.connect(owner).mint(address, 200n)
                        }

                        const initialSupply = await erc20Facet.totalSupply()

                        await erc3643Controller
                            .connect(owner)
                            .batchForceBurn(addresses, amounts)

                        // Verify total supply
                        const totalBurned = amounts.reduce(
                            (acc, val) => acc + val,
                            0n
                        )
                        expect(await erc20Facet.totalSupply()).to.equal(
                            initialSupply - totalBurned
                        )

                        // Verify each balance
                        for (let i = 0; i < batchSize; i++) {
                            expect(
                                await erc20Facet.balanceOf(addresses[i])
                            ).to.equal(200n - amounts[i])
                        }
                    })
                })

                describe('batchForceTransfer', () => {
                    let charlie: Signer
                    let charlieAddress: string
                    let david: Signer
                    let davidAddress: string

                    beforeEach(async () => {
                        const signers = await ethers.getSigners()
                        charlie = signers[3] as unknown as Signer
                        charlieAddress = await charlie.getAddress()
                        david = signers[4] as unknown as Signer
                        davidAddress = await david.getAddress()

                        await erc3643Capped
                            .connect(owner)
                            .mint(charlieAddress, BigInt(totalBalanceStr))
                    })

                    it('GIVEN no CONTROLLER_ROLE WHEN batchForceTransfer THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(CONTROLLER_ROLE, ownerAddress)

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceTransfer(
                                    [aliceAddress],
                                    [bobAddress],
                                    [100n]
                                )
                        ).to.be.reverted
                    })

                    it('GIVEN contract paused WHEN batchForceTransfer THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(PAUSER_ROLE, ownerAddress)
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceTransfer(
                                    [aliceAddress],
                                    [bobAddress],
                                    [100n]
                                )
                        ).to.be.reverted
                    })

                    it('GIVEN fromList and toList length mismatch WHEN batchForceTransfer THEN reverts', async () => {
                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceTransfer(
                                    [aliceAddress, charlieAddress],
                                    [bobAddress],
                                    [100n, 200n]
                                )
                        ).to.be.revertedWithCustomError(
                            erc20Facet,
                            'NotSameLengthArray'
                        )
                    })

                    it('GIVEN fromList and amounts length mismatch WHEN batchForceTransfer THEN reverts', async () => {
                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceTransfer(
                                    [aliceAddress, charlieAddress],
                                    [bobAddress, davidAddress],
                                    [100n]
                                )
                        ).to.be.revertedWithCustomError(
                            erc20Facet,
                            'NotSameLengthArray'
                        )
                    })

                    it('GIVEN empty arrays WHEN batchForceTransfer THEN succeeds without operations', async () => {
                        const initialBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc3643Controller
                            .connect(owner)
                            .batchForceTransfer([], [], [])

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            initialBalance
                        )
                    })

                    it('GIVEN valid batch within free balance WHEN batchForceTransfer THEN succeeds and emits multiple ForceTransfer events', async () => {
                        const transferAmount1 = 200n
                        const transferAmount2 = 300n

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceTransfer(
                                [aliceAddress, charlieAddress],
                                [bobAddress, davidAddress],
                                [transferAmount1, transferAmount2]
                            )

                        // Check ForceTransfer events
                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                transferAmount1
                            )

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                charlieAddress,
                                davidAddress,
                                transferAmount2
                            )

                        // Check Transfer events
                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, transferAmount1)

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(charlieAddress, davidAddress, transferAmount2)

                        // Verify balances
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr) - transferAmount1
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr) - transferAmount2
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            transferAmount1
                        )
                        expect(await erc20Facet.balanceOf(davidAddress)).to.equal(
                            transferAmount2
                        )
                    })

                    it('GIVEN frozen tokens WHEN batchForceTransfer exceeds free balance THEN auto-unfreezes and emits TokensUnfrozen', async () => {
                        // Freeze tokens for alice and charlie
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(
                                aliceAddress,
                                BigInt(frozenAmountStr)
                            )
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(
                                charlieAddress,
                                BigInt(frozenAmountStr)
                            )

                        const aliceTransferAmount = 700n // Exceeds free balance (600)
                        const charlieTransferAmount = 500n // Within free balance

                        const aliceExpectedUnfreeze =
                            aliceTransferAmount - BigInt(freeBalanceStr) // 100n

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceTransfer(
                                [aliceAddress, charlieAddress],
                                [bobAddress, davidAddress],
                                [aliceTransferAmount, charlieTransferAmount]
                            )

                        // Alice should trigger unfreeze
                        await expect(tx)
                            .to.emit(erc3643, 'TokensUnfrozen')
                            .withArgs(aliceAddress, aliceExpectedUnfreeze)

                        // Charlie should NOT trigger unfreeze (within free balance)
                        const receipt = await tx.wait()
                        const unfreezeEvents = receipt?.logs.filter((log) => {
                            if (!('fragment' in log)) return false
                            return (
                                log.fragment?.name === 'TokensUnfrozen' &&
                                log.args?.[0] === charlieAddress
                            )
                        })
                        expect(unfreezeEvents?.length).to.equal(0)

                        // Verify frozen tokens updated correctly
                        expect(
                            await erc3643.getFrozenTokens(aliceAddress)
                        ).to.equal(BigInt(frozenAmountStr) - aliceExpectedUnfreeze)
                        expect(
                            await erc3643.getFrozenTokens(charlieAddress)
                        ).to.equal(BigInt(frozenAmountStr))

                        // Verify balances
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr) - aliceTransferAmount
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr) - charlieTransferAmount
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            aliceTransferAmount
                        )
                        expect(await erc20Facet.balanceOf(davidAddress)).to.equal(
                            charlieTransferAmount
                        )
                    })

                    it('GIVEN insufficient total balance in one address WHEN batchForceTransfer THEN reverts entire batch', async () => {
                        const validAmount = 100n
                        const excessiveAmount = BigInt(totalBalanceStr) + 1n

                        await expect(
                            erc3643Controller
                                .connect(owner)
                                .batchForceTransfer(
                                    [aliceAddress, charlieAddress],
                                    [bobAddress, davidAddress],
                                    [validAmount, excessiveAmount]
                                )
                        ).to.be.reverted

                        // Verify no transfers occurred (atomic operation)
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr)
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr)
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(0n)
                        expect(await erc20Facet.balanceOf(davidAddress)).to.equal(
                            0n
                        )
                    })

                    it('GIVEN sender is frozen WHEN batchForceTransfer THEN succeeds (ignores sender freeze)', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(charlieAddress, true)

                        const transferAmount1 = 150n
                        const transferAmount2 = 250n

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceTransfer(
                                [aliceAddress, charlieAddress],
                                [bobAddress, davidAddress],
                                [transferAmount1, transferAmount2]
                            )

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                transferAmount1
                            )

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                charlieAddress,
                                davidAddress,
                                transferAmount2
                            )

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            transferAmount1
                        )
                        expect(await erc20Facet.balanceOf(davidAddress)).to.equal(
                            transferAmount2
                        )
                    })

                    it('GIVEN recipient is frozen WHEN batchForceTransfer THEN succeeds (ignores recipient freeze)', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(bobAddress, true)
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(davidAddress, true)

                        const transferAmount1 = 100n
                        const transferAmount2 = 200n

                        const tx = await erc3643Controller
                            .connect(owner)
                            .batchForceTransfer(
                                [aliceAddress, charlieAddress],
                                [bobAddress, davidAddress],
                                [transferAmount1, transferAmount2]
                            )

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                aliceAddress,
                                bobAddress,
                                transferAmount1
                            )

                        await expect(tx)
                            .to.emit(erc3643Controller, 'ForceTransfer')
                            .withArgs(
                                ownerAddress,
                                charlieAddress,
                                davidAddress,
                                transferAmount2
                            )

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            transferAmount1
                        )
                        expect(await erc20Facet.balanceOf(davidAddress)).to.equal(
                            transferAmount2
                        )
                    })

                    it('GIVEN large batch WHEN batchForceTransfer THEN succeeds (gas test)', async () => {
                        // Create 5 senders and 5 recipients with tokens
                        const signers = await ethers.getSigners()
                        const batchSize = 5
                        const fromAddresses: string[] = []
                        const toAddresses: string[] = []
                        const amounts: bigint[] = []

                        for (let i = 0; i < batchSize; i++) {
                            const fromSigner = signers[5 + i] as unknown as Signer
                            const toSigner = signers[10 + i] as unknown as Signer
                            const fromAddress = await fromSigner.getAddress()
                            const toAddress = await toSigner.getAddress()

                            fromAddresses.push(fromAddress)
                            toAddresses.push(toAddress)
                            amounts.push(50n)
                            await erc3643Capped
                                .connect(owner)
                                .mint(fromAddress, 200n)
                        }

                        await erc3643Controller
                            .connect(owner)
                            .batchForceTransfer(fromAddresses, toAddresses, amounts)

                        // Verify each transfer
                        for (let i = 0; i < batchSize; i++) {
                            expect(
                                await erc20Facet.balanceOf(fromAddresses[i])
                            ).to.equal(200n - amounts[i])
                            expect(
                                await erc20Facet.balanceOf(toAddresses[i])
                            ).to.equal(amounts[i])
                        }
                    })

                    it('GIVEN same recipient multiple times WHEN batchForceTransfer THEN accumulates amounts correctly', async () => {
                        const amount1 = 100n
                        const amount2 = 150n

                        await erc3643Controller.connect(owner).batchForceTransfer(
                            [aliceAddress, charlieAddress],
                            [bobAddress, bobAddress], // Same recipient
                            [amount1, amount2]
                        )

                        // Bob should receive both amounts
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            amount1 + amount2
                        )
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr) - amount1
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            BigInt(totalBalanceStr) - amount2
                        )
                    })

                    it('GIVEN same sender multiple times WHEN batchForceTransfer THEN deducts amounts correctly', async () => {
                        const amount1 = 100n
                        const amount2 = 150n

                        await erc3643Controller.connect(owner).batchForceTransfer(
                            [aliceAddress, aliceAddress], // Same sender
                            [bobAddress, davidAddress],
                            [amount1, amount2]
                        )

                        // Alice should lose both amounts
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            BigInt(totalBalanceStr) - amount1 - amount2
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            amount1
                        )
                        expect(await erc20Facet.balanceOf(davidAddress)).to.equal(
                            amount2
                        )
                    })
                })
            })

            describe('when Mode compliance is active',() => {
                //** Reserved for future compliance-related tests involving the Controller module */
                describe('when one compliance feature is enabled',() => {
                })

                describe('when multiple compliance features are enabled',() => {
                    //** Probar escenarios donde el compliance de un feature se pasa y el de otro no, y viceversa */
                })
            })
        })
    })
    // ====================================================================
    // CAPPED MODULE
    // ====================================================================
    describe('ERC3643 Capped', () => {
        // --------------------------------------------------------------------
        // when ERC3643 is NOT initialized
        // --------------------------------------------------------------------
        describe('when Mode ERC20', () => {
            //** ERC20 module test cover its main use cases. We reserve this space for future implementations that may involve ERC20 behavior not expected by its standard implementation and caused by futures interactions with any logic change from ERC3643 Controller */
        })

        // --------------------------------------------------------------------
        // when ERC3643 is initialized
        // --------------------------------------------------------------------
        describe('when Mode ERC3643', () => {
            describe('when Mode compliance is not active',() => {
                let erc3643Capped: IERC203643Capped
                let bob: Signer
                let bobAddress: string

                const initialCap = 10000n

                beforeEach(async () => {
                    const fixture = async () => {
                        const signers = await ethers.getSigners()
                        bob = signers[2] as unknown as Signer
                        bobAddress = await bob.getAddress()

                        // Grant necessary roles
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(CAP_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 modules
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                        await erc3643.connect(owner)
                        // Get capped and controller interfaces
                        erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped
                    }
                    await loadFixture(fixture)
                })

                // ----------------------------------------------------------------
                // initializeCap
                // ----------------------------------------------------------------
                describe('initializeCap', () => {
                    it('GIVEN cap not initialized WHEN initializeCap THEN succeeds and emits CapSet', async () => {
                        await expect(
                            erc3643Capped.connect(owner).initializeCap(initialCap)
                        )
                            .to.emit(erc3643Capped, 'CapSet')
                            .withArgs(ownerAddress, initialCap)

                        expect(await erc3643Capped.cap()).to.equal(initialCap)
                    })

                    it('GIVEN cap already initialized WHEN initializeCap again THEN reverts', async () => {
                        await erc3643Capped.connect(owner).initializeCap(initialCap)

                        await expect(
                            erc3643Capped.connect(owner).initializeCap(initialCap)
                        ).to.be.reverted
                    })

                    it('GIVEN zero cap WHEN initializeCap THEN reverts', async () => {
                        await expect(erc3643Capped.connect(owner).initializeCap(0n))
                            .to.be.reverted
                    })
                })

                // ----------------------------------------------------------------
                // mint
                // ----------------------------------------------------------------
                describe('mint', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize cap before minting
                            await erc3643Capped
                                .connect(owner)
                                .initializeCap(initialCap)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN no MINTER_ROLE WHEN mint THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(MINTER_ROLE, ownerAddress)

                        await expect(
                            erc3643Capped.connect(owner).mint(aliceAddress, 1000n)
                        ).to.be.reverted
                    })

                    it('GIVEN contract paused WHEN mint THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(PAUSER_ROLE, ownerAddress)
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643Capped.connect(owner).mint(aliceAddress, 1000n)
                        ).to.be.reverted
                    })

                    it('GIVEN recipient WHEN mint within cap THEN succeeds and emits Transfer', async () => {
                        const mintAmount = 5000n

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .mint(aliceAddress, mintAmount)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, aliceAddress, mintAmount)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            mintAmount
                        )
                        expect(await erc20Facet.totalSupply()).to.equal(mintAmount)
                    })

                    it('GIVEN minting exceeds cap WHEN mint THEN reverts', async () => {
                        const excessiveAmount = initialCap + 1n

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .mint(aliceAddress, excessiveAmount)
                        ).to.be.reverted
                    })

                    it('GIVEN multiple mints WHEN total exceeds cap THEN reverts', async () => {
                        const firstMint = 6000n
                        const secondMint = 5000n // Total would be 11000n > 10000n cap

                        await erc3643Capped
                            .connect(owner)
                            .mint(aliceAddress, firstMint)

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .mint(bobAddress, secondMint)
                        ).to.be.reverted
                    })

                    it('GIVEN minting up to cap WHEN mint exact remaining amount THEN succeeds', async () => {
                        const firstMint = 6000n
                        const secondMint = 4000n // Total = 10000n (exact cap)

                        await erc3643Capped
                            .connect(owner)
                            .mint(aliceAddress, firstMint)

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .mint(bobAddress, secondMint)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, bobAddress, secondMint)

                        expect(await erc20Facet.totalSupply()).to.equal(initialCap)
                    })
                })

                // ----------------------------------------------------------------
                // batchMint
                // ----------------------------------------------------------------
                describe('batchMint', () => {
                    let bob: Signer
                    let charlie: Signer
                    let bobAddress: string
                    let charlieAddress: string

                    beforeEach(async () => {
                        const fixture = async () => {
                            const signers = await ethers.getSigners()
                            bob = signers[2] as unknown as Signer
                            charlie = signers[3] as unknown as Signer
                            bobAddress = await bob.getAddress()
                            charlieAddress = await charlie.getAddress()

                            // Initialize cap
                            await erc3643Capped
                                .connect(owner)
                                .initializeCap(initialCap)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN no MINTER_ROLE WHEN batchMint THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(MINTER_ROLE, ownerAddress)

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .batchMint([aliceAddress], [100n])
                        ).to.be.reverted
                    })

                    it('GIVEN contract paused WHEN batchMint THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(PAUSER_ROLE, ownerAddress)
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .batchMint([aliceAddress], [100n])
                        ).to.be.reverted
                    })

                    it('GIVEN arrays length mismatch WHEN batchMint THEN reverts', async () => {
                        const addresses = [aliceAddress, bobAddress]
                        const amounts = [100n]
                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .batchMint(addresses, amounts)
                        ).to.be.revertedWithCustomError(
                            erc20Facet,
                            'NotSameLengthArray'
                        )
                    })

                    it('GIVEN empty arrays WHEN batchMint THEN succeeds without operations', async () => {
                        const initialSupply = await erc20Facet.totalSupply()

                        await erc3643Capped.connect(owner).batchMint([], [])

                        expect(await erc20Facet.totalSupply()).to.equal(
                            initialSupply
                        )
                    })

                    it('GIVEN valid batch WHEN batchMint THEN succeeds and emits multiple Transfer events', async () => {
                        const addresses = [aliceAddress, bobAddress, charlieAddress]
                        const amounts = [100n, 200n, 300n]

                        const tx = await erc3643Capped
                            .connect(owner)
                            .batchMint(addresses, amounts)

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, aliceAddress, amounts[0])

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, bobAddress, amounts[1])

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, charlieAddress, amounts[2])

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            amounts[0]
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            amounts[1]
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            amounts[2]
                        )
                        expect(await erc20Facet.totalSupply()).to.equal(600n)
                    })

                    it('GIVEN batch exceeds cap WHEN batchMint THEN reverts', async () => {
                        const addresses = [aliceAddress, bobAddress]
                        const amounts = [5000n, 6000n] // Total: 11000 > 10000 (cap)

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .batchMint(addresses, amounts)
                        ).to.be.revertedWithCustomError(
                            erc3643Capped,
                            'CapExceeded'
                        )
                    })

                    it('GIVEN large batch WHEN batchMint THEN succeeds', async () => {
                        const batchSize = 50
                        const addresses = []
                        const amounts = []
                        const amountPerAddress = 100n

                        for (let i = 0; i < batchSize; i++) {
                            const wallet = ethers.Wallet.createRandom()
                            const walletAddress = wallet.address
                            addresses.push(walletAddress)
                            amounts.push(amountPerAddress)
                        }

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .batchMint(addresses, amounts)
                        ).to.not.be.reverted

                        expect(await erc20Facet.totalSupply()).to.equal(
                            amountPerAddress * BigInt(batchSize)
                        )
                    })

                    it('GIVEN same address multiple times WHEN batchMint THEN mints to each independently', async () => {
                        const amount1 = 100n
                        const amount2 = 200n

                        await erc3643Capped
                            .connect(owner)
                            .batchMint(
                                [aliceAddress, aliceAddress],
                                [amount1, amount2]
                            )

                        // Alice should receive both amounts: 100 + 200 = 300
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            300n
                        )
                    })

                    it('GIVEN zero amount WHEN batchMint THEN succeeds and emits Transfer', async () => {
                        const tx = await erc3643Capped
                            .connect(owner)
                            .batchMint([aliceAddress], [0n])

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, aliceAddress, 0n)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            0n
                        )
                    })

                    it('GIVEN partial batch within cap WHEN batchMint THEN succeeds', async () => {
                        // First mint some tokens
                        await erc3643Capped.connect(owner).mint(aliceAddress, 3000n)

                        // Now batch mint more (total will be 3000 + 2000 + 3000 = 8000 < 10000)
                        const addresses = [bobAddress, charlieAddress]
                        const amounts = [2000n, 3000n]

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .batchMint(addresses, amounts)
                        ).to.not.be.reverted

                        expect(await erc20Facet.totalSupply()).to.equal(8000n)
                    })
                })

                // ----------------------------------------------------------------
                // setCap
                // ----------------------------------------------------------------
                describe('setCap', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize cap
                            await erc3643Capped
                                .connect(owner)
                                .initializeCap(initialCap)

                            // Mint some tokens
                            await erc3643Capped
                                .connect(owner)
                                .mint(aliceAddress, 5000n)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN no CAP_ROLE WHEN setCap THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(CAP_ROLE, ownerAddress)

                        await expect(erc3643Capped.connect(owner).setCap(20000n)).to
                            .be.reverted
                    })

                    it('GIVEN new cap >= current supply WHEN setCap THEN succeeds and emits CapSet', async () => {
                        const newCap = 15000n
                        const currentSupply = await erc20Facet.totalSupply()

                        expect(newCap).to.be.greaterThan(currentSupply)

                        await expect(erc3643Capped.connect(owner).setCap(newCap))
                            .to.emit(erc3643Capped, 'CapSet')
                            .withArgs(ownerAddress, newCap)

                        expect(await erc3643Capped.cap()).to.equal(newCap)
                    })

                    it('GIVEN new cap < current supply WHEN setCap THEN reverts', async () => {
                        const currentSupply = await erc20Facet.totalSupply()
                        const invalidCap = currentSupply - 1n

                        await expect(
                            erc3643Capped.connect(owner).setCap(invalidCap)
                        ).to.be.reverted
                    })

                    it('GIVEN new cap = current supply WHEN setCap THEN succeeds', async () => {
                        const currentSupply = await erc20Facet.totalSupply()

                        await expect(
                            erc3643Capped.connect(owner).setCap(currentSupply)
                        )
                            .to.emit(erc3643Capped, 'CapSet')
                            .withArgs(ownerAddress, currentSupply)

                        expect(await erc3643Capped.cap()).to.equal(currentSupply)
                    })

                    it('GIVEN zero cap WHEN setCap THEN reverts', async () => {
                        await expect(erc3643Capped.connect(owner).setCap(0n)).to.be
                            .reverted
                    })

                    it('GIVEN cap increased WHEN mint up to new cap THEN succeeds', async () => {
                        const newCap = 20000n
                        await erc3643Capped.connect(owner).setCap(newCap)

                        const currentSupply = await erc20Facet.totalSupply()
                        const remainingToMint = newCap - currentSupply

                        await expect(
                            erc3643Capped
                                .connect(owner)
                                .mint(bobAddress, remainingToMint)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(ZeroAddress, bobAddress, remainingToMint)

                        expect(await erc20Facet.totalSupply()).to.equal(newCap)
                    })
                })

                // ----------------------------------------------------------------
                // Getters
                // ----------------------------------------------------------------
                describe('Getters', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize cap
                            await erc3643Capped
                                .connect(owner)
                                .initializeCap(initialCap)
                        }
                        await loadFixture(fixture)
                    })

                    describe('cap', () => {
                        it('GIVEN cap initialized WHEN cap() THEN returns correct value', async () => {
                            expect(await erc3643Capped.cap()).to.equal(initialCap)
                        })

                        it('GIVEN cap updated WHEN cap() THEN returns new value', async () => {
                            const newCap = 20000n
                            await erc3643Capped.connect(owner).setCap(newCap)

                            expect(await erc3643Capped.cap()).to.equal(newCap)
                        })
                    })
                })
            })

            describe('when Mode compliance is active',() => {
                //** Reserved for future compliance-related tests involving the Controller module */
                describe('when one compliance feature is enabled',() => {
                })

                describe('when multiple compliance features are enabled',() => {
                    //** Probar escenarios donde el compliance de un feature se pasa y el de otro no, y viceversa */
                })
            })
        })
    })

    // ====================================================================
    // PRIMITIVES MODULE
    // ====================================================================
    describe('ERC3643 Primitives', () => {

        describe('when Mode compliance is not active',() => {
            // --------------------------------------------------------------------
            // Burn Operations Restriction in ERC3643 Mode
            // --------------------------------------------------------------------
            describe('Burn Operations Restriction', () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let erc20Burnable: any

                beforeEach(async () => {
                    const fixture = async () => {
                        // Grant necessary roles
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 modules (this puts us in ERC3643 mode)
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                        await erc3643.connect(owner)

                        // Get capped interface and initialize cap
                        const erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped

                        await erc3643Capped.connect(owner).initializeCap(10000n)

                        // Mint tokens to alice
                        await erc3643Capped.connect(owner).mint(aliceAddress, 5000n)

                        // Try to get ERC20Burnable interface
                        try {
                            erc20Burnable = await ethers.getContractAt(
                                'IERC20Burnable',
                                proxyAddress
                            )
                        } catch {
                            erc20Burnable = null
                        }
                    }
                    await loadFixture(fixture)
                })

                it('GIVEN ERC3643 mode WHEN burn() called THEN function does not exist or reverts', async () => {
                    if (erc20Burnable === null) {
                        // Interface not available - this is expected
                        expect(erc20Burnable).to.be.null
                    } else {
                        // Interface exists but should revert when called
                        await expect(erc20Burnable.connect(alice).burn(100n)).to.be
                            .reverted
                    }
                })

                it('GIVEN ERC3643 mode WHEN burnFrom() called THEN function does not exist or reverts', async () => {
                    if (erc20Burnable === null) {
                        // Interface not available - this is expected
                        expect(erc20Burnable).to.be.null
                    } else {
                        // Interface exists but should revert when called
                        // First approve to test burnFrom
                        await erc20Facet.connect(alice).approve(ownerAddress, 100n)

                        await expect(
                            erc20Burnable
                                .connect(owner)
                                .burnFrom(aliceAddress, 100n)
                        ).to.be.reverted
                    }
                })
            })

            // --------------------------------------------------------------------
            // Mint Operations in ERC3643 Mode
            // --------------------------------------------------------------------
            describe('Mint Operations', () => {
                let erc3643Capped: IERC203643Capped

                beforeEach(async () => {
                    const fixture = async () => {
                        // Grant necessary roles
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 modules (this puts us in ERC3643 mode)
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                        await erc3643.connect(owner)

                        // Get capped interface and initialize cap
                        erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped

                        await erc3643Capped.connect(owner).initializeCap(10000n)
                    }
                    await loadFixture(fixture)
                })

                it('GIVEN ERC3643 mode WHEN mint to zero address THEN reverts', async () => {
                    await expect(
                        erc3643Capped.connect(owner).mint(ZeroAddress, 1000n)
                    ).to.be.reverted
                })
            })

            // --------------------------------------------------------------------
            // Transfer Operations in ERC3643 Mode
            // --------------------------------------------------------------------
            describe('Transfer Operations', () => {
                let erc3643Capped: IERC203643Capped
                let bob: Signer
                let bobAddress: string

                beforeEach(async () => {
                    const fixture = async () => {
                        const signers = await ethers.getSigners()
                        bob = signers[2] as unknown as Signer
                        bobAddress = await bob.getAddress()

                        // Grant necessary roles
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(FREEZE_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 modules
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                        await erc3643.connect(owner)

                        // Get capped interface and initialize cap
                        erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped

                        await erc3643Capped.connect(owner).initializeCap(10000n)

                        // Mint tokens to alice
                        await erc3643Capped.connect(owner).mint(aliceAddress, 5000n)
                    }
                    await loadFixture(fixture)
                })

                describe('transfer', () => {
                    it('GIVEN ERC3643 mode WHEN sender is frozen THEN reverts', async () => {
                        // Freeze alice
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)

                        await expect(
                            erc20Facet.connect(alice).transfer(bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN recipient is frozen THEN reverts', async () => {
                        // Freeze bob
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(bobAddress, true)

                        await expect(
                            erc20Facet.connect(alice).transfer(bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN transfer exceeds free balance THEN reverts', async () => {
                        // Freeze 4000 tokens of alice (she has 5000 total)
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, 4000n)

                        // Try to transfer 1500 (exceeds free balance of 1000)
                        await expect(
                            erc20Facet.connect(alice).transfer(bobAddress, 1500n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN valid transfer within free balance THEN succeeds', async () => {
                        await expect(
                            erc20Facet.connect(alice).transfer(bobAddress, 100n)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, 100n)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            4900n
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            100n
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN transfer with partial freeze THEN succeeds if within free balance', async () => {
                        // Freeze 3000 tokens (free balance = 2000)
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, 3000n)

                        // Transfer 1500 (within free balance)
                        await expect(
                            erc20Facet.connect(alice).transfer(bobAddress, 1500n)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, 1500n)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            3500n
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            1500n
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN transfer to zero address THEN reverts', async () => {
                        await expect(
                            erc20Facet.connect(alice).transfer(ZeroAddress, 100n)
                        ).to.be.reverted
                    })
                })

                describe('transferFrom', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Alice approves owner to spend her tokens
                            await erc20Facet
                                .connect(alice)
                                .approve(ownerAddress, 2000n)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN ERC3643 mode WHEN sender is frozen THEN reverts', async () => {
                        // Freeze alice
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)

                        await expect(
                            erc20Facet
                                .connect(owner)
                                .transferFrom(aliceAddress, bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN recipient is frozen THEN reverts', async () => {
                        // Freeze bob
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(bobAddress, true)

                        await expect(
                            erc20Facet
                                .connect(owner)
                                .transferFrom(aliceAddress, bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN transferFrom exceeds free balance THEN reverts', async () => {
                        // Freeze 4000 tokens of alice (she has 5000 total)
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, 4000n)

                        // Try to transfer 1500 (exceeds free balance of 1000)
                        await expect(
                            erc20Facet
                                .connect(owner)
                                .transferFrom(aliceAddress, bobAddress, 1500n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN valid transferFrom within free balance THEN succeeds', async () => {
                        await expect(
                            erc20Facet
                                .connect(owner)
                                .transferFrom(aliceAddress, bobAddress, 100n)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, 100n)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            4900n
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            100n
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN transferFrom with partial freeze THEN succeeds if within free balance', async () => {
                        // Freeze 3000 tokens (free balance = 2000)
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, 3000n)

                        // Transfer 1500 (within free balance)
                        await expect(
                            erc20Facet
                                .connect(owner)
                                .transferFrom(aliceAddress, bobAddress, 1500n)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, 1500n)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            3500n
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            1500n
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN transferFrom without allowance THEN reverts', async () => {
                        // Bob tries to transfer alice's tokens without approval
                        await expect(
                            erc20Facet
                                .connect(bob)
                                .transferFrom(aliceAddress, bobAddress, 100n)
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN transferFrom to zero address THEN reverts', async () => {
                        await expect(
                            erc20Facet
                                .connect(owner)
                                .transferFrom(aliceAddress, ZeroAddress, 100n)
                        ).to.be.reverted
                    })
                })

                describe('batchTransfer', () => {
                    it('GIVEN ERC3643 mode WHEN arrays length mismatch THEN reverts with NotSameLengthArray', async () => {
                        await expect(
                            erc20Facet
                                .connect(alice)
                                .batchTransfer([bobAddress], [100n, 200n])
                        ).to.be.revertedWithCustomError(
                            erc20Facet,
                            'NotSameLengthArray'
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN empty arrays THEN succeeds without operations', async () => {
                        const initialBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc20Facet.connect(alice).batchTransfer([], [])

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            initialBalance
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN sender is frozen THEN reverts', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)

                        await expect(
                            erc20Facet
                                .connect(alice)
                                .batchTransfer([bobAddress], [100n])
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN recipient is frozen THEN reverts', async () => {
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(bobAddress, true)

                        await expect(
                            erc20Facet
                                .connect(alice)
                                .batchTransfer([bobAddress], [100n])
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN batchTransfer exceeds free balance THEN reverts', async () => {
                        const totalBalance =
                            await erc20Facet.balanceOf(aliceAddress)
                        const frozenAmount = 2000n

                        // Freeze some tokens
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)

                        const freeBalance = totalBalance - frozenAmount
                        const excessAmount = freeBalance + 1n

                        await expect(
                            erc20Facet
                                .connect(alice)
                                .batchTransfer([bobAddress], [excessAmount])
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN valid batchTransfer within free balance THEN succeeds and emits multiple Transfer events', async () => {
                        const amount1 = 100n
                        const amount2 = 200n
                        const amount3 = 150n

                        const signers = await ethers.getSigners()
                        const charlie = signers[3] as unknown as Signer
                        const charlieAddress = await charlie.getAddress()

                        const aliceInitialBalance =
                            await erc20Facet.balanceOf(aliceAddress)
                        const bobInitialBalance =
                            await erc20Facet.balanceOf(bobAddress)

                        const tx = await erc20Facet
                            .connect(alice)
                            .batchTransfer(
                                [bobAddress, charlieAddress, bobAddress],
                                [amount1, amount2, amount3]
                            )

                        // Check Transfer events
                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, amount1)

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, charlieAddress, amount2)

                        await expect(tx)
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, amount3)

                        // Verify balances
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            aliceInitialBalance - amount1 - amount2 - amount3
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            bobInitialBalance + amount1 + amount3
                        )
                        expect(await erc20Facet.balanceOf(charlieAddress)).to.equal(
                            amount2
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN batchTransfer with partial freeze THEN succeeds if within free balance', async () => {
                        const frozenAmount = 400n

                        // Freeze some tokens
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)

                        const amount1 = 200n
                        const amount2 = 300n

                        const aliceInitialBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc20Facet
                            .connect(alice)
                            .batchTransfer(
                                [bobAddress, bobAddress],
                                [amount1, amount2]
                            )

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            aliceInitialBalance - amount1 - amount2
                        )
                    })

                    it('GIVEN ERC3643 mode WHEN batchTransfer exceeds total balance THEN reverts', async () => {
                        const totalBalance =
                            await erc20Facet.balanceOf(aliceAddress)
                        const excessAmount = totalBalance + 1n

                        await expect(
                            erc20Facet
                                .connect(alice)
                                .batchTransfer([bobAddress], [excessAmount])
                        ).to.be.reverted
                    })

                    it('GIVEN ERC3643 mode WHEN large batch THEN succeeds (gas test)', async () => {
                        const signers = await ethers.getSigners()
                        const batchSize = 5
                        const addresses: string[] = []
                        const amounts: bigint[] = []

                        for (let i = 0; i < batchSize; i++) {
                            const signer = signers[4 + i] as unknown as Signer
                            const address = await signer.getAddress()
                            addresses.push(address)
                            amounts.push(50n)
                        }

                        const aliceInitialBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc20Facet
                            .connect(alice)
                            .batchTransfer(addresses, amounts)

                        const totalTransferred = amounts.reduce(
                            (acc, val) => acc + val,
                            0n
                        )
                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            aliceInitialBalance - totalTransferred
                        )

                        // Verify each recipient received their amount
                        for (let i = 0; i < batchSize; i++) {
                            expect(
                                await erc20Facet.balanceOf(addresses[i])
                            ).to.equal(amounts[i])
                        }
                    })
                })
            })
        })
        describe('when Mode compliance is active',() => {
                //** Reserved for future compliance-related tests involving the Controller module */
                describe('when one compliance feature is enabled',() => {
                })

                describe('when multiple compliance features are enabled',() => {
                    //** Probar escenarios donde el compliance de un feature se pasa y el de otro no, y viceversa */
                })
        })

    })
    // ====================================================================
    // RECOVERY MODULE
    // ====================================================================
    describe('ERC3643 Recovery', () => {
        describe('when Mode compliance is not active',() => {
            describe('when not initialized', () => {
                it('GIVEN ERC3643 not initialized WHEN recoveryAddress THEN reverts', async () => {
                    const bobAddress = await (
                        await ethers.getSigners()
                    )[2].getAddress()

                    await accessControlFacet
                        .connect(owner)
                        .grantRole(RECOVERY_ROLE, ownerAddress)

                    await expect(
                        erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)
                    ).to.be.reverted
                })
            })

            describe('when initialized', () => {
                beforeEach(async () => {
                    const fixture = async () => {
                        // Grant necessary roles
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(METADATA_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(RECOVERY_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(CAP_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 Metadata
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)
                        await erc3643.connect(owner)

                        // Get capped interface and initialize cap
                        const erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped

                        await erc3643Capped.connect(owner).initializeCap(10000n)

                        // Mint tokens to alice using the capped interface
                        await erc3643Capped.connect(owner).mint(aliceAddress, 1000n)
                    }
                    await loadFixture(fixture)
                })

                describe('Access Control', () => {
                    it('GIVEN no RECOVERY_ROLE WHEN recoveryAddress THEN reverts', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()

                        await expect(
                            erc3643
                                .connect(alice)
                                .recoveryAddress(aliceAddress, bobAddress)
                        ).to.be.reverted
                    })

                    it('GIVEN RECOVERY_ROLE WHEN recoveryAddress THEN succeeds', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()

                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(aliceAddress, bobAddress)
                        )
                            .to.emit(erc3643, 'RecoverySuccess')
                            .withArgs(aliceAddress, bobAddress)
                    })
                })

                describe('Input Validation', () => {
                    it('GIVEN zero lost wallet WHEN recoveryAddress THEN reverts with InvalidLostWallet', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()

                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(ZeroAddress, bobAddress)
                        ).to.be.revertedWithCustomError(
                            erc3643,
                            'InvalidLostWallet'
                        )
                    })

                    it('GIVEN zero new wallet WHEN recoveryAddress THEN reverts with InvalidNewWallet', async () => {
                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(aliceAddress, ZeroAddress)
                        ).to.be.revertedWithCustomError(erc3643, 'InvalidNewWallet')
                    })

                    it('GIVEN same lost and new wallet WHEN recoveryAddress THEN reverts with SameWalletAddress', async () => {
                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(aliceAddress, aliceAddress)
                        ).to.be.revertedWithCustomError(
                            erc3643,
                            'SameWalletAddress'
                        )
                    })

                    it('GIVEN lost wallet with zero balance WHEN recoveryAddress THEN reverts with NoTokensToRecover', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const dave = signers[4]
                        const bobAddress = await bob.getAddress()
                        const daveAddress = await dave.getAddress()

                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(daveAddress, bobAddress)
                        ).to.be.revertedWithCustomError(
                            erc3643,
                            'NoTokensToRecover'
                        )
                    })
                })

                describe('Token Transfer', () => {
                    it('GIVEN valid recovery WHEN recoveryAddress THEN transfers all tokens', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()

                        const aliceBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)

                        expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(
                            0n
                        )
                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            aliceBalance
                        )
                    })

                    it('GIVEN recovery with tokens WHEN recoveryAddress THEN emits Transfer event', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()
                        const aliceBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(aliceAddress, bobAddress)
                        )
                            .to.emit(erc20Facet, 'Transfer')
                            .withArgs(aliceAddress, bobAddress, aliceBalance)
                    })
                })

                describe('Frozen State Preservation', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            await accessControlFacet
                                .connect(owner)
                                .grantRole(FREEZE_ROLE, ownerAddress)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN frozen tokens WHEN recoveryAddress THEN preserves frozen tokens on new wallet', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const charlie = signers[3]
                        const bobAddress = await bob.getAddress()

                        const frozenAmount = 300n
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)

                        expect(await erc3643.getFrozenTokens(bobAddress)).to.equal(
                            frozenAmount
                        )
                    })

                    it('GIVEN frozen address WHEN recoveryAddress THEN preserves freeze status on new wallet', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const charlie = signers[3]
                        const bobAddress = await bob.getAddress()

                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)

                        expect(await erc3643.isFrozen(bobAddress)).to.be.true
                    })

                    it('GIVEN frozen tokens and frozen address WHEN recoveryAddress THEN preserves both states', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const charlie = signers[3]
                        const bobAddress = await bob.getAddress()

                        const frozenAmount = 400n
                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)
                        await erc3643
                            .connect(owner)
                            .setAddressFrozen(aliceAddress, true)

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)

                        expect(await erc3643.getFrozenTokens(bobAddress)).to.equal(
                            frozenAmount
                        )
                        expect(await erc3643.isFrozen(bobAddress)).to.be.true
                    })
                })

                describe('Pause Integration', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            await accessControlFacet
                                .connect(owner)
                                .grantRole(PAUSER_ROLE, ownerAddress)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN paused contract WHEN recoveryAddress THEN reverts', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()

                        await pauseFacet.connect(owner).pause()

                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(aliceAddress, bobAddress)
                        ).to.be.reverted
                    })
                })

                describe('Events', () => {
                    it('GIVEN successful recovery WHEN recoveryAddress THEN emits RecoverySuccess', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()

                        await expect(
                            erc3643
                                .connect(owner)
                                .recoveryAddress(aliceAddress, bobAddress)
                        )
                            .to.emit(erc3643, 'RecoverySuccess')
                            .withArgs(aliceAddress, bobAddress)
                    })
                })

                describe('Complex Scenarios', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            await accessControlFacet
                                .connect(owner)
                                .grantRole(FREEZE_ROLE, ownerAddress)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN partial frozen tokens WHEN recoveryAddress THEN new wallet has correct free balance', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const bobAddress = await bob.getAddress()
                        const totalBalance = 1000n
                        const frozenAmount = 600n
                        const freeBalance = totalBalance - frozenAmount

                        await erc3643
                            .connect(owner)
                            .freezePartialTokens(aliceAddress, frozenAmount)

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            totalBalance
                        )
                        expect(await erc3643.getFrozenTokens(bobAddress)).to.equal(
                            frozenAmount
                        )

                        // Verify free balance calculation
                        const bobFreeBalance =
                            (await erc20Facet.balanceOf(bobAddress)) -
                            (await erc3643.getFrozenTokens(bobAddress))
                        expect(bobFreeBalance).to.equal(freeBalance)
                    })

                    it('GIVEN multiple recoveries WHEN recoveryAddress twice THEN both succeed', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2]
                        const dave = signers[4]
                        const bobAddress = await bob.getAddress()
                        const daveAddress = await dave.getAddress()

                        const aliceBalance =
                            await erc20Facet.balanceOf(aliceAddress)

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(aliceAddress, bobAddress)

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(
                            aliceBalance
                        )

                        await erc3643
                            .connect(owner)
                            .recoveryAddress(bobAddress, daveAddress)

                        expect(await erc20Facet.balanceOf(bobAddress)).to.equal(0n)
                        expect(await erc20Facet.balanceOf(daveAddress)).to.equal(
                            aliceBalance
                        )
                    })
                })
            })
        })
        describe('when Mode compliance is active',() => {
                //** Reserved for future compliance-related tests involving the Controller module */
                describe('when one compliance feature is enabled',() => {
                })

                describe('when multiple compliance features are enabled',() => {
                    //** Probar escenarios donde el compliance de un feature se pasa y el de otro no, y viceversa */
                })
        })
    })

    // ====================================================================
    // COMPLIANCE MODULE
    // ====================================================================
    describe('ERC3643 Compliance', () => {
        describe('when Mode compliance is not active', () => {
            describe('when not initialized', () => {
                it('GIVEN ERC3643 not initialized WHEN initializeERC3643Compliance THEN reverts', async () => {
                    const complianceFacet = (await ethers.getContractAt(
                        'ERC3643ComplianceFacet',
                        proxyAddress
                    )) as ERC3643ComplianceFacet

                    await expect(
                        complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, false)
                    ).to.be.reverted
                })
            })

            describe('when initialized', () => {
                let complianceFacet: ERC3643ComplianceFacet
                let erc3643Capped: IERC203643Capped

                beforeEach(async () => {
                    const fixture = async () => {
                        // Grant necessary roles
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(METADATA_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(COMPLIANCE_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(MINTER_ROLE, ownerAddress)
                        await accessControlFacet
                            .connect(owner)
                            .grantRole(CAP_ROLE, ownerAddress)

                        // Initialize ERC20
                        await erc20Facet
                            .connect(owner)
                            .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                        // Initialize ERC3643 Metadata
                        await erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(version)

                        // Get compliance interface
                        complianceFacet = (await ethers.getContractAt(
                            'ERC3643ComplianceFacet',
                            proxyAddress
                        )) as ERC3643ComplianceFacet

                        // Get capped interface
                        erc3643Capped = (await ethers.getContractAt(
                            'IERC203643Capped',
                            proxyAddress
                        )) as IERC203643Capped

                        // Initialize cap
                        await erc3643Capped.connect(owner).initializeCap(10000n)
                    }
                    await loadFixture(fixture)
                })

                // ----------------------------------------------------------------
                // initializeERC3643Compliance
                // ----------------------------------------------------------------
                describe('initializeERC3643Compliance', () => {
                    it('GIVEN compliance not initialized WHEN initializeERC3643Compliance with both disabled THEN succeeds and emits events', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', false)
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN compliance not initialized WHEN initializeERC3643Compliance with MaxBalance enabled THEN succeeds', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(true, false)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN compliance not initialized WHEN initializeERC3643Compliance with DailyMonthLimits enabled THEN succeeds', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, true)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })

                    it('GIVEN compliance not initialized WHEN initializeERC3643Compliance with both enabled THEN succeeds', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(true, true)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', true)
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })

                    it('GIVEN compliance already initialized WHEN initializeERC3643Compliance again THEN reverts', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, false)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)
                        ).to.be.reverted
                    })
                })

                // ----------------------------------------------------------------
                // setMaxBalanceEnabled
                // ----------------------------------------------------------------
                describe('setMaxBalanceEnabled', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize compliance with both disabled
                            await complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN no COMPLIANCE_ROLE WHEN setMaxBalanceEnabled THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(COMPLIANCE_ROLE, ownerAddress)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(true)
                        ).to.be.reverted
                    })

                    it('GIVEN COMPLIANCE_ROLE WHEN setMaxBalanceEnabled to true THEN succeeds and emits event', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(true)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                    })

                    it('GIVEN MaxBalance enabled WHEN setMaxBalanceEnabled to false THEN succeeds and emits event', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(false)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                    })

                    it('GIVEN MaxBalance disabled WHEN setMaxBalanceEnabled to false again THEN succeeds', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(false)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                    })

                    it('GIVEN MaxBalance enabled WHEN setMaxBalanceEnabled to true again THEN succeeds', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(true)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('MaxBalance', true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                    })
                })

                // ----------------------------------------------------------------
                // setDailyMonthLimitsEnabled
                // ----------------------------------------------------------------
                describe('setDailyMonthLimitsEnabled', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize compliance with both disabled
                            await complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN no COMPLIANCE_ROLE WHEN setDailyMonthLimitsEnabled THEN reverts', async () => {
                        await accessControlFacet
                            .connect(owner)
                            .revokeRole(COMPLIANCE_ROLE, ownerAddress)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(true)
                        ).to.be.reverted
                    })

                    it('GIVEN COMPLIANCE_ROLE WHEN setDailyMonthLimitsEnabled to true THEN succeeds and emits event', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(true)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', true)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })

                    it('GIVEN DailyMonthLimits enabled WHEN setDailyMonthLimitsEnabled to false THEN succeeds and emits event', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(false)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', false)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN DailyMonthLimits disabled WHEN setDailyMonthLimitsEnabled to false again THEN succeeds', async () => {
                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(false)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', false)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN DailyMonthLimits enabled WHEN setDailyMonthLimitsEnabled to true again THEN succeeds', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(true)
                        )
                            .to.emit(complianceFacet, 'ComplianceFeatureToggled')
                            .withArgs('DailyMonthLimits', true)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })
                })

                // ----------------------------------------------------------------
                // isMaxBalanceEnabled
                // ----------------------------------------------------------------
                describe('isMaxBalanceEnabled', () => {
                    it('GIVEN compliance initialized with MaxBalance disabled WHEN isMaxBalanceEnabled THEN returns false', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                    })

                    it('GIVEN compliance initialized with MaxBalance enabled WHEN isMaxBalanceEnabled THEN returns true', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(true, false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                    })

                    it('GIVEN MaxBalance toggled multiple times WHEN isMaxBalanceEnabled THEN returns current state', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false

                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)
                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true

                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(false)
                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                    })
                })

                // ----------------------------------------------------------------
                // isDailyMonthLimitsEnabled
                // ----------------------------------------------------------------
                describe('isDailyMonthLimitsEnabled', () => {
                    it('GIVEN compliance initialized with DailyMonthLimits disabled WHEN isDailyMonthLimitsEnabled THEN returns false', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, false)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN compliance initialized with DailyMonthLimits enabled WHEN isDailyMonthLimitsEnabled THEN returns true', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, true)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })

                    it('GIVEN DailyMonthLimits toggled multiple times WHEN isDailyMonthLimitsEnabled THEN returns current state', async () => {
                        await complianceFacet
                            .connect(owner)
                            .initializeERC3643Compliance(false, false)

                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false

                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true

                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(false)
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })
                })

                // ----------------------------------------------------------------
                // canTransfer
                // ----------------------------------------------------------------
                describe('canTransfer', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize compliance with both disabled
                            await complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)

                            // Mint tokens to alice
                            await erc3643Capped
                                .connect(owner)
                                .mint(aliceAddress, 1000n)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN all compliance features disabled WHEN canTransfer THEN returns true', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2] as unknown as Signer
                        const bobAddress = await bob.getAddress()

                        const canTransfer = await complianceFacet.canTransfer(
                            aliceAddress,
                            bobAddress,
                            100n
                        )

                        expect(canTransfer).to.be.true
                    })

                    it('GIVEN zero amount WHEN canTransfer THEN returns true', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2] as unknown as Signer
                        const bobAddress = await bob.getAddress()

                        const canTransfer = await complianceFacet.canTransfer(
                            aliceAddress,
                            bobAddress,
                            0n
                        )

                        expect(canTransfer).to.be.true
                    })

                    it('GIVEN zero address recipient WHEN canTransfer THEN returns result based on compliance', async () => {
                        // With no compliance enabled, should return true
                        const canTransfer = await complianceFacet.canTransfer(
                            aliceAddress,
                            ZeroAddress,
                            100n
                        )

                        expect(canTransfer).to.be.true
                    })

                    it('GIVEN zero address sender WHEN canTransfer THEN returns result based on compliance', async () => {
                        const signers = await ethers.getSigners()
                        const bob = signers[2] as unknown as Signer
                        const bobAddress = await bob.getAddress()

                        // With no compliance enabled, should return true
                        const canTransfer = await complianceFacet.canTransfer(
                            ZeroAddress,
                            bobAddress,
                            100n
                        )

                        expect(canTransfer).to.be.true
                    })
                })

                // ----------------------------------------------------------------
                // Pause Integration
                // ----------------------------------------------------------------
                describe('Pause Integration', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            await accessControlFacet
                                .connect(owner)
                                .grantRole(PAUSER_ROLE, ownerAddress)

                            // Initialize compliance with both disabled
                            await complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN paused contract WHEN setMaxBalanceEnabled THEN reverts', async () => {
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(true)
                        ).to.be.reverted
                    })

                    it('GIVEN paused contract WHEN setDailyMonthLimitsEnabled THEN reverts', async () => {
                        await pauseFacet.connect(owner).pause()

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(true)
                        ).to.be.reverted
                    })

                    it('GIVEN unpaused contract WHEN setMaxBalanceEnabled THEN succeeds', async () => {
                        await pauseFacet.connect(owner).pause()
                        await pauseFacet.connect(owner).unpause()

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setMaxBalanceEnabled(true)
                        ).to.not.be.reverted
                    })

                    it('GIVEN unpaused contract WHEN setDailyMonthLimitsEnabled THEN succeeds', async () => {
                        await pauseFacet.connect(owner).pause()
                        await pauseFacet.connect(owner).unpause()

                        await expect(
                            complianceFacet
                                .connect(owner)
                                .setDailyMonthLimitsEnabled(true)
                        ).to.not.be.reverted
                    })
                })

                // ----------------------------------------------------------------
                // Complex Scenarios
                // ----------------------------------------------------------------
                describe('Complex Scenarios', () => {
                    beforeEach(async () => {
                        const fixture = async () => {
                            // Initialize compliance with both disabled
                            await complianceFacet
                                .connect(owner)
                                .initializeERC3643Compliance(false, false)
                        }
                        await loadFixture(fixture)
                    })

                    it('GIVEN both features disabled WHEN enabling both simultaneously THEN both are enabled', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })

                    it('GIVEN both features enabled WHEN disabling both simultaneously THEN both are disabled', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)

                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(false)
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN MaxBalance enabled and DailyMonthLimits disabled WHEN toggling DailyMonthLimits THEN MaxBalance state unchanged', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false

                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true

                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })

                    it('GIVEN DailyMonthLimits enabled and MaxBalance disabled WHEN toggling MaxBalance THEN DailyMonthLimits state unchanged', async () => {
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true

                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true

                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.false
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.true
                    })

                    it('GIVEN rapid toggling of features WHEN final state checked THEN reflects last operation', async () => {
                        // Rapid toggles
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(false)
                        await complianceFacet
                            .connect(owner)
                            .setMaxBalanceEnabled(true)
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(true)
                        await complianceFacet
                            .connect(owner)
                            .setDailyMonthLimitsEnabled(false)

                        expect(
                            await complianceFacet.isMaxBalanceEnabled()
                        ).to.be.true
                        expect(
                            await complianceFacet.isDailyMonthLimitsEnabled()
                        ).to.be.false
                    })
                })
            })
        })
    })

    // ====================================================================
    // COMPLIANCE MAX BALANCE FEATURE
    // ====================================================================

    // ====================================================================
    // COMPLIANCE DAY MONTH LIMIT FEATURE
    // ====================================================================
})
