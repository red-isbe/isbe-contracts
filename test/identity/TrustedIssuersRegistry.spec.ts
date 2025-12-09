import { expect } from 'chai'
import { sha256, ZeroHash } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { randomBytes32 } from '../support'
import { TRUSTED_ISSUERS_REGISTRY_RESOLVER_KEY } from '../../utils/constants'

import {
    IssuerType,
    deployContractsFixture,
    deployWithDidsFixture,
} from './utils/trustedIssuersRegistry.fixtures'

import {
    EventValidator,
    TrustedIssuerTestBuilder,
} from './utils/trustedIssuersRegistry.helpers'

// ============================================================================
// Tests
// ============================================================================

describe('TrustedIssuersRegistry', () => {
    describe('Contract Initialization', () => {
        it('should have correct business ID and interfaces', async () => {
            const ctx = await loadFixture(deployContractsFixture)

            expect(
                await ctx.trustedIssuersRegistryFacet!.businessIdIntrospection()
            ).to.be.equal(TRUSTED_ISSUERS_REGISTRY_RESOLVER_KEY)

            expect(
                await ctx.trustedIssuersRegistryFacet!.interfacesIntrospection()
            ).to.be.deep.equal(['0x53e2bade'])
        })
    })

    describe('setAttributeMetadata', () => {
        describe('Access Control', () => {
            it('reverts when contract is paused', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                await ctx.pause!.pause()

                await expect(
                    ctx.trustedIssuersRegistry!.setAttributeMetadata(
                        ZeroHash,
                        IssuerType.NONE,
                        ZeroHash,
                        ZeroHash,
                        ZeroHash
                    )
                ).to.be.revertedWithCustomError(ctx.pause!, 'IsPaused')
            })

            it('reverts when caller is not a controller', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                await expect(
                    ctx.trustedIssuersRegistry
                        .connect(ctx.alice)
                        .setAttributeMetadata(
                            ctx.adminDid,
                            IssuerType.ROOT_TAO,
                            randomBytes32(),
                            ZeroHash,
                            ZeroHash
                        )
                )
                    .to.be.revertedWithCustomError(
                        ctx.trustedIssuersRegistryFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(ctx.adminDid, ctx.aliceAddress)
            })
        })

        describe('Input Validation', () => {
            it('reverts when issuerType is NONE', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                await expect(
                    ctx.trustedIssuersRegistry.setAttributeMetadata(
                        ctx.adminDid,
                        IssuerType.NONE,
                        randomBytes32(),
                        ZeroHash,
                        ZeroHash
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'InvalidIssuerType'
                )
            })

            it('reverts when revisionId is zero', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                await expect(
                    ctx.trustedIssuersRegistry.setAttributeMetadata(
                        ctx.adminDid,
                        IssuerType.ROOT_TAO,
                        ZeroHash,
                        ZeroHash,
                        ZeroHash
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'EmptyBytes32'
                )
            })

            it('reverts when attribute is owned by another issuer', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const sharedRevisionId = randomBytes32()

                // Admin creates an attribute with this revision ID
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.ROOT_TAO,
                    sharedRevisionId,
                    ZeroHash,
                    ZeroHash
                )

                // Bob tries to use the same revision ID
                await expect(
                    ctx.trustedIssuersRegistry
                        .connect(ctx.bob)
                        .setAttributeMetadata(
                            ctx.bobDid,
                            IssuerType.ROOT_TAO,
                            sharedRevisionId,
                            ZeroHash,
                            ZeroHash
                        )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'AttributeOwnedByAnotherIssuer'
                )
            })
        })

        describe('Authorization Rules', () => {
            describe('ROOT_TAO permissions', () => {
                it('allows admin to create ROOT_TAO', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const revisionId = randomBytes32()

                    await expect(
                        ctx.trustedIssuersRegistry.setAttributeMetadata(
                            ctx.adminDid,
                            IssuerType.ROOT_TAO,
                            revisionId,
                            ZeroHash,
                            ZeroHash
                        )
                    ).to.not.be.reverted
                })

                it('prevents non-admin from creating ROOT_TAO', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)

                    await expect(
                        ctx.trustedIssuersRegistry
                            .connect(ctx.bob)
                            .setAttributeMetadata(
                                ctx.bobDid,
                                IssuerType.ROOT_TAO,
                                randomBytes32(),
                                ZeroHash,
                                ZeroHash
                            )
                    ).to.be.revertedWithCustomError(
                        ctx.trustedIssuersRegistryFacet,
                        'SenderCannotInteractWithRootTao'
                    )
                })
            })

            describe('TAO/TI Controller Validation', () => {
                it('reverts when sender does not control the TAO DID', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const unknownTaoDid = randomBytes32()

                    await expect(
                        ctx.trustedIssuersRegistry
                            .connect(ctx.bob)
                            .setAttributeMetadata(
                                ctx.bobDid,
                                IssuerType.TAO,
                                randomBytes32(),
                                unknownTaoDid,
                                randomBytes32()
                            )
                    ).to.be.revertedWithCustomError(
                        ctx.trustedIssuersRegistryFacet,
                        'SenderIsNotTaoOrRootTao'
                    )
                })

                it('reverts when TAO DID does not have ROOT_TAO or TAO issuer type', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)

                    // Bob controls bobDid but it has no TAO/ROOT_TAO attribute
                    await expect(
                        ctx.trustedIssuersRegistry
                            .connect(ctx.bob)
                            .setAttributeMetadata(
                                ctx.bobDid,
                                IssuerType.TI,
                                randomBytes32(),
                                ctx.bobDid,
                                randomBytes32()
                            )
                    ).to.be.revertedWithCustomError(
                        ctx.trustedIssuersRegistryFacet,
                        'SenderIsNotTaoOrRootTao'
                    )
                })
            })

            describe('Trust Chain Validation', () => {
                it('prevents update from different trust chain', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const builder = new TrustedIssuerTestBuilder(ctx)

                    // Create two separate ROOT_TAOs
                    const adminRootTao = await builder.createRootTao(
                        ctx.adminDid
                    )
                    const bobRootTao = await builder.createRootTao(ctx.bobDid)

                    // Create TI for Bob under admin's trust chain
                    const tiRevisionId = await builder.createTi(
                        ctx.bobDid,
                        ctx.adminDid,
                        adminRootTao
                    )

                    // Bob tries to update using his own trust chain
                    await expect(
                        ctx.trustedIssuersRegistry
                            .connect(ctx.bob)
                            .setAttributeMetadata(
                                ctx.bobDid,
                                IssuerType.TI,
                                tiRevisionId,
                                ctx.bobDid,
                                bobRootTao
                            )
                    )
                        .to.be.revertedWithCustomError(
                            ctx.trustedIssuersRegistryFacet,
                            'SenderIsNotTaoOrRootTaoOf'
                        )
                        .withArgs(ctx.bobDid)
                })
            })

            describe('Coverage Tests - _checkEligibility', () => {
                it('allows TAO (not ROOT_TAO) to authorize operations (line 489)', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const builder = new TrustedIssuerTestBuilder(ctx)

                    // Create ROOT_TAO for admin
                    const adminRootTao = await builder.createRootTao(
                        ctx.adminDid
                    )

                    // Create TAO for Bob (IssuerType.TAO, not ROOT_TAO)
                    const bobTao = await builder.createTao(
                        ctx.bobDid,
                        ctx.adminDid,
                        adminRootTao
                    )

                    // Ensure Alice DID exists with Bob as controller
                    await builder.ensureAliceDid()

                    // Bob (TAO) creates TI for Alice - should succeed
                    const tiRevision = await builder.createTi(
                        ctx.aliceDid,
                        ctx.bobDid,
                        bobTao,
                        ctx.bob
                    )

                    // Verify attribute was created
                    const attribute =
                        await ctx.trustedIssuersRegistry.getRevisionAttribute(
                            ctx.aliceDid,
                            tiRevision,
                            tiRevision
                        )
                    expect(attribute.did).to.equal(ctx.aliceDid)
                    expect(attribute.issuerType).to.equal(IssuerType.TI)
                })

                it('returns early for new attributes (line 500)', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const builder = new TrustedIssuerTestBuilder(ctx)

                    // Create ROOT_TAO for Bob
                    const bobRootTao = await builder.createRootTao(ctx.bobDid)

                    // Ensure Alice DID with Bob as controller
                    await builder.ensureAliceDid()

                    // Bob creates NEW TI for Alice
                    const newTiRevision = await builder.createTi(
                        ctx.aliceDid,
                        ctx.bobDid,
                        bobRootTao,
                        ctx.bob
                    )

                    // Verify it's a new attribute (only 1 revision)
                    const [, total] =
                        await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                            ctx.aliceDid,
                            newTiRevision,
                            1,
                            10
                        )
                    expect(total).to.equal(1)
                })

                it('allows update via rootTaoDid trust chain (line 506)', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const builder = new TrustedIssuerTestBuilder(ctx)

                    // Create hierarchy
                    const { rootTaoRevisionId, tiRevisionId } =
                        await builder.createCompleteHierarchy()

                    // Add admin as controller of Alice
                    await ctx.didRegistry.addController(
                        ctx.aliceDid,
                        ctx.adminDid
                    )

                    // Admin (ROOT_TAO) updates Alice's attribute
                    await expect(
                        ctx.trustedIssuersRegistry.setAttributeMetadata(
                            ctx.aliceDid,
                            IssuerType.TI,
                            tiRevisionId,
                            ctx.adminDid,
                            rootTaoRevisionId
                        )
                    ).to.not.be.reverted

                    // Verify new revision was created
                    const [, total] =
                        await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                            ctx.aliceDid,
                            tiRevisionId,
                            1,
                            10
                        )
                    expect(total).to.equal(2) // Original + updated
                })

                it('allows update via taoDid trust chain (line 503)', async () => {
                    const ctx = await loadFixture(deployWithDidsFixture)
                    const builder = new TrustedIssuerTestBuilder(ctx)

                    // Create hierarchy
                    const { taoRevisionId, tiRevisionId } =
                        await builder.createCompleteHierarchy()

                    // Bob updates Alice's attribute using same TAO
                    await expect(
                        ctx.trustedIssuersRegistry
                            .connect(ctx.bob)
                            .setAttributeMetadata(
                                ctx.aliceDid,
                                IssuerType.TI,
                                tiRevisionId,
                                ctx.bobDid,
                                taoRevisionId
                            )
                    ).to.not.be.reverted

                    // Verify new revision was created
                    const [, total] =
                        await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                            ctx.aliceDid,
                            tiRevisionId,
                            1,
                            10
                        )
                    expect(total).to.equal(2)
                })
            })
        })

        describe('Revision ID Collision Protection', () => {
            it('creates revision successfully with unique ID', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const validator = new EventValidator(
                    ctx.trustedIssuersRegistryFacet.interface
                )
                const uniqueRevisionId = randomBytes32()

                const tx =
                    await ctx.trustedIssuersRegistry.setAttributeMetadata(
                        ctx.adminDid,
                        IssuerType.ROOT_TAO,
                        uniqueRevisionId,
                        ZeroHash,
                        ZeroHash
                    )

                await validator.expectAttributeMetadataSet(tx, {
                    did: ctx.adminDid,
                    issuerType: IssuerType.ROOT_TAO.toString(),
                    revisionId: uniqueRevisionId,
                    taoDid: ctx.adminDid,
                    attributeIdTao: ZeroHash,
                    attributeId: uniqueRevisionId,
                    newRevisionId: uniqueRevisionId,
                    rootTaoDid: ctx.adminDid,
                })

                const attribute =
                    await ctx.trustedIssuersRegistry.getRevisionAttribute(
                        ctx.adminDid,
                        uniqueRevisionId,
                        uniqueRevisionId
                    )
                expect(attribute.did).to.equal(ctx.adminDid)
            })

            it('reverts when different issuer tries to use same revision ID', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const sharedRevisionId = randomBytes32()

                // Admin creates attribute
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.ROOT_TAO,
                    sharedRevisionId,
                    ZeroHash,
                    ZeroHash
                )

                // Verify it's owned by admin
                const adminAttr =
                    await ctx.trustedIssuersRegistry.getRevisionAttribute(
                        ctx.adminDid,
                        sharedRevisionId,
                        sharedRevisionId
                    )
                expect(adminAttr.did).to.equal(ctx.adminDid)

                // Bob tries to use same revision ID
                const builder = new TrustedIssuerTestBuilder(ctx)
                const bobRootTao = await builder.createRootTao(ctx.bobDid)

                await expect(
                    ctx.trustedIssuersRegistry
                        .connect(ctx.bob)
                        .setAttributeMetadata(
                            ctx.bobDid,
                            IssuerType.TI,
                            sharedRevisionId, // COLLISION
                            ctx.bobDid,
                            bobRootTao
                        )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'AttributeOwnedByAnotherIssuer'
                )
            })

            it('allows same issuer to create multiple revisions', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const rootTao = await builder.createRootTao(ctx.adminDid)
                const tiAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    rootTao
                )

                // Add first data revision
                const data1 = '0xaabbccdd'
                const revision1 = await builder.addAttributeData(
                    ctx.adminDid,
                    tiAttr,
                    data1
                )

                // Add second data revision
                const data2 = '0x11223344'
                const revision2 = await builder.addAttributeData(
                    ctx.adminDid,
                    tiAttr,
                    data2
                )

                expect(revision1).to.not.equal(revision2)

                // Verify both exist
                const [, total] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                        ctx.adminDid,
                        tiAttr,
                        1,
                        10
                    )
                expect(total).to.equal(3) // Initial + 2 data revisions
            })
        })

        describe('Success Cases', () => {
            it('creates ROOT_TAO attribute with correct events', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const validator = new EventValidator(
                    ctx.trustedIssuersRegistryFacet.interface
                )
                const revisionId = randomBytes32()

                const tx =
                    await ctx.trustedIssuersRegistry.setAttributeMetadata(
                        ctx.adminDid,
                        IssuerType.ROOT_TAO,
                        revisionId,
                        ZeroHash,
                        ZeroHash
                    )

                await validator.expectAttributeMetadataSet(tx, {
                    did: ctx.adminDid,
                    issuerType: IssuerType.ROOT_TAO.toString(),
                    revisionId,
                    taoDid: ctx.adminDid,
                    attributeIdTao: ZeroHash,
                    attributeId: revisionId,
                    newRevisionId: revisionId,
                    rootTaoDid: ctx.adminDid,
                })
            })

            it('creates TI attribute under TAO trust chain', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const validator = new EventValidator(
                    ctx.trustedIssuersRegistryFacet.interface
                )

                const rootTao = randomBytes32()
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.ROOT_TAO,
                    rootTao,
                    ZeroHash,
                    ZeroHash
                )

                const tiRevision = randomBytes32()
                const tx =
                    await ctx.trustedIssuersRegistry.setAttributeMetadata(
                        ctx.adminDid,
                        IssuerType.TI,
                        tiRevision,
                        ZeroHash,
                        rootTao
                    )

                await validator.expectAttributeMetadataSet(tx, {
                    did: ctx.adminDid,
                    issuerType: IssuerType.TI.toString(),
                    revisionId: tiRevision,
                    taoDid: ZeroHash,
                    attributeIdTao: rootTao,
                    attributeId: tiRevision,
                    newRevisionId: tiRevision,
                    rootTaoDid: ZeroHash,
                })
            })

            it('creates new revision for existing attribute', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const rootTao = await builder.createRootTao(ctx.adminDid)
                const initialTi = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    rootTao
                )

                // Create new revision by passing SAME revisionId
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.TI,
                    initialTi, // Same revision ID triggers update
                    ZeroHash,
                    rootTao
                )

                // Verify latest revision updated (should be a new hash, not initialTi)
                const latestRevision =
                    await ctx.trustedIssuersRegistry.getLatestRevisionAttributeId(
                        ctx.adminDid,
                        initialTi
                    )
                expect(latestRevision).to.not.equal(initialTi)

                // Verify we have 2 revisions now
                const [, total] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                        ctx.adminDid,
                        initialTi,
                        1,
                        10
                    )
                expect(total).to.equal(2)
            })
        })
    })

    describe('setAttributeData', () => {
        describe('Access Control', () => {
            it('reverts when contract is paused', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                await ctx.pause!.pause()

                await expect(
                    ctx.trustedIssuersRegistry!.setAttributeData(
                        ZeroHash,
                        ZeroHash,
                        '0x'
                    )
                ).to.be.revertedWithCustomError(ctx.pause!, 'IsPaused')
            })

            it('reverts when caller is not a controller', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                await expect(
                    ctx.trustedIssuersRegistry
                        .connect(ctx.alice)
                        .setAttributeData(
                            ctx.adminDid,
                            randomBytes32(),
                            '0xdead'
                        )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'ControllerNotAuthorized'
                )
            })
        })

        describe('Input Validation', () => {
            it('reverts when DID is zero', async () => {
                const ctx = await loadFixture(deployContractsFixture)

                await expect(
                    ctx.trustedIssuersRegistry!.setAttributeData(
                        ZeroHash,
                        randomBytes32(),
                        '0xdead'
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet!,
                    'EmptyBytes32'
                )
            })

            it('reverts when attributeId is zero', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                await expect(
                    ctx.trustedIssuersRegistry.setAttributeData(
                        ctx.adminDid,
                        ZeroHash,
                        '0xdead'
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'EmptyBytes32'
                )
            })

            it('reverts when Attribute does not exist', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                await expect(
                    ctx.trustedIssuersRegistry.setAttributeData(
                        ctx.adminDid,
                        randomBytes32(),
                        '0xdead'
                    )
                ).to.be.reverted
            })

            it('reverts when attribute ID does not belong to the specified DID (line 620)', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                // Create attributes for both admin and bob
                const adminAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )
                const bobAttr = await builder.createTi(
                    ctx.bobDid,
                    ZeroHash,
                    ZeroHash
                )

                // First, ensure Admin's DID has some attributes by creating a revision
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.TI,
                    randomBytes32(),
                    ctx.adminDid,
                    adminAttr
                )

                // Now try to set data for Bob's attribute using Admin's DID (mismatch)
                await expect(
                    ctx.trustedIssuersRegistry.setAttributeData(
                        ctx.adminDid, // Using admin's DID
                        bobAttr, // But trying to access Bob's attribute
                        '0x'
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'AttributeHasNotBeenFound'
                )
            })

            it('reverts when attributeData is empty', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)

                const builder = new TrustedIssuerTestBuilder(ctx)
                const rootTao = await builder.createRootTao(ctx.adminDid)
                const tiAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    rootTao
                )

                await expect(
                    ctx.trustedIssuersRegistry.setAttributeData(
                        ctx.adminDid,
                        tiAttr,
                        '0x'
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'EmptyBytes'
                )
            })
        })

        describe('Edge Cases - Hash Collision', () => {
            it('reverts when same issuer tries to add duplicate data (same hash)', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                new TrustedIssuerTestBuilder(ctx)

                // STEP 1: Create ROOT_TAO
                const rootTaoRevisionId = randomBytes32()
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.ROOT_TAO,
                    rootTaoRevisionId,
                    ZeroHash,
                    ZeroHash
                )

                // STEP 2: Create TI attribute
                const tiAttributeId = randomBytes32()
                await ctx.trustedIssuersRegistry.setAttributeMetadata(
                    ctx.adminDid,
                    IssuerType.TI,
                    tiAttributeId,
                    ZeroHash,
                    rootTaoRevisionId
                )

                // STEP 3: Add data revision
                const attributeData = '0xdeadbeef'
                await ctx.trustedIssuersRegistry.setAttributeData(
                    ctx.adminDid,
                    tiAttributeId,
                    attributeData
                )

                // STEP 4: Try to add the EXACT SAME data again
                // This should fail because sha256(attributeData) already exists as a revisionId
                await expect(
                    ctx.trustedIssuersRegistry.setAttributeData(
                        ctx.adminDid,
                        tiAttributeId,
                        attributeData // Same data = same hash = collision
                    )
                ).to.be.revertedWithCustomError(
                    ctx.trustedIssuersRegistryFacet,
                    'AttributeOwnedByAnotherIssuer'
                )
            })
        })

        describe('Success Cases', () => {
            it('adds data to existing attribute and emits events', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const validator = new EventValidator(
                    ctx.trustedIssuersRegistryFacet.interface
                )
                const builder = new TrustedIssuerTestBuilder(ctx)

                const rootTao = await builder.createRootTao(ctx.adminDid)
                const tiAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    rootTao
                )

                const data = '0xdead'
                const tx = await ctx.trustedIssuersRegistry.setAttributeData(
                    ctx.adminDid,
                    tiAttr,
                    data
                )

                await validator.expectAttributeDataSet(tx, {
                    did: ctx.adminDid,
                    attributeId: tiAttr,
                    revisionId: sha256(data),
                    issuerType: IssuerType.TI.toString(),
                    attributeData: data,
                })

                // Verify data was stored
                const attr =
                    await ctx.trustedIssuersRegistry.getRevisionAttribute(
                        ctx.adminDid,
                        tiAttr,
                        sha256(data)
                    )
                expect(attr.attribData).to.equal(data)
            })
        })
    })

    describe('Query Functions', () => {
        describe('getIssuer', () => {
            it('returns false and 0 for non-existent DID', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                const [noAttrs, count] =
                    await ctx.trustedIssuersRegistry!.getIssuer(randomBytes32())

                expect(noAttrs).to.be.false
                expect(count).to.equal(0)
            })

            it('returns true and count for issuer with no accepted attributes', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                await builder.createTi(ctx.adminDid, ZeroHash, ZeroHash)

                const [noAttrsAccepted, count] =
                    await ctx.trustedIssuersRegistry.getIssuer(ctx.adminDid)

                expect(noAttrsAccepted).to.be.true
                expect(count).to.equal(1)
            })

            it('returns false and count for issuer with accepted attributes', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const tiAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )
                await builder.addAttributeData(ctx.adminDid, tiAttr, '0xdead')

                const [noAttrsAccepted, count] =
                    await ctx.trustedIssuersRegistry.getIssuer(ctx.adminDid)

                expect(noAttrsAccepted).to.be.false
                expect(count).to.equal(1)
            })
        })

        describe('getIssuers', () => {
            it('returns empty array when no issuers registered', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                const [issuers, total] =
                    await ctx.trustedIssuersRegistry!.getIssuers(1, 10)

                expect(issuers.length).to.equal(0)
                expect(total).to.equal(0)
            })

            it('returns paginated issuers', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                await builder.createRootTao(ctx.adminDid)

                const [issuers, total] =
                    await ctx.trustedIssuersRegistry.getIssuers(1, 10)

                expect(total).to.equal(1)
                expect(issuers.length).to.equal(1)
                expect(issuers[0]).to.equal(ctx.adminDid)
            })
        })

        describe('getIssuerAttributes', () => {
            it('returns empty array for DID with no attributes', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                const [attrs, total] =
                    await ctx.trustedIssuersRegistry!.getIssuerAttributes(
                        randomBytes32(),
                        1,
                        10
                    )

                expect(total).to.equal(0)
                expect(attrs.length).to.equal(0)
            })

            it('returns paginated attributes', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                await builder.createTi(ctx.adminDid, ZeroHash, ZeroHash)
                await builder.createTi(ctx.adminDid, ZeroHash, ZeroHash)

                const [attrs, total] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributes(
                        ctx.adminDid,
                        1,
                        10
                    )

                expect(total).to.equal(2)
                expect(attrs.length).to.equal(2)
            })
        })

        describe('getIssuerAttributeRevisions', () => {
            it('returns empty for non-existent attribute', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const [revisions, total] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                        ctx.adminDid,
                        randomBytes32(),
                        1,
                        10
                    )

                expect(total).to.equal(0)
                expect(revisions.length).to.equal(0)
            })

            it('returns all revisions for attribute', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const attr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )
                await builder.addAttributeData(ctx.adminDid, attr, '0xdead')
                await builder.addAttributeData(ctx.adminDid, attr, '0xbeef')

                const [, total] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                        ctx.adminDid,
                        attr,
                        1,
                        10
                    )

                expect(total).to.equal(3) // Initial + 2 data revisions
            })

            it('returns empty when DID and attributeId mismatch', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                // IMPORTANT: Bob must have attributes first (so length != 0)
                // This ensures we test the SECOND part of the OR condition (line 350)
                await builder.createTi(ctx.bobDid, ZeroHash, ZeroHash)

                // Verify Bob has attributes
                const [bobAttrs] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributes(
                        ctx.bobDid,
                        1,
                        10
                    )
                expect(bobAttrs.length).to.be.greaterThan(0) // Bob HAS attributes

                // Create attribute for admin AFTER Bob has attributes
                const adminAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )

                // Query Bob's DID with admin's attribute
                // $.issuerStore[bobDid].attributes.length != 0 (FALSE - has attributes)
                // bobDid != attributeMetadata.did (TRUE - attribute belongs to admin)
                // This should trigger line 350: _did != attributeMetadata.did
                const [revisions, total] =
                    await ctx.trustedIssuersRegistry.getIssuerAttributeRevisions(
                        ctx.bobDid, // Bob's DID (has attributes)
                        adminAttr, // Admin's attribute (belongs to admin.did != bob.did)
                        1,
                        10
                    )

                expect(total).to.equal(0)
                expect(revisions.length).to.equal(0)
            })
        })

        describe('getLatestRevisionAttributeId', () => {
            it('returns zero hash for non-existent DID', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                const latest =
                    await ctx.trustedIssuersRegistry!.getLatestRevisionAttributeId(
                        randomBytes32(),
                        ZeroHash
                    )

                expect(latest).to.equal(ZeroHash)
            })

            it('returns latest revision ID', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const attr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )
                const dataRevision = await builder.addAttributeData(
                    ctx.adminDid,
                    attr,
                    '0xdead'
                )

                const latest =
                    await ctx.trustedIssuersRegistry.getLatestRevisionAttributeId(
                        ctx.adminDid,
                        attr
                    )

                expect(latest).to.equal(dataRevision)
            })
        })

        describe('getRevisionAttribute', () => {
            it('returns empty struct for non-existent DID', async () => {
                const ctx = await loadFixture(deployContractsFixture)
                const attr =
                    await ctx.trustedIssuersRegistry!.getRevisionAttribute(
                        randomBytes32(),
                        ZeroHash,
                        ZeroHash
                    )

                expect(attr.did).to.equal(ZeroHash)
            })

            it('returns full attribute details', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const rootTao = await builder.createRootTao(ctx.adminDid)

                const attr =
                    await ctx.trustedIssuersRegistry.getRevisionAttribute(
                        ctx.adminDid,
                        rootTao,
                        rootTao
                    )

                expect(attr.did).to.equal(ctx.adminDid)
                expect(attr.attributeId).to.equal(rootTao)
                expect(attr.issuerType).to.equal(IssuerType.ROOT_TAO)
            })

            it('returns empty struct when attributeId does not belong to DID', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                // Create attribute for admin
                const adminAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )

                // Create attribute for Bob
                await builder.createTi(ctx.bobDid, ZeroHash, ZeroHash)

                // Try to get admin's attribute using Bob's DID (mismatch)
                const attr =
                    await ctx.trustedIssuersRegistry.getRevisionAttribute(
                        ctx.bobDid, // Bob's DID
                        adminAttr, // Admin's attribute (mismatch!)
                        adminAttr
                    )

                expect(attr.did).to.equal(ZeroHash) // Empty struct
            })

            it('returns empty when revisionId does not belong to the DID', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                // Create attributes for both admin and bob
                const adminAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )
                const bobAttr = await builder.createTi(
                    ctx.bobDid,
                    ZeroHash,
                    ZeroHash
                )

                // Add data to admin's attribute
                const data = '0xdeadbeef'
                const adminDataRevision = await builder.addAttributeData(
                    ctx.adminDid,
                    adminAttr,
                    data
                )

                // Query with Bob's DID, Bob's attributeId (passes line 412),
                // but admin's revisionId (fails line 420: attributeMetadata.did != _did)
                const attr =
                    await ctx.trustedIssuersRegistry.getRevisionAttribute(
                        ctx.bobDid, // Bob's DID
                        bobAttr, // Bob's attribute ID (passes line 412)
                        adminDataRevision // Admin's revision (belongs to admin.did, not bob.did!)
                    )

                expect(attr.did).to.equal(ZeroHash) // Empty struct
            })
        })

        describe('getLatestRevisionAttribute', () => {
            it('returns empty struct for non-existent attribute', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const attr =
                    await ctx.trustedIssuersRegistry.getLatestRevisionAttribute(
                        ctx.adminDid,
                        ZeroHash
                    )

                expect(attr.did).to.equal(ZeroHash)
            })

            it('returns latest revision details', async () => {
                const ctx = await loadFixture(deployWithDidsFixture)
                const builder = new TrustedIssuerTestBuilder(ctx)

                const tiAttr = await builder.createTi(
                    ctx.adminDid,
                    ZeroHash,
                    ZeroHash
                )
                const data = '0xdead'
                await builder.addAttributeData(ctx.adminDid, tiAttr, data)

                const attr =
                    await ctx.trustedIssuersRegistry.getLatestRevisionAttribute(
                        ctx.adminDid,
                        tiAttr
                    )

                expect(attr.did).to.equal(ctx.adminDid)
                expect(attr.attribData).to.equal(data)
            })
        })
    })
})
