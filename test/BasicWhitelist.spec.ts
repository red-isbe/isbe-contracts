import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployGovernance } from './fixtures/governance'
import {
    BasicWhitelistFacet,
    AccessControl,
    ISBEPauseFacet,
} from '../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    WHITELIST_MANAGER_ROLE,
    PAUSER_ROLE,
    BASIC_WHITELIST_RESOLVER_KEY,
    CONFIGURATION_ID_ERC3643,
} from '../utils/constants'

describe('BasicWhitelist', function () {
    // ====================================================================
    // GLOBAL VARIABLES
    // ====================================================================
    let owner: Signer
    let whitelistManager: Signer
    let alice: Signer
    let bob: Signer
    let charlie: Signer
    let ownerAddress: string
    let whitelistManagerAddress: string
    let aliceAddress: string
    let bobAddress: string
    let charlieAddress: string
    let basicWhitelistFacet: BasicWhitelistFacet
    let accessControl: AccessControl
    let pauseFacet: ISBEPauseFacet
    let proxyAddress: string

    // ====================================================================
    // FIXTURES
    // ====================================================================
    async function deployFixture() {
        const [
            ownerSigner,
            whitelistManagerSigner,
            aliceSigner,
            bobSigner,
            charlieSigner,
        ] = await ethers.getSigners()
        
         ownerAddress = await ownerSigner.getAddress()
         whitelistManagerAddress = await whitelistManagerSigner.getAddress()
        aliceAddress = await aliceSigner.getAddress()
        bobAddress = await bobSigner.getAddress()
        charlieAddress = await charlieSigner.getAddress()

        // Deploy governance with ERC3643 configuration (includes BasicWhitelist)
        const gov = await deployGovernance(
            ownerSigner,
            [
                {
                    role: WHITELIST_MANAGER_ROLE,
                    members: [whitelistManagerAddress],
                },
                {
                    role: PAUSER_ROLE,
                    members: [ownerAddress],
                },
            ],
            CONFIGURATION_ID_ERC3643
        )

        const proxy = gov.useCaseProxy!

        // Attach facets to the proxy
        const whitelist = (await ethers.getContractAt(
            'BasicWhitelistFacet',
            proxy
        )) as BasicWhitelistFacet

        const access = (await ethers.getContractAt(
            'AccessControlFacet',
            proxy
        )) as AccessControl

        const pause = (await ethers.getContractAt(
            'ISBEPauseFacet',
            proxy
        )) as ISBEPauseFacet

        return {
            owner: ownerSigner,
            whitelistManager: whitelistManagerSigner,
            alice: aliceSigner,
            bob: bobSigner,
            charlie: charlieSigner,
            ownerAddress,
            whitelistManagerAddress,
            aliceAddress,
            bobAddress,
            charlieAddress,
            basicWhitelistFacet: whitelist,
            accessControl: access,
            pauseFacet: pause,
            proxyAddress: proxy,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        owner = contracts.owner
        whitelistManager = contracts.whitelistManager
        alice = contracts.alice
        bob = contracts.bob
        charlie = contracts.charlie
        ownerAddress = contracts.ownerAddress
        whitelistManagerAddress = contracts.whitelistManagerAddress
        aliceAddress = contracts.aliceAddress
        bobAddress = contracts.bobAddress
        charlieAddress = contracts.charlieAddress
        basicWhitelistFacet = contracts.basicWhitelistFacet
        accessControl = contracts.accessControl
        pauseFacet = contracts.pauseFacet
        proxyAddress = contracts.proxyAddress
    })

    // ====================================================================
    // INITIALIZATION TESTS
    // ====================================================================
    describe('Initialization', function () {
        it('Should initialize whitelist with enabled state', async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)

            expect(
                await basicWhitelistFacet.isWhitelistEnabled()
            ).to.be.equal(true)
        })

        it('Should initialize whitelist with disabled state', async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(false)

            expect(
                await basicWhitelistFacet.isWhitelistEnabled()
            ).to.be.equal(false)
        })

        it('Should emit WhitelistInitialized event', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(owner)
                    .initializeBasicWhitelist(true)
            )
                .to.emit(basicWhitelistFacet, 'WhitelistInitialized')
                .withArgs(true)
        })

        it('Should prevent re-initialization', async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)

            await expect(
                basicWhitelistFacet
                    .connect(owner)
                    .initializeBasicWhitelist(true)
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(BASIC_WHITELIST_RESOLVER_KEY, 1, 1)
        })
    })

    // ====================================================================
    // ADD TO WHITELIST TESTS
    // ====================================================================
    describe('Add to Whitelist', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)
        })

           it('Should revert when caller does not have WHITELIST_MANAGER_ROLE', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(alice)
                    .addToWhitelist(bobAddress)
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AccountHasNoRole'
                )
                .withArgs(aliceAddress, WHITELIST_MANAGER_ROLE)
        })

        it('Should revert when adding zero address', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .addToWhitelist(ZeroAddress)
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'AddressZero'
            )
        })

        it('Should revert when contract is paused', async function () {
            await pauseFacet.connect(owner).pause();

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .addToWhitelist(aliceAddress)
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'IsPaused'
            )
        })

        it('Should add multiple different addresses', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(aliceAddress)
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(bobAddress)
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(charlieAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(true)
            expect(
                await basicWhitelistFacet.isWhitelisted(bobAddress)
            ).to.be.equal(true)
            expect(
                await basicWhitelistFacet.isWhitelisted(charlieAddress)
            ).to.be.equal(true)
        })

        it('Should add address to whitelist with WHITELIST_MANAGER_ROLE', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(aliceAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(true)
        })

        it('Should emit AddedToWhitelist event', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .addToWhitelist(aliceAddress)
            )
                .to.emit(basicWhitelistFacet, 'AddedToWhitelist')
                .withArgs(aliceAddress)
        })

        it('Should revert when adding address that is already whitelisted', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(aliceAddress)

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .addToWhitelist(aliceAddress)
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AddressAlreadyWhitelisted'
                )
                .withArgs(aliceAddress)
        })

     
    })

    // ====================================================================
    // REMOVE FROM WHITELIST TESTS
    // ====================================================================
    describe('Remove from Whitelist', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)
                   await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(aliceAddress)

        })

        it('Should remove address from whitelist with WHITELIST_MANAGER_ROLE', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .removeFromWhitelist(aliceAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(false)
        })

        it('Should emit RemovedFromWhitelist event', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .removeFromWhitelist(aliceAddress)
            )
                .to.emit(basicWhitelistFacet, 'RemovedFromWhitelist')
                .withArgs(aliceAddress)
        })

        it('Should revert when removing address that is not whitelisted', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .removeFromWhitelist(bobAddress)
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AddressNotWhitelisted'
                )
                .withArgs(bobAddress)
        })

        it('Should revert when caller does not have WHITELIST_MANAGER_ROLE', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(alice)
                    .removeFromWhitelist(aliceAddress)
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AccountHasNoRole'
                )
                .withArgs(aliceAddress, WHITELIST_MANAGER_ROLE)
        })

        it('Should revert when contract is paused', async function () {
            await pauseFacet.connect(owner).pause();

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .removeFromWhitelist(aliceAddress)
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'IsPaused'
            )
        })

        it('Should allow re-adding after removal', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .removeFromWhitelist(aliceAddress)
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(aliceAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(true)
        })
    })

    // ====================================================================
    // ENABLE/DISABLE WHITELIST TESTS
    // ====================================================================
    describe('Enable/Disable Whitelist', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)
        })

        it('Should disable whitelist with WHITELIST_MANAGER_ROLE', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()

            expect(
                await basicWhitelistFacet.isWhitelistEnabled()
            ).to.be.equal(false)
        })

        it('Should enable whitelist with WHITELIST_MANAGER_ROLE', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()
            await basicWhitelistFacet
                .connect(whitelistManager)
                .enableWhitelist()

            expect(
                await basicWhitelistFacet.isWhitelistEnabled()
            ).to.be.equal(true)
        })

        it('Should emit WhitelistStatusChanged event on disable', async function () {
            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .disableWhitelist()
            )
                .to.emit(basicWhitelistFacet, 'WhitelistStatusChanged')
                .withArgs(false)
        })

        it('Should emit WhitelistStatusChanged event on enable', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .enableWhitelist()
            )
                .to.emit(basicWhitelistFacet, 'WhitelistStatusChanged')
                .withArgs(true)
        })

        it('Should revert when non-manager tries to disable', async function () {
            await expect(
                basicWhitelistFacet.connect(alice).disableWhitelist()
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AccountHasNoRole'
                )
                .withArgs(aliceAddress, WHITELIST_MANAGER_ROLE)
        })

        it('Should revert when non-manager tries to enable', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()

            await expect(basicWhitelistFacet.connect(alice).enableWhitelist())
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AccountHasNoRole'
                )
                .withArgs(aliceAddress, WHITELIST_MANAGER_ROLE)
        })

        it('Should revert when contract is paused (disable)', async function () {
            await pauseFacet.connect(owner).pause();

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .disableWhitelist()
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'IsPaused'
            )
        })

        it('Should revert when contract is paused (enable)', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()
            await pauseFacet.connect(owner).pause();

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .enableWhitelist()
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'IsPaused'
            )
        })
    })

    // ====================================================================
    // WHITELIST CHECK TESTS
    // ====================================================================
    describe('Whitelist Check Logic', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)
            
        })

        it('Should return true for whitelisted address when enabled', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(aliceAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(true)
        })

        it('Should return false for non-whitelisted address when enabled', async function () {
            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(false)
        })

        it('Should return true for any address when whitelist is disabled', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()

            // Even non-whitelisted addresses should pass when disabled
            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(true)
            expect(
                await basicWhitelistFacet.isWhitelisted(bobAddress)
            ).to.be.equal(true)
        })

        it('Should return false after removing from whitelist', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(charlieAddress)
            await basicWhitelistFacet
                .connect(whitelistManager)
                .removeFromWhitelist(charlieAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(charlieAddress)
            ).to.be.equal(false)
        })

        it('Should check zero address correctly', async function () {
            // Zero address should return false when enabled (not whitelisted)
            expect(
                await basicWhitelistFacet.isWhitelisted(ZeroAddress)
            ).to.be.equal(false)

            // But should return true when disabled (allows all)
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()
            expect(
                await basicWhitelistFacet.isWhitelisted(ZeroAddress)
            ).to.be.equal(true)
        })
    })

    // ====================================================================
    // ACCESS CONTROL INTEGRATION TESTS
    // ====================================================================
    describe('Access Control Integration', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)
        })

        it('Should verify WHITELIST_MANAGER_ROLE is correctly set', async function () {
            expect(
                await accessControl.hasRole(
                    WHITELIST_MANAGER_ROLE,
                    whitelistManagerAddress
                )
            ).to.be.equal(true)
        })

        it('Should allow owner to grant WHITELIST_MANAGER_ROLE', async function () {
            await accessControl
                .connect(owner)
                .grantRole(WHITELIST_MANAGER_ROLE, aliceAddress)

            expect(
                await accessControl.hasRole(
                    WHITELIST_MANAGER_ROLE,
                    aliceAddress
                )
            ).to.be.equal(true)
        })

        it('Should allow new manager to manage whitelist', async function () {
            await accessControl
                .connect(owner)
                .grantRole(WHITELIST_MANAGER_ROLE, aliceAddress)

            await basicWhitelistFacet
                .connect(alice)
                .addToWhitelist(bobAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(bobAddress)
            ).to.be.equal(true)
        })

        it('Should revoke WHITELIST_MANAGER_ROLE', async function () {
            await accessControl
                .connect(owner)
                .revokeRole(WHITELIST_MANAGER_ROLE, whitelistManagerAddress)

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .addToWhitelist(aliceAddress)
            )
                .to.be.revertedWithCustomError(
                    basicWhitelistFacet,
                    'AccountHasNoRole'
                )
                .withArgs(whitelistManagerAddress, WHITELIST_MANAGER_ROLE)
        })
    })

    // ====================================================================
    // PAUSE INTEGRATION TESTS
    // ====================================================================
    describe('Pause Integration', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)
        })

        it('Should block all state-changing operations when paused', async function () {
            await pauseFacet.connect(owner).pause();

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .addToWhitelist(charlieAddress)
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'IsPaused'
            )

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .disableWhitelist()
            ).to.be.revertedWithCustomError(
                basicWhitelistFacet,
                'IsPaused'
            )
        })

        it('Should allow view functions when paused', async function () {

            await pauseFacet.connect(owner).pause();

            // View functions should work even when paused
            expect(
                await basicWhitelistFacet.isWhitelisted(charlieAddress)
            ).to.be.equal(false)
            expect(
                await basicWhitelistFacet.isWhitelistEnabled()
            ).to.be.equal(true)
        })

        it('Should resume operations after unpause', async function () {
            await pauseFacet.connect(owner).pause();
            await pauseFacet.connect(owner).unpause();

            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(false)
        })
    })

    // ====================================================================
    // EDGE CASES AND BOUNDARY TESTS
    // ====================================================================
    describe('Edge Cases', function () {
        beforeEach(async function () {
            await basicWhitelistFacet
                .connect(owner)
                .initializeBasicWhitelist(true)

            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(bobAddress)
        })

        it('Should handle enable when already enabled', async function () {
            // Initial state is enabled
            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .enableWhitelist()
            )
                .to.emit(basicWhitelistFacet, 'WhitelistStatusChanged')
                .withArgs(true)
        })

        it('Should handle disable when already disabled', async function () {
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()

            await expect(
                basicWhitelistFacet
                    .connect(whitelistManager)
                    .disableWhitelist()
            )
                .to.emit(basicWhitelistFacet, 'WhitelistStatusChanged')
                .withArgs(false)
        })

        it('Should maintain whitelist state across enable/disable cycles', async function () {
       
            // Disable and re-enable
            await basicWhitelistFacet
                .connect(whitelistManager)
                .disableWhitelist()
            await basicWhitelistFacet
                .connect(whitelistManager)
                .enableWhitelist()

        
            expect(
                await basicWhitelistFacet.isWhitelisted(aliceAddress)
            ).to.be.equal(false)
            expect(
                await basicWhitelistFacet.isWhitelisted(bobAddress)
            ).to.be.equal(true)
            expect(
                await basicWhitelistFacet.isWhitelisted(charlieAddress)
            ).to.be.equal(false)
        })

        it('Should handle contract address as whitelisted address', async function () {
            const contractAddress = await basicWhitelistFacet.getAddress()

            await basicWhitelistFacet
                .connect(whitelistManager)
                .addToWhitelist(contractAddress)

            expect(
                await basicWhitelistFacet.isWhitelisted(contractAddress)
            ).to.be.equal(true)
        })
    })
})
