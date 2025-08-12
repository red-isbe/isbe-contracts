import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { ERC3643MetadataFacet, AccessControlFacet } from '../typechain-types'
import { deployGovernance, CONFIGURATION_ID_ERC3643 } from './initialization'
import { ERC3643_METADATA_RESOLVER_KEY, TOKEN_OWNER_ROLE } from './constants'

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

    async function deploy(initialize: boolean = false) {
        ;[owner, otherAccount, onchainId] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()
        onchainIdAddress = await onchainId.getAddress()

        // Deploy using the governance system with ERC3643 Metadata Facet
        const businessIds = [ERC3643_METADATA_RESOLVER_KEY]
        const data = []

        if (initialize) {
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            data.push(
                ERC3643MetadataFactory.interface.encodeFunctionData(
                    'initializeERC3643Metadata',
                    [onchainIdAddress, version]
                )
            )
        }

        const result = await deployGovernance(
            owner,
            [],
            CONFIGURATION_ID_ERC3643, // ⬅️ Usar configuración ERC3643
            false,
            '0x',
            businessIds,
            data
        )

        // Cast to the correct facet type using the proxy address
        const ERC3643MetadataFactory = await ethers.getContractFactory(
            'ERC3643MetadataFacet'
        )
        erc3643MetadataFacet = ERC3643MetadataFactory.attach(
            await result.governanceContract.getAddress()
        ) as ERC3643MetadataFacet
        accessControl = result.accessControl

        await accessControl.grantRole(TOKEN_OWNER_ROLE, ownerAddress)
    }

    describe('Deployment', () => {
        it('GIVEN ERC3643 Metadata Facet WHEN it is deployed THEN it should deploy successfully', async () => {
            await deploy()

            expect(await erc3643MetadataFacet.getAddress()).to.not.equal(
                ethers.ZeroAddress
            )
        })

        it('GIVEN ERC3643 Metadata Facet WHEN not initialized THEN it should allow initialization', async () => {
            await deploy()

            // Should be able to initialize
            await expect(
                erc3643MetadataFacet.initializeERC3643Metadata(
                    onchainIdAddress,
                    version
                )
            ).to.not.be.reverted
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
            await expect(erc3643MetadataFacet.setOnchainID(otherAccountAddress))
                .to.emit(erc3643MetadataFacet, 'OnchainIDUpdated')
                .withArgs(onchainIdAddress, otherAccountAddress)

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

            // Note: To verify name change, we'd need ERC20 functionality integrated
        })

        it('GIVEN an initialized ERC3643 Metadata WHEN updating symbol THEN it should update successfully', async () => {
            const newSymbol = 'UPD3643'

            await expect(erc3643MetadataFacet.setSymbol(newSymbol)).to.emit(
                erc3643MetadataFacet,
                'UpdatedTokenInformation'
            )

            // Note: To verify symbol change, we'd need ERC20 functionality integrated
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
            ).to.be.revertedWithCustomError(
                accessControl,
                'AccessControlUnauthorizedAccount'
            )
        })

        it('GIVEN ERC3643 Metadata WHEN non-owner tries to update name THEN it should revert', async () => {
            const newName = 'Unauthorized Token'

            await expect(
                erc3643MetadataFacet.connect(otherAccount).setName(newName)
            ).to.be.revertedWithCustomError(
                accessControl,
                'AccessControlUnauthorizedAccount'
            )
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
        it('GIVEN ERC3643 Metadata WHEN initializing with zero address onchainID THEN it should revert', async () => {
            ;[owner] = await ethers.getSigners()

            const businessIds = [ERC3643_METADATA_RESOLVER_KEY]
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            const data = [
                ERC3643MetadataFactory.interface.encodeFunctionData(
                    'initializeERC3643Metadata',
                    [
                        ethers.ZeroAddress, // invalid onchainID
                        version,
                    ]
                ),
            ]

            await expect(
                deployGovernance(
                    owner,
                    [],
                    undefined,
                    false,
                    '0x',
                    businessIds,
                    data
                )
            ).to.be.revertedWithCustomError(
                ERC3643MetadataFactory,
                'ZeroAddress'
            )
        })

        it('GIVEN ERC3643 Metadata WHEN initializing with empty version THEN it should revert', async () => {
            ;[owner, , onchainId] = await ethers.getSigners()
            onchainIdAddress = await onchainId.getAddress()

            const businessIds = [ERC3643_METADATA_RESOLVER_KEY]
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            const data = [
                ERC3643MetadataFactory.interface.encodeFunctionData(
                    'initializeERC3643Metadata',
                    [
                        onchainIdAddress,
                        '', // empty version
                    ]
                ),
            ]

            await expect(
                deployGovernance(
                    owner,
                    [],
                    undefined,
                    false,
                    '0x',
                    businessIds,
                    data
                )
            ).to.be.revertedWithCustomError(
                ERC3643MetadataFactory,
                'EmptyString'
            )
        })

        it('GIVEN ERC3643 Metadata WHEN updating to zero address onchainID THEN it should revert', async () => {
            await deploy(true)

            await expect(
                erc3643MetadataFacet.setOnchainID(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(erc3643MetadataFacet, 'ZeroAddress')
        })

        it('GIVEN ERC3643 Metadata WHEN updating to empty name THEN it should revert', async () => {
            await deploy(true)

            await expect(
                erc3643MetadataFacet.setName('')
            ).to.be.revertedWithCustomError(erc3643MetadataFacet, 'EmptyString')
        })
    })

    describe('Events', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN ERC3643 Metadata WHEN onchainID is updated THEN it should emit OnchainIDUpdated event', async () => {
            await expect(erc3643MetadataFacet.setOnchainID(otherAccountAddress))
                .to.emit(erc3643MetadataFacet, 'OnchainIDUpdated')
                .withArgs(onchainIdAddress, otherAccountAddress)
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

        it('GIVEN ERC3643 Metadata WHEN initialized THEN it should emit initialization events', async () => {
            ;[owner, , onchainId] = await ethers.getSigners()
            onchainIdAddress = await onchainId.getAddress()

            const businessIds = [ERC3643_METADATA_RESOLVER_KEY]
            const ERC3643MetadataFactory = await ethers.getContractFactory(
                'ERC3643MetadataFacet'
            )
            const data = [
                ERC3643MetadataFactory.interface.encodeFunctionData(
                    'initializeERC3643Metadata',
                    [onchainIdAddress, version]
                ),
            ]

            const result = await deployGovernance(
                owner,
                [],
                undefined,
                false,
                '0x',
                businessIds,
                data
            )

            // Check that the contract was initialized with correct values
            const facet = ERC3643MetadataFactory.attach(
                await result.governanceContract.getAddress()
            ) as ERC3643MetadataFacet
            expect(await facet.version()).to.equal(version)
            expect(await facet.onchainID()).to.equal(onchainIdAddress)
        })
    })
})
