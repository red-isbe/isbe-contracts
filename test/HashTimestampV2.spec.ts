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
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { HDNodeWallet, ZeroAddress, ZeroHash } from 'ethers'
import { deployGovernance } from './fixtures/governance'
import { EllipticType } from './types/identity'
import { generateProof, proofToDid } from './support'
import { CONFIGURATION_ID_ERC20, HASH_TIMESTAMP_ROLE } from '../utils/constants'
import { getEvent } from '../scripts/utils/getEvent'
import {
    AccessControlDidFacet,
    HashTimestampV2Facet,
    IDidRegistry__factory,
    IServiceDidRegistry,
    IServiceDidRegistry__factory,
} from '../typechain-types'

const RESOLVER_KEY = ethers.id('isbe.contracts.hash.timestamp.v2.resolver.key')
const CONFIGURATION_ID = ethers.id(
    'isbe.contracts.configuration.hash.timestamp.v2.test'
)
/** Enum value of IDiamond.ItemCutAction.Add */
const ITEM_CUT_ACTION_ADD = 0
const NOT_BEFORE = 5n
const NOT_AFTER = NOT_BEFORE + 1_000_000_000_000n
const GATEWAY_LABEL = ethers.id('evidence-gateway')

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
    gateway: HDNodeWallet
    serviceDid: string
}

