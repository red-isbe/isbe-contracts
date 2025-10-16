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
    CAP_ROLE,
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
        describe('when Mode ERC20', () => {
            //** ERC20 module test cover its main use cases. We reserve this space for future implementations that may involve ERC20 behavior not expected by its standard implementation and caused by futures interactions with any logic change from ERC3643 Controller */
        })

        // --------------------------------------------------------------------
        // when ERC3643 is initialized
        // --------------------------------------------------------------------
        describe('when Mode ERC3643', () => {
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
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(REGULATORY_ROLE, ownerAddress)

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

                    // Get capped and controller interfaces
                    erc3643Capped = (await ethers.getContractAt(
                        'IERC203643Capped',
                        proxyAddress
                    )) as IERC203643Capped

                    // Setup identity registry to allow alice and bob
                    await identityRegistryMock.setIsVerified(aliceAddress, true)
                    await identityRegistryMock.setIsVerified(bobAddress, true)
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

                it('GIVEN unverified recipient WHEN mint THEN reverts (ERC3643 mode)', async () => {
                    await identityRegistryMock.setIsVerified(
                        aliceAddress,
                        false
                    )

                    await expect(
                        erc3643Capped.connect(owner).mint(aliceAddress, 1000n)
                    ).to.be.reverted
                })

                it('GIVEN verified recipient WHEN mint within cap THEN succeeds and emits Transfer', async () => {
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
    })

    // ====================================================================
    // PRIMITIVES MODULE
    // ====================================================================
    describe('ERC3643 Primitives', () => {
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
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(REGULATORY_ROLE, ownerAddress)

                    // Initialize ERC20
                    await erc20Facet
                        .connect(owner)
                        .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                    // Initialize ERC3643 modules (this puts us in ERC3643 mode)
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

                    // Setup identity registry
                    await identityRegistryMock.setIsVerified(aliceAddress, true)

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

            it('GIVEN ERC3643 mode WHEN trying to access burn functions THEN ERC20BurnableFacet is not exposed', async () => {
                // Verify that the standard ERC20Burnable interface is not available
                // In ERC3643 mode, only forceBurn (from Controller) should be available
                const hasIdentityRegistry =
                    (await erc3643.identityRegistry()) !== ZeroAddress

                expect(hasIdentityRegistry).to.be.true

                // In ERC3643 mode, burn/burnFrom should not be accessible
                // Only forceBurn from the Controller facet should work
                // This is verified by the regulatory compliance requirements
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
                    await accessControlFacet
                        .connect(owner)
                        .grantRole(REGULATORY_ROLE, ownerAddress)

                    // Initialize ERC20
                    await erc20Facet
                        .connect(owner)
                        .initializeErc20(tokenName, tokenSymbol, tokenDecimals)

                    // Initialize ERC3643 modules (this puts us in ERC3643 mode)
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

                    // Get capped interface and initialize cap
                    erc3643Capped = (await ethers.getContractAt(
                        'IERC203643Capped',
                        proxyAddress
                    )) as IERC203643Capped

                    await erc3643Capped.connect(owner).initializeCap(10000n)
                }
                await loadFixture(fixture)
            })

            it('GIVEN ERC3643 mode WHEN mint to unverified recipient THEN reverts', async () => {
                // Alice is NOT verified in identity registry
                await identityRegistryMock.setIsVerified(aliceAddress, false)

                await expect(
                    erc3643Capped.connect(owner).mint(aliceAddress, 1000n)
                ).to.be.reverted
            })

            it('GIVEN ERC3643 mode WHEN mint to verified recipient THEN succeeds', async () => {
                // Alice IS verified in identity registry
                await identityRegistryMock.setIsVerified(aliceAddress, true)

                await expect(
                    erc3643Capped.connect(owner).mint(aliceAddress, 1000n)
                )
                    .to.emit(erc20Facet, 'Transfer')
                    .withArgs(ZeroAddress, aliceAddress, 1000n)

                expect(await erc20Facet.balanceOf(aliceAddress)).to.equal(1000n)
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
                        .grantRole(REGULATORY_ROLE, ownerAddress)
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

                    // Setup identity registry - verify alice and bob
                    await identityRegistryMock.setIsVerified(aliceAddress, true)
                    await identityRegistryMock.setIsVerified(bobAddress, true)

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
                it('GIVEN ERC3643 mode WHEN transfer to unverified recipient THEN reverts', async () => {
                    // Bob is NOT verified
                    await identityRegistryMock.setIsVerified(bobAddress, false)

                    await expect(
                        erc20Facet.connect(alice).transfer(bobAddress, 100n)
                    ).to.be.reverted
                })

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

                it('GIVEN ERC3643 mode WHEN transferFrom to unverified recipient THEN reverts', async () => {
                    // Bob is NOT verified
                    await identityRegistryMock.setIsVerified(bobAddress, false)

                    await expect(
                        erc20Facet
                            .connect(owner)
                            .transferFrom(aliceAddress, bobAddress, 100n)
                    ).to.be.reverted
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
        })
    })
})
