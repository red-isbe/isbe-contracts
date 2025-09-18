import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import { TOKEN_OWNER_ROLE, PAUSER_ROLE } from './constants'
import { IERC3643, AccessControl, ERC20, ISBEPause } from '../typechain-types'

describe('ERC3643 Token', function () {
    // ====================================================================
    // GLOBAL VARIABLES
    // ====================================================================
    let owner: Signer
    let otherAccount: Signer
    let onchainId: Signer
    let ownerAddress: string
    let otherAccountAddress: string
    let onchainIdAddress: string
    let token: IERC3643
    let accessControl: AccessControl
    let erc20Facet: ERC20
    let pause: ISBEPause

    const version = '4.0.0'
    const emptyString = ''

    async function deployInitial() {
        const signers = await ethers.getSigners()
        owner = signers[0] as unknown as Signer
        otherAccount = signers[1] as unknown as Signer
        onchainId = signers[2] as unknown as Signer

        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()
        onchainIdAddress = await onchainId.getAddress()

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

        token =
            result.erc3643Metadata || (result.erc3643MetadataFacet as IToken)
        accessControl = result.accessControl || result.accessControlFacet
        erc20Facet = result.erc20 || result.erc20Facet
        pause = result.pause || result.pauseFacet

        return result
    }

    beforeEach(async () => {
        await loadFixture(deployInitial)
    })

    describe('initializeERC3643Metadata', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
            }
            await loadFixture(fixture)
        })

        describe('Failures', () => {
            it('GIVEN deployed contract WHEN try to initialize with empty version THEN it fails', async () => {
                await expect(
                    token.initializeERC3643Metadata(
                        onchainIdAddress,
                        emptyString
                    )
                ).to.be.revertedWithCustomError(token, 'EmptyString')
            })

            it('GIVEN deployed contract WHEN try to initialize twice THEN it fails', async () => {
                await expect(
                    token.initializeERC3643Metadata(onchainIdAddress, version)
                ).to.emit(token, 'UpdatedTokenInformation')

                await expect(
                    token.initializeERC3643Metadata(onchainIdAddress, version)
                ).to.be.revertedWithCustomError(
                    token,
                    'ContractIsAlreadyInitialized'
                )
            })
        })

        describe('Success', () => {
            it('GIVEN deployed contract WHEN initialize with valid parameters THEN it success', async () => {
                await expect(
                    token.initializeERC3643Metadata(onchainIdAddress, version)
                )
                    .to.emit(token, 'UpdatedTokenInformation')
                    .withArgs(
                        'Test ERC3643 Token',
                        'T3643',
                        18,
                        version,
                        onchainIdAddress
                    )

                expect(await token.version()).to.equal(version)
                expect(await token.onchainID()).to.equal(onchainIdAddress)
            })

            it('GIVEN deployed contract WHEN initialize with zero onchainID THEN it success', async () => {
                await expect(
                    token.initializeERC3643Metadata(ethers.ZeroAddress, version)
                ).to.not.be.reverted

                expect(await token.onchainID()).to.equal(ethers.ZeroAddress)
            })
        })
    })

    describe('setOnchainID', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
                await token.initializeERC3643Metadata(onchainIdAddress, version)
            }
            await loadFixture(fixture)
        })

        describe('Failures', () => {
            it('GIVEN initialized contract WHEN try to set zero address THEN it fails', async () => {
                await expect(
                    token.setOnchainID(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(token, 'AddressZero')
            })

            it('GIVEN initialized contract WHEN non-owner tries to set onchainID THEN it fails', async () => {
                await expect(
                    token
                        .connect(otherAccount)
                        .setOnchainID(otherAccountAddress)
                )
                    .to.be.revertedWithCustomError(token, 'AccountHasNoRole')
                    .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
            })

            it('GIVEN initialized contract WHEN try to set onchainID while paused THEN it fails', async () => {
                const fixture = async () => {
                    await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                    await pause.pause()
                }
                await loadFixture(fixture)

                await expect(
                    token.setOnchainID(otherAccountAddress)
                ).to.be.revertedWithCustomError(token, 'IsPaused')
            })
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN set valid onchainID THEN it success', async () => {
                const currentName = await erc20Facet.name()
                const currentSymbol = await erc20Facet.symbol()
                const currentDecimals = await erc20Facet.decimals()
                const currentVersion = await token.version()

                await expect(token.setOnchainID(otherAccountAddress))
                    .to.emit(token, 'UpdatedTokenInformation')
                    .withArgs(
                        currentName,
                        currentSymbol,
                        currentDecimals,
                        currentVersion,
                        otherAccountAddress
                    )

                expect(await token.onchainID()).to.equal(otherAccountAddress)
            })
        })
    })

    describe('setName', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
                await token.initializeERC3643Metadata(onchainIdAddress, version)
            }
            await loadFixture(fixture)
        })

        describe('Failures', () => {
            it('GIVEN initialized contract WHEN try to set empty name THEN it fails', async () => {
                await expect(
                    token.setName(emptyString)
                ).to.be.revertedWithCustomError(token, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN non-owner tries to set name THEN it fails', async () => {
                await expect(
                    token.connect(otherAccount).setName('Unauthorized Name')
                )
                    .to.be.revertedWithCustomError(token, 'AccountHasNoRole')
                    .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
            })

            it('GIVEN initialized contract WHEN try to set name while paused THEN it fails', async () => {
                const fixture = async () => {
                    await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                    await pause.pause()
                }
                await loadFixture(fixture)

                await expect(
                    token.setName('NewName')
                ).to.be.revertedWithCustomError(token, 'IsPaused')
            })
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN set valid name THEN it success', async () => {
                const newName = 'Updated ERC3643 Token'
                const currentSymbol = await erc20Facet.symbol()
                const currentDecimals = await erc20Facet.decimals()
                const currentVersion = await token.version()
                const currentOnchainID = await token.onchainID()

                await expect(token.setName(newName))
                    .to.emit(token, 'UpdatedTokenInformation')
                    .withArgs(
                        newName,
                        currentSymbol,
                        currentDecimals,
                        currentVersion,
                        currentOnchainID
                    )

                expect(await erc20Facet.name()).to.equal(newName)
            })
        })
    })

    describe('setSymbol', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
                await token.initializeERC3643Metadata(onchainIdAddress, version)
            }
            await loadFixture(fixture)
        })

        describe('Failures', () => {
            it('GIVEN initialized contract WHEN try to set empty symbol THEN it fails', async () => {
                await expect(
                    token.setSymbol(emptyString)
                ).to.be.revertedWithCustomError(token, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN non-owner tries to set symbol THEN it fails', async () => {
                await expect(token.connect(otherAccount).setSymbol('UNAUTH'))
                    .to.be.revertedWithCustomError(token, 'AccountHasNoRole')
                    .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
            })

            it('GIVEN initialized contract WHEN try to set symbol while paused THEN it fails', async () => {
                const fixture = async () => {
                    await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                    await pause.pause()
                }
                await loadFixture(fixture)

                await expect(
                    token.setSymbol('NEW')
                ).to.be.revertedWithCustomError(token, 'IsPaused')
            })
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN set valid symbol THEN it success', async () => {
                const newSymbol = 'UPD3643'
                const currentName = await erc20Facet.name()
                const currentDecimals = await erc20Facet.decimals()
                const currentVersion = await token.version()
                const currentOnchainID = await token.onchainID()

                await expect(token.setSymbol(newSymbol))
                    .to.emit(token, 'UpdatedTokenInformation')
                    .withArgs(
                        currentName,
                        newSymbol,
                        currentDecimals,
                        currentVersion,
                        currentOnchainID
                    )

                expect(await erc20Facet.symbol()).to.equal(newSymbol)
            })
        })
    })

    describe('View Functions', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
                await token.initializeERC3643Metadata(onchainIdAddress, version)
            }
            await loadFixture(fixture)
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN checking version THEN it success', async () => {
                expect(await token.version()).to.equal(version)
            })

            it('GIVEN initialized contract WHEN checking onchainID THEN it success', async () => {
                expect(await token.onchainID()).to.equal(onchainIdAddress)
            })

            it('GIVEN deployed contract WHEN checking deployment THEN it success', async () => {
                expect(await token.getAddress()).to.not.equal(
                    ethers.ZeroAddress
                )
            })
        })
    })
})
