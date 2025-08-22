import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    ERC3643MetadataFacet,
    AccessControlFacet,
    ERC20Facet,
} from '../typechain-types'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import {
    ERC3643_METADATA_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    TOKEN_OWNER_ROLE,
    PAUSER_ROLE,
} from './constants'

describe('ERC3643 Metadata Facet', function () {
    const version = '4.0.0'

    let erc3643MetadataFacet: ERC3643MetadataFacet
    let accessControl: AccessControlFacet
    let erc20Facet: ERC20Facet
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
            // 1. Prepare initialization data for ERC20
            const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
            const erc20InitData = ERC20Factory.interface.encodeFunctionData(
                'initializeErc20',
                [
                    'Test ERC3643 Token', // name
                    'T3643', // symbol
                    18, // decimals
                ]
            )

            // 2. Prepare initialization data for ERC3643MetadataFacet
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            const erc3643InitData =
                ERC3643MetadataFactory.interface.encodeFunctionData(
                    'initializeERC3643Metadata',
                    [onchainIdAddress, version]
                )

            // 3. Add both initializations - ORDER MATTERS (ERC20 first)
            businessIds.push(ERC20_RESOLVER_KEY)
            businessIds.push(ERC3643_METADATA_RESOLVER_KEY)
            data.push(erc20InitData)
            data.push(erc3643InitData)
        } else {
            // When not initializing, use empty arrays to avoid length mismatch errors
            businessIds = []
            data = []
        }

        // Use ERC3643 configuration which now includes ERC20 facets automatically
        const result = await deployGovernance(
            owner,
            [],
            CONFIGURATION_ID_ERC3643, // Use ERC3643 configuration with auto-included ERC20 facets
            false,
            '0x',
            businessIds,
            data,
            false
        )

        // Extract contracts from result
        erc3643MetadataFacet =
            result.erc3643Metadata || result.erc3643MetadataFacet
        accessControl = result.accessControl || result.accessControlFacet
        // Attach ERC20 facet to the same proxy for verification tests
        if (initialize && result.useCaseProxy) {
            if (result.useCaseProxy) {
                const ERC20Factory =
                    await ethers.getContractFactory('ERC20Facet')
                erc20Facet = ERC20Factory.attach(
                    result.useCaseProxy
                ) as ERC20Facet
            }
        }

        // If ERC3643MetadataFacet is not available in result, attach it manually
        if (!erc3643MetadataFacet && result.useCaseProxy) {
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            erc3643MetadataFacet = ERC3643MetadataFactory.attach(
                result.useCaseProxy
            ) as ERC3643MetadataFacet
        }

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
            // First deploy without initialization to get the contracts
            const result = await deploy(false)

            // Initialize ERC20 first
            await result.erc20.initializeErc20(
                'Test ERC3643 Token',
                'T3643',
                18
            )

            // Grant TOKEN_OWNER_ROLE for ERC3643 operations
            await result.accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)

            // Initialize ERC3643 and capture the event
            await expect(
                result.erc3643Metadata.initializeERC3643Metadata(
                    onchainIdAddress,
                    version
                )
            )
                .to.emit(result.erc3643Metadata, 'UpdatedTokenInformation')
                .withArgs(
                    'Test ERC3643 Token', // name
                    'T3643', // symbol
                    18, // decimals
                    version, // version
                    onchainIdAddress // onchainID
                )

            // Verify the onchainID is not zero address
            const actualOnchainId = await result.erc3643Metadata.onchainID()
            expect(actualOnchainId).to.not.equal(ethers.ZeroAddress)
            expect(actualOnchainId).to.equal(onchainIdAddress)

            // Check ERC3643 initial values
            const actualVersion = await result.erc3643Metadata.version()
            expect(actualVersion).to.equal(version)

            // Check ERC20 initial values
            expect(await result.erc20.name()).to.equal('Test ERC3643 Token')
            expect(await result.erc20.symbol()).to.equal('T3643')
            expect(await result.erc20.decimals()).to.equal(18)

            // Update global variables for other tests
            erc3643MetadataFacet = result.erc3643Metadata
            accessControl = result.accessControl
            erc20Facet = result.erc20
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
            // Get current values before update for event verification
            const currentName = await erc20Facet.name()
            const currentSymbol = await erc20Facet.symbol()
            const currentDecimals = await erc20Facet.decimals()
            const currentVersion = await erc3643MetadataFacet.version()

            await expect(erc3643MetadataFacet.setOnchainID(otherAccountAddress))
                .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                .withArgs(
                    currentName, // name (unchanged)
                    currentSymbol, // symbol (unchanged)
                    currentDecimals, // decimals (unchanged)
                    currentVersion, // version (unchanged)
                    otherAccountAddress // onchainID (updated value)
                )

            expect(await erc3643MetadataFacet.onchainID()).to.equal(
                otherAccountAddress
            )
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN updating name THEN it should update successfully', async () => {
            const newName = 'Updated ERC3643 Token'

            // Get current values before update for event verification
            const currentSymbol = await erc20Facet.symbol()
            const currentDecimals = await erc20Facet.decimals()
            const currentVersion = await erc3643MetadataFacet.version()
            const currentOnchainID = await erc3643MetadataFacet.onchainID()

            await expect(erc3643MetadataFacet.setName(newName))
                .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                .withArgs(
                    newName, // name (updated value)
                    currentSymbol, // symbol (unchanged)
                    currentDecimals, // decimals (unchanged)
                    currentVersion, // version (unchanged)
                    currentOnchainID // onchainID (unchanged)
                )

            // Verify the name was actually updated using ERC20 facet
            const updatedName = await erc20Facet.name()
            expect(updatedName).to.equal(newName)
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN updating symbol THEN it should update successfully', async () => {
            const newSymbol = 'UPD3643'

            // Get current values before update for event verification
            const currentName = await erc20Facet.name()
            const currentDecimals = await erc20Facet.decimals()
            const currentVersion = await erc3643MetadataFacet.version()
            const currentOnchainID = await erc3643MetadataFacet.onchainID()

            await expect(erc3643MetadataFacet.setSymbol(newSymbol))
                .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                .withArgs(
                    currentName, // name (unchanged)
                    newSymbol, // symbol (updated value)
                    currentDecimals, // decimals (unchanged)
                    currentVersion, // version (unchanged)
                    currentOnchainID // onchainID (unchanged)
                )

            // Verify the symbol was actually updated using ERC20 facet
            const updatedSymbol = await erc20Facet.symbol()
            expect(updatedSymbol).to.equal(newSymbol)
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

        it('GIVEN an initialized ERC3643 Metadata Facet WHEN checking implemented interfaces THEN it should return the IERC3643Metadata interface', async () => {
            // IERC3643Metadata interface ID (calculated by Solidity compiler)
            const IERC3643_METADATA_INTERFACE_ID = '0x10a35cfa'

            const interfaces =
                await erc3643MetadataFacet.interfacesIntrospection()

            // The facet implements both IERC3643Metadata and IEIP2535Introspection,
            // but interfacesIntrospection() only returns business logic interfaces.
            // IEIP2535Introspection is excluded as it's an infrastructure interface
            // for introspection capabilities, not domain-specific business functionality.
            //  function _implementedInterfaces()
            //         internal
            //         pure
            //         virtual
            //         override
            //         returns (bytes4[] memory interfaces_)
            //     {
            //         uint256 interfacesLength = 1;
            //         interfaces_ = new bytes4[](interfacesLength);
            //         interfaces_[--interfacesLength] = type(IERC3643Metadata).interfaceId;
            //     }
            expect(interfaces).to.have.lengthOf(1)
            expect(interfaces[0]).to.equal(IERC3643_METADATA_INTERFACE_ID)
        })

        it('GIVEN an initialized ERC3643 Metadata Facet WHEN checking selectors THEN it should return exactly 9 ERC3643 function selectors', async () => {
            const selectors =
                await erc3643MetadataFacet.selectorsIntrospection()

            // Verify exact count matches contract implementation
            expect(selectors.length).to.equal(9)

            // Get expected selectors from the contract interface
            const expectedSelectors = [
                erc3643MetadataFacet.interface.getFunction(
                    'initializeERC3643Metadata'
                ).selector,
                erc3643MetadataFacet.interface.getFunction('setName').selector,
                erc3643MetadataFacet.interface.getFunction('setSymbol')
                    .selector,
                erc3643MetadataFacet.interface.getFunction('setOnchainID')
                    .selector,
                erc3643MetadataFacet.interface.getFunction('onchainID')
                    .selector,
                erc3643MetadataFacet.interface.getFunction('version').selector,
                erc3643MetadataFacet.interface.getFunction(
                    'businessIdIntrospection'
                ).selector,
                erc3643MetadataFacet.interface.getFunction(
                    'interfacesIntrospection'
                ).selector,
                erc3643MetadataFacet.interface.getFunction(
                    'selectorsIntrospection'
                ).selector,
            ]

            // Verify all expected selectors are present
            for (const expectedSelector of expectedSelectors) {
                expect(selectors).to.include(expectedSelector)
            }

            // Verify all returned selectors are valid 4-byte values
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
            await expect(
                erc3643MetadataFacet
                    .connect(otherAccount)
                    .setName('Unauthorized Name')
            )
                .to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'AccountHasNoRole'
                )
                .withArgs(otherAccountAddress, TOKEN_OWNER_ROLE)
        })

        it('GIVEN ERC3643 Metadata WHEN non-owner tries to update symbol THEN it should revert', async () => {
            await expect(
                erc3643MetadataFacet.connect(otherAccount).setSymbol('UNAUTH')
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

            // Verify all values were actually updated
            expect(await erc20Facet.name()).to.equal(newName)
            expect(await erc20Facet.symbol()).to.equal(newSymbol)
            expect(await erc3643MetadataFacet.onchainID()).to.equal(
                otherAccountAddress
            )
        })
    })

    // Note: Empty string validation tests moved to "Additional Branch Coverage Tests" section

    describe('Additional Branch Coverage Tests', () => {
        describe('Empty String Validation', () => {
            beforeEach(async () => {
                await deploy(false)
            })

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
                await deploy(false)

                await expect(
                    erc3643MetadataFacet.initializeERC3643Metadata(
                        onchainIdAddress,
                        ''
                    )
                ).to.be.revertedWithCustomError(
                    erc3643MetadataFacet,
                    'EmptyString'
                )
            })
        })

        describe('Zero Address Validation', () => {
            beforeEach(async () => {
                await deploy(false)
            })

            it('GIVEN ERC3643 Metadata WHEN initialized with zero onchainID THEN it should succeed', async () => {
                await deploy(false)

                // Zero address should be allowed for onchainID as per contract specification
                await expect(
                    erc3643MetadataFacet.initializeERC3643Metadata(
                        ethers.ZeroAddress,
                        version
                    )
                ).to.not.be.reverted

                expect(await erc3643MetadataFacet.onchainID()).to.equal(
                    ethers.ZeroAddress
                )
            })

            it('GIVEN ERC3643 Metadata WHEN setOnchainID called with zero address THEN it should succeed', async () => {
                await deploy(true)

                // Zero address should be allowed for onchainID reset
                await expect(
                    erc3643MetadataFacet.setOnchainID(ethers.ZeroAddress)
                )
                    .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                    .withArgs(
                        'Test ERC3643 Token',
                        'T3643',
                        18,
                        version,
                        ethers.ZeroAddress
                    )

                expect(await erc3643MetadataFacet.onchainID()).to.equal(
                    ethers.ZeroAddress
                )
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
            // Get current values before update for event verification
            const currentName = await erc20Facet.name()
            const currentSymbol = await erc20Facet.symbol()
            const currentDecimals = await erc20Facet.decimals()
            const currentVersion = await erc3643MetadataFacet.version()

            await expect(erc3643MetadataFacet.setOnchainID(otherAccountAddress))
                .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                .withArgs(
                    currentName, // name (unchanged)
                    currentSymbol, // symbol (unchanged)
                    currentDecimals, // decimals (unchanged)
                    currentVersion, // version (unchanged)
                    otherAccountAddress // onchainID (updated value)
                )
        })

        it('GIVEN ERC3643 Metadata WHEN name is updated THEN it should emit UpdatedTokenInformation event', async () => {
            const newName = 'Updated Token Name'

            // Get current values before update for event verification
            const currentSymbol = await erc20Facet.symbol()
            const currentDecimals = await erc20Facet.decimals()
            const currentVersion = await erc3643MetadataFacet.version()
            const currentOnchainID = await erc3643MetadataFacet.onchainID()

            await expect(erc3643MetadataFacet.setName(newName))
                .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                .withArgs(
                    newName, // name (updated value)
                    currentSymbol, // symbol (unchanged)
                    currentDecimals, // decimals (unchanged)
                    currentVersion, // version (unchanged)
                    currentOnchainID // onchainID (unchanged)
                )
        })

        it('GIVEN ERC3643 Metadata WHEN symbol is updated THEN it should emit UpdatedTokenInformation event', async () => {
            const newSymbol = 'UPD'

            // Get current values before update for event verification
            const currentName = await erc20Facet.name()
            const currentDecimals = await erc20Facet.decimals()
            const currentVersion = await erc3643MetadataFacet.version()
            const currentOnchainID = await erc3643MetadataFacet.onchainID()

            await expect(erc3643MetadataFacet.setSymbol(newSymbol))
                .to.emit(erc3643MetadataFacet, 'UpdatedTokenInformation')
                .withArgs(
                    currentName, // name (unchanged)
                    newSymbol, // symbol (updated value)
                    currentDecimals, // decimals (unchanged)
                    currentVersion, // version (unchanged)
                    currentOnchainID // onchainID (unchanged)
                )
        })
    })
})
