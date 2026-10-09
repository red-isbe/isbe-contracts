// SPDX-License-Identifier: Apache-2.0

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
import { HDNodeWallet, ZeroHash } from 'ethers'
import { deployGovernance } from './fixtures/governance'
import { EllipticType } from './types/identity'
import { generateProof, proofToDid } from './support'
import {
    ASSERTION_RELATIONSHIP,
    CONFIGURATION_ID_ERC20,
    HASH_TIMESTAMP_ROLE,
} from '../utils/constants'
import { getEvent } from '../scripts/utils/getEvent'
import {
    AccessControlDidFacet,
    HashTimestampV2Facet,
    IDidRegistry,
    IDidRegistry__factory,
} from '../typechain-types'

const RESOLVER_KEY = ethers.id('isbe.contracts.hash.timestamp.v2.resolver.key')
const CONFIGURATION_ID = ethers.id(
    'isbe.contracts.configuration.hash.timestamp.v2.test'
)
const NOT_BEFORE = 5n
const NOT_AFTER = NOT_BEFORE + 1_000_000_000_000n

function wallet(index: number): HDNodeWallet {
    const { mnemonic } = config.networks.hardhat.accounts as {
        mnemonic: string
    }
    return HDNodeWallet.fromPhrase(
        mnemonic,
        undefined,
        `m/44'/60'/0'/0/${index}`
    ).connect(ethers.provider)
}

interface Entity {
    did: string
    founder: HDNodeWallet
    docker: HDNodeWallet
    dockerVMethodId: string
}

