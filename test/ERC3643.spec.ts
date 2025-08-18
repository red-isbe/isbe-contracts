import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { ERC3643MetadataFacet, AccessControlFacet } from '../typechain-types'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import {
    ERC3643_METADATA_RESOLVER_KEY,
    TOKEN_OWNER_ROLE,
    PAUSER_ROLE,
} from './constants'

describe('ERC3643 Metadata Facet', function () {
    const version = '4.0.0'

    let erc3643MetadataFacet: ERC3643MetadataFacet
    let accessControl: AccessControlFacet

    let owner: Signer
    let ownerAddress: string
    let otherAccount: Signer
    let otherAccountAddress: string
    let onchainId: Signer
    let onchainIdAddress: string

    before(async () => {
        ;[owner, otherAccount, onchainId] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()
        onchainIdAddress = await onchainId.getAddress()
    })

    async function deploy(initialize: boolean = false) {
        let businessIds = []
        let data = []

        if (initialize) {
            // Prepare initialization data for ERC3643MetadataFacet
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            const initData =
                ERC3643MetadataFactory.interface.encodeFunctionData(
                    'initializeERC3643Metadata',
                    [onchainIdAddress, version]
                )

            data.push(initData)
            businessIds.push(ERC3643_METADATA_RESOLVER_KEY)
        } else {
            // When not initializing, use empty arrays to avoid length mismatch errors
            businessIds = []
            data = []
        }

        const result = await deployGovernance(
            owner,
            [],
            CONFIGURATION_ID_ERC3643,
            false,
            '0x',
            businessIds,
            data,
            false
        )

        // Extract contracts from result
        erc3643MetadataFacet = result.erc3643Metadata

        accessControl = result.accessControl

        // Grant TOKEN_OWNER_ROLE to the owner after initialization
        if (initialize) {
            await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
        }

        return result
    }
    describe('Deployment', () => {
        it('GIVEN ERC3643 Metadata Facet WHEN it is deployed THEN it should deploy successfully', async () => {
            await deploy()

            expect(await erc3643MetadataFacet.getAddress()).to.not.equal(
                ethers.ZeroAddress
            )
        })

        it('GIVEN ERC3643 Metadata Facet WHEN initialized THEN it should have correct initial values', async () => {
            await deploy(true) // Deploy with initialization

            const actualVersion = await erc3643MetadataFacet.version()
            const actualOnchainId = await erc3643MetadataFacet.onchainID()

            // Check initial values
            expect(actualVersion).to.equal(version)
            expect(actualOnchainId).to.equal(onchainIdAddress)
        })

        it('GIVEN ERC3643 Metadata Facet WHEN already initialized THEN it should reject re-initialization', async () => {
            await deploy(true) // Deploy with initialization

            // Should reject re-initialization
            await expect(
                erc3643MetadataFacet.initializeERC3643Metadata(
                    onchainIdAddress,
                    version
                )
            ).to.be.revertedWithCustomError(
                erc3643MetadataFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN ERC3643 Metadata Facet WHEN initialized THEN it should prevent double initialization', async () => {
            await deploy(true)

            await expect(
                erc3643MetadataFacet.initializeERC3643Metadata(
                    onchainIdAddress,
                    version
                )
            ).to.be.revertedWithCustomError(
                erc3643MetadataFacet,
                'ContractIsAlreadyInitialized'
            )
        })
    })

    describe('ERC3643 Metadata Functionality', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN checking version THEN it should return correct version', async () => {
            expect(await erc3643MetadataFacet.version()).to.equal(version)
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN checking onchainID THEN it should return correct address', async () => {
            expect(await erc3643MetadataFacet.onchainID()).to.equal(
                onchainIdAddress
            )
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN updating onchainID THEN it should update successfully', async () => {
            await expect(
                erc3643MetadataFacet.setOnchainID(otherAccountAddress)
            ).to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')

            expect(await erc3643MetadataFacet.onchainID()).to.equal(
                otherAccountAddress
            )
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN updating name THEN it should update successfully', async () => {
            const newName = 'Updated ERC3643 Token'

            await expect(erc3643MetadataFacet.setName(newName)).to.emit(
                erc3643MetadataFacet,
                'UpdatedTokenInformation'
            )
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN updating symbol THEN it should update successfully', async () => {
            const newSymbol = 'UPD3643'

            await expect(erc3643MetadataFacet.setSymbol(newSymbol)).to.emit(
                erc3643MetadataFacet,
                'UpdatedTokenInformation'
            )
        })
    })

    describe('Business Logic Introspection', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN an initialized ERC3643 Metadata Facet WHEN checking business ID THEN it should return ERC3643 resolver key', async () => {
            expect(
                await erc3643MetadataFacet.businessIdIntrospection()
            ).to.equal(ERC3643_METADATA_RESOLVER_KEY)
        })

        it('GIVEN an initialized ERC3643 Metadata Facet WHEN checking implemented interfaces THEN it should return ERC3643 interfaces', async () => {
            const interfaces =
                await erc3643MetadataFacet.interfacesIntrospection()

            expect(interfaces.length).to.be.greaterThan(0)

            // Should include ERC3643 specific interfaces
            // TODO: Verify specific interface IDs when available
        })

        it('GIVEN an initialized ERC3643 Metadata Facet WHEN checking selectors THEN it should return ERC3643 function selectors', async () => {
            const selectors =
                await erc3643MetadataFacet.selectorsIntrospection()

            expect(selectors.length).to.be.greaterThan(0)

            // Should include ERC3643 specific function selectors
            for (const selector of selectors) {
                expect(selector).to.match(/^0x[a-fA-F0-9]{8}$/)
            }
        })
    })

    describe('Access Control', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN ERC3643 Metadata WHEN non-owner tries to update onchainID THEN it should revert', async () => {
            await expect(
                erc3643MetadataFacet
                    .connect(otherAccount)
                    .setOnchainID(otherAccountAddress)
            )
                .to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'AccountHasNoRole'
                )
                .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
        })

        it('GIVEN ERC3643 Metadata WHEN non-owner tries to update name THEN it should revert', async () => {
            const newName = 'Unauthorized Token'

            await expect(
                erc3643MetadataFacet.connect(otherAccount).setName(newName)
            )
                .to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'AccountHasNoRole'
                )
                .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
        })

        it('GIVEN ERC3643 Metadata WHEN owner updates parameters THEN it should succeed', async () => {
            const newName = 'Updated Token'
            const newSymbol = 'UPD'

            await expect(erc3643MetadataFacet.setName(newName)).to.not.be
                .reverted
            await expect(erc3643MetadataFacet.setSymbol(newSymbol)).to.not.be
                .reverted
            await expect(erc3643MetadataFacet.setOnchainID(otherAccountAddress))
                .to.not.be.reverted
        })
    })

    describe('Edge Cases and Security', () => {
        it('GIVEN ERC3643 Metadata WHEN updating to empty name THEN it should revert', async () => {
            await deploy(true)

            await expect(
                erc3643MetadataFacet.setName('')
            ).to.be.revertedWithCustomError(erc3643MetadataFacet, 'EmptyString')
        })
    })

    describe('Additional Branch Coverage Tests', () => {
        describe('Empty String Validation', () => {
            it('GIVEN ERC3643 Metadata WHEN setName called with empty string THEN it should revert with EmptyString', async () => {
                await deploy(true)

                await expect(
                    erc3643MetadataFacet.setName('')
                ).to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'EmptyString'
                )
            })

            it('GIVEN ERC3643 Metadata WHEN setSymbol called with empty string THEN it should revert with EmptyString', async () => {
                await deploy(true)

                await expect(
                    erc3643MetadataFacet.setSymbol('')
                ).to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'EmptyString'
                )
            })

            it('GIVEN ERC3643 Metadata WHEN initializeERC3643Metadata called with empty version THEN it should revert with EmptyString', async () => {
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

                const testFacet = result.erc3643Metadata

                await expect(
                    testFacet.initializeERC3643Metadata(
                        ethers.ZeroAddress,
                        '' // Empty version string
                    )
                ).to.be.revertedWithCustomError(testFacet, 'EmptyString')
            })
        })

        describe('Paused State Validation', () => {
            it('GIVEN ERC3643 Metadata WHEN setName called while paused THEN it should revert with IsPaused', async () => {
                const result = await deploy(true)

                // Grant PAUSER_ROLE to the owner to allow pausing
                await result.accessControl.grantRole(PAUSER_ROLE, ownerAddress)

                // Pause the contract
                await result.pause.pause()

                await expect(
                    erc3643MetadataFacet.setName('NewName')
                ).to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'IsPaused'
                )
            })

            it('GIVEN ERC3643 Metadata WHEN setSymbol called while paused THEN it should revert with IsPaused', async () => {
                const result = await deploy(true)

                // Grant PAUSER_ROLE to the owner to allow pausing
                await result.accessControl.grantRole(PAUSER_ROLE, ownerAddress)

                // Pause the contract
                await result.pause.pause()

                await expect(
                    erc3643MetadataFacet.setSymbol('NEW')
                ).to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'IsPaused'
                )
            })

            it('GIVEN ERC3643 Metadata WHEN setOnchainID called while paused THEN it should revert with IsPaused', async () => {
                const result = await deploy(true)

                // Grant PAUSER_ROLE to the owner to allow pausing
                await result.accessControl.grantRole(PAUSER_ROLE, ownerAddress)

                // Pause the contract
                await result.pause.pause()

                await expect(
                    erc3643MetadataFacet.setOnchainID(otherAccountAddress)
                ).to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'IsPaused'
                )
            })
        })
    })

    describe('Events', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN ERC3643 Metadata WHEN onchainID is updated THEN it should emit UpdatedTokenInformation event', async () => {
            // El evento UpdatedTokenInformation emite: name, symbol, decimals, version, onchainID
            // Como no podemos obtener directamente name/symbol del facet, verificamos solo que se emita
            await expect(
                erc3643MetadataFacet.setOnchainID(otherAccountAddress)
            ).to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
        })

        it('GIVEN ERC3643 Metadata WHEN name is updated THEN it should emit UpdatedTokenInformation event', async () => {
            const newName = 'Updated Token Name'

            await expect(erc3643MetadataFacet.setName(newName)).to.emit(
                erc3643MetadataFacet,
                'UpdatedTokenInformation'
            )
        })

        it('GIVEN ERC3643 Metadata WHEN symbol is updated THEN it should emit UpdatedTokenInformation event', async () => {
            const newSymbol = 'UPD'

            await expect(erc3643MetadataFacet.setSymbol(newSymbol)).to.emit(
                erc3643MetadataFacet,
                'UpdatedTokenInformation'
            )
        })
    })
})
