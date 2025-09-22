import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import { TOKEN_OWNER_ROLE, PAUSER_ROLE } from './constants'
import { IERC3643, AccessControl, ERC20, ISBEPause, ERC3643Metadata, ERC3643Regulatory } from '../typechain-types'

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
    let erc3643MetadataFacet: ERC3643Metadata
    let erc3643RegulatoryFacet: ERC3643Regulatory

    const version = '3.0.0'
    const emptyString = ''

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    async function pauseContractWithRole() {
        await accessControlFacet.connect(owner).grantRole(PAUSER_ROLE, await owner.getAddress())
        await pauseFacet.connect(owner).pause()
    }

    async function expectUnauthorizedToFail(promise: Promise<any>) {
        await expect(promise).to.be.reverted
    }

    async function expectOperationSuccess(promise: Promise<any>) {
        await expect(promise).to.not.be.reverted
    }

    // ====================================================================
    // COMMON FIXTURES
    // ====================================================================
    async function deployInitial() {
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

        // Get the IERC3643 interface from the Diamond proxy
        // The Diamond proxy must contain all facets through the same address
        const proxyAddress = await result.useCaseProxy
        erc3643 = (await ethers.getContractAt(
            'IERC3643',
            proxyAddress
        )) as IERC3643
        
        accessControlFacet = result.accessControl
        erc20Facet = result.erc20
        pauseFacet = result.pause
        erc3643MetadataFacet = result.erc3643Metadata
        erc3643RegulatoryFacet = result.erc3643Regulatory
    }

    // Basic ERC20 + Role setup
    async function deployWithBasicSetup() {
        await loadFixture(deployInitial)
        
        await erc20Facet.initializeErc20('Test ERC3643 Token', 'T3643', 18)
        await accessControlFacet.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
    }

    // Basic setup + Metadata module initialized
    async function deployWithMetadataModule() {
        await deployWithBasicSetup()
        
        await erc3643.connect(owner).initializeERC3643Metadata(ownerAddress, version)
    }

    // Basic setup + Both modules initialized (configurable regulatory params)
    async function deployWithBothModules(identityRegistry = aliceAddress, compliance = ethers.ZeroAddress) {
        await deployWithBasicSetup()
        
        // Initialize both modules sequentially
        await erc3643.connect(owner).initializeERC3643Metadata(ownerAddress, version)
        await erc3643.connect(owner).initializeERC3643Regulatory(identityRegistry, compliance)
    }

    // Basic setup + Metadata + Empty Regulatory (for testing regulatory functions)
    async function deployWithEmptyRegulatoryModule() {
        return deployWithBothModules(ZeroAddress, ZeroAddress)
    }

    describe('ERC3643Metadata Module', () => {
        beforeEach(async () => {
            await loadFixture(deployInitial)
        })

        describe('initializeERC3643Metadata', () => {
            beforeEach(async () => {
                await loadFixture(deployWithBasicSetup)
            })

            describe('Failures', () => {
                it('GIVEN deployed contract WHEN try to initialize with empty version THEN it fails', async () => {
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(ZeroAddress, emptyString)
                    ).to.be.reverted
                })

                it('GIVEN deployed contract WHEN try to initialize twice THEN it fails', async () => {
                    // First initialization
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Metadata(ZeroAddress, version)

                    // Second initialization should fail
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Metadata(ZeroAddress, '3.0.1')
                    ).to.be.reverted
                })
            })

            describe('Success', () => {
                it('GIVEN deployed contract WHEN initialize with valid parameters THEN it success', async () => {
                    await expectOperationSuccess(
                        erc3643.connect(owner).initializeERC3643Metadata(ownerAddress, version)
                    )

                    expect(await erc3643.version()).to.equal(version)
                    expect(await erc3643.onchainID()).to.equal(ownerAddress)
                })

                it('GIVEN deployed contract WHEN initialize with zero onchainID THEN it success', async () => {
                    await expectOperationSuccess(
                        erc3643.connect(owner).initializeERC3643Metadata(ZeroAddress, version)
                    )

                    expect(await erc3643.onchainID()).to.equal(ZeroAddress)
                })
            })
        })

        describe('setOnchainID', () => {
            beforeEach(async () => {
                await loadFixture(deployWithMetadataModule)
            })

            describe('Failures', () => {
                it('GIVEN initialized contract WHEN try to set zero address THEN it fails', async () => {
                    await expect(erc3643.connect(owner).setOnchainID(ZeroAddress))
                        .to.be.reverted
                })

                it('GIVEN initialized contract WHEN non-owner tries to set onchainID THEN it fails', async () => {
                    await expectUnauthorizedToFail(
                        erc3643.connect(alice).setOnchainID(aliceAddress)
                    )
                })

                it('GIVEN initialized contract WHEN try to set onchainID while paused THEN it fails', async () => {
                    await pauseContractWithRole()

                    await expect(
                        erc3643.connect(owner).setOnchainID(aliceAddress)
                    ).to.be.reverted
                })
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN set valid onchainID THEN it success', async () => {
                    await expectOperationSuccess(
                        erc3643.connect(owner).setOnchainID(aliceAddress)
                    )

                    expect(await erc3643.onchainID()).to.equal(aliceAddress)
                })
            })
        })

        describe('setName', () => {
            beforeEach(async () => {
                await loadFixture(deployWithMetadataModule)
            })

            describe('Failures', () => {
                it('GIVEN initialized contract WHEN try to set empty name THEN it fails', async () => {
                    await expect(erc3643.connect(owner).setName(emptyString)).to
                        .be.reverted
                })

                it('GIVEN initialized contract WHEN non-owner tries to set name THEN it fails', async () => {
                    await expectUnauthorizedToFail(
                        erc3643.connect(alice).setName('Hacked Token')
                    )
                })

                it('GIVEN initialized contract WHEN try to set name while paused THEN it fails', async () => {
                    await pauseContractWithRole()

                    await expect(erc3643.connect(owner).setName('Updated Token'))
                        .to.be.reverted
                })
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN set valid name THEN it success', async () => {
                    await expectOperationSuccess(
                        erc3643.connect(owner).setName('Updated Token')
                    )

                    expect(await erc3643.name()).to.equal('Updated Token')
                })
            })
        })

        describe('setSymbol', () => {
            beforeEach(async () => {
                await loadFixture(deployWithMetadataModule)
            })

            describe('Failures', () => {
                it('GIVEN initialized contract WHEN try to set empty symbol THEN it fails', async () => {
                    await expect(erc3643.connect(owner).setSymbol(emptyString)).to
                        .be.reverted
                })

                it('GIVEN initialized contract WHEN non-owner tries to set symbol THEN it fails', async () => {
                    await expectUnauthorizedToFail(
                        erc3643.connect(alice).setSymbol('HACK')
                    )
                })

                it('GIVEN initialized contract WHEN try to set symbol while paused THEN it fails', async () => {
                    await pauseContractWithRole()

                    await expect(erc3643.connect(owner).setSymbol('UPD')).to.be
                        .reverted
                })
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN set valid symbol THEN it success', async () => {
                    await expectOperationSuccess(
                        erc3643.connect(owner).setSymbol('UPD')
                    )

                    expect(await erc3643.symbol()).to.equal('UPD')
                })
            })
        })

        describe('View Functions', () => {
            beforeEach(async () => {
                await loadFixture(deployWithMetadataModule)
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN checking version THEN it success', async () => {
                    expect(await erc3643.version()).to.equal(version)
                })

                it('GIVEN initialized contract WHEN checking onchainID THEN it success', async () => {
                    expect(await erc3643.onchainID()).to.equal(ownerAddress)
                })

                it('GIVEN deployed contract WHEN checking deployment THEN it success', async () => {
                    expect(await erc3643.getAddress()).to.not.equal(ZeroAddress)
                })
            })
        })
    })

    describe('ERC3643Regulatory Module', () => {
        beforeEach(async () => {
            await loadFixture(deployInitial)
        })

        describe('initializeERC3643Regulatory', () => {
            beforeEach(async () => {
                await loadFixture(deployWithMetadataModule)
            })

            describe('Failures', () => {
                it('GIVEN deployed contract WHEN try to initialize twice THEN it fails', async () => {
                    // First initialization
                    await erc3643
                        .connect(owner)
                        .initializeERC3643Regulatory(ZeroAddress, ZeroAddress)

                    // Second initialization should fail
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Regulatory(
                                ownerAddress,
                                ownerAddress
                            )
                    ).to.be.reverted
                })

                it('GIVEN deployed contract WHEN initialize with invalid compliance THEN it fails', async () => {
                    // Test for coverage: This test ensures coverage of the bindToken call in _setCompliance
                    // Using a non-contract address (alice) as compliance should fail when attempting to call bindToken
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Regulatory(
                                ethers.ZeroAddress,  // identity registry
                                aliceAddress         // invalid compliance address (EOA)
                            )
                    ).to.be.reverted
                })
            })

            describe('Success', () => {
                it('GIVEN deployed contract WHEN initialize with valid parameters THEN it success', async () => {
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Regulatory(
                                aliceAddress,
                                ethers.ZeroAddress
                            )
                    ).to.not.be.reverted

                    expect(await erc3643.identityRegistry()).to.equal(
                        aliceAddress
                    )
                    expect(await erc3643.compliance()).to.equal(
                        ethers.ZeroAddress
                    )
                })

                it('GIVEN deployed contract WHEN initialize with zero addresses THEN it success', async () => {
                    await expect(
                        erc3643
                            .connect(owner)
                            .initializeERC3643Regulatory(
                                ethers.ZeroAddress,
                                ethers.ZeroAddress
                            )
                    ).to.not.be.reverted

                    expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
                    expect(await erc3643.compliance()).to.equal(ZeroAddress)
                })
            })
        })

        describe('setIdentityRegistry', () => {
            beforeEach(async () => {
                await loadFixture(deployWithEmptyRegulatoryModule)
            })

            describe('Failures', () => {
                it('GIVEN initialized contract WHEN non-owner tries to set identity registry THEN it fails', async () => {
                    await expectUnauthorizedToFail(
                        erc3643.connect(alice).setIdentityRegistry(aliceAddress)
                    )
                })

                it('GIVEN initialized contract WHEN try to set identity registry while paused THEN it fails', async () => {
                    await pauseContractWithRole()

                    await expect(
                        erc3643.connect(owner).setIdentityRegistry(ownerAddress)
                    ).to.be.reverted
                })
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN set valid identity registry THEN it success', async () => {
                    await expect(
                        erc3643.connect(owner).setIdentityRegistry(aliceAddress)
                    ).to.not.be.reverted

                    expect(await erc3643.identityRegistry()).to.equal(
                        aliceAddress
                    )
                })

                it('GIVEN initialized contract WHEN set zero address THEN it success', async () => {
                    await expect(
                        erc3643.connect(owner).setIdentityRegistry(ZeroAddress)
                    ).to.not.be.reverted

                    expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
                })
            })
        })

        describe('setCompliance', () => {
            beforeEach(async () => {
                await loadFixture(deployWithEmptyRegulatoryModule)
            })

            describe('Failures', () => {
                it('GIVEN initialized contract WHEN non-owner tries to set compliance THEN it fails', async () => {
                    await expectUnauthorizedToFail(
                        erc3643.connect(alice).setCompliance(aliceAddress)
                    )
                })

                it('GIVEN initialized contract WHEN try to set compliance while paused THEN it fails', async () => {
                    await pauseContractWithRole()

                    await expect(
                        erc3643.connect(owner).setCompliance(ownerAddress)
                    ).to.be.reverted
                })

                it('GIVEN initialized contract WHEN set invalid compliance address THEN it fails', async () => {
                    // Test for coverage: This test ensures coverage of the bindToken call in _setCompliance
                    // Using a non-contract address (alice) as compliance should fail when attempting to call bindToken
                    await expect(
                        erc3643.connect(owner).setCompliance(aliceAddress)
                    ).to.be.reverted
                })
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN set valid compliance THEN it success', async () => {
                    await expect(
                        erc3643.connect(owner).setCompliance(ethers.ZeroAddress)
                    ).to.not.be.reverted

                    expect(await erc3643.compliance()).to.equal(
                        ethers.ZeroAddress
                    )
                })

                it('GIVEN initialized contract WHEN set zero address THEN it success', async () => {
                    await expect(
                        erc3643.connect(owner).setCompliance(ZeroAddress)
                    ).to.not.be.reverted

                    expect(await erc3643.compliance()).to.equal(ZeroAddress)
                })
            })
        })

        describe('View Functions', () => {
            beforeEach(async () => {
                await loadFixture(deployWithBothModules)
            })

            describe('Success', () => {
                it('GIVEN initialized contract WHEN checking identityRegistry THEN it success', async () => {
                    expect(await erc3643.identityRegistry()).to.equal(
                        aliceAddress
                    )
                })

                it('GIVEN initialized contract WHEN checking compliance THEN it success', async () => {
                    expect(await erc3643.compliance()).to.equal(
                        ethers.ZeroAddress
                    )
                })

                it('GIVEN contract with zero addresses WHEN checking regulatory references THEN it success', async () => {
                    // Reset to zero addresses
                    await erc3643.connect(owner).setIdentityRegistry(ZeroAddress)
                    await erc3643.connect(owner).setCompliance(ZeroAddress)

                    expect(await erc3643.identityRegistry()).to.equal(ZeroAddress)
                    expect(await erc3643.compliance()).to.equal(ZeroAddress)
                })
            })
        })

        describe('Integration Tests', () => {
            beforeEach(async () => {
                await loadFixture(deployWithBothModules)
            })

            describe('Success', () => {
                it('GIVEN fully initialized contract WHEN checking all modules THEN it success', async () => {
                    // Metadata module functions work
                    expect(await erc3643.version()).to.equal(version)
                    expect(await erc3643.name()).to.equal('Test ERC3643 Token')
                    expect(await erc3643.symbol()).to.equal('T3643')
                    expect(await erc3643.onchainID()).to.equal(ownerAddress)

                    // Regulatory module functions work
                    expect(await erc3643.identityRegistry()).to.equal(
                        aliceAddress
                    )
                    expect(await erc3643.compliance()).to.equal(
                        ethers.ZeroAddress
                    )
                })

                it('GIVEN fully initialized contract WHEN updating both modules THEN it success', async () => {
                    // Update metadata
                    await erc3643
                        .connect(owner)
                        .setName('Updated Regulatory Token')
                    await erc3643.connect(owner).setSymbol('URT')

                    // Update regulatory
                    await erc3643.connect(owner).setIdentityRegistry(aliceAddress)
                    await erc3643.connect(owner).setCompliance(ethers.ZeroAddress)

                    // Verify all updates
                    expect(await erc3643.name()).to.equal(
                        'Updated Regulatory Token'
                    )
                    expect(await erc3643.symbol()).to.equal('URT')
                    expect(await erc3643.identityRegistry()).to.equal(
                        aliceAddress
                    )
                    expect(await erc3643.compliance()).to.equal(
                        ethers.ZeroAddress
                    )
                })
            })
        })
    })
})