describe('HashTimestampV2 (evidence attributed to entity DIDs through service DIDs)', () => {
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

        // The Service DID Registry is cut into 0x15BE as a live upgrade would do.
        const serviceFacet = await (
            await ethers.getContractFactory('ServiceDidRegistryFacet')
        ).deploy()
        await gov.diamondCutAccessControl.connect(admin!).diamondCut(
            [
                {
                    facetAddress: await serviceFacet.getAddress(),
                    action: ITEM_CUT_ACTION_ADD,
                    items: [...(await serviceFacet.selectorsIntrospection())],
                },
            ],
            ZeroAddress,
            '0x'
        )
        const serviceRegistry = IServiceDidRegistry__factory.connect(
            factoryAddress,
            admin!
        )
        await serviceRegistry.initializeServiceDidRegistry()

        /** Registered by the entity itself, with its capabilityInvocation (founder) key. */
        async function registerService(
            founder: HDNodeWallet,
            controllerDid: string,
            gateway: HDNodeWallet,
            expiresAt = 0n,
            document?: string
        ): Promise<string> {
            const asFounder = serviceRegistry.connect(founder)
            const tx =
                document === undefined
                    ? await asFounder.registerServiceDid(
                          controllerDid,
                          gateway.signingKey.publicKey,
                          EllipticType.SECP_256_K1,
                          GATEWAY_LABEL,
                          expiresAt
                      )
                    : await asFounder.registerServiceDidWithDocument(
                          controllerDid,
                          gateway.signingKey.publicKey,
                          EllipticType.SECP_256_K1,
                          GATEWAY_LABEL,
                          expiresAt,
                          document
                      )
            return (await getEvent('ServiceDidRegistered', tx, serviceRegistry))
                .args.serviceDid as string
        }

        // Founders and gateways are hardhat accounts, so they can send transactions.
        async function createEntity(
            founderIndex: number,
            gatewayIndex: number
        ): Promise<Entity> {
            const founder = wallet(founderIndex)
            const gateway = wallet(gatewayIndex)
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
            // No verification method is added to the entity DID: the gateway is a service.
            const serviceDid = await registerService(founder, did, gateway)
            return { did, founder, gateway, serviceDid }
        }
        const entityA = await createEntity(2, 3)
        const entityB = await createEntity(4, 5)
        // Has a service DID but was never onboarded to the evidence registry.
        const entityC = await createEntity(8, 9)

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
        // Onboarding (spec H1/H2) is per entity DID, never per key nor per service.
        await accessControlDid.grantDidRole(HASH_TIMESTAMP_ROLE, entityA.did)
        await accessControlDid.grantDidRole(HASH_TIMESTAMP_ROLE, entityB.did)

        return {
            evidence: FacetFactory.attach(proxy) as HashTimestampV2Facet,
            // ISBE keeps the pauser role irrevocably: it pauses through the factory (spec H24).
            pauseByIsbe: () => isbeFactory.pauseIsbe(proxy),
            accessControlDid,
            gov,
            admin: admin!,
            governanceAddress: factoryAddress,
            serviceRegistry,
            registerService,
            entityA,
            entityB,
            entityC,
        }
    }

    let evidence: HashTimestampV2Facet
    let pauseByIsbe: () => Promise<unknown>
    let accessControlDid: AccessControlDidFacet
    let serviceRegistry: IServiceDidRegistry
    let registerService: Awaited<
        ReturnType<typeof deployFixture>
    >['registerService']
    let entityA: Entity
    let entityB: Entity
    let entityC: Entity
    const HASH = ethers.id('document')
    const STAMPED = ethers.id('stamped document')

    beforeEach(async () => {
        ;({
            evidence,
            pauseByIsbe,
            accessControlDid,
            serviceRegistry,
            registerService,
            entityA,
            entityB,
            entityC,
        } = await loadFixture(deployFixture))
    })

    describe('registration', () => {
        it('GIVEN an onboarded entity and the key of its active service DID WHEN registering THEN stores the record under the entity DID and emits the event', async () => {
            const tx = await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            const receipt = (await tx.wait())!
            const block = (await ethers.provider.getBlock(receipt.blockNumber))!

            await expect(tx)
                .to.emit(evidence, 'EvidenceRegistered')
                .withArgs(
                    HASH,
                    entityA.did,
                    entityA.gateway.address,
                    entityA.serviceDid,
                    ZeroHash,
                    receipt.blockNumber,
                    block.timestamp
                )
            expect(await evidence.existsV2(HASH, entityA.did)).to.equal(true)
            expect(await evidence.existsV2(HASH, entityA.serviceDid)).to.equal(
                false
            )
            const record = await evidence.getTimestampV2(HASH, entityA.did)
            expect(record.signer).to.equal(entityA.gateway.address)
            expect(record.blockNumber).to.equal(receipt.blockNumber)
            expect(record.timestamp).to.equal(block.timestamp)
            expect(record.parentHash).to.equal(ZeroHash)
        })

        it('GIVEN a registered pair WHEN registering it again THEN does not revert, returns the existing record and emits nothing', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            const original = await evidence.getTimestampV2(HASH, entityA.did)

            const [did, record, alreadyRegistered] = await evidence
                .connect(entityA.gateway)
                .timestampHashV2.staticCall(entityA.serviceDid, HASH, ZeroHash)
            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            ).not.to.emit(evidence, 'EvidenceRegistered')

            expect(did).to.equal(entityA.did)
            expect(alreadyRegistered).to.equal(true)
            expect(record.blockNumber).to.equal(original.blockNumber)
            expect(
                await evidence.getTimestampV2(HASH, entityA.did)
            ).to.deep.equal(original)
        })

        it('GIVEN two services of the same entity WHEN both register the same hash THEN it is one record of the entity (uniqueness per hash and DID)', async () => {
            const secondGateway = wallet(10)
            const secondService = await registerService(
                entityA.founder,
                entityA.did,
                secondGateway
            )
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)

            const [did, , alreadyRegistered] = await evidence
                .connect(secondGateway)
                .timestampHashV2.staticCall(secondService, HASH, ZeroHash)

            expect(did).to.equal(entityA.did)
            expect(alreadyRegistered).to.equal(true)
            expect(await evidence.getRecordsCountV2(HASH)).to.equal(1n)
        })

        it('GIVEN two entities WHEN both register the same hash THEN each keeps its own record (uniqueness per hash and DID)', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            await evidence
                .connect(entityB.gateway)
                .timestampHashV2(entityB.serviceDid, HASH, ZeroHash)

            expect(await evidence.getRecordsCountV2(HASH)).to.equal(2n)
            const [dids, records] = await evidence.getRecordsV2(HASH, 0, 10)
            expect(dids).to.deep.equal([entityA.did, entityB.did])
            expect(records.map((record) => record.signer)).to.deep.equal([
                entityA.gateway.address,
                entityB.gateway.address,
            ])
        })

        it('GIVEN several records WHEN paginating getRecords THEN returns each page and an empty page past the end', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            await evidence
                .connect(entityB.gateway)
                .timestampHashV2(entityB.serviceDid, HASH, ZeroHash)

            expect((await evidence.getRecordsV2(HASH, 0, 1))[0]).to.deep.equal([
                entityA.did,
            ])
            expect((await evidence.getRecordsV2(HASH, 1, 1))[0]).to.deep.equal([
                entityB.did,
            ])
            expect((await evidence.getRecordsV2(HASH, 2, 1))[0]).to.deep.equal(
                []
            )
        })

        it('GIVEN a registered original WHEN registering the stamped document with it as parent THEN chains both records', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)

            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, STAMPED, HASH)

            expect(
                (await evidence.getTimestampV2(STAMPED, entityA.did)).parentHash
            ).to.equal(HASH)
        })

        it('GIVEN a service DID with a document declaring a serviceEndpoint WHEN registering THEN it works the same as one without document', async () => {
            const gateway = wallet(11)
            const document = JSON.stringify({
                service: [
                    {
                        id: '#evidence',
                        type: 'EvidenceGateway',
                        serviceEndpoint: 'https://gateway.example/evidence',
                    },
                ],
            })
            const serviceDid = await registerService(
                entityA.founder,
                entityA.did,
                gateway,
                0n,
                document
            )
            expect(
                await serviceRegistry.getServiceDocument(serviceDid)
            ).to.equal(document)

            await evidence
                .connect(gateway)
                .timestampHashV2(serviceDid, HASH, ZeroHash)

            expect(
                (await evidence.getTimestampV2(HASH, entityA.did)).signer
            ).to.equal(gateway.address)
        })
    })

    describe('authorization', () => {
        it('GIVEN a service DID that does not exist WHEN registering THEN reverts', async () => {
            const unknown = ethers.id('unknown service')

            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(unknown, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'ServiceDidNotActive')
                .withArgs(unknown)
        })

        it('GIVEN an expired service DID WHEN registering THEN reverts but records signed before remain', async () => {
            const gateway = wallet(12)
            const expiresAt = BigInt(await time.latest()) + 3600n
            const serviceDid = await registerService(
                entityA.founder,
                entityA.did,
                gateway,
                expiresAt
            )
            await evidence
                .connect(gateway)
                .timestampHashV2(serviceDid, HASH, ZeroHash)

            await time.increaseTo(expiresAt)

            await expect(
                evidence
                    .connect(gateway)
                    .timestampHashV2(serviceDid, STAMPED, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'ServiceDidNotActive')
                .withArgs(serviceDid)
            expect(await evidence.existsV2(HASH, entityA.did)).to.equal(true)
        })

        it('GIVEN a deactivated service DID WHEN registering THEN reverts but records signed before remain', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)

            await serviceRegistry
                .connect(entityA.founder)
                .deactivateServiceDid(entityA.serviceDid)

            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'ServiceDidNotActive')
                .withArgs(entityA.serviceDid)
            expect(
                (await evidence.getTimestampV2(HASH, entityA.did)).signer
            ).to.equal(entityA.gateway.address)
        })

        it('GIVEN the founder key (not the service key) WHEN registering THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.founder)
                    .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'SignerNotServiceKey')
                .withArgs(entityA.serviceDid, entityA.founder.address)
        })

        it('GIVEN the gateway of entity A WHEN registering with the service DID of entity B THEN reverts, so it can never act for another entity', async () => {
            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityB.serviceDid, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'SignerNotServiceKey')
                .withArgs(entityB.serviceDid, entityA.gateway.address)
            expect(await evidence.existsV2(HASH, entityB.did)).to.equal(false)
        })

        it('GIVEN an address without any identity WHEN registering THEN reverts', async () => {
            const outsider = wallet(6)

            await expect(
                evidence
                    .connect(outsider)
                    .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'SignerNotServiceKey')
                .withArgs(entityA.serviceDid, outsider.address)
        })

        it('GIVEN a rotated service key WHEN registering THEN the old key reverts, the new one registers for the same entity and earlier records keep their signer', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            const rotated = wallet(13)

            await serviceRegistry
                .connect(entityA.founder)
                .rotateSigningKey(
                    entityA.serviceDid,
                    rotated.signingKey.publicKey,
                    EllipticType.SECP_256_K1
                )

            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'SignerNotServiceKey')
                .withArgs(entityA.serviceDid, entityA.gateway.address)
            await evidence
                .connect(rotated)
                .timestampHashV2(entityA.serviceDid, STAMPED, HASH)
            expect(
                (await evidence.getTimestampV2(STAMPED, entityA.did)).signer
            ).to.equal(rotated.address)
            expect(
                (await evidence.getTimestampV2(HASH, entityA.did)).signer
            ).to.equal(entityA.gateway.address)
        })

        it('GIVEN an entity never onboarded WHEN its active service registers THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityC.gateway)
                    .timestampHashV2(entityC.serviceDid, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'EntityNotRegistered')
                .withArgs(entityC.did)
        })

        it('GIVEN an entity whose onboarding was revoked WHEN registering THEN reverts but its previous records remain', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)

            await accessControlDid.revokeDidRole(
                HASH_TIMESTAMP_ROLE,
                entityA.did
            )

            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'EntityNotRegistered')
                .withArgs(entityA.did)
            expect(await evidence.existsV2(HASH, entityA.did)).to.equal(true)
        })

        it('GIVEN the service DID itself WHEN granted HASH_TIMESTAMP_ROLE THEN it still cannot register for an entity that is not onboarded', async () => {
            await accessControlDid.grantDidRole(
                HASH_TIMESTAMP_ROLE,
                entityC.serviceDid
            )

            await expect(
                evidence
                    .connect(entityC.gateway)
                    .timestampHashV2(entityC.serviceDid, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(evidence, 'EntityNotRegistered')
                .withArgs(entityC.did)
        })
    })

    describe('validation', () => {
        it('GIVEN a zero hash WHEN registering THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, ZeroHash, ZeroHash)
            ).to.be.revertedWithCustomError(evidence, 'EmptyBytes32')
        })

        it('GIVEN a parent never registered WHEN registering a child THEN reverts', async () => {
            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, HASH)
            )
                .to.be.revertedWithCustomError(evidence, 'ParentNotRegistered')
                .withArgs(HASH, entityA.did)
        })

        it('GIVEN a parent registered by another entity WHEN registering a child THEN reverts', async () => {
            await evidence
                .connect(entityB.gateway)
                .timestampHashV2(entityB.serviceDid, HASH, ZeroHash)

            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, HASH)
            )
                .to.be.revertedWithCustomError(evidence, 'ParentNotRegistered')
                .withArgs(HASH, entityA.did)
        })

        it('GIVEN a use case paused by ISBE WHEN registering THEN reverts and reads still work', async () => {
            await evidence
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)

            await pauseByIsbe()

            await expect(
                evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, ZeroHash)
            ).to.be.revertedWithCustomError(evidence, 'IsPaused')
            expect(await evidence.existsV2(HASH, entityA.did)).to.equal(true)
        })
    })

    describe('core diamond (not a use case)', () => {
        // Cut into the governance diamond itself: there is no factory behind it, so the
        // service DID resolves against the local Service DID Registry storage.
        async function deployOnGovernanceFixture() {
            const fixture = await deployFixture()
            const { gov, admin, governanceAddress } = fixture
            const facet = await (
                await ethers.getContractFactory('HashTimestampV2Facet')
            ).deploy()
            await gov.diamondCutAccessControl.connect(admin).diamondCut(
                [
                    {
                        facetAddress: await facet.getAddress(),
                        action: ITEM_CUT_ACTION_ADD,
                        items: [...(await facet.selectorsIntrospection())],
                    },
                ],
                ZeroAddress,
                '0x'
            )
            const accessControlDidGovernance = (
                await ethers.getContractFactory('AccessControlDidFacet')
            )
                .attach(governanceAddress)
                .connect(admin) as AccessControlDidFacet
            await accessControlDidGovernance.grantDidRole(
                HASH_TIMESTAMP_ROLE,
                fixture.entityA.did
            )
            return {
                ...fixture,
                evidenceOnGovernance: facet.attach(
                    governanceAddress
                ) as HashTimestampV2Facet,
            }
        }

        it('GIVEN the facet on the governance diamond WHEN the service key registers THEN stores the record and rejects other keys and inactive services', async () => {
            const { evidenceOnGovernance, entityA, entityB } =
                await loadFixture(deployOnGovernanceFixture)

            await evidenceOnGovernance
                .connect(entityA.gateway)
                .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)

            expect(
                await evidenceOnGovernance.existsV2(HASH, entityA.did)
            ).to.equal(true)
            await expect(
                evidenceOnGovernance
                    .connect(entityA.founder)
                    .timestampHashV2(entityA.serviceDid, STAMPED, ZeroHash)
            )
                .to.be.revertedWithCustomError(
                    evidenceOnGovernance,
                    'SignerNotServiceKey'
                )
                .withArgs(entityA.serviceDid, entityA.founder.address)
            await expect(
                evidenceOnGovernance
                    .connect(entityA.gateway)
                    .timestampHashV2(ethers.id('unknown'), STAMPED, ZeroHash)
            ).to.be.revertedWithCustomError(
                evidenceOnGovernance,
                'ServiceDidNotActive'
            )
            // B holds the role on the use case proxy, not on the governance diamond.
            await expect(
                evidenceOnGovernance
                    .connect(entityB.gateway)
                    .timestampHashV2(entityB.serviceDid, HASH, ZeroHash)
            )
                .to.be.revertedWithCustomError(
                    evidenceOnGovernance,
                    'EntityNotRegistered'
                )
                .withArgs(entityB.did)
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
                'timestampHashV2',
                'existsV2',
                'getTimestampV2',
                'getRecordsCountV2',
                'getRecordsV2',
            ]
                .map((name) => facet.interface.getFunction(name)!.selector)
                .sort()
            expect(selectors).to.deep.equal(expected)
            expect(await facet.interfacesIntrospection()).to.have.length(1)
        })
    })

    describe('gas', () => {
        it('GIVEN an onboarded entity WHEN its service registers an original and a chained stamped hash THEN reports gas used', async () => {
            const original = await (
                await evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
            ).wait()
            const stamped = await (
                await evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, STAMPED, HASH)
            ).wait()
            const duplicate = await (
                await evidence
                    .connect(entityA.gateway)
                    .timestampHashV2(entityA.serviceDid, HASH, ZeroHash)
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
