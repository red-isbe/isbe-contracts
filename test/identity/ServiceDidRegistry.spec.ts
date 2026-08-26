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
import { config, ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { AbiCoder, Contract, HDNodeWallet, Wallet, ZeroAddress } from 'ethers'
import {
    deployServiceDidRegistryFixture,
    deployInitializedServiceDidRegistryFixture,
    deployGovernanceWithoutServiceFacetFixture,
} from '../fixtures/servicedidregistry'
import { generateProof, proofToDid } from '../support'
import { EllipticType } from '../types/identity'

const NEVER_EXPIRES = 0n
const YEAR_2033 = 2_000_000_000n
const CAPABILITY_NOT_BEFORE = 1n
const CAPABILITY_NOT_AFTER = 1n + 1000000000000000000n

/** Wallet backing the hardhat signer at a given index. */
function walletOfSigner(index: number): HDNodeWallet {
    const { mnemonic } = config.networks.hardhat.accounts as {
        mnemonic: string
    }
    return ethers.HDNodeWallet.fromPhrase(
        mnemonic,
        undefined,
        `m/44'/60'/0'/0/${index}`
    )
}

/** Public key of a wallet in the 65-byte uncompressed encoding. */
function publicKeyOf(wallet: HDNodeWallet): string {
    return wallet.signingKey.publicKey
}

describe('ServiceDidRegistry', () => {
    /**
     * Registers an organisational DID whose capability invocation is the key of the
     * given signer, so that signer becomes able to operate on it.
     */
    async function insertOrganisationalDid(
        didRegistry: {
            insertFirstDidDocument: (
                ...args: unknown[]
            ) => Promise<{ wait: () => Promise<unknown> }>
        },
        signerIndex: number,
        label: string
    ) {
        const wallet = walletOfSigner(signerIndex)
        const proof = generateProof(wallet)
        const did = proofToDid(proof)

        const tx = await didRegistry.insertFirstDidDocument(
            did,
            `{"@context":"https://www.w3.org/ns/did/v1","id":"${label}"}`,
            ethers.id(`vmethod:${label}`),
            proof,
            publicKeyOf(wallet),
            EllipticType.SECP_256_K1,
            CAPABILITY_NOT_BEFORE,
            CAPABILITY_NOT_AFTER,
            `irn:orgs:${label}`
        )
        await tx.wait()

        return { did, wallet }
    }

    async function registryFixture() {
        const base = await loadFixture(
            deployInitializedServiceDidRegistryFixture
        )
        // The admin signer's own key backs this DID, so admin controls it.
        const parent = await insertOrganisationalDid(
            base.didRegistry as never,
            0,
            'alastria'
        )
        return { ...base, parentDid: parent.did, parentWallet: parent.wallet }
    }

    // A key that belongs to nobody: derived far from the signer range.
    function freeKey(seed: number): {
        publicKey: string
        wallet: HDNodeWallet
    } {
        const wallet = walletOfSigner(500 + seed)
        return { publicKey: publicKeyOf(wallet), wallet }
    }

    describe('Cutting the facet into an existing diamond', () => {
        it('GIVEN a live diamond WHEN comparing selectors THEN none of the new ones collide', async () => {
            const { newSelectors, selectorsBeforeCut } = await loadFixture(
                deployServiceDidRegistryFixture
            )

            const collisions = newSelectors.filter((selector) =>
                selectorsBeforeCut.includes(selector)
            )

            // Named explicitly: a collision surfacing as a bare bytes4 from the cut's
            // own revert would say nothing about which function is at fault.
            expect(
                collisions,
                `selectors already present in the diamond: ${collisions.join(', ')}`
            ).to.be.empty
        })

        it('GIVEN the facet has been cut WHEN asking the loupe THEN every selector routes to it', async () => {
            const { diamondLoupe, newSelectors, facetAddress } =
                await loadFixture(deployServiceDidRegistryFixture)

            for (const selector of newSelectors) {
                expect(await diamondLoupe.facetAddress(selector)).to.equal(
                    facetAddress
                )
            }
        })

        it('GIVEN the facet has been cut WHEN registering a service THEN the call reaches the diamond', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const { publicKey } = freeKey(1)

            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('ingesta IoT'),
                    NEVER_EXPIRES
                )
            ).to.emit(serviceDidRegistry, 'ServiceDidRegistered')
        })

        it('GIVEN an account without GOVERNANCE_MANAGER_ROLE WHEN cutting THEN it fails', async () => {
            const {
                diamondCutAccessControl,
                other,
                facetAddress,
                serviceDidRegistryFacet,
                itemCutActionAdd,
            } = await loadFixture(deployGovernanceWithoutServiceFacetFixture)

            const selectors =
                await serviceDidRegistryFacet.selectorsIntrospection()

            await expect(
                diamondCutAccessControl.connect(other).diamondCut(
                    [
                        {
                            facetAddress,
                            action: itemCutActionAdd,
                            items: [...selectors],
                        },
                    ],
                    ZeroAddress,
                    '0x'
                )
            ).to.be.reverted
        })
    })

    describe('registerServiceDid', () => {
        it('GIVEN the first service of a controller WHEN registering THEN the nonce is one', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const { publicKey } = freeKey(1)

            const expected = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )

            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('primer servicio'),
                    NEVER_EXPIRES
                )
            )
                .to.emit(serviceDidRegistry, 'ServiceDidRegistered')
                .withArgs(
                    expected,
                    parentDid,
                    () => true,
                    () => true,
                    EllipticType.SECP_256_K1,
                    ethers.id('primer servicio'),
                    NEVER_EXPIRES,
                    1
                )
        })

        it('GIVEN a second registration WHEN registering THEN the nonce advances and the identifier differs', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                freeKey(1).publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('uno'),
                NEVER_EXPIRES
            )
            await serviceDidRegistry.registerServiceDid(
                parentDid,
                freeKey(2).publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('dos'),
                NEVER_EXPIRES
            )

            const first = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )
            const second = await serviceDidRegistry.computeServiceDid(
                parentDid,
                2
            )

            expect(first).to.not.equal(second)
            expect(
                (await serviceDidRegistry.getServiceDid(first)).nonce
            ).to.equal(1)
            expect(
                (await serviceDidRegistry.getServiceDid(second)).nonce
            ).to.equal(2)
        })

        it('GIVEN a registered service WHEN reading it back THEN every field is what was sent', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const { publicKey } = freeKey(3)
            const labelHash = ethers.id('pipeline de facturacion')

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                publicKey,
                EllipticType.SECP_256_K1,
                labelHash,
                YEAR_2033
            )

            const serviceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )
            const record = await serviceDidRegistry.getServiceDid(serviceDid)

            expect(record.controllerDid).to.equal(parentDid)
            expect(record.labelHash).to.equal(labelHash)
            expect(record.expiresAt).to.equal(YEAR_2033)
            expect(record.ellipticType).to.equal(EllipticType.SECP_256_K1)
            expect(record.deactivated).to.equal(false)
            expect(record.exists).to.equal(true)
            expect(record.registeredAt).to.be.greaterThan(0)
            expect(record.updatedAt).to.equal(record.registeredAt)

            // The coordinates must reassemble into the key that was supplied.
            const reassembled = '0x04'.concat(
                record.pubKeyX.slice(2),
                record.pubKeyY.slice(2)
            )
            expect(reassembled).to.equal(publicKey)
        })

        it('GIVEN a caller who does not control the parent WHEN registering THEN it fails', async () => {
            const { serviceDidRegistry, didRegistry, parentDid, other } =
                await registryFixture()

            await expect(
                serviceDidRegistry
                    .connect(other)
                    .registerServiceDid(
                        parentDid,
                        freeKey(4).publicKey,
                        EllipticType.SECP_256_K1,
                        ethers.id('ajeno'),
                        NEVER_EXPIRES
                    )
            ).to.be.revertedWithCustomError(
                didRegistry,
                'ControllerNotAuthorized'
            )
        })

        it('GIVEN a parent DID that does not exist WHEN registering THEN it fails', async () => {
            const { serviceDidRegistry, didRegistry } = await registryFixture()

            await expect(
                serviceDidRegistry.registerServiceDid(
                    ethers.id('did inexistente'),
                    freeKey(5).publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('huerfano'),
                    NEVER_EXPIRES
                )
            ).to.be.revertedWithCustomError(didRegistry, 'DidNotExists')
        })

        it('GIVEN an expiry in the past WHEN registering THEN it fails', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()

            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    freeKey(6).publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('caducado'),
                    1n
                )
            ).to.be.revertedWithCustomError(serviceDidRegistry, 'InvalidExpiry')
        })
    })

    describe('Uniqueness of the signing key', () => {
        it('GIVEN a key already claimed by a service WHEN registering another THEN it fails', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const { publicKey } = freeKey(7)

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('primero'),
                NEVER_EXPIRES
            )

            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('duplicado'),
                    NEVER_EXPIRES
                )
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'SigningKeyAlreadyInUse'
            )
        })

        it('GIVEN the key of an organisational DID WHEN registering a service with it THEN it fails', async () => {
            const { serviceDidRegistry, parentDid, parentWallet } =
                await registryFixture()

            // The cross-registry check. Without it a signature by this key would be
            // attributable both to the organisation and to the service.
            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    publicKeyOf(parentWallet),
                    EllipticType.SECP_256_K1,
                    ethers.id('clave de la organizacion'),
                    NEVER_EXPIRES
                )
            )
                .to.be.revertedWithCustomError(
                    serviceDidRegistry,
                    'SigningKeyBoundToDid'
                )
                .withArgs(
                    () => true,
                    () => true,
                    parentDid
                )
        })

        it('GIVEN a key rotated away from WHEN claiming it again THEN it fails', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const original = freeKey(8).publicKey

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                original,
                EllipticType.SECP_256_K1,
                ethers.id('rotable'),
                NEVER_EXPIRES
            )
            const serviceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )
            await serviceDidRegistry.rotateSigningKey(
                serviceDid,
                freeKey(9).publicKey,
                EllipticType.SECP_256_K1
            )

            // The binding is permanent, so historical signatures stay attributable.
            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    original,
                    EllipticType.SECP_256_K1,
                    ethers.id('reclamando la vieja'),
                    NEVER_EXPIRES
                )
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'SigningKeyAlreadyInUse'
            )
        })
    })

    describe('Authorisation follows the parent DID', () => {
        it('GIVEN a second controller of the parent WHEN operating on its services THEN it succeeds', async () => {
            const { serviceDidRegistry, didRegistry, parentDid, other } =
                await registryFixture()

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                freeKey(10).publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('compartido'),
                NEVER_EXPIRES
            )
            const serviceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )

            // A second organisational DID, backed by `other`, added as controller.
            const second = await insertOrganisationalDid(
                didRegistry as never,
                1,
                'segunda'
            )
            await didRegistry.addController(parentDid, second.did)

            // Nothing was written on the service: authorisation resolves through the
            // parent on every call, which is why controller rotation needs no cascade.
            await expect(
                serviceDidRegistry
                    .connect(other)
                    .updateExpiry(serviceDid, YEAR_2033)
            ).to.emit(serviceDidRegistry, 'ServiceDidExpiryUpdated')
        })

        it('GIVEN the caller key is revoked on the parent WHEN operating THEN it loses access', async () => {
            const {
                serviceDidRegistry,
                didRegistry,
                parentDid,
                mockTimestamp,
            } = await registryFixture()

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                freeKey(11).publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('a revocar'),
                NEVER_EXPIRES
            )
            const serviceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )

            // Control: without this the test would pass even if the setup, and not the
            // revocation, were what broke the call.
            await expect(
                serviceDidRegistry.updateExpiry(serviceDid, YEAR_2033)
            ).to.emit(serviceDidRegistry, 'ServiceDidExpiryUpdated')

            // Revoking the parent's verification method drops the address index the
            // controller check walks, so the caller stops being a controller.
            await mockTimestamp.setMockedTimestamp(YEAR_2033)
            await didRegistry.revokeVerificationMethod(
                parentDid,
                ethers.id('vmethod:alastria'),
                YEAR_2033
            )

            await expect(
                serviceDidRegistry.updateExpiry(serviceDid, YEAR_2033 + 1000n)
            ).to.be.revertedWithCustomError(
                didRegistry,
                'ControllerNotAuthorized'
            )
        })
    })

    describe('Lifecycle', () => {
        async function withOneService() {
            const fixture = await registryFixture()
            await fixture.serviceDidRegistry.registerServiceDid(
                fixture.parentDid,
                freeKey(12).publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('ciclo de vida'),
                NEVER_EXPIRES
            )
            const serviceDid =
                await fixture.serviceDidRegistry.computeServiceDid(
                    fixture.parentDid,
                    1
                )
            return { ...fixture, serviceDid }
        }

        it('GIVEN a rotation WHEN reading the record THEN the key changed and updatedAt moved', async () => {
            const { serviceDidRegistry, serviceDid } = await withOneService()
            const before = await serviceDidRegistry.getServiceDid(serviceDid)

            await serviceDidRegistry.rotateSigningKey(
                serviceDid,
                freeKey(13).publicKey,
                EllipticType.SECP_256_K1
            )

            const after = await serviceDidRegistry.getServiceDid(serviceDid)
            expect(after.pubKeyX).to.not.equal(before.pubKeyX)
            expect(after.registeredAt).to.equal(before.registeredAt)
            expect(after.updatedAt).to.be.greaterThanOrEqual(before.updatedAt)
        })

        it('GIVEN a deactivated service WHEN operating on it THEN every write fails', async () => {
            const { serviceDidRegistry, serviceDid } = await withOneService()

            await expect(
                serviceDidRegistry.deactivateServiceDid(serviceDid)
            ).to.emit(serviceDidRegistry, 'ServiceDidDeactivated')

            await expect(
                serviceDidRegistry.deactivateServiceDid(serviceDid)
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'ServiceDidIsDeactivated'
            )
            await expect(
                serviceDidRegistry.updateExpiry(serviceDid, YEAR_2033)
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'ServiceDidIsDeactivated'
            )
            await expect(
                serviceDidRegistry.rotateSigningKey(
                    serviceDid,
                    freeKey(14).publicKey,
                    EllipticType.SECP_256_K1
                )
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'ServiceDidIsDeactivated'
            )
        })

        it('GIVEN an unknown identifier WHEN reading THEN getServiceDid reverts but isServiceDidActive does not', async () => {
            const { serviceDidRegistry } = await registryFixture()
            const unknown = ethers.id('nunca registrado')

            await expect(
                serviceDidRegistry.getServiceDid(unknown)
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'ServiceDidNotFound'
            )
            expect(await serviceDidRegistry.isServiceDidActive(unknown)).to.be
                .false
        })

        it('GIVEN an expiry WHEN the clock passes it THEN the service stops being active', async () => {
            const { serviceDidRegistry, serviceDid, mockTimestamp } =
                await withOneService()

            await serviceDidRegistry.updateExpiry(serviceDid, YEAR_2033)
            expect(await serviceDidRegistry.isServiceDidActive(serviceDid)).to
                .be.true

            await mockTimestamp.setMockedTimestamp(YEAR_2033 + 1n)
            expect(await serviceDidRegistry.isServiceDidActive(serviceDid)).to
                .be.false

            // The record survives: expiry is a reading, not a deletion.
            const record = await serviceDidRegistry.getServiceDid(serviceDid)
            expect(record.exists).to.be.true
            expect(record.deactivated).to.be.false
        })

        it('GIVEN a deactivated service WHEN asking THEN it is not active', async () => {
            const { serviceDidRegistry, serviceDid } = await withOneService()

            await serviceDidRegistry.deactivateServiceDid(serviceDid)

            expect(await serviceDidRegistry.isServiceDidActive(serviceDid)).to
                .be.false
        })
    })

    describe('getServiceDidsByController', () => {
        async function withThreeServices() {
            const fixture = await registryFixture()
            for (let i = 0; i < 3; i++) {
                await fixture.serviceDidRegistry.registerServiceDid(
                    fixture.parentDid,
                    freeKey(20 + i).publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id(`servicio ${i}`),
                    NEVER_EXPIRES
                )
            }
            return fixture
        }

        it('GIVEN three services WHEN asking for the first page THEN total is three', async () => {
            const { serviceDidRegistry, parentDid } = await withThreeServices()

            const [items, total, howMany] =
                await serviceDidRegistry.getServiceDidsByController(
                    parentDid,
                    1,
                    10
                )

            expect(total).to.equal(3)
            expect(howMany).to.equal(3)
            expect(items.length).to.equal(3)
        })

        it('GIVEN three services WHEN paging one by one THEN pages are one-based', async () => {
            const { serviceDidRegistry, parentDid } = await withThreeServices()

            const [firstPage] =
                await serviceDidRegistry.getServiceDidsByController(
                    parentDid,
                    1,
                    1
                )
            const [secondPage] =
                await serviceDidRegistry.getServiceDidsByController(
                    parentDid,
                    2,
                    1
                )

            expect(firstPage[0].nonce).to.equal(1)
            expect(secondPage[0].nonce).to.equal(2)
        })

        it('GIVEN a page beyond the end WHEN asking THEN it returns empty but reports the total', async () => {
            const { serviceDidRegistry, parentDid } = await withThreeServices()

            const [items, total, howMany] =
                await serviceDidRegistry.getServiceDidsByController(
                    parentDid,
                    9,
                    10
                )

            expect(items.length).to.equal(0)
            expect(howMany).to.equal(0)
            expect(total).to.equal(3)
        })

        it('GIVEN a controller with no services WHEN asking THEN the total is zero', async () => {
            const { serviceDidRegistry } = await registryFixture()

            const [, total] =
                await serviceDidRegistry.getServiceDidsByController(
                    ethers.id('sin servicios'),
                    1,
                    10
                )

            expect(total).to.equal(0)
        })
    })

    describe('signingKeyAddressOf', () => {
        it('GIVEN a registered service WHEN asking THEN it is the address of the key that was registered', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const key = freeKey(40)

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                key.publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('con direccion'),
                NEVER_EXPIRES
            )
            const serviceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )

            // Derived, never stored — so it cannot drift from the coordinates.
            expect(
                await serviceDidRegistry.signingKeyAddressOf(serviceDid)
            ).to.equal(key.wallet.address)
        })

        it('GIVEN a rotation WHEN asking THEN it follows the new key', async () => {
            const { serviceDidRegistry, parentDid } = await registryFixture()
            const original = freeKey(41)
            const replacement = freeKey(42)

            await serviceDidRegistry.registerServiceDid(
                parentDid,
                original.publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('a rotar'),
                NEVER_EXPIRES
            )
            const serviceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )
            await serviceDidRegistry.rotateSigningKey(
                serviceDid,
                replacement.publicKey,
                EllipticType.SECP_256_K1
            )

            expect(
                await serviceDidRegistry.signingKeyAddressOf(serviceDid)
            ).to.equal(replacement.wallet.address)
        })

        it('GIVEN an unknown identifier WHEN asking THEN it reverts', async () => {
            const { serviceDidRegistry } = await registryFixture()

            await expect(
                serviceDidRegistry.signingKeyAddressOf(
                    ethers.id('no registrado')
                )
            ).to.be.revertedWithCustomError(
                serviceDidRegistry,
                'ServiceDidNotFound'
            )
        })
    })

    describe('initializeServiceDidRegistry', () => {
        async function uninitialised() {
            const base = await loadFixture(deployServiceDidRegistryFixture)
            const registry = base.serviceDidRegistryFacet.attach(
                base.governanceAddress
            ) as typeof base.serviceDidRegistryFacet
            return { ...base, registry }
        }

        it('GIVEN a freshly cut facet WHEN initialising THEN it emits and stamps the version', async () => {
            const { registry, admin } = await uninitialised()

            await expect(
                registry.connect(admin).initializeServiceDidRegistry()
            ).to.emit(registry, 'ServiceDidRegistryInitialized')
        })

        it('GIVEN an initialised facet WHEN initialising again THEN it fails', async () => {
            const { registry, admin } = await uninitialised()
            await registry.connect(admin).initializeServiceDidRegistry()

            await expect(
                registry.connect(admin).initializeServiceDidRegistry()
            ).to.be.revertedWithCustomError(
                registry,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN an account without DEFAULT_ADMIN_ROLE WHEN initialising THEN it fails', async () => {
            const { registry, other, accessControlGovernance } =
                await uninitialised()

            await expect(
                registry.connect(other).initializeServiceDidRegistry()
            ).to.be.revertedWithCustomError(
                accessControlGovernance,
                'AccountHasNoRole'
            )
        })
    })

    describe('Facet introspection', () => {
        it('GIVEN the facet WHEN asking for its business id THEN it is the resolver key', async () => {
            const { serviceDidRegistryFacet } = await loadFixture(
                deployServiceDidRegistryFixture
            )

            // Same preimage convention as constants/resolverKeys.sol.
            expect(
                await serviceDidRegistryFacet.businessIdIntrospection()
            ).to.equal(
                ethers.id('isbe.contracts.service.did.registry.resolver.key')
            )
        })
    })

    describe('Guards', () => {
        async function withService() {
            const fixture = await registryFixture()
            await fixture.serviceDidRegistry.registerServiceDid(
                fixture.parentDid,
                freeKey(30).publicKey,
                EllipticType.SECP_256_K1,
                ethers.id('guardado'),
                NEVER_EXPIRES
            )
            const serviceDid =
                await fixture.serviceDidRegistry.computeServiceDid(
                    fixture.parentDid,
                    1
                )
            return { ...fixture, serviceDid }
        }

        const UNKNOWN = ethers.id('no registrado jamas')
        const ZERO32 = ethers.ZeroHash

        it('GIVEN a paused diamond WHEN writing THEN every operation fails', async () => {
            const {
                serviceDidRegistry,
                serviceDid,
                pauseGovernance,
                parentDid,
            } = await withService()

            await pauseGovernance.pause()

            for (const call of [
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    freeKey(31).publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('en pausa'),
                    NEVER_EXPIRES
                ),
                serviceDidRegistry.rotateSigningKey(
                    serviceDid,
                    freeKey(32).publicKey,
                    EllipticType.SECP_256_K1
                ),
                serviceDidRegistry.updateExpiry(serviceDid, YEAR_2033),
                serviceDidRegistry.deactivateServiceDid(serviceDid),
            ]) {
                await expect(call).to.be.revertedWithCustomError(
                    pauseGovernance,
                    'IsPaused'
                )
            }
        })

        it('GIVEN a zero identifier WHEN writing THEN every operation fails', async () => {
            const { serviceDidRegistry, serviceDidRegistryFacet } =
                await withService()

            for (const call of [
                serviceDidRegistry.registerServiceDid(
                    ZERO32,
                    freeKey(33).publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('sin padre'),
                    NEVER_EXPIRES
                ),
                serviceDidRegistry.rotateSigningKey(
                    ZERO32,
                    freeKey(34).publicKey,
                    EllipticType.SECP_256_K1
                ),
                serviceDidRegistry.updateExpiry(ZERO32, YEAR_2033),
                serviceDidRegistry.deactivateServiceDid(ZERO32),
            ]) {
                await expect(call).to.be.revertedWithCustomError(
                    serviceDidRegistryFacet,
                    'EmptyBytes32'
                )
            }
        })

        it('GIVEN empty key material WHEN registering or rotating THEN it fails', async () => {
            const {
                serviceDidRegistry,
                serviceDidRegistryFacet,
                serviceDid,
                parentDid,
            } = await withService()

            for (const call of [
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    '0x',
                    EllipticType.SECP_256_K1,
                    ethers.id('sin clave'),
                    NEVER_EXPIRES
                ),
                serviceDidRegistry.rotateSigningKey(
                    serviceDid,
                    '0x',
                    EllipticType.SECP_256_K1
                ),
            ]) {
                await expect(call).to.be.revertedWithCustomError(
                    serviceDidRegistryFacet,
                    'EmptyBytes'
                )
            }
        })

        it('GIVEN an unsupported curve WHEN registering or rotating THEN it fails', async () => {
            const {
                serviceDidRegistry,
                serviceDidRegistryFacet,
                serviceDid,
                parentDid,
            } = await withService()
            const NONE = 0

            for (const call of [
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    freeKey(35).publicKey,
                    NONE,
                    ethers.id('sin curva'),
                    NEVER_EXPIRES
                ),
                serviceDidRegistry.rotateSigningKey(
                    serviceDid,
                    freeKey(36).publicKey,
                    NONE
                ),
            ]) {
                await expect(call).to.be.revertedWithCustomError(
                    serviceDidRegistryFacet,
                    'InvalidEllipticCurve'
                )
            }
        })

        it('GIVEN an unknown service WHEN writing THEN every operation fails', async () => {
            const { serviceDidRegistry } = await withService()

            for (const call of [
                serviceDidRegistry.rotateSigningKey(
                    UNKNOWN,
                    freeKey(37).publicKey,
                    EllipticType.SECP_256_K1
                ),
                serviceDidRegistry.updateExpiry(UNKNOWN, YEAR_2033),
                serviceDidRegistry.deactivateServiceDid(UNKNOWN),
            ]) {
                await expect(call).to.be.revertedWithCustomError(
                    serviceDidRegistry,
                    'ServiceDidNotFound'
                )
            }
        })

        it('GIVEN a caller who controls nothing WHEN writing THEN rotation and deactivation fail', async () => {
            const { serviceDidRegistry, didRegistry, serviceDid, other } =
                await withService()

            for (const call of [
                serviceDidRegistry
                    .connect(other)
                    .rotateSigningKey(
                        serviceDid,
                        freeKey(38).publicKey,
                        EllipticType.SECP_256_K1
                    ),
                serviceDidRegistry
                    .connect(other)
                    .deactivateServiceDid(serviceDid),
            ]) {
                await expect(call).to.be.revertedWithCustomError(
                    didRegistry,
                    'ControllerNotAuthorized'
                )
            }
        })

        it('GIVEN an expiry beyond what the record stores WHEN updating THEN it fails', async () => {
            const { serviceDidRegistry, serviceDid } = await withService()

            // Guards the narrowing to uint64: without it, 2**64 would be stored as zero,
            // which this registry reads as "never expires" — the opposite of the intent.
            await expect(
                serviceDidRegistry.updateExpiry(serviceDid, 2n ** 64n)
            ).to.be.revertedWithCustomError(serviceDidRegistry, 'InvalidExpiry')
        })

        it('GIVEN a service that never expires WHEN asking THEN it is active', async () => {
            const { serviceDidRegistry, serviceDid } = await withService()

            expect(await serviceDidRegistry.isServiceDidActive(serviceDid)).to
                .be.true
        })

        it('GIVEN a forged identifier collision WHEN registering THEN the defensive guard holds', async () => {
            const { serviceDidRegistry, storageProbe, parentDid } =
                await registryFixture()

            // Unreachable in normal operation: the nonce is monotonic. Forged here so
            // the invariant is proven rather than assumed.
            const nextServiceDid = await serviceDidRegistry.computeServiceDid(
                parentDid,
                1
            )
            await storageProbe.forceServiceDidExists(nextServiceDid)

            await expect(
                serviceDidRegistry.registerServiceDid(
                    parentDid,
                    freeKey(39).publicKey,
                    EllipticType.SECP_256_K1,
                    ethers.id('colision forzada'),
                    NEVER_EXPIRES
                )
            )
                .to.be.revertedWithCustomError(
                    serviceDidRegistry,
                    'ServiceDidAlreadyExists'
                )
                .withArgs(nextServiceDid)
        })
    })

    /**
     * Derivations.
     *
     * These helpers decide how key material is stored and how identifiers are derived.
     * Every one of them can be wrong without any call reverting: a mis-sliced coordinate
     * stores a key that is simply not the caller's, and a derivation that disagrees with
     * its off-chain counterpart breaks resolution rather than the transaction. That is
     * why they are exercised directly, against values computed independently in
     * TypeScript, rather than through the registry's happy path.
     */
    describe('Derivations', () => {
        // Hardhat's first account. Fixed on purpose: a random key would still prove
        // parity, but a constant one also pins the expected bytes across refactors.
        const PRIVATE_KEY =
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

        async function deployHelpersFixture() {
            const factory = await ethers.getContractFactory(
                'ServiceDidRegistryHelpersTestWrapper'
            )
            const helpers = await factory.deploy()
            await helpers.waitForDeployment()

            // Custom errors raised by the helpers are declared in IDidDocumentDetailed,
            // so the matcher needs an instance carrying that interface's ABI.
            const didErrors = await ethers.getContractAt(
                'IDidDocumentDetailed',
                await helpers.getAddress()
            )

            const wallet = new Wallet(PRIVATE_KEY)
            const publicKey65 = wallet.signingKey.publicKey // 0x04 || x || y
            const publicKey64 = '0x'.concat(publicKey65.slice(4))

            return {
                helpers: helpers as unknown as Contract,
                didErrors,
                wallet,
                publicKey65,
                publicKey64,
                expectedX: '0x'.concat(publicKey64.slice(2, 66)),
                expectedY: '0x'.concat(publicKey64.slice(66)),
            }
        }

        describe('splitPublicKey', () => {
            it('GIVEN a 65-byte key WHEN splitting THEN the coordinates match the raw slices', async () => {
                const { helpers, publicKey65, expectedX, expectedY } =
                    await loadFixture(deployHelpersFixture)

                const [x, y] = await helpers.splitPublicKey(publicKey65)

                expect(x).to.equal(expectedX)
                expect(y).to.equal(expectedY)
            })

            it('GIVEN the same key in its 64-byte form WHEN splitting THEN it yields identical coordinates', async () => {
                const { helpers, publicKey65, publicKey64 } =
                    await loadFixture(deployHelpersFixture)

                const [x65, y65] = await helpers.splitPublicKey(publicKey65)
                const [x64, y64] = await helpers.splitPublicKey(publicKey64)

                // Both encodings must collapse to the same pair, or the same key could
                // be presented twice and claim two entries in the uniqueness index.
                expect(x64).to.equal(x65)
                expect(y64).to.equal(y65)
            })

            it('GIVEN a 65-byte key whose control byte is not 0x04 WHEN splitting THEN it reverts', async () => {
                const { helpers, didErrors, publicKey64 } =
                    await loadFixture(deployHelpersFixture)
                const wrongPrefix = '0x03'.concat(publicKey64.slice(2))

                await expect(
                    helpers.splitPublicKey(wrongPrefix)
                ).to.be.revertedWithCustomError(
                    didErrors,
                    'InvalidControlBytes'
                )
            })

            it('GIVEN key material of an unsupported length WHEN splitting THEN it reverts', async () => {
                const { helpers, didErrors, publicKey64 } =
                    await loadFixture(deployHelpersFixture)
                const tooShort = publicKey64.slice(0, 128) // 63 bytes
                const tooLong = publicKey64.concat('ff') // 65 bytes, no 0x04 semantics
                const compressed = '0x02'.concat(publicKey64.slice(2, 66)) // 33 bytes

                await expect(
                    helpers.splitPublicKey(tooShort)
                ).to.be.revertedWithCustomError(
                    didErrors,
                    'InvalidPubKeyLength'
                )
                await expect(
                    helpers.splitPublicKey(compressed)
                ).to.be.revertedWithCustomError(
                    didErrors,
                    'InvalidPubKeyLength'
                )
                // 65 bytes reaches the control-byte branch instead of the length one
                await expect(
                    helpers.splitPublicKey(tooLong)
                ).to.be.revertedWithCustomError(
                    didErrors,
                    'InvalidControlBytes'
                )
            })
        })

        describe('signingKeyAddress', () => {
            it('GIVEN a public key WHEN deriving its address THEN it equals the address of the wallet', async () => {
                const { helpers, wallet, expectedX, expectedY } =
                    await loadFixture(deployHelpersFixture)

                // The parity check that matters. The organisational registry derives an
                // address as keccak256 of the same 64 coordinate bytes, which for
                // secp256k1 is exactly the Ethereum address of the key. If this fails,
                // the cross-registry uniqueness check silently never fires.
                expect(
                    await helpers.signingKeyAddress(expectedX, expectedY)
                ).to.equal(wallet.address)
            })

            it('GIVEN several independent keys WHEN deriving THEN every address matches its wallet', async () => {
                const { helpers } = await loadFixture(deployHelpersFixture)

                for (let i = 0; i < 5; i++) {
                    const wallet = Wallet.createRandom()
                    const key64 = '0x'.concat(
                        wallet.signingKey.publicKey.slice(4)
                    )
                    const x = '0x'.concat(key64.slice(2, 66))
                    const y = '0x'.concat(key64.slice(66))

                    expect(await helpers.signingKeyAddress(x, y)).to.equal(
                        wallet.address
                    )
                }
            })
        })

        describe('publicKeyHash', () => {
            it('GIVEN swapped coordinates WHEN hashing THEN the digest differs', async () => {
                const { helpers, expectedX, expectedY } =
                    await loadFixture(deployHelpersFixture)

                // A digest that ignored ordering would let two different keys collide.
                expect(
                    await helpers.publicKeyHash(expectedX, expectedY)
                ).to.not.equal(
                    await helpers.publicKeyHash(expectedY, expectedX)
                )
            })

            it('GIVEN the same coordinates WHEN hashing twice THEN the digest is stable', async () => {
                const { helpers, expectedX, expectedY } =
                    await loadFixture(deployHelpersFixture)

                expect(
                    await helpers.publicKeyHash(expectedX, expectedY)
                ).to.equal(await helpers.publicKeyHash(expectedX, expectedY))
            })
        })

        describe('computeServiceDid', () => {
            const controllerDid = ethers.id('did:isbe:uc:test-controller')

            it('GIVEN a controller and a nonce WHEN computing off-chain with abi.encode THEN both agree', async () => {
                const { helpers } = await loadFixture(deployHelpersFixture)

                const offChain = ethers.keccak256(
                    AbiCoder.defaultAbiCoder().encode(
                        ['bytes32', 'uint64'],
                        [controllerDid, 1]
                    )
                )

                expect(
                    await helpers.computeServiceDid(controllerDid, 1)
                ).to.equal(offChain)
            })

            it('GIVEN the packed encoding WHEN computing off-chain THEN it does NOT agree', async () => {
                const { helpers } = await loadFixture(deployHelpersFixture)

                // Documented on purpose. abi.encode pads the nonce to 32 bytes; a
                // library reaching for solidityPacked would produce a different
                // identifier and break resolution without breaking any transaction.
                const packed = ethers.keccak256(
                    ethers.solidityPacked(
                        ['bytes32', 'uint64'],
                        [controllerDid, 1]
                    )
                )

                expect(
                    await helpers.computeServiceDid(controllerDid, 1)
                ).to.not.equal(packed)
            })

            it('GIVEN different nonces or controllers WHEN computing THEN identifiers differ', async () => {
                const { helpers } = await loadFixture(deployHelpersFixture)
                const otherController = ethers.id(
                    'did:isbe:uc:other-controller'
                )

                const first = await helpers.computeServiceDid(controllerDid, 1)
                const second = await helpers.computeServiceDid(controllerDid, 2)
                const otherFirst = await helpers.computeServiceDid(
                    otherController,
                    1
                )

                expect(first).to.not.equal(second)
                expect(first).to.not.equal(otherFirst)
            })
        })
    })
})
