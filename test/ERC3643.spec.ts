import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import {
    METADATA_ROLE,
    REGULATORY_ROLE,
    FREEZE_ROLE,
    PAUSER_ROLE,
    CONTROLLER_ROLE,
    MINTER_ROLE,
} from './constants'
import {
    IERC3643,
    AccessControl,
    ERC20,
    ISBEPause,
    IERC203643Controller,
    IERC203643Capped,
} from '../typechain-types'
import {
    MockCompliance,
    MockIdentityRegistry,
    MockOnchainID,
} from '../typechain-types'

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

    let tokenOnchainIDAddress: string
    let identityRegistryAddress: string
    let complianceAddress: string

    let onchainIdMock: MockOnchainID
    let identityRegistryMock: MockIdentityRegistry
    let complianceMock: MockCompliance

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

        // Deploy a mock contract to use as ERC3643 onchainID
        const OnchainIdMock = await ethers.getContractFactory('MockOnchainID')
        onchainIdMock = await OnchainIdMock.deploy()
        await onchainIdMock.waitForDeployment()
        tokenOnchainIDAddress = await onchainIdMock.getAddress()

        // Deploy a mock contract to use as IdentityRegistry
        const IdentityRegistryMock = await ethers.getContractFactory(
            'MockIdentityRegistry'
        )
        identityRegistryMock = await IdentityRegistryMock.deploy()
        await identityRegistryMock.waitForDeployment()
        identityRegistryAddress = await identityRegistryMock.getAddress()

        // Deploy a mock contract to use as Compliance
        const ComplianceMock = await ethers.getContractFactory('MockCompliance')
        complianceMock = await ComplianceMock.deploy()
        await complianceMock.waitForDeployment()
        complianceAddress = await complianceMock.getAddress()
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
                            .initializeERC3643Metadata(
                                tokenOnchainIDAddress,
                                emptyString
                            )
                    ).to.be.reverted
                })

                it('GIVEN metadata already initialized WHEN initializeERC3643Metadata again THEN reverts', async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(
                            tokenOnchainIDAddress,
                            version
                        )
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(
                                tokenOnchainIDAddress,
                                version
                            )
                    ).to.be.reverted
                })

                it('GIVEN ERC20 not initialized WHEN initializeERC3643Metadata THEN emits UpdatedTokenInformation with empty values', async () => {
                    expect(await erc20Facet.name()).to.equal('')
                    expect(await erc20Facet.symbol()).to.equal('')
                    expect(await erc20Facet.decimals()).to.equal(0)

                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(
                                tokenOnchainIDAddress,
                                version
                            )
                    )
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs('', '', 0, version, tokenOnchainIDAddress)

                    expect(await erc3643.version()).to.equal(version)
                    expect(await erc3643.onchainID()).to.equal(
                        tokenOnchainIDAddress
                    )
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
                            .initializeERC3643Metadata(
                                tokenOnchainIDAddress,
                                emptyString
                            )
                    ).to.be.reverted
                })

                it('GIVEN ERC20 initialized WHEN initializeERC3643Metadata THEN emits UpdatedTokenInformation with ERC20 values', async () => {
                    const n = await erc20Facet.name()
                    const s = await erc20Facet.symbol()
                    const d = await erc20Facet.decimals()

                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(
                                tokenOnchainIDAddress,
                                version
                            )
                    )
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs(n, s, d, version, tokenOnchainIDAddress)
                })
            })

            describe('setName', () => {
                beforeEach(async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(
                            tokenOnchainIDAddress,
                            version
                        )
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
                        .withArgs(
                            newName,
                            s,
                            d,
                            await erc3643.version(),
                            await erc3643.onchainID()
                        )

                    expect(await erc20Facet.name()).to.equal(newName)
                })
            })

            describe('setSymbol', () => {
                beforeEach(async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(
                            tokenOnchainIDAddress,
                            version
                        )
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
                        .withArgs(
                            n,
                            newSymbol,
                            d,
                            await erc3643.version(),
                            await erc3643.onchainID()
                        )

                    expect(await erc20Facet.symbol()).to.equal(newSymbol)
                })
            })

            describe('setOnchainID', () => {
                beforeEach(async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(
                            tokenOnchainIDAddress,
                            version
                        )
                })

                it('GIVEN ZeroAddress WHEN setOnchainID THEN reverts', async () => {
                    await expect(
                        erc3643.connect(owner).setOnchainID(ZeroAddress)
                    ).to.be.reverted
                })

                it('GIVEN no TOKEN_OWNER_ROLE WHEN setOnchainID THEN reverts', async () => {
                    await accessControlFacet
                        .connect(owner)
                        .revokeRole(METADATA_ROLE, ownerAddress)
                    await expect(
                        erc3643.connect(owner).setOnchainID(aliceAddress)
                    ).to.be.reverted
                })

                it('GIVEN contract paused WHEN setOnchainID THEN reverts', async () => {
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(PAUSER_ROLE, ownerAddress)
                    await pauseFacet.connect(owner).pause()
                    await expect(
                        erc3643.connect(owner).setOnchainID(aliceAddress)
                    ).to.be.reverted
                })

                it('GIVEN initialized metadata WHEN setOnchainID with valid address THEN updates onchainID and emits UpdatedTokenInformation', async () => {
                    const n = await erc20Facet.name()
                    const s = await erc20Facet.symbol()
                    const d = await erc20Facet.decimals()

                    await expect(
                        erc3643.connect(owner).setOnchainID(aliceAddress)
                    )
                        .to.emit(erc3643, 'UpdatedTokenInformation')
                        .withArgs(
                            n,
                            s,
                            d,
                            await erc3643.version(),
                            aliceAddress
                        )

                    expect(await erc3643.onchainID()).to.equal(aliceAddress)
                })
            })

            describe('getters', () => {
                it('GIVEN initialized metadata WHEN call getters THEN return stored values', async () => {
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(aliceAddress, version)
                    expect(await erc3643.version()).to.equal(version)
                    expect(await erc3643.onchainID()).to.equal(aliceAddress)
                })
            })
        })
    })

    // ====================================================================
    // REGULATORY MODULE
    // ====================================================================
    describe('ERC3643 Regulatory', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(REGULATORY_ROLE, ownerAddress)
            }
            await loadFixture(fixture)
        })

        describe('initializeERC3643Regulatory', () => {
            it('GIVEN regulatory already initialized WHEN initializeERC3643Regulatory again THEN reverts', async () => {
                await erc3643
                    .connect(owner)
                    .initializeERC3643Regulatory(
                        identityRegistryAddress,
                        complianceAddress
                    )
                await expect(
                    erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(
                            identityRegistryAddress,
                            complianceAddress
                        )
                ).to.be.reverted
            })

            it('GIVEN both addresses non-zero WHEN initializeERC3643Regulatory THEN binds token in compliance and emits events', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(
                            identityRegistryAddress,
                            complianceAddress
                        )
                )
                    .to.emit(erc3643, 'IdentityRegistryAdded')
                    .withArgs(identityRegistryAddress)
                    .and.to.emit(erc3643, 'ComplianceAdded')
                    .withArgs(complianceAddress)

                const bound = await complianceMock.lastToken()
                expect(bound.toLowerCase()).to.equal(proxyAddress.toLowerCase())

                expect(await erc3643.identityRegistry()).to.equal(
                    identityRegistryAddress
                )
                expect(await erc3643.compliance()).to.equal(complianceAddress)
            })

            it('GIVEN both addresses zero WHEN initializeERC3643Regulatory THEN allows zero, emits events with zero and does not bind', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(ZeroAddress, ZeroAddress)
                )
                    .to.emit(erc3643, 'IdentityRegistryAdded')
                    .withArgs(ZeroAddress)
                    .and.to.emit(erc3643, 'ComplianceAdded')
                    .withArgs(ZeroAddress)

                expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
                expect(await erc3643.compliance()).to.equal(ZeroAddress)

                // no bindToken should have been called
                expect(await complianceMock.lastToken()).to.equal(ZeroAddress)
            })

            it('GIVEN identityRegistry zero and compliance non-zero WHEN initializeERC3643Regulatory THEN stores correctly and binds token', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(
                            ZeroAddress,
                            complianceAddress
                        )
                )
                    .to.emit(erc3643, 'IdentityRegistryAdded')
                    .withArgs(ZeroAddress)
                    .and.to.emit(erc3643, 'ComplianceAdded')
                    .withArgs(complianceAddress)

                const bound = await complianceMock.lastToken()
                expect(bound.toLowerCase()).to.equal(proxyAddress.toLowerCase())

                expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
                expect(await erc3643.compliance()).to.equal(complianceAddress)
            })

            it('GIVEN identityRegistry non-zero and compliance zero WHEN initializeERC3643Regulatory THEN stores correctly and does not bind', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(
                            identityRegistryAddress,
                            ZeroAddress
                        )
                )
                    .to.emit(erc3643, 'IdentityRegistryAdded')
                    .withArgs(identityRegistryAddress)
                    .and.to.emit(erc3643, 'ComplianceAdded')
                    .withArgs(ZeroAddress)

                expect(await erc3643.identityRegistry()).to.equal(
                    identityRegistryAddress
                )
                expect(await erc3643.compliance()).to.equal(ZeroAddress)

                // no bindToken should have been called
                expect(await complianceMock.lastToken()).to.equal(ZeroAddress)
            })
        })

        describe('setIdentityRegistry', () => {
            beforeEach(async () => {
                await erc3643
                    .connect(owner)
                    .initializeERC3643Regulatory(ZeroAddress, ZeroAddress)
            })

            it('GIVEN no TOKEN_OWNER_ROLE WHEN setIdentityRegistry THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(REGULATORY_ROLE, ownerAddress)

                await expect(
                    erc3643
                        .connect(owner)
                        .setIdentityRegistry(identityRegistryAddress)
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN setIdentityRegistry THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)

                await pauseFacet.connect(owner).pause()

                await expect(
                    erc3643
                        .connect(owner)
                        .setIdentityRegistry(identityRegistryAddress)
                ).to.be.reverted
            })

            it('GIVEN valid address WHEN setIdentityRegistry THEN updates and emits', async () => {
                await expect(
                    erc3643
                        .connect(owner)
                        .setIdentityRegistry(identityRegistryAddress)
                )
                    .to.emit(erc3643, 'IdentityRegistryAdded')
                    .withArgs(identityRegistryAddress)

                expect(await erc3643.identityRegistry()).to.equal(
                    identityRegistryAddress
                )
            })

            it('GIVEN zero address WHEN setIdentityRegistry THEN updates to zero and emits', async () => {
                await expect(
                    erc3643.connect(owner).setIdentityRegistry(ZeroAddress)
                )
                    .to.emit(erc3643, 'IdentityRegistryAdded')
                    .withArgs(ZeroAddress)

                expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
            })
        })

        describe('setCompliance', () => {
            beforeEach(async () => {
                await erc3643
                    .connect(owner)
                    .initializeERC3643Regulatory(ZeroAddress, ZeroAddress)
            })

            it('GIVEN no TOKEN_OWNER_ROLE WHEN setCompliance THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .revokeRole(REGULATORY_ROLE, ownerAddress)
                await expect(
                    erc3643.connect(owner).setCompliance(complianceAddress)
                ).to.be.reverted
            })

            it('GIVEN contract paused WHEN setCompliance THEN reverts', async () => {
                await accessControlFacet
                    .connect(owner)
                    .grantRole(PAUSER_ROLE, ownerAddress)
                await pauseFacet.connect(owner).pause()
                await expect(
                    erc3643.connect(owner).setCompliance(complianceAddress)
                ).to.be.reverted
            })

            it('GIVEN zero address WHEN setCompliance THEN updates to zero and emits (no bindToken)', async () => {
                await expect(erc3643.connect(owner).setCompliance(ZeroAddress))
                    .to.emit(erc3643, 'ComplianceAdded')
                    .withArgs(ZeroAddress)

                expect(await erc3643.compliance()).to.equal(ZeroAddress)

                // lastToken should remain zero (no new bind call)
                expect(await complianceMock.lastToken()).to.equal(ZeroAddress)
            })

            it('GIVEN valid address WHEN setCompliance THEN updates, emits and binds token', async () => {
                await expect(
                    erc3643.connect(owner).setCompliance(complianceAddress)
                )
                    .to.emit(erc3643, 'ComplianceAdded')
                    .withArgs(complianceAddress)

                expect(await erc3643.compliance()).to.equal(complianceAddress)

                const bound = await complianceMock.lastToken()
                expect(bound.toLowerCase()).to.equal(proxyAddress.toLowerCase())
            })
        })

        describe('getters', () => {
            it('GIVEN initialized regulatory WHEN call getters THEN return stored references', async () => {
                await erc3643
                    .connect(owner)
                    .initializeERC3643Regulatory(
                        identityRegistryAddress,
                        complianceAddress
                    )

                expect(await erc3643.identityRegistry()).to.equal(
                    identityRegistryAddress
                )
                expect(await erc3643.compliance()).to.equal(complianceAddress)
            })

            it('GIVEN zero initialization WHEN call getters THEN return zero addresses', async () => {
                await erc3643
                    .connect(owner)
                    .initializeERC3643Regulatory(ZeroAddress, ZeroAddress)

                expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
                expect(await erc3643.compliance()).to.equal(ZeroAddress)
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
        describe('when ERC3643 is not initialized but ERC20 is', () => {
            //** ERC20 module test cover its main use cases. We reserve this space for future implementations that may involve ERC20 behavior not expected by its standard implementation and caused by futures interactions with any logic change from ERC3643 Controller */
        })

        // --------------------------------------------------------------------
        // when ERC3643 is initialized
        // --------------------------------------------------------------------
        describe('when ERC3643 is initialized', () => {
            const totalBalance = 1000n
            const frozenAmount = 400n
            const freeBalance = totalBalance - frozenAmount // 600n

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
                        .initializeERC3643Metadata(
                            tokenOnchainIDAddress,
                            version
                        )
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(
                            identityRegistryAddress,
                            complianceAddress
                        )

                    // Get controller and capped interfaces
                    erc3643Controller = (await ethers.getContractAt(
                        'IERC203643Controller',
                        proxyAddress
                    )) as IERC203643Controller

                    erc3643Capped = (await ethers.getContractAt(
                        'IERC203643Capped',
                        proxyAddress
                    )) as IERC203643Capped

                    // Setup identity registry to allow alice and bob BEFORE minting
                    await identityRegistryMock.setIsVerified(aliceAddress, true)
                    await identityRegistryMock.setIsVerified(bobAddress, true)

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

                it('GIVEN unverified recipient WHEN forceTransfer THEN reverts', async () => {
                    await identityRegistryMock.setIsVerified(bobAddress, false)

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
        })
    })
})
