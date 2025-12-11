/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { expect } from 'chai'
import { Signer, HDNodeWallet } from 'ethers'
import { ethers, config } from 'hardhat'
import {
    KnownDidTestWrapperFacet,
    IDidRegistry,
    MockTimestampFacet,
    AccessControl,
} from '../typechain-types'
import {
    DID_REGISTRY_ROLE,
    CONFIGURATION_ID_KNOWN_DID_TEST,
    KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY,
    ISBE_ROLE,
    DEFAULT_ADMIN_ROLE,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { EllipticType } from './types/identity'
import { randomDid, randomBaseDocument } from './support'

describe('KnownDidTestWrapper', function () {
    let admin: Signer
    let other: Signer
    let adminAddress: string
    let otherAddress: string
    let knownDidTestWrapper: KnownDidTestWrapperFacet
    let knownDidTestWrapperFacet: KnownDidTestWrapperFacet
    let didRegistry: IDidRegistry
    let mockTimestamp: MockTimestampFacet
    let accessControl: AccessControl
    let wallet: HDNodeWallet

    function walletOfFirstSigner(): HDNodeWallet {
        const mnemonic = (
            config.networks.hardhat.accounts as {
                mnemonic: string
                path: string
            }
        ).mnemonic
        return ethers.Wallet.fromPhrase(mnemonic)
    }

    async function deployFixture() {
        const [adminSigner, otherSigner] = await ethers.getSigners()
        const adminAddr = await adminSigner.getAddress()
        const otherAddr = await otherSigner.getAddress()

        const result = await deployGovernance(
            adminSigner,
            [],
            CONFIGURATION_ID_KNOWN_DID_TEST
        )

        // Grant DID registry role
        await result.accessControlGovernance!.grantRole(
            DID_REGISTRY_ROLE,
            adminAddr
        )

        // Initialize DID registry
        await result.didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)

        const baseWallet = walletOfFirstSigner()

        return {
            admin: adminSigner,
            other: otherSigner,
            adminAddress: adminAddr,
            otherAddress: otherAddr,
            knownDidTestWrapper: result.knownDidTestWrapper,
            knownDidTestWrapperFacet: result.knownDidTestWrapperFacet,
            didRegistry: result.didRegistry,
            mockTimestamp: result.mockTimestamp,
            accessControl: result.accessControl,
            wallet: baseWallet,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        admin = contracts.admin
        other = contracts.other
        adminAddress = contracts.adminAddress
        otherAddress = contracts.otherAddress
        knownDidTestWrapper = contracts.knownDidTestWrapper
        knownDidTestWrapperFacet = contracts.knownDidTestWrapperFacet
        didRegistry = contracts.didRegistry
        mockTimestamp = contracts.mockTimestamp
        accessControl = contracts.accessControl
        wallet = contracts.wallet
    })

    describe('Introspection', function () {
        it('GIVEN KnownDidTestWrapper WHEN checking business ID THEN returns correct value', async function () {
            expect(
                await knownDidTestWrapperFacet.businessIdIntrospection()
            ).to.equal(KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY)
        })

        it('GIVEN KnownDidTestWrapper WHEN checking interfaces THEN returns correct interface ID', async function () {
            const interfaces =
                await knownDidTestWrapperFacet.interfacesIntrospection()
            expect(interfaces.length).to.equal(1)
        })

        it('GIVEN KnownDidTestWrapper WHEN checking selectors THEN returns testOnlyKnownDid', async function () {
            const selectors =
                await knownDidTestWrapperFacet.selectorsIntrospection()
            expect(selectors.length).to.equal(1)
            expect(selectors[0]).to.equal(
                knownDidTestWrapper.interface.getFunction('testOnlyKnownDid')!
                    .selector
            )
        })
    })

    describe('onlyKnownDid modifier', function () {
        it('GIVEN address without DID WHEN calling testOnlyKnownDid THEN it fails with AddressNotKnown', async function () {
            await expect(knownDidTestWrapper.connect(other).testOnlyKnownDid())
                .to.be.revertedWithCustomError(
                    knownDidTestWrapper,
                    'AddressNotKnown'
                )
                .withArgs(otherAddress)
        })

        it('GIVEN address with registered DID WHEN calling testOnlyKnownDid THEN it succeeds and emits DidVerified', async function () {
            // Register a DID for admin
            const adminDid = randomDid()
            const publicKey = wallet.signingKey.publicKey
            const vMethodId = ethers.id(`vmethod:${adminDid}`)
            const notBefore = Math.floor(Date.now() / 1000)
            const notAfter = notBefore + 365 * 24 * 60 * 60

            const message = ethers.keccak256(
                ethers.solidityPacked(['bytes'], [publicKey])
            )
            const signature = wallet.signingKey.sign(message)
            const proof = ethers.Signature.from(signature).serialized

            await didRegistry.insertFirstDidDocument(
                adminDid,
                randomBaseDocument(),
                vMethodId,
                proof,
                publicKey,
                EllipticType.SECP_256_K1,
                notBefore,
                notAfter,
                ''
            )

            // Set timestamp to make the capability invocation active
            await mockTimestamp.setMockedTimestamp(notBefore + 1)

            // Now calling testOnlyKnownDid should succeed
            await expect(knownDidTestWrapper.connect(admin).testOnlyKnownDid())
                .to.emit(knownDidTestWrapper, 'DidVerified')
                .withArgs(adminAddress)
        })

        it('GIVEN address with DID but inactive capability invocation WHEN calling testOnlyKnownDid THEN it fails with AddressNotKnown', async function () {
            // Register a DID for admin
            const adminDid = randomDid()
            const publicKey = wallet.signingKey.publicKey
            const vMethodId = ethers.id(`vmethod:${adminDid}`)
            const notBefore = Math.floor(Date.now() / 1000) + 10000 // Future timestamp this does not work propperly in coverage tests
            const notAfter = notBefore + 365 * 24 * 60 * 60

            const message = ethers.keccak256(
                ethers.solidityPacked(['bytes'], [publicKey])
            )
            const signature = wallet.signingKey.sign(message)
            const proof = ethers.Signature.from(signature).serialized

            await didRegistry.insertFirstDidDocument(
                adminDid,
                randomBaseDocument(),
                vMethodId,
                proof,
                publicKey,
                EllipticType.SECP_256_K1,
                notBefore,
                notAfter,
                ''
            )

            // Set timestamp to a time BEFORE notBefore so capability invocation is not active
            await mockTimestamp.setMockedTimestamp(notBefore - 1000)

            await expect(knownDidTestWrapper.connect(admin).testOnlyKnownDid())
                .to.be.revertedWithCustomError(
                    knownDidTestWrapper,
                    'AddressNotKnown'
                )
                .withArgs(adminAddress)
        })

        it('GIVEN multiple addresses with DIDs WHEN calling testOnlyKnownDid THEN all succeed', async function () {
            // Register DID for admin
            const adminDid = randomDid()
            const adminPublicKey = wallet.signingKey.publicKey
            const adminVMethodId = ethers.id(`vmethod:${adminDid}`)
            const notBefore = Math.floor(Date.now() / 1000)
            const notAfter = notBefore + 365 * 24 * 60 * 60

            const adminMessage = ethers.keccak256(
                ethers.solidityPacked(['bytes'], [adminPublicKey])
            )
            const adminSignature = wallet.signingKey.sign(adminMessage)
            const adminProof = ethers.Signature.from(adminSignature).serialized

            await didRegistry.insertFirstDidDocument(
                adminDid,
                randomBaseDocument(),
                adminVMethodId,
                adminProof,
                adminPublicKey,
                EllipticType.SECP_256_K1,
                notBefore,
                notAfter,
                ''
            )

            // Set timestamp
            await mockTimestamp.setMockedTimestamp(notBefore + 1)

            // Register DID for other using insertDidDocument
            const otherDid = randomDid()
            const otherWallet = ethers.Wallet.createRandom()
            const otherPublicKey = otherWallet.signingKey.publicKey
            const otherVMethodId = ethers.id(`vmethod:${otherDid}`)

            const otherMessage = ethers.keccak256(
                ethers.solidityPacked(['bytes'], [otherPublicKey])
            )
            const otherSignature = otherWallet.signingKey.sign(otherMessage)
            const otherProof = ethers.Signature.from(otherSignature).serialized

            await didRegistry.insertFirstDidDocument(
                otherDid,
                randomBaseDocument(),
                otherVMethodId,
                otherProof,
                otherPublicKey,
                EllipticType.SECP_256_K1,
                notBefore,
                notAfter,
                ''
            )

            // Both should succeed
            await expect(knownDidTestWrapper.connect(admin).testOnlyKnownDid())
                .to.emit(knownDidTestWrapper, 'DidVerified')
                .withArgs(adminAddress)

            // Note: other address won't be able to call it because the DID was registered
            // with a different public key (otherWallet) than the actual signer (other)
        })
    })

    describe('ISBE role immutability', function () {
        it('GIVEN ISBE role WHEN attempting to grant THEN it fails with RoleIsImmutable', async function () {
            await expect(accessControl.grantRole(ISBE_ROLE, otherAddress))
                .to.be.revertedWithCustomError(accessControl, 'RoleIsImmutable')
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN ISBE role WHEN attempting to revoke THEN it fails with RoleIsImmutable', async function () {
            await expect(accessControl.revokeRole(ISBE_ROLE, adminAddress))
                .to.be.revertedWithCustomError(accessControl, 'RoleIsImmutable')
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN DEFAULT_ADMIN_ROLE WHEN attempting to grant THEN it succeeds', async function () {
            await expect(
                accessControl.grantRole(DEFAULT_ADMIN_ROLE, otherAddress)
            ).to.not.be.reverted

            expect(
                await accessControl.hasRole(DEFAULT_ADMIN_ROLE, otherAddress)
            ).to.be.true
        })
    })
})
