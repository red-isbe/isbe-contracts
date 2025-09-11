import { expect } from 'chai'
import { ethers } from 'hardhat'

import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import { TOKEN_OWNER_ROLE, PAUSER_ROLE } from './constants'
import { IToken } from '../typechain-types'

describe('ERC3643 Token', function () {
    // ====================================================================
    // GLOBAL VARIABLES
    // ====================================================================
    const version = '4.0.0'
    const emptyString = ''

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    async function deployInitial() {
        const [owner, otherAccount, onchainId] = await ethers.getSigners()
        const ownerAddress = await owner.getAddress()
        const otherAccountAddress = await otherAccount.getAddress()
        const onchainIdAddress = await onchainId.getAddress()

        // Deploy without initialization
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

        return {
            ...result,
            owner,
            otherAccount,
            onchainId,
            ownerAddress,
            otherAccountAddress,
            onchainIdAddress,
            // Use IToken as utility interface for scalable testing
            token:
                result.erc3643Metadata ||
                (result.erc3643MetadataFacet as IToken),
            accessControl: result.accessControl || result.accessControlFacet,
            erc20Facet: result.erc20 || result.erc20Facet,
        }
    }

    async function deployInitialized() {
        const result = await deployInitial()

        // Initialize ERC20 first
        await result.erc20Facet.initializeErc20(
            'Test ERC3643 Token',
            'T3643',
            18
        )

        // Grant TOKEN_OWNER_ROLE for ERC3643 operations
        await result.accessControl.grantRole(
            TOKEN_OWNER_ROLE,
            result.ownerAddress
        )

        // Initialize ERC3643
        await result.token.initializeERC3643Metadata(
            result.onchainIdAddress,
            version
        )

        return result
    }

    // ====================================================================
    // FUNCTION-BASED TEST ORGANIZATION
    // ====================================================================

    describe('initializeERC3643Metadata', () => {
        describe('Failures', () => {
            it('GIVEN deployed contract WHEN try to initialize with empty version THEN it fails', async () => {
                const { token, onchainIdAddress } =
                    await loadFixture(deployInitial)

                await expect(
                    token.initializeERC3643Metadata(
                        onchainIdAddress,
                        emptyString
                    )
                ).to.be.revertedWithCustomError(token, 'EmptyString')
            })

            it('GIVEN deployed contract WHEN try to initialize twice THEN it fails', async () => {
                const {
                    token,
                    erc20Facet,
                    accessControl,
                    ownerAddress,
                    onchainIdAddress,
                } = await loadFixture(deployInitial)

                // Initialize ERC20 first
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )

                // Grant TOKEN_OWNER_ROLE
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)

                // First initialization should succeed
                await expect(
                    token.initializeERC3643Metadata(onchainIdAddress, version)
                ).to.emit(token, 'UpdatedTokenInformation')

                // Second initialization should fail
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
                const {
                    token,
                    erc20Facet,
                    accessControl,
                    ownerAddress,
                    onchainIdAddress,
                } = await loadFixture(deployInitial)

                // Initialize ERC20 first
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )

                // Grant TOKEN_OWNER_ROLE
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)

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
                const { token, erc20Facet, accessControl, ownerAddress } =
                    await loadFixture(deployInitial)

                // Initialize ERC20 first
                await erc20Facet.initializeErc20(
                    'Test ERC3643 Token',
                    'T3643',
                    18
                )

                // Grant TOKEN_OWNER_ROLE
                await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)

                await expect(
                    token.initializeERC3643Metadata(ethers.ZeroAddress, version)
                ).to.not.be.reverted

                expect(await token.onchainID()).to.equal(ethers.ZeroAddress)
            })
        })
    })

    describe('setOnchainID', () => {
        describe('Failures', () => {
            it('GIVEN initialized contract WHEN try to set zero address THEN it fails', async () => {
                const { token } = await loadFixture(deployInitialized)

                await expect(
                    token.setOnchainID(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(token, 'AddressZero')
            })

            it('GIVEN initialized contract WHEN non-owner tries to set onchainID THEN it fails', async () => {
                const { token, otherAccount, otherAccountAddress } =
                    await loadFixture(deployInitialized)

                await expect(
                    token
                        .connect(otherAccount)
                        .setOnchainID(otherAccountAddress)
                )
                    .to.be.revertedWithCustomError(token, 'AccountHasNoRole')
                    .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
            })

            it('GIVEN initialized contract WHEN try to set onchainID while paused THEN it fails', async () => {
                const {
                    token,
                    accessControl,
                    pause,
                    ownerAddress,
                    otherAccountAddress,
                } = await loadFixture(deployInitialized)

                await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                await pause.pause()

                await expect(
                    token.setOnchainID(otherAccountAddress)
                ).to.be.revertedWithCustomError(token, 'IsPaused')
            })
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN set valid onchainID THEN it success', async () => {
                const { token, erc20Facet, otherAccountAddress } =
                    await loadFixture(deployInitialized)

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
        describe('Failures', () => {
            it('GIVEN initialized contract WHEN try to set empty name THEN it fails', async () => {
                const { token } = await loadFixture(deployInitialized)

                await expect(
                    token.setName(emptyString)
                ).to.be.revertedWithCustomError(token, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN non-owner tries to set name THEN it fails', async () => {
                const { token, otherAccount, otherAccountAddress } =
                    await loadFixture(deployInitialized)

                await expect(
                    token.connect(otherAccount).setName('Unauthorized Name')
                )
                    .to.be.revertedWithCustomError(token, 'AccountHasNoRole')
                    .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
            })

            it('GIVEN initialized contract WHEN try to set name while paused THEN it fails', async () => {
                const { token, accessControl, pause, ownerAddress } =
                    await loadFixture(deployInitialized)

                await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                await pause.pause()

                await expect(
                    token.setName('NewName')
                ).to.be.revertedWithCustomError(token, 'IsPaused')
            })
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN set valid name THEN it success', async () => {
                const { token, erc20Facet } =
                    await loadFixture(deployInitialized)
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
        describe('Failures', () => {
            it('GIVEN initialized contract WHEN try to set empty symbol THEN it fails', async () => {
                const { token } = await loadFixture(deployInitialized)

                await expect(
                    token.setSymbol(emptyString)
                ).to.be.revertedWithCustomError(token, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN non-owner tries to set symbol THEN it fails', async () => {
                const { token, otherAccount, otherAccountAddress } =
                    await loadFixture(deployInitialized)

                await expect(token.connect(otherAccount).setSymbol('UNAUTH'))
                    .to.be.revertedWithCustomError(token, 'AccountHasNoRole')
                    .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
            })

            it('GIVEN initialized contract WHEN try to set symbol while paused THEN it fails', async () => {
                const { token, accessControl, pause, ownerAddress } =
                    await loadFixture(deployInitialized)

                await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                await pause.pause()

                await expect(
                    token.setSymbol('NEW')
                ).to.be.revertedWithCustomError(token, 'IsPaused')
            })
        })

        describe('Success', () => {
            it('GIVEN initialized contract WHEN set valid symbol THEN it success', async () => {
                const { token, erc20Facet } =
                    await loadFixture(deployInitialized)
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
        describe('Success', () => {
            it('GIVEN initialized contract WHEN checking version THEN it success', async () => {
                const { token } = await loadFixture(deployInitialized)

                expect(await token.version()).to.equal(version)
            })

            it('GIVEN initialized contract WHEN checking onchainID THEN it success', async () => {
                const { token, onchainIdAddress } =
                    await loadFixture(deployInitialized)

                expect(await token.onchainID()).to.equal(onchainIdAddress)
            })

            it('GIVEN deployed contract WHEN checking deployment THEN it success', async () => {
                const { token } = await loadFixture(deployInitial)

                expect(await token.getAddress()).to.not.equal(
                    ethers.ZeroAddress
                )
            })
        })
    })
})