describe('HashTimestampV2 (evidence attributed to entity DIDs)', () => {
    async function deployFixture() {
        const [admin] = await ethers.getSigners()
        const gov = await deployGovernance(admin!, [], CONFIGURATION_ID_ERC20)
        const factoryAddress = await gov.accessControlGovernance!.getAddress()
        const isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            factoryAddress
        )
        const registry = IDidRegistry__factory.connect(factoryAddress, admin!)
        await registry.initializeDiDRegistry(EllipticType.SECP_256_K1)
        await gov.mockTimestamp
            .connect(admin!)
            .setMockedTimestamp(NOT_BEFORE + 1n)

        // Entity founders and dockers are hardhat accounts, so they can send transactions.
        async function createEntity(
            founderIndex: number,
            dockerIndex: number
        ): Promise<Entity> {
            const founder = wallet(founderIndex)
            const docker = wallet(dockerIndex)
            const proof = generateProof(founder)
            const did = proofToDid(proof)
            await registry.insertFirstDidDocument(
                did,
                `doc:${did}`,
                ethers.id(`${did}#founder`),
                proof,
                founder.signingKey.publicKey,
                EllipticType.SECP_256_K1,
                NOT_BEFORE,
                NOT_AFTER,
                ''
            )
            // Self-service by the entity: its own controller key declares the docker key.
            const dockerVMethodId = ethers.id(`${did}#docker`)
            const asFounder = registry.connect(founder)
            await asFounder.addVerificationMethod(
                did,
                dockerVMethodId,
                docker.signingKey.publicKey,
                EllipticType.SECP_256_K1
            )
            await asFounder.addVerificationRelationship(
                did,
                ASSERTION_RELATIONSHIP,
                dockerVMethodId,
                NOT_BEFORE,
                NOT_AFTER
            )
            return { did, founder, docker, dockerVMethodId }
        }
        const entityA = await createEntity(2, 3)
        const entityB = await createEntity(4, 5)

        const FacetFactory = await ethers.getContractFactory(
            'HashTimestampV2Facet'
        )
        await (
            await isbeFactory.deploy(RESOLVER_KEY, FacetFactory.bytecode)
        ).wait()
        await isbeFactory.setConfiguration(CONFIGURATION_ID, [
            { businessId: RESOLVER_KEY, version: 1 },
        ])
        const tx = await isbeFactory.deployUseCase(
            CONFIGURATION_ID,
            1,
            [],
            false,
            [],
            []
        )
        const { proxy } = (await getEvent('UseCaseDeployed', tx, isbeFactory))
            .args

        const accessControlDid = (
            await ethers.getContractFactory('AccessControlDidFacet')
        )
            .attach(proxy)
            .connect(admin!) as AccessControlDidFacet
        // Onboarding (spec H1/H2) is per entity DID, never per key.
        await accessControlDid.grantDidRole(HASH_TIMESTAMP_ROLE, entityA.did)
        await accessControlDid.grantDidRole(HASH_TIMESTAMP_ROLE, entityB.did)

        return {
            evidence: FacetFactory.attach(proxy) as HashTimestampV2Facet,
            facet: (await ethers.getContractAt(
                'HashTimestampV2Facet',
                proxy
            )) as HashTimestampV2Facet,
            // ISBE keeps the pauser role irrevocably: it pauses through the factory (spec H24).
            pauseByIsbe: () => isbeFactory.pauseIsbe(proxy),
            accessControlDid,
            registry,
            entityA,
            entityB,
        }
    }

    let evidence: HashTimestampV2Facet
    let pauseByIsbe: () => Promise<unknown>
    let accessControlDid: AccessControlDidFacet
    let registry: IDidRegistry
    let entityA: Entity
    let entityB: Entity
    const HASH = ethers.id('document')
    const STAMPED = ethers.id('stamped document')

    beforeEach(async () => {
        ;({
            evidence,
            pauseByIsbe,
            accessControlDid,
            registry,
            entityA,
            entityB,
        } = await loadFixture(deployFixture))
    })

    describe('registration', () => {
        it('GIVEN an onboarded entity and its assertionMethod key WHEN registering THEN stores the record and emits the event', async () => {
            const tx = await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)
            const receipt = (await tx.wait())!
            const block = (await ethers.provider.getBlock(receipt.blockNumber))!

            await expect(tx)
                .to.emit(evidence, 'EvidenceRegistered')
                .withArgs(
                    HASH,
                    entityA.did,
                    entityA.docker.address,
                    ZeroHash,
                    receipt.blockNumber,
                    block.timestamp
                )
            expect(await evidence.exists(HASH, entityA.did)).to.equal(true)
            const record = await evidence.getTimestamp(HASH, entityA.did)
            expect(record.signer).to.equal(entityA.docker.address)
            expect(record.blockNumber).to.equal(receipt.blockNumber)
            expect(record.timestamp).to.equal(block.timestamp)
            expect(record.parentHash).to.equal(ZeroHash)
        })

        it('GIVEN a registered pair WHEN registering it again THEN does not revert, returns the existing record and emits nothing', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)
            const original = await evidence.getTimestamp(HASH, entityA.did)

            const [record, alreadyRegistered] = await evidence
                .connect(entityA.docker)
                .timestampHash.staticCall(HASH, ZeroHash, entityA.did)
            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(HASH, ZeroHash, entityA.did)
            ).not.to.emit(evidence, 'EvidenceRegistered')

            expect(alreadyRegistered).to.equal(true)
            expect(record.blockNumber).to.equal(original.blockNumber)
            expect(
                await evidence.getTimestamp(HASH, entityA.did)
            ).to.deep.equal(original)
        })

        it('GIVEN two entities WHEN both register the same hash THEN each keeps its own record (uniqueness per hash and DID)', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)
            await evidence
                .connect(entityB.docker)
                .timestampHash(HASH, ZeroHash, entityB.did)

            expect(await evidence.getRecordsCount(HASH)).to.equal(2n)
            const [dids, records] = await evidence.getRecords(HASH, 0, 10)
            expect(dids).to.deep.equal([entityA.did, entityB.did])
            expect(records.map((record) => record.signer)).to.deep.equal([
                entityA.docker.address,
                entityB.docker.address,
            ])
        })

        it('GIVEN several records WHEN paginating getRecords THEN returns each page and an empty page past the end', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)
            await evidence
                .connect(entityB.docker)
                .timestampHash(HASH, ZeroHash, entityB.did)

            expect((await evidence.getRecords(HASH, 0, 1))[0]).to.deep.equal([
                entityA.did,
            ])
            expect((await evidence.getRecords(HASH, 1, 1))[0]).to.deep.equal([
                entityB.did,
            ])
            expect((await evidence.getRecords(HASH, 2, 1))[0]).to.deep.equal([])
        })

        it('GIVEN a registered original WHEN registering the stamped document with it as parent THEN chains both records', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)

            await evidence
                .connect(entityA.docker)
                .timestampHash(STAMPED, HASH, entityA.did)

            expect(
                (await evidence.getTimestamp(STAMPED, entityA.did)).parentHash
            ).to.equal(HASH)
        })
    })

    describe('authorization', () => {
        it('GIVEN the founder key (capabilityInvocation, not assertionMethod) WHEN registering THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.founder)
                    .timestampHash(HASH, ZeroHash, entityA.did)
            )
                .to.be.revertedWithCustomError(
                    evidence,
                    'SignerNotAssertionMethod'
                )
                .withArgs(entityA.did, entityA.founder.address)
        })

        it('GIVEN the docker key of entity A WHEN claiming to act for entity B THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(HASH, ZeroHash, entityB.did)
            )
                .to.be.revertedWithCustomError(
                    evidence,
                    'SignerNotAssertionMethod'
                )
                .withArgs(entityB.did, entityA.docker.address)
        })

        it('GIVEN an address without any DID WHEN registering THEN reverts', async () => {
            const outsider = wallet(6)

            await expect(
                evidence
                    .connect(outsider)
                    .timestampHash(HASH, ZeroHash, entityA.did)
            )
                .to.be.revertedWithCustomError(
                    evidence,
                    'SignerNotAssertionMethod'
                )
                .withArgs(entityA.did, outsider.address)
        })

        it('GIVEN an entity whose onboarding was revoked WHEN registering THEN reverts but its previous records remain', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)

            await accessControlDid.revokeDidRole(
                HASH_TIMESTAMP_ROLE,
                entityA.did
            )

            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(STAMPED, ZeroHash, entityA.did)
            )
                .to.be.revertedWithCustomError(evidence, 'EntityNotRegistered')
                .withArgs(entityA.did)
            expect(await evidence.exists(HASH, entityA.did)).to.equal(true)
        })

        it('GIVEN a revoked docker key WHEN registering THEN reverts but records signed before remain valid', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)

            await registry
                .connect(entityA.founder)
                .revokeVerificationMethod(
                    entityA.did,
                    entityA.dockerVMethodId,
                    NOT_BEFORE
                )

            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(STAMPED, ZeroHash, entityA.did)
            ).to.be.revertedWithCustomError(
                evidence,
                'SignerNotAssertionMethod'
            )
            expect(
                (await evidence.getTimestamp(HASH, entityA.did)).signer
            ).to.equal(entityA.docker.address)
        })

        it('GIVEN the key-binding flaw of the DID registry WHEN entity B binds A docker public key THEN evidence of A stays attributed to A', async () => {
            // B declares A's docker PUBLIC key as its own assertionMethod (possible today, see the security ticket).
            const stolen = ethers.id(`${entityB.did}#stolen`)
            const asFounderB = registry.connect(entityB.founder)
            await asFounderB.addVerificationMethod(
                entityB.did,
                stolen,
                entityA.docker.signingKey.publicKey,
                EllipticType.SECP_256_K1
            )
            await asFounderB.addVerificationRelationship(
                entityB.did,
                ASSERTION_RELATIONSHIP,
                stolen,
                NOT_BEFORE,
                NOT_AFTER
            )

            // A's docker always declares A's DID: the record is A's, whatever the address index says.
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)

            expect(await evidence.exists(HASH, entityA.did)).to.equal(true)
            expect(await evidence.exists(HASH, entityB.did)).to.equal(false)
        })
    })

    describe('validation', () => {
        it('GIVEN a zero hash or a zero DID WHEN registering THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(ZeroHash, ZeroHash, entityA.did)
            ).to.be.revertedWithCustomError(evidence, 'EmptyBytes32')
            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(HASH, ZeroHash, ZeroHash)
            ).to.be.revertedWithCustomError(evidence, 'EmptyBytes32')
        })

        it('GIVEN a parent never registered WHEN registering a child THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(STAMPED, HASH, entityA.did)
            )
                .to.be.revertedWithCustomError(evidence, 'ParentNotRegistered')
                .withArgs(HASH, entityA.did)
        })

        it('GIVEN a parent registered by another entity WHEN registering a child THEN reverts', async () => {
            await evidence
                .connect(entityB.docker)
                .timestampHash(HASH, ZeroHash, entityB.did)

            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(STAMPED, HASH, entityA.did)
            )
                .to.be.revertedWithCustomError(evidence, 'ParentNotRegistered')
                .withArgs(HASH, entityA.did)
        })

        it('GIVEN a use case paused by ISBE WHEN registering THEN reverts and reads still work', async () => {
            await evidence
                .connect(entityA.docker)
                .timestampHash(HASH, ZeroHash, entityA.did)

            await pauseByIsbe()

            await expect(
                evidence
                    .connect(entityA.docker)
                    .timestampHash(STAMPED, ZeroHash, entityA.did)
            ).to.be.revertedWithCustomError(evidence, 'IsPaused')
            expect(await evidence.exists(HASH, entityA.did)).to.equal(true)
        })
    })

    describe('introspection', () => {
        it('GIVEN the facet WHEN introspecting THEN exposes its business id and its five selectors', async () => {
            const facet = await (
                await ethers.getContractFactory('HashTimestampV2Facet')
            ).deploy()

            expect(await facet.businessIdIntrospection()).to.equal(RESOLVER_KEY)
            const selectors = [...(await facet.selectorsIntrospection())].sort()
            const expected = [
                'timestampHash',
                'exists',
                'getTimestamp',
                'getRecordsCount',
                'getRecords',
            ]
                .map((name) => facet.interface.getFunction(name)!.selector)
                .sort()
            expect(selectors).to.deep.equal(expected)
            expect(await facet.interfacesIntrospection()).to.have.length(1)
        })
    })

    describe('gas', () => {
        it('GIVEN an onboarded entity WHEN registering an original and a chained stamped hash THEN reports gas used', async () => {
            const original = await (
                await evidence
                    .connect(entityA.docker)
                    .timestampHash(HASH, ZeroHash, entityA.did)
            ).wait()
            const stamped = await (
                await evidence
                    .connect(entityA.docker)
                    .timestampHash(STAMPED, HASH, entityA.did)
            ).wait()
            const duplicate = await (
                await evidence
                    .connect(entityA.docker)
                    .timestampHash(HASH, ZeroHash, entityA.did)
            ).wait()

            console.table({
                original: { gasUsed: original!.gasUsed },
                'stamped (with parentHash)': { gasUsed: stamped!.gasUsed },
                'duplicate (returns existing)': { gasUsed: duplicate!.gasUsed },
            })
            expect(duplicate!.gasUsed).to.be.lessThan(original!.gasUsed)
        })
    })
})
