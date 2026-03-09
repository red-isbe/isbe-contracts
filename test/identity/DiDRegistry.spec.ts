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
import {
    DidControllerFacet,
    DidDocumentDetailedFacet,
    DidVerificationMethodFacet,
    DidVerificationRelationshipFacet,
    DidRegistryQueryFacet,
    IDidVerificationMethod,
    IDidRegistry,
    MockTimestampFacet,
} from '../../typechain-types'
import { HDNodeWallet, Signer, ZeroHash } from 'ethers'
import {
    ASSERTION_RELATIONSHIP,
    AUTHENTICATION_RELATIONSHIP,
    CAPABILITY_DELEGATION_RELATIONSHIP,
    CAPABILITY_INVOCATION_RELATIONSHIP,
    DID_DOCUMENT_DETAILED_RESOLVER_KEY,
    KEY_AGREEMENT_RELATIONSHIP,
    DID_REGISTRY_ROLE,
    CONFIGURATION_ID_DID_REGISTRY,
    DID_CONTROLLER_RESOLVER_KEY,
    DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY,
    DID_VERIFICATION_METHOD_RESOLVER_KEY,
    DID_REGISTRY_QUERY_RESOLVER_KEY,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    DidDocumentBuilder,
    DidDocumentVerifier,
    DidsResultValidator,
    ContractGetDidsResult,
    VerificationRelationshipResultValidator,
} from '../utils/identity'
import {
    randomHex,
    randomInt,
    randomDid,
    randomBaseDocument,
    proofToDid,
    generateProof,
    EMPTY_VALUES,
} from '../support'
import { EllipticType, ContractDidDocumentResult } from '../types/identity'

// EllipticType enum values for testing
const EllipticTypeTest = {
    NONE: 0,
    SECP_256_K1: EllipticType.SECP_256_K1,
    SECP_256_R1: EllipticType.SECP_256_R1,
} as const

const CHECK_CONTROLLER_BYTES32_ADDRESS = 'checkController(bytes32,address)'
const CHECK_CONTROLLER_BYTES_ADDRESS = 'checkController(bytes,address)'

// Test constants
const TEST_VALIDITY_DURATION = 1000000000000000000n
const MAX_ROLL_DURATION = 356n * 12n * 60n * 60n // ~1 year in hours

// ============================================================================
// Helper Functions
// ============================================================================

// --- Wallet Utilities ---
function walletOfFirstSigner(): HDNodeWallet {
    const mnemonic = (
        config.networks.hardhat.accounts as {
            mnemonic: string
            path: string
        }
    ).mnemonic
    return ethers.Wallet.fromPhrase(mnemonic)
}

function deriveWallet(wallet: HDNodeWallet, path: string): HDNodeWallet {
    return wallet.derivePath(path)
}

const walletToPublicKey = (wallet: HDNodeWallet): string => {
    return wallet.signingKey.publicKey
}

// publicKeyToDid removed — DID now derives from proof, not public key
// Use proofToDid(proof) from test/support instead

// --- Test Data Generation ---
let baseDocument: string
let vMethodId: string
let publicKey65: string
let publicKey64: string
let notBefore: bigint
let notAfter: bigint

const randomizeDidDocument = (wallet: HDNodeWallet) => {
    baseDocument = randomBaseDocument()
    vMethodId = randomHex(32)
    publicKey65 = walletToPublicKey(wallet)
    publicKey64 = '0x'.concat(publicKey65.slice(4))
    // Use timestamp in the past to ensure capability invocation is immediately active
    notBefore = 5n
    notAfter = notBefore + TEST_VALIDITY_DURATION
}

// --- Fixture Helpers ---
let didRegistry: IDidRegistry
let mockTimestamp: MockTimestampFacet
let didDocumentDetailedFacet: DidDocumentDetailedFacet
let didControllerFacet: DidControllerFacet
let didVerificationMethodFacet: DidVerificationMethodFacet
let didVerificationRelationshipFacet: DidVerificationRelationshipFacet
let didRegistryQueryFacet: DidRegistryQueryFacet

/**
 * Helper function to create a standard test fixture:
 * - Creates and randomizes wallet
 * - Initializes the DID registry
 * - Inserts a first DID document (with proof)
 * - Sets the mock timestamp to notBefore + 1
 * - Returns wallet for tests that need it
 */
async function createStandardFixture() {
    const wallet = walletOfFirstSigner()
    randomizeDidDocument(wallet)

    await didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)

    // Generate proof and derive DID from it
    const proof = generateProof(wallet)
    const did = proofToDid(proof)

    await didRegistry.insertFirstDidDocument(
        did,
        baseDocument,
        vMethodId,
        proof,
        publicKey65,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter,
        '' // empty alsoKnownAs
    )
    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

    return { wallet, did }
}

/**
 * Helper function to insert a controller DID document with random data
 * Uses insertFirstDidDocument to create a new DID for a controller
 * Returns the proof-derived DID
 */
async function insertControllerDocument(): Promise<string> {
    const controllerWallet = ethers.Wallet.createRandom()
    const controllerPublicKey = controllerWallet.signingKey.publicKey
    const controllerVMethodId = randomDid()
    const controllerBaseDocument = randomBaseDocument()

    // Generate proof and derive DID from it
    const proof = generateProof(controllerWallet)
    const did = proofToDid(proof)

    await didRegistry.insertFirstDidDocument(
        did,
        controllerBaseDocument,
        controllerVMethodId,
        proof,
        controllerPublicKey,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter,
        ''
    )

    return did
}

// --- Assertion Helpers ---

/**
 * Helper function to build and verify a basic DID document with single vMethod and relationships
 */
function buildAndVerifyBasicDidDocument(
    didDocument: ContractDidDocumentResult,
    baseDoc: string,
    controller: string,
    methodId: string,
    publicKey: string,
    elliptic: EllipticType,
    revoked: boolean,
    notBeforeVal: bigint,
    notAfterVal: bigint
): void {
    const expectedComplete = new DidDocumentBuilder(baseDoc, [controller])
        .addVMethod(methodId, publicKey, elliptic, revoked)
        .addVRelationship(
            AUTHENTICATION_RELATIONSHIP,
            methodId,
            notBeforeVal,
            notAfterVal,
            0
        )
        .addVRelationship(
            CAPABILITY_INVOCATION_RELATIONSHIP,
            methodId,
            notBeforeVal,
            notAfterVal,
            0
        )
        .build()
    DidDocumentVerifier.verifyDidDocument(didDocument, expectedComplete)
}

/**
 * Helper function to check controller status
 */
async function expectControllerStatus(
    did: string,
    address: string,
    expectedStatus: boolean
): Promise<void> {
    expect(
        await didRegistry[CHECK_CONTROLLER_BYTES32_ADDRESS](did, address)
    ).to.equal(expectedStatus)
}

// --- Controller Management Helpers ---
/**
 * Helper function to count active controllers for a DID
 */
async function getControllerCount(didId: string): Promise<number> {
    const didDocument = await didRegistry.getDidDocument(didId)
    return didDocument[2].length // controllers is the third return value (index 2)
}

/**
 * Helper function to check if a DID is a controller of another DID
 */
async function isDidController(
    didId: string,
    controllerDid: string
): Promise<boolean> {
    const didDocument = await didRegistry.getDidDocument(didId)
    return didDocument[2].includes(controllerDid) // controllers is the third return value (index 2)
}

/**
 * Helper function to verify controller count and status
 */
async function expectControllerState(
    didId: string,
    expectedCount: number,
    controllersToCheck: Array<{ controller: string; shouldExist: boolean }>
): Promise<void> {
    expect(await getControllerCount(didId)).to.equal(expectedCount)
    for (const { controller, shouldExist } of controllersToCheck) {
        expect(await isDidController(didId, controller)).to.equal(shouldExist)
    }
}

/**
 * Helper function to create and add multiple controllers
 */
async function addMultipleControllers(
    didId: string,
    count: number
): Promise<string[]> {
    const controllers: string[] = []
    for (let i = 0; i < count; i++) {
        const controller = await insertControllerDocument()
        await didRegistry.addController(didId, controller)
        controllers.push(controller)
    }
    return controllers
}

/**
 * Helper function to expect revocation failure
 */
async function expectRevocationToFail(
    didId: string,
    controllerToRevoke: string
): Promise<void> {
    await expect(didRegistry.revokeController(didId, controllerToRevoke))
        .to.be.revertedWithCustomError(
            didControllerFacet,
            'CannotLeaveDidWithoutControllers'
        )
        .withArgs(didId, controllerToRevoke)
}

// ============================================================================
// Tests
// ============================================================================

describe('DiDRegistry', function () {
    let admin: Signer
    let other: Signer
    let otherAddress: string
    const emptyString = EMPTY_VALUES.string
    const emptyBytes = EMPTY_VALUES.bytes
    let did: string

    async function deployFixture() {
        const [adminSigner, otherSigner] = await ethers.getSigners()
        const otherAddress = await otherSigner.getAddress()

        const gov = await deployGovernance(
            adminSigner,
            [],
            CONFIGURATION_ID_DID_REGISTRY
        )

        await gov.accessControlGovernance!.grantRole(
            DID_REGISTRY_ROLE,
            await adminSigner.getAddress()
        )

        expect(
            await gov.didDocumentDetailedFacet.businessIdIntrospection()
        ).to.be.equal(DID_DOCUMENT_DETAILED_RESOLVER_KEY)
        expect(
            await gov.didControllerFacet.businessIdIntrospection()
        ).to.be.equal(DID_CONTROLLER_RESOLVER_KEY)
        expect(
            await gov.didVerificationMethodFacet.businessIdIntrospection()
        ).to.be.equal(DID_VERIFICATION_METHOD_RESOLVER_KEY)
        expect(
            await gov.didVerificationRelationshipFacet.businessIdIntrospection()
        ).to.be.equal(DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY)
        expect(
            await gov.didDocumentDetailedFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x10e047f4'])

        return {
            admin: adminSigner,
            other: otherSigner,
            otherAddress,
            didDocumentDetailedFacet: gov.didDocumentDetailedFacet,
            didControllerFacet: gov.didControllerFacet,
            didVerificationMethodFacet: gov.didVerificationMethodFacet,
            didVerificationRelationshipFacet:
                gov.didVerificationRelationshipFacet,
            didRegistryQueryFacet: gov.didRegistryQueryFacet,
            didRegistry: gov.didRegistry.connect(
                adminSigner
            ) as typeof gov.didRegistry,
            mockTimestamp: gov.mockTimestamp,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        admin = contracts.admin
        other = contracts.other
        otherAddress = contracts.otherAddress
        didDocumentDetailedFacet = contracts.didDocumentDetailedFacet
        didControllerFacet = contracts.didControllerFacet
        didVerificationMethodFacet = contracts.didVerificationMethodFacet
        didVerificationRelationshipFacet =
            contracts.didVerificationRelationshipFacet
        didRegistryQueryFacet = contracts.didRegistryQueryFacet
        didRegistry = contracts.didRegistry
        mockTimestamp = contracts.mockTimestamp
    })

    describe('DiDRegistry', () => {
        describe('initializeDidRegistry', () => {
            it('GIVEN deployed didRegistry WHEN try to initialize with non elliptic type THEN it fails', async () => {
                await expect(
                    didRegistry.initializeDiDRegistry(EllipticTypeTest.NONE)
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'InvalidEllipticCurve'
                )
            })
            it('GIVEN deployed didRegistry WHEN try to initialize twice THEN it fails', async () => {
                await didRegistry.initializeDiDRegistry(
                    EllipticType.SECP_256_R1
                )
                await expect(
                    didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'ContractIsAlreadyInitialized'
                )
            })
            it('GIVEN deployed didRegistry WHEN try to initialize correct elliptic type THEN success', async () => {
                expect(
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                )
                    .to.emit(didRegistry, 'DiDRegistryInitialized')
                    .withArgs(EllipticType.SECP_256_K1)
            })
        })

        describe('insertFirstDidDocument', () => {
            const ALSO_KNOWN_AS_EXAMPLE = 'irn:orgs:inetum'
            let proof: string
            let wallet: HDNodeWallet

            beforeEach(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)

                await didRegistry.initializeDiDRegistry(
                    EllipticType.SECP_256_K1
                )

                // Create valid proof and derive DID from it
                proof = generateProof(wallet)
                did = proofToDid(proof)
            })

            describe('Authorization', () => {
                it('GIVEN an account without DID_REGISTRY_ROLE WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry
                            .connect(other)
                            .insertFirstDidDocument(
                                did,
                                baseDocument,
                                vMethodId,
                                proof,
                                publicKey65,
                                EllipticType.SECP_256_K1,
                                notBefore,
                                notAfter,
                                ALSO_KNOWN_AS_EXAMPLE
                            )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'AccountHasNoRole'
                        )
                        .withArgs(otherAddress, DID_REGISTRY_ROLE)
                })

                it('GIVEN an account with DID_REGISTRY_ROLE WHEN calling insertFirstDidDocument THEN it succeeds', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.not.be.reverted
                })
            })

            describe('Input Validation', () => {
                it('GIVEN empty DID WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            ZeroHash,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyBytes32'
                    )
                })

                it('GIVEN empty baseDocument WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            emptyString,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyString'
                    )
                })

                it('GIVEN empty vMethodId WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            ZeroHash,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyBytes32'
                    )
                })

                it('GIVEN empty proof WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            emptyBytes,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'WrongSignatureLength'
                    )
                })

                it('GIVEN empty publicKey WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            emptyBytes,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'InvalidPubKeyLength'
                    )
                })

                it('GIVEN invalid elliptic type WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticTypeTest.NONE,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'InvalidEllipticCurve'
                    )
                })

                it('GIVEN network elliptic type K1 WHEN inserting with R1 elliptic type THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_R1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'FirstPublicKeyMustBeTheSameThanTheNetwork'
                        )
                        .withArgs(EllipticType.SECP_256_R1)
                })

                it('GIVEN zero notBefore WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            0,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyUint'
                    )
                })

                it('GIVEN zero notAfter WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            0,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyUint'
                    )
                })

                it('GIVEN notBefore >= notAfter WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notAfter,
                            notBefore,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'InvalidDates'
                    )
                })

                it('GIVEN empty alsoKnownAs WHEN calling insertFirstDidDocument THEN it succeeds', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            emptyString
                        )
                    ).to.not.be.reverted
                })
            })

            describe('DID Already Exists', () => {
                it('GIVEN an existing DID WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    await didRegistry.insertFirstDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ALSO_KNOWN_AS_EXAMPLE
                    )

                    const vMethodId2 = randomHex(32)
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId2,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'DidAlreadyExists'
                    )
                })
            })

            describe('Proof Validation', () => {
                it('GIVEN invalid proof length WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    // Generate valid proof-derived DID
                    const validProof = generateProof(wallet)
                    const validDid = proofToDid(validProof)

                    const invalidProof = randomHex(32)

                    await expect(
                        didRegistry.insertFirstDidDocument(
                            validDid,
                            baseDocument,
                            vMethodId,
                            invalidProof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'WrongSignatureLength'
                    )
                })

                it('GIVEN invalid proof signature WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    // Generate valid proof-derived DID
                    const validProof = generateProof(wallet)
                    const validDid = proofToDid(validProof)

                    const invalidProof = randomHex(65)

                    await expect(
                        didRegistry.insertFirstDidDocument(
                            validDid,
                            baseDocument,
                            vMethodId,
                            invalidProof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'InvalidSignature'
                    )
                })

                it('GIVEN public key with invalid control byte WHEN calling insertFirstDidDocument THEN it fails', async () => {
                    // Create a 65-byte public key that doesn't start with 0x04
                    const invalidPublicKey = '0x05' + publicKey65.slice(4)
                    const invalidMessage = ethers.keccak256(
                        ethers.solidityPacked(['bytes'], [invalidPublicKey])
                    )
                    const invalidSignature =
                        wallet.signingKey.sign(invalidMessage)
                    const invalidProof =
                        ethers.Signature.from(invalidSignature).serialized

                    // Generate valid proof-derived DID for a different proof
                    const validProof = generateProof(wallet)
                    const validDid = proofToDid(validProof)

                    await expect(
                        didRegistry.insertFirstDidDocument(
                            validDid,
                            baseDocument,
                            vMethodId,
                            invalidProof,
                            invalidPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'InvalidControlBytes'
                    )
                })

                it('GIVEN a proof that is valid for the publicKey BUT a DID not derived from that proof WHEN calling insertFirstDidDocument THEN it fails with DidNotDerivedFromProof', async () => {
                    // GIVEN: a valid proof/publicKey pair and its correct DID
                    const validProof = generateProof(wallet)
                    const validDid = proofToDid(validProof)

                    // Create a DID that is guaranteed to be different while keeping valid proof/publicKey
                    const badDid = ethers.toBeHex(
                        ethers.toBigInt(validDid) ^ 1n,
                        32
                    )

                    // WHEN/THEN: insertion must revert because DID payload is not derived from proof
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            badDid,
                            baseDocument,
                            vMethodId,
                            validProof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'DidNotDerivedFromProof'
                        )
                        .withArgs(badDid)
                })

                it('GIVEN a proof that is valid for the publicKey BUT a DID with a non-zero 13-byte prefix WHEN calling insertFirstDidDocument THEN it fails with DidNotDerivedFromProof', async () => {
                    // GIVEN: a valid proof/publicKey pair and its correct DID (which has 13 zero prefix bytes)
                    const validProof = generateProof(wallet)
                    const validDid = proofToDid(validProof)

                    // Make the prefix invalid by setting the most-significant bit (stays in the first 13 bytes)
                    const badDidPrefix = ethers.toBeHex(
                        ethers.toBigInt(validDid) | (1n << 255n),
                        32
                    )

                    // WHEN/THEN: insertion must revert because DID prefix is not 13 zero bytes
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            badDidPrefix,
                            baseDocument,
                            vMethodId,
                            validProof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'DidNotDerivedFromProof'
                        )
                        .withArgs(badDidPrefix)
                })
            })

            describe('Controller Setup', () => {
                it('GIVEN a successful insertion WHEN checking controllers THEN DID is its own controller', async () => {
                    await didRegistry.insertFirstDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ALSO_KNOWN_AS_EXAMPLE
                    )

                    const didDocument = await didRegistry.getDidDocument(did)
                    const controllers = didDocument[2]

                    expect(controllers).to.have.lengthOf(1)
                    expect(controllers[0]).to.equal(did)
                })
            })

            describe('Event Emission', () => {
                it('GIVEN valid parameters WHEN calling insertFirstDidDocument THEN it emits FirstDidDocumentInserted', async () => {
                    await expect(
                        didRegistry.insertFirstDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            proof,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                    )
                        .to.emit(didRegistry, 'FirstDidDocumentInserted')
                        .withArgs(
                            did,
                            baseDocument,
                            vMethodId,
                            publicKey65,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter,
                            ALSO_KNOWN_AS_EXAMPLE
                        )
                })
            })
        })

        describe('updateAlsoKnownAs', () => {
            const ALSO_KNOWN_AS_EXAMPLE = 'irn:orgs:inetum'
            const ALSO_KNOWN_AS_UPDATED = 'irn:orgs:updated-example'
            let proof: string
            let wallet: HDNodeWallet

            beforeEach(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)

                await didRegistry.initializeDiDRegistry(
                    EllipticType.SECP_256_K1
                )

                proof = generateProof(wallet)
                did = proofToDid(proof)

                await didRegistry.insertFirstDidDocument(
                    did,
                    baseDocument,
                    vMethodId,
                    proof,
                    publicKey65,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    ALSO_KNOWN_AS_EXAMPLE
                )
            })

            describe('Authorization', () => {
                it('GIVEN an account without DID_REGISTRY_ROLE WHEN calling updateAlsoKnownAs THEN it fails', async () => {
                    await expect(
                        didRegistry
                            .connect(other)
                            .updateAlsoKnownAs(did, ALSO_KNOWN_AS_UPDATED)
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'AccountHasNoRole'
                        )
                        .withArgs(otherAddress, DID_REGISTRY_ROLE)
                })

                it('GIVEN an account with DID_REGISTRY_ROLE WHEN calling updateAlsoKnownAs THEN it succeeds', async () => {
                    await expect(
                        didRegistry.updateAlsoKnownAs(
                            did,
                            ALSO_KNOWN_AS_UPDATED
                        )
                    ).to.not.be.reverted
                })
            })

            describe('DID Validation', () => {
                it('GIVEN empty DID WHEN calling updateAlsoKnownAs THEN it fails', async () => {
                    await expect(
                        didRegistry.updateAlsoKnownAs(
                            ZeroHash,
                            ALSO_KNOWN_AS_UPDATED
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyBytes32'
                    )
                })

                it('GIVEN non-existent DID WHEN calling updateAlsoKnownAs THEN it fails', async () => {
                    const nonExistentDid = randomDid()

                    await expect(
                        didRegistry.updateAlsoKnownAs(
                            nonExistentDid,
                            ALSO_KNOWN_AS_UPDATED
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'DidNotExists'
                    )
                })
            })

            describe('AlsoKnownAs Update', () => {
                it('GIVEN a valid DID WHEN calling updateAlsoKnownAs THEN it succeeds', async () => {
                    await expect(
                        didRegistry.updateAlsoKnownAs(
                            did,
                            ALSO_KNOWN_AS_UPDATED
                        )
                    ).to.not.be.reverted
                })

                it('GIVEN a valid DID WHEN updating to empty string THEN it succeeds', async () => {
                    await expect(
                        didRegistry.updateAlsoKnownAs(did, emptyString)
                    ).to.not.be.reverted
                })

                it('GIVEN a valid DID WHEN calling updateAlsoKnownAs multiple times THEN it succeeds', async () => {
                    await didRegistry.updateAlsoKnownAs(
                        did,
                        'irn:orgs:first-update'
                    )
                    await didRegistry.updateAlsoKnownAs(
                        did,
                        'irn:orgs:second-update'
                    )

                    await expect(
                        didRegistry.updateAlsoKnownAs(
                            did,
                            'irn:orgs:third-update'
                        )
                    ).to.not.be.reverted
                })
            })

            describe('Event Emission', () => {
                it('GIVEN valid parameters WHEN calling updateAlsoKnownAs THEN it emits AlsoKnownAsUpdated', async () => {
                    await expect(
                        didRegistry.updateAlsoKnownAs(
                            did,
                            ALSO_KNOWN_AS_UPDATED
                        )
                    )
                        .to.emit(didRegistry, 'AlsoKnownAsUpdated')
                        .withArgs(did, ALSO_KNOWN_AS_UPDATED)
                })
            })
        })

        describe('insertDidDocument', () => {
            const ALSO_KNOWN_AS_EXAMPLE = 'irn:orgs:inetum'
            let wallet: HDNodeWallet
            let callerDid: string
            let proof: string

            beforeEach(async () => {
                const fixture = async () => {
                    wallet = walletOfFirstSigner()
                    randomizeDidDocument(wallet)

                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )

                    // Insert first DID for the test caller so they can use insertDidDocument
                    const callerProof = generateProof(wallet)
                    callerDid = proofToDid(callerProof)

                    await didRegistry.insertFirstDidDocument(
                        callerDid,
                        randomBaseDocument(),
                        randomDid(),
                        callerProof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ALSO_KNOWN_AS_EXAMPLE
                    )

                    // Set timestamp so capability invocation is active
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                }
                await loadFixture(fixture)
                // Generate proof-derived DID for insertDidDocument tests
                const secondWallet = deriveWallet(wallet, '2')
                proof = generateProof(secondWallet)
                did = proofToDid(proof)
            })

            describe('Requires Known DID', () => {
                it('GIVEN a caller without a DID WHEN calling insertDidDocument THEN it fails', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    await expect(
                        didRegistry
                            .connect(other)
                            .insertDidDocument(
                                did,
                                baseDocument,
                                vMethodId,
                                proof,
                                newPublicKey,
                                EllipticType.SECP_256_K1,
                                notBefore,
                                notAfter
                            )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'AddressNotKnown'
                        )
                        .withArgs(otherAddress)
                })

                it('GIVEN a caller with a DID WHEN calling insertDidDocument THEN it succeeds', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    await expect(
                        didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            newVMethodId,
                            proof,
                            newPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    ).to.not.be.reverted
                })
            })

            describe('DID Already Exists', () => {
                it('GIVEN an existing DID WHEN calling insertDidDocument THEN it fails', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    // First insert should succeed
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        newVMethodId,
                        proof,
                        newPublicKey,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )

                    // Second insert with same DID should fail
                    await expect(
                        didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            newVMethodId,
                            proof,
                            newPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'DidAlreadyExists'
                        )
                        .withArgs(did)
                })
            })

            describe('Elliptic Type Validation', () => {
                it('GIVEN network elliptic type K1 WHEN inserting with R1 elliptic type THEN it fails', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    await expect(
                        didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            newVMethodId,
                            proof,
                            newPublicKey,
                            EllipticType.SECP_256_R1,
                            notBefore,
                            notAfter
                        )
                    )
                        .to.be.revertedWithCustomError(
                            didDocumentDetailedFacet,
                            'FirstPublicKeyMustBeTheSameThanTheNetwork'
                        )
                        .withArgs(EllipticType.SECP_256_R1)
                })

                it('GIVEN invalid elliptic type WHEN inserting THEN it fails', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    await expect(
                        didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            newVMethodId,
                            proof,
                            newPublicKey,
                            EllipticTypeTest.NONE,
                            notBefore,
                            notAfter
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'InvalidEllipticCurve'
                    )
                })
            })

            describe('Public Key Validation', () => {
                it('GIVEN empty public key WHEN inserting THEN it fails', async () => {
                    const newVMethodId = randomHex(32)
                    await expect(
                        didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            newVMethodId,
                            proof,
                            emptyBytes,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'EmptyBytes'
                    )
                })
            })

            describe('AlsoKnownAs Inheritance', () => {
                it('GIVEN a caller with alsoKnownAs WHEN inserting new DID THEN it inherits alsoKnownAs', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        newVMethodId,
                        proof,
                        newPublicKey,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )

                    const didDocument = await didRegistry.getDidDocument(did)
                    const alsoKnownAs = didDocument[1] // alsoKnownAs is the second return value
                    expect(alsoKnownAs).to.deep.equal([ALSO_KNOWN_AS_EXAMPLE])
                })
            })

            describe('Controller Setup', () => {
                it('GIVEN a successful insertion WHEN checking controllers THEN new DID is its own controller and caller is controller', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        newVMethodId,
                        proof,
                        newPublicKey,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )

                    const didDocument = await didRegistry.getDidDocument(did)
                    const controllers = didDocument[2]

                    // After ISBE-84 fix: DID is linked to itself AND caller via _insertAndLink
                    const callerDid = proofToDid(generateProof(wallet))
                    expect(controllers).to.have.lengthOf(2)
                    expect(controllers).to.include(did)
                    expect(controllers).to.include(callerDid)
                })
            })

            describe('Event Emission', () => {
                it('GIVEN valid parameters WHEN calling insertDidDocument THEN it emits DidDocumentInserted', async () => {
                    const newPublicKey = walletToPublicKey(
                        deriveWallet(wallet, '2')
                    )
                    const newVMethodId = randomHex(32)
                    await expect(
                        didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            newVMethodId,
                            proof,
                            newPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    )
                        .to.emit(didRegistry, 'DidDocumentInserted')
                        .withArgs(
                            did,
                            baseDocument,
                            newVMethodId,
                            newPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                })
            })

            describe('Proof Validation', () => {
                it('GIVEN a DID not derived from proof WHEN calling insertDidDocument THEN it fails', async () => {
                    const newVMethodId = randomHex(32)

                    // Generate valid proof and public key from the SAME wallet
                    const testWallet = deriveWallet(wallet, '4')
                    const validProof = generateProof(testWallet)
                    const testPublicKey = walletToPublicKey(testWallet)
                    // Use a random DID that doesn't match the proof
                    const wrongDid = randomDid()

                    await expect(
                        didRegistry.insertDidDocument(
                            wrongDid,
                            baseDocument,
                            newVMethodId,
                            validProof,
                            testPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    ).to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'DidNotDerivedFromProof'
                    )
                })
            })
        })

        describe('updateDidDocument', () => {
            beforeEach(async () => {
                ;({ did } = await createStandardFixture())
            })

            it('GIVEN an inserted document WHEN try to update with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.updateBaseDocument(ZeroHash, randomDid())
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyBytes32'
                )
            })

            it('GIVEN an inserted document WHEN try to update with empty baseDocument THEN it fails', async () => {
                await expect(
                    didRegistry.updateBaseDocument(randomDid(), '')
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to update an not inserted did THEN it fails', async () => {
                const newDid = randomDid()
                await expect(
                    didRegistry.updateBaseDocument(newDid, randomDid())
                )
                    .to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'DidNotExists'
                    )
                    .withArgs(newDid)
            })

            it('GIVEN an inserted document WHEN try to update without rights THEN it fails', async () => {
                await expect(
                    didRegistry
                        .connect(other)
                        .updateBaseDocument(did, randomDid())
                )
                    .to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, otherAddress)
            })

            it('GIVEN initialized didRegistry WHEN try to update base document THEN it success', async () => {
                const newBaseDocument = randomDid()
                await expect(
                    didRegistry.updateBaseDocument(did, newBaseDocument)
                )
                    .to.emit(didRegistry, 'BaseDocumentUpdated')
                    .withArgs(did, newBaseDocument)
            })
        })

        describe('addVerificationMethod', () => {
            let wallet: HDNodeWallet

            beforeEach(async () => {
                const fixtures = await createStandardFixture()
                did = fixtures.did
                wallet = fixtures.wallet
            })

            it('GIVEN an inserted document WHEN try to add V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        ZeroHash,
                        randomDid(),
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with empty vMethod THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        randomDid(),
                        ZeroHash,
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with empty PK THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        randomDid(),
                        randomDid(),
                        emptyBytes,
                        EllipticType.SECP_256_K1
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with empty elliptic type THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        randomDid(),
                        randomDid(),
                        publicKey64,
                        EllipticTypeTest.NONE
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'InvalidEllipticCurve'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with not inserted did THEN it fails', async () => {
                const newDid = randomDid()
                await expect(
                    didRegistry.addVerificationMethod(
                        newDid,
                        randomDid(),
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'DidNotExists'
                    )
                    .withArgs(newDid)
            })
            it('GIVEN an inserted document WHEN try to add V.M. with inserted vMethodId THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        did,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodExists'
                    )
                    .withArgs(did, vMethodId)
            })
            it('GIVEN an inserted document WHEN try to add V.M. with inserted PK THEN it fails', async () => {
                const newVMethodId = randomDid()
                await expect(
                    didRegistry.addVerificationMethod(
                        did,
                        newVMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'PublicKeyAlreadyInUse'
                    )
                    .withArgs(publicKey64)
            })
            it('GIVEN an inserted document WHEN try to add V.M. with a non controller THEN it fails', async () => {
                const newMethodId = randomDid()
                await expect(
                    didRegistry
                        .connect(other)
                        .addVerificationMethod(
                            did,
                            newMethodId,
                            walletToPublicKey(deriveWallet(wallet, '1')),
                            EllipticType.SECP_256_K1
                        )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, otherAddress)
            })
            it('GIVEN an inserted document WHEN try to add V.M. of same elliptic type than NW THEN it success', async () => {
                const newVMethodId = randomDid()
                const newPublicKey = walletToPublicKey(
                    deriveWallet(wallet, '1')
                )

                await expect(
                    didRegistry.addVerificationMethod(
                        did,
                        newVMethodId,
                        newPublicKey,
                        EllipticType.SECP_256_R1
                    )
                )
                    .to.emit(didRegistry, 'VerificationMethodAdded')
                    .withArgs(
                        did,
                        newVMethodId,
                        newPublicKey,
                        EllipticType.SECP_256_R1
                    )
            })
        })

        describe('revokeVerificationMethod', () => {
            beforeEach(async () => {
                ;({ did } = await createStandardFixture())
            })

            it('GIVEN an inserted document WHEN try to revoke V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        ZeroHash,
                        randomDid(),
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with empty vMethod THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        randomDid(),
                        ZeroHash,
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with not inserted did THEN it fails', async () => {
                const newDid = randomDid()
                await expect(
                    didRegistry.revokeVerificationMethod(
                        newDid,
                        randomDid(),
                        notBefore
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'DidNotExists'
                    )
                    .withArgs(newDid)
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with inserted vMethodId THEN it fails', async () => {
                const newVMethodId = randomDid()
                await expect(
                    didRegistry.revokeVerificationMethod(
                        did,
                        newVMethodId,
                        notBefore
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodNotExists'
                    )
                    .withArgs(did, newVMethodId)
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with inserted 0 notAfter THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(did, vMethodId, 0)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with inserted future notAfter THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        did,
                        vMethodId,
                        notBefore + 2n
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'InvalidNotAfter'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. of same elliptic type than NW THEN it success', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        did,
                        vMethodId,
                        notBefore
                    )
                )
                    .to.emit(didRegistry, 'VerificationMethodRevoked')
                    .withArgs(did, vMethodId, notBefore)

                // Verify the verification method owner (admin) is no longer a controller
                // because the revoked vMethod was the only one with capabilityInvocation
                await expectControllerStatus(
                    did,
                    await admin.getAddress(),
                    false
                )
            })
            it('GIVEN a DID with verification method WHEN non-controller tries to revoke V.M. THEN it fails with ControllerNotAuthorized', async () => {
                // GIVEN
                const [, otherSigner] = await ethers.getSigners()

                // WHEN/THEN - Unauthorized account tries to revoke verification method
                await expect(
                    didRegistry
                        .connect(otherSigner)
                        .revokeVerificationMethod(did, vMethodId, notBefore)
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, await otherSigner.getAddress())
            })
        })

        describe('expireVerificationMethod', () => {
            let wallet: HDNodeWallet

            beforeEach(async () => {
                const fixtures = await createStandardFixture()
                did = fixtures.did
                wallet = fixtures.wallet
            })

            it('GIVEN an inserted document WHEN try to expire V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        ZeroHash,
                        randomDid(),
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with empty vMethod THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        randomDid(),
                        ZeroHash,
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with not inserted did THEN it fails', async () => {
                const newDid = randomDid()
                await expect(
                    didRegistry.expireVerificationMethod(
                        newDid,
                        randomDid(),
                        notBefore
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'DidNotExists'
                    )
                    .withArgs(newDid)
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with inserted vMethodId THEN it fails', async () => {
                const newVMethodId = randomDid()
                await expect(
                    didRegistry.expireVerificationMethod(
                        did,
                        newVMethodId,
                        notBefore
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodNotExists'
                    )
                    .withArgs(did, newVMethodId)
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with inserted 0 notAfter THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(did, vMethodId, 0)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with inserted future notAfter THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        did,
                        vMethodId,
                        notBefore - 2n
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'InvalidNotAfter'
                )
            })
            it('GIVEN a DID with verification method WHEN non-controller tries to expire V.M. THEN it fails with ControllerNotAuthorized', async () => {
                // GIVEN
                const [, otherSigner] = await ethers.getSigners()

                // WHEN/THEN - Unauthorized account tries to expire verification method
                await expect(
                    didRegistry
                        .connect(otherSigner)
                        .expireVerificationMethod(
                            did,
                            vMethodId,
                            notBefore + 2n
                        )
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, await otherSigner.getAddress())
            })
            it('GIVEN an inserted document WHEN try to expire V.M. of same elliptic type than NW THEN it success', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        did,
                        vMethodId,
                        notBefore + 2n
                    )
                )
                    .to.emit(didRegistry, 'VerificationMethodExpired')
                    .withArgs(did, vMethodId, notBefore + 2n)

                // After expiring, the verification method owner is no longer a controller
                await expectControllerStatus(
                    did,
                    await admin.getAddress(),
                    false
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. of added NW THEN it success', async () => {
                const newVMethodId = randomDid()
                const newPublicKey = walletToPublicKey(
                    deriveWallet(wallet, '1')
                )
                await didRegistry.addVerificationMethod(
                    did,
                    newVMethodId,
                    newPublicKey,
                    EllipticType.SECP_256_R1
                )
                await expect(
                    didRegistry.expireVerificationMethod(
                        did,
                        newVMethodId,
                        notBefore + 2n
                    )
                )
                    .to.emit(didRegistry, 'VerificationMethodExpired')
                    .withArgs(did, newVMethodId, notBefore + 2n)

                // The original vMethod still has capabilityInvocation, so admin is still a controller
                await expectControllerStatus(
                    did,
                    await admin.getAddress(),
                    true
                )
            })
        })

        describe('rollVerificationMethod', () => {
            let wallet: HDNodeWallet
            let rolledWallet: HDNodeWallet
            let rollArgs: IDidVerificationMethod.RollArgsStruct

            beforeEach(async () => {
                const fixtures = await createStandardFixture()
                did = fixtures.did
                wallet = fixtures.wallet

                // Additional setup specific to roll tests
                rolledWallet = deriveWallet(wallet, '1')
                const newNotBefore = notAfter + (randomInt() % 1_000_000n)
                rollArgs = {
                    did: did,
                    vMethodId: randomDid(),
                    publicKey: rolledWallet.signingKey.publicKey,
                    ellipticType: EllipticType.SECP_256_K1,
                    notBefore: newNotBefore,
                    notAfter: newNotBefore + (randomInt() % 100_000_000n),
                    oldVMethodId: vMethodId,
                    duration: randomInt() % MAX_ROLL_DURATION,
                }
            })

            it('GIVEN an inserted document WHEN try to roll V.M. with empty did THEN it fails', async () => {
                rollArgs.did = ZeroHash
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty vMethod THEN it fails', async () => {
                rollArgs.vMethodId = ZeroHash
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty ellipticType THEN it fails', async () => {
                rollArgs.ellipticType = EllipticTypeTest.NONE
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'InvalidEllipticCurve'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty publicKey THEN it fails', async () => {
                rollArgs.publicKey = emptyBytes
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty before THEN it fails', async () => {
                rollArgs.notBefore = 0n
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty after THEN it fails', async () => {
                rollArgs.notAfter = 0n
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with after in past of before THEN it fails', async () => {
                rollArgs.notAfter = 1n
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'InvalidDates'
                    )
                    .withArgs(rollArgs.notBefore, rollArgs.notAfter)
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty oldVMethodId THEN it fails', async () => {
                rollArgs.oldVMethodId = ZeroHash
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty duration THEN it fails', async () => {
                rollArgs.duration = 0n
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with did non existent THEN it fails', async () => {
                rollArgs.did = randomDid()
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'ControllerNotAuthorized'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with vMethod existent THEN it fails', async () => {
                rollArgs.vMethodId = vMethodId
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodExists'
                    )
                    .withArgs(did, vMethodId)
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with oldVMethodId non existent THEN it fails', async () => {
                rollArgs.oldVMethodId = randomDid()
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodNotExists'
                    )
                    .withArgs(did, rollArgs.oldVMethodId)
            })
            it('GIVEN an inserted document WHEN try to roll V.M. of same elliptic type than NW THEN it success', async () => {
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.emit(didRegistry, 'VerificationMethodRolled')
                    .withArgs(
                        rollArgs.did,
                        rollArgs.vMethodId,
                        rollArgs.publicKey,
                        rollArgs.ellipticType,
                        rollArgs.notBefore,
                        rollArgs.notAfter,
                        rollArgs.oldVMethodId,
                        rollArgs.duration
                    )

                // Before roll activation: neither wallet is controller yet (not in time window)
                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    false
                )
                await expectControllerStatus(
                    did,
                    await rolledWallet.getAddress(),
                    false
                )

                // Move time to activate the rolled verification method
                await mockTimestamp.setMockedTimestamp(
                    BigInt(rollArgs.notBefore) + 1n
                )

                // After roll activation: old wallet inactive, new wallet is controller
                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    false
                )
                await expectControllerStatus(
                    did,
                    await rolledWallet.getAddress(),
                    true
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. of different elliptic type than NW THEN it fails', async () => {
                // NOTE: This test now fails because the oldVMethodId has capabilityInvocation relationship
                // and the new elliptic type doesn't match the network elliptic type
                rollArgs.ellipticType = EllipticType.SECP_256_R1
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'NewVMethodMustMatchNetworkEllipticType'
                    )
                    .withArgs(rollArgs.vMethodId)
            })
            it('GIVEN an inserted document WHEN try to roll V.M. recently added THEN it success', async () => {
                const newVMethodId = randomDid()
                const vmWallet = deriveWallet(wallet, '1')
                await didRegistry.addVerificationMethod(
                    did,
                    newVMethodId,
                    vmWallet.signingKey.publicKey,
                    EllipticType.SECP_256_R1
                )
                rollArgs.oldVMethodId = newVMethodId
                rollArgs.ellipticType = EllipticType.SECP_256_R1
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.emit(didRegistry, 'VerificationMethodRolled')
                    .withArgs(
                        rollArgs.did,
                        rollArgs.vMethodId,
                        rollArgs.publicKey,
                        rollArgs.ellipticType,
                        rollArgs.notBefore,
                        rollArgs.notAfter,
                        rollArgs.oldVMethodId,
                        rollArgs.duration
                    )

                // The original vMethod (vMethodId) still has capabilityInvocation, so wallet is still a controller
                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    true
                )
                // The rolled vMethod is not active yet (not within its time window)
                await expectControllerStatus(
                    did,
                    await rolledWallet.getAddress(),
                    false
                )
            })

            it('GIVEN a revoked verification method WHEN try to roll THEN it fails', async () => {
                // GIVEN: Add a verification method and then revoke it
                const revokedVMethodId = randomDid()
                const revokedWallet = deriveWallet(wallet, '2')
                await didRegistry.addVerificationMethod(
                    did,
                    revokedVMethodId,
                    walletToPublicKey(revokedWallet),
                    EllipticType.SECP_256_K1
                )

                // Revoke the verification method
                await didRegistry.revokeVerificationMethod(
                    did,
                    revokedVMethodId,
                    notBefore
                )

                // WHEN: Try to roll the revoked verification method
                rollArgs.oldVMethodId = revokedVMethodId

                // THEN: Should fail with VerificationMethodIsRevoked error
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationRelationshipFacet,
                        'VerificationMethodIsRevoked'
                    )
                    .withArgs(did, revokedVMethodId)
            })

            it('GIVEN a vMethod with capabilityInvocation WHEN try to roll with different elliptic type than network THEN it fails', async () => {
                // GIVEN: The initial document has a vMethod with capabilityInvocation (created during insertDidDocument)
                // The oldVMethodId has capabilityInvocation relationship and elliptic type SECP_256_K1 (same as network)

                // WHEN: Try to roll to a different elliptic type (SECP_256_R1) than the network (SECP_256_K1)
                rollArgs.ellipticType = EllipticType.SECP_256_R1

                // THEN: Should fail because oldVMethodId has capabilityInvocation and new elliptic type doesn't match network
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'NewVMethodMustMatchNetworkEllipticType'
                    )
                    .withArgs(rollArgs.vMethodId)
            })
        })

        describe('addVerificationRelationship', () => {
            let wallet: HDNodeWallet

            beforeEach(async () => {
                const fixtures = await createStandardFixture()
                did = fixtures.did
                wallet = fixtures.wallet
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        ZeroHash,
                        randomDid(),
                        randomDid(),
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty name THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        randomDid(),
                        emptyString,
                        randomDid(),
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty vMethodId THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        randomDid(),
                        randomDid(),
                        ZeroHash,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty notBefore THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        randomDid(),
                        randomDid(),
                        randomDid(),
                        0n,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty notAfter THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        randomDid(),
                        randomDid(),
                        randomDid(),
                        notBefore,
                        0n
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with non existent DID THEN it fails', async () => {
                const wrongDid = randomDid()
                await expect(
                    didRegistry.addVerificationRelationship(
                        wrongDid,
                        randomDid(),
                        randomDid(),
                        notBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'DidNotExists'
                    )
                    .withArgs(wrongDid)
            })

            it('GIVEN an inserted document WHEN try to add V.R. with non existent vMethod THEN it fails', async () => {
                const wrongVMethod = randomDid()
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        randomDid(),
                        wrongVMethod,
                        notBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodNotExists'
                    )
                    .withArgs(did, wrongVMethod)
            })

            it('GIVEN an inserted document WHEN try to add V.R. with non controller THEN it fails', async () => {
                await expect(
                    didRegistry
                        .connect(other)
                        .addVerificationRelationship(
                            did,
                            randomDid(),
                            vMethodId,
                            notBefore,
                            notAfter
                        )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, otherAddress)
            })

            it('GIVEN an inserted document WHEN try to add V.R. with non valid name THEN it fails', async () => {
                const wrongName = randomDid()
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        wrongName,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationRelationshipFacet,
                        'InvalidVerificationMethodName'
                    )
                    .withArgs(wrongName)
            })

            it('GIVEN an inserted document WHEN try to add V.R. with existen relationship THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        AUTHENTICATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationRelationshipFacet,
                        'VerificationRelationshipExists'
                    )
                    .withArgs(did, AUTHENTICATION_RELATIONSHIP, vMethodId)
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationRelationshipFacet,
                        'VerificationRelationshipExists'
                    )
                    .withArgs(
                        did,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        vMethodId
                    )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with before in future than after THEN it fails', async () => {
                const badNotBefore = notAfter + 1n
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        ASSERTION_RELATIONSHIP,
                        vMethodId,
                        badNotBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'InvalidDates'
                    )
                    .withArgs(badNotBefore, notAfter)
            })

            it('GIVEN an inserted document WHEN try to add V.R. with correct values THEN it success', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        CAPABILITY_DELEGATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
                )
                    .to.emit(didRegistry, 'VerificationRelationshipAdded')
                    .withArgs(
                        did,
                        CAPABILITY_DELEGATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        KEY_AGREEMENT_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
                )
                    .to.emit(didRegistry, 'VerificationRelationshipAdded')
                    .withArgs(
                        did,
                        KEY_AGREEMENT_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter
                    )
            })

            it('GIVEN a revoked verification method WHEN try to add V.R. THEN it fails', async () => {
                // GIVEN: A DID with a verification method that will be revoked
                // Add a second verification method that we will revoke (not the original one)
                // to avoid losing controller access
                const revokedVMethodId = randomHex(32)
                const revokedPublicKey = walletToPublicKey(
                    deriveWallet(wallet, '1')
                )
                await didRegistry.addVerificationMethod(
                    did,
                    revokedVMethodId,
                    revokedPublicKey,
                    EllipticType.SECP_256_K1
                )

                // Revoke this newly added verification method
                // This sets the revoked flag to true and expires all its relationships
                await didRegistry.revokeVerificationMethod(
                    did,
                    revokedVMethodId,
                    notBefore
                )

                // WHEN: Try to add a new verification relationship to the revoked vMethod
                // THEN: This should fail with VerificationMethodIsRevoked error
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        ASSERTION_RELATIONSHIP,
                        revokedVMethodId,
                        notBefore,
                        notAfter
                    )
                )
                    .to.be.revertedWithCustomError(
                        didVerificationRelationshipFacet,
                        'VerificationMethodIsRevoked'
                    )
                    .withArgs(did, revokedVMethodId)
            })

            it('GIVEN document with multiple vMethods and relationships WHEN getDidDocument is called THEN all vMethods are returned', async () => {
                // Add multiple verification methods
                const vMethod2Id = randomDid()
                const vMethod3Id = randomDid()
                const wallet2 = deriveWallet(wallet, '2')
                const wallet3 = deriveWallet(wallet, '3')

                await didRegistry.addVerificationMethod(
                    did,
                    vMethod2Id,
                    wallet2.signingKey.publicKey,
                    EllipticType.SECP_256_K1
                )
                await didRegistry.addVerificationMethod(
                    did,
                    vMethod3Id,
                    wallet3.signingKey.publicKey,
                    EllipticType.SECP_256_K1
                )

                // Add relationships to different vMethods
                await didRegistry.addVerificationRelationship(
                    did,
                    ASSERTION_RELATIONSHIP,
                    vMethod2Id,
                    notBefore,
                    notAfter
                )
                await didRegistry.addVerificationRelationship(
                    did,
                    KEY_AGREEMENT_RELATIONSHIP,
                    vMethod3Id,
                    notBefore,
                    notAfter
                )

                // Retrieve document - this triggers _addUniqueVMethod loop
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                const didDocument = await didRegistry.getDidDocument(did)

                // Verify all vMethods are present
                const vMethodIds = didDocument[3]
                expect(vMethodIds).to.include(vMethodId)
                expect(vMethodIds).to.include(vMethod2Id)
                expect(vMethodIds).to.include(vMethod3Id)
            })
        })

        describe('addController', () => {
            beforeEach(async () => {
                ;({ did } = await createStandardFixture())
            })

            it('GIVEN deployed DiDRegistry WHEN try to add empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addController(ZeroHash, randomDid())
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to add empty controller THEN it fails', async () => {
                await expect(
                    didRegistry.addController(randomDid(), ZeroHash)
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to add non existent did THEN it fails', async () => {
                const randomDiD = randomDid()
                await expect(didRegistry.addController(randomDiD, randomDid()))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to add non existent controller THEN it fails', async () => {
                const randomDiD = randomDid()
                await expect(didRegistry.addController(did, randomDiD))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to add same controller twice THEN it fails', async () => {
                await expect(didRegistry.addController(did, did))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidIsControlledBy'
                    )
                    .withArgs(did, did)
            })
            it('GIVEN two inserted documents WHEN try to add controller THEN it success', async () => {
                // GIVEN
                const controller = await insertControllerDocument()
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // WHEN
                expect(await didRegistry.addController(did, controller))
                    .to.emit(didRegistry, 'ControllerAdded')
                    .withArgs(did, controller)
            })

            it('GIVEN a DID with owner WHEN a non-controller account tries to add controller THEN it fails with ControllerNotAuthorized', async () => {
                // GIVEN
                const [, otherSigner] = await ethers.getSigners()
                const controller = await insertControllerDocument()
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // WHEN/THEN - Other account (non-controller) cannot add controller
                await expect(
                    didRegistry
                        .connect(otherSigner)
                        .addController(did, controller)
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, await otherSigner.getAddress())
            })

            it('GIVEN a DID with existing controller WHEN owner adds another controller THEN it succeeds', async () => {
                // GIVEN - Add first controller as owner
                const firstController = await insertControllerDocument()
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                await didRegistry.addController(did, firstController)

                // GIVEN - Second controller document
                const secondControllerWallet = ethers.Wallet.createRandom()
                const secondControllerProof = generateProof(
                    secondControllerWallet
                )
                const secondControllerDid = proofToDid(secondControllerProof)
                await didRegistry.insertFirstDidDocument(
                    secondControllerDid,
                    randomBaseDocument(),
                    randomHex(32),
                    secondControllerProof,
                    secondControllerWallet.signingKey.publicKey,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    ''
                )

                // WHEN/THEN - Owner can still add more controllers
                expect(
                    await didRegistry.addController(did, secondControllerDid)
                )
                    .to.emit(didRegistry, 'ControllerAdded')
                    .withArgs(did, secondControllerDid)
            })
        })

        describe('revokeController', () => {
            async function addNewController() {
                const controller = await insertControllerDocument()
                await didRegistry.addController(did, controller)
                return controller
            }

            beforeEach(async () => {
                ;({ did } = await createStandardFixture())
            })

            it('GIVEN deployed DiDRegistry WHEN try to revoke empty did THEN it fails', async () => {
                await expect(
                    didRegistry.revokeController(ZeroHash, randomDid())
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke empty controller THEN it fails', async () => {
                await expect(
                    didRegistry.revokeController(randomDid(), ZeroHash)
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke non existent did THEN it fails', async () => {
                const randomDiD = randomDid()
                await expect(
                    didRegistry.revokeController(randomDiD, randomDid())
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke non existent controller THEN it fails', async () => {
                const randomDiD = randomDid()
                await expect(didRegistry.revokeController(did, randomDiD))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke not linked controller THEN it fails', async () => {
                // GIVEN
                const controller = await insertControllerDocument()

                // WHEN
                await expect(didRegistry.revokeController(did, controller))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidIsNotControlledBy'
                    )
                    .withArgs(did, controller)
            })
            it('GIVEN two inserted documents WHEN try to revoke controller THEN it success', async () => {
                // GIVEN
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                const controller = await addNewController()
                await addNewController()
                // WHEN
                expect(await didRegistry.revokeController(did, controller))
                    .to.emit(didRegistry, 'ControllerRevoked')
                    .withArgs(did, controller)
            })
        })

        describe('getDids', () => {
            let insertedDids: string[]

            beforeEach(async () => {
                const wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
                insertedDids = []
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    // Insert first DID with proof (DID derives from proof)
                    const proof = generateProof(wallet)
                    const firstDid = proofToDid(proof)
                    insertedDids.push(firstDid)

                    await didRegistry.insertFirstDidDocument(
                        firstDid,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ''
                    )

                    // Set timestamp so caller can use insertDidDocument
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                    // Insert remaining DIDs using insertDidDocument (proof-derived DIDs)
                    for (let i = 1; i < 5; i++) {
                        const loopWallet = deriveWallet(wallet, `${i + 10}`)
                        const loopProof = generateProof(loopWallet)
                        const did = proofToDid(loopProof)
                        const loopPublicKey = walletToPublicKey(loopWallet)
                        insertedDids.push(did)
                        const vMethodIdFor = randomDid()

                        await didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            vMethodIdFor,
                            loopProof,
                            loopPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    }
                }
                await loadFixture(fixture)
            })
            it('GIVEN inserted documents WHEN try to get more than exists THEN returns full list', async () => {
                const dids: ContractGetDidsResult = (await didRegistry.getDids(
                    1,
                    insertedDids.length * 2
                )) as unknown as ContractGetDidsResult
                DidsResultValidator.validate(dids).expectFullResult({
                    dids: insertedDids,
                    totalCount: insertedDids.length,
                    filteredCount: insertedDids.length,
                    pageNumber: 1n,
                    totalPages: 1n,
                })
            })
            it('GIVEN inserted documents WHEN try to get bit by bit THEN returns little lists', async () => {
                DidsResultValidator.validate(
                    (await didRegistry.getDids(1, 2)) as ContractGetDidsResult
                )
                    .expectDidsArray(insertedDids.slice(0, 2))
                    .expectCounts(insertedDids.length, 2)
                    .expectPaginationInfo(1n, 2n)
                DidsResultValidator.validate(
                    (await didRegistry.getDids(2, 2)) as ContractGetDidsResult
                )
                    .expectDidsArray(insertedDids.slice(2, 4))
                    .expectCounts(insertedDids.length, 2)
                    .expectPaginationInfo(1n, 3n)
                DidsResultValidator.validate(await didRegistry.getDids(3, 2))
                    .expectDidsArray(insertedDids.slice(4))
                    .expectCounts(insertedDids.length, 1)
                    .expectPaginationInfo(2n, 3n)
            })
            it('GIVEN inserted documents WHEN try to get out of the list THEN returns emtpy list', async () => {
                DidsResultValidator.validate(await didRegistry.getDids(2, 5))
                    .expectDidsArray([])
                    .expectCounts(insertedDids.length, 0)
                    .expectPaginationInfo(1n, 1n)
            })
        })

        describe('getDidsByVerificationRelationship', () => {
            let wallet: HDNodeWallet
            let insertedDids: string[]
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                insertedDids = []
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    // Insert first DID with proof (DID derives from proof)
                    const proof = generateProof(wallet)
                    const firstDid = proofToDid(proof)
                    insertedDids.push(firstDid)

                    await didRegistry.insertFirstDidDocument(
                        firstDid,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ''
                    )

                    // Set timestamp so caller can use insertDidDocument
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                    // Insert remaining DIDs using insertDidDocument (proof-derived DIDs)
                    // Note: All DIDs use the same vMethodId so they can be queried by verification relationship
                    for (let i = 1; i < 5; i++) {
                        const loopWallet = deriveWallet(wallet, `${i + 20}`)
                        const loopProof = generateProof(loopWallet)
                        const did = proofToDid(loopProof)
                        const loopPublicKey = walletToPublicKey(loopWallet)
                        insertedDids.push(did)

                        await didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            loopProof,
                            loopPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    }
                }
                await loadFixture(fixture)
            })
            it('GIVEN inserted documents WHEN try to get more relationships than stored THEN can recover', async () => {
                VerificationRelationshipResultValidator.validate(
                    await didRegistry.getDidsByVerificationRelationship(
                        vMethodId,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        1,
                        20
                    )
                )
                    .expectTotal(5)
                    .expectHowMany(5)
                    .expectPrev(1)
                    .expectNext(1)
                    .expectDidsOnlyAndDates(
                        insertedDids,
                        new Array(5).fill(notBefore as bigint),
                        new Array(5).fill(notAfter as bigint)
                    )
                    .expectConsistentPagination(1, 10)
            })
            it('GIVEN inserted documents WHEN try to get bit by bit THEN returns little lists', async () => {
                VerificationRelationshipResultValidator.validate(
                    await didRegistry.getDidsByVerificationRelationship(
                        vMethodId,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        1,
                        2
                    )
                )
                    .expectTotal(5)
                    .expectHowMany(2)
                    .expectPrev(1)
                    .expectNext(2)
                    .expectDidsOnlyAndDates(
                        insertedDids.slice(0, 2),
                        new Array(2).fill(notBefore as bigint),
                        new Array(2).fill(notAfter as bigint)
                    )
                    .expectConsistentPagination(1, 2)
                VerificationRelationshipResultValidator.validate(
                    await didRegistry.getDidsByVerificationRelationship(
                        vMethodId,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        2,
                        2
                    )
                )
                    .expectTotal(5)
                    .expectHowMany(2)
                    .expectPrev(1)
                    .expectNext(3)
                    .expectDidsOnlyAndDates(
                        insertedDids.slice(2, 4),
                        new Array(2).fill(notBefore as bigint),
                        new Array(2).fill(notAfter as bigint)
                    )
                    .expectConsistentPagination(2, 2)
                VerificationRelationshipResultValidator.validate(
                    await didRegistry.getDidsByVerificationRelationship(
                        vMethodId,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        3,
                        2
                    )
                )
                    .expectTotal(5)
                    .expectHowMany(1)
                    .expectPrev(2)
                    .expectNext(3)
                    .expectDidsOnlyAndDates(
                        insertedDids.slice(4, 5),
                        new Array(1).fill(notBefore as bigint),
                        new Array(1).fill(notAfter as bigint)
                    )
                    .expectConsistentPagination(3, 2)
            })
            it('GIVEN inserted documents WHEN try to get out of the list THEN returns emtpy list', async () => {
                VerificationRelationshipResultValidator.validate(
                    await didRegistry.getDidsByVerificationRelationship(
                        vMethodId,
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        2,
                        5
                    )
                )
                    .expectTotal(5)
                    .expectHowMany(0)
                    .expectPrev(1)
                    .expectNext(1)
                    .expectDidsOnlyAndDates([], [], [])
                    .expectConsistentPagination(2, 5)
            })
        })

        describe('getDidsByController', () => {
            let insertedDids: string[]
            let controllerDid: string
            let controllerWallet: HDNodeWallet

            beforeEach(async () => {
                controllerWallet = walletOfFirstSigner()
                randomizeDidDocument(controllerWallet)
                insertedDids = []
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                    const proof = generateProof(controllerWallet)
                    controllerDid = proofToDid(proof)

                    await didRegistry.insertFirstDidDocument(
                        controllerDid,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ''
                    )

                    for (let i = 0; i < 4; i++) {
                        const currentWallet = deriveWallet(
                            controllerWallet,
                            (i + 100).toString()
                        )
                        const didProof = generateProof(currentWallet)
                        const didPublicKey = walletToPublicKey(currentWallet)
                        const did = proofToDid(didProof)
                        insertedDids.push(did)
                        await didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            didProof,
                            didPublicKey,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    }
                }
                await loadFixture(fixture)
                insertedDids = [controllerDid].concat(insertedDids)
            })
            it('GIVEN controlled documents WHEN try to get more than exists THEN returns full list', async () => {
                const dids: ContractGetDidsResult =
                    (await didRegistry.getDidsByController(
                        controllerDid,
                        1,
                        insertedDids.length * 2
                    )) as unknown as ContractGetDidsResult
                DidsResultValidator.validate(dids).expectFullResult({
                    dids: insertedDids,
                    totalCount: insertedDids.length,
                    filteredCount: insertedDids.length,
                    pageNumber: 1n,
                    totalPages: 1n,
                })
            })
            it('GIVEN controlled documents WHEN try to get bit by bit THEN returns little lists', async () => {
                DidsResultValidator.validate(
                    (await didRegistry.getDidsByController(
                        controllerDid,
                        1,
                        2
                    )) as ContractGetDidsResult
                )
                    .expectDidsArray(insertedDids.slice(0, 2))
                    .expectCounts(insertedDids.length, 2)
                    .expectPaginationInfo(1n, 2n)
                DidsResultValidator.validate(
                    (await didRegistry.getDidsByController(
                        controllerDid,
                        2,
                        2
                    )) as ContractGetDidsResult
                )
                    .expectDidsArray(insertedDids.slice(2, 4))
                    .expectCounts(insertedDids.length, 2)
                    .expectPaginationInfo(1n, 3n)
                DidsResultValidator.validate(
                    await didRegistry.getDidsByController(controllerDid, 3, 2)
                )
                    .expectDidsArray(insertedDids.slice(4))
                    .expectCounts(insertedDids.length, 1)
                    .expectPaginationInfo(2n, 3n)
            })
            it('GIVEN controlled documents WHEN try to get out of the list THEN returns emtpy list', async () => {
                DidsResultValidator.validate(
                    await didRegistry.getDidsByController(controllerDid, 2, 5)
                )
                    .expectDidsArray([])
                    .expectCounts(insertedDids.length, 0)
                    .expectPaginationInfo(1n, 1n)
            })
        })

        describe('Controller Management with Last Controller Protection', () => {
            beforeEach(async () => {
                ;({ did } = await createStandardFixture())
            })

            it('FIXED: Should fail when trying to revoke the only controller', async () => {
                // GIVEN: The DID is its own controller (standard setup creates this)
                await expectControllerState(did, 1, [
                    { controller: did, shouldExist: true },
                ])

                // WHEN/THEN: Try to revoke the only controller should fail
                await expectRevocationToFail(did, did)

                // THEN: Verify DID still have its controller
                await expectControllerState(did, 1, [
                    { controller: did, shouldExist: true },
                ])
            })

            it('FIXED: Should fail when revoking the last remaining controller', async () => {
                // GIVEN: Create additional controller and remove original
                const [controller] = await addMultipleControllers(did, 1)

                // Remove the original controller (DID as its own controller)
                await didRegistry.revokeController(did, did)

                // Verify we have only one controller left
                await expectControllerState(did, 1, [
                    { controller, shouldExist: true },
                    { controller: did, shouldExist: false },
                ])

                // WHEN/THEN: Try to revoke the last remaining controller should fail
                await expectRevocationToFail(did, controller)

                // THEN: Verify DID still have the controller
                await expectControllerState(did, 1, [
                    { controller, shouldExist: true },
                ])
            })

            it('EXPECTED BEHAVIOR: Should succeed when revoking a controller but leaving others', async () => {
                // GIVEN: Create multiple controllers
                const [controller1, controller2] = await addMultipleControllers(
                    did,
                    2
                )

                // Verify we have 3 controllers (including self)
                await expectControllerState(did, 3, [
                    { controller: did, shouldExist: true },
                    { controller: controller1, shouldExist: true },
                    { controller: controller2, shouldExist: true },
                ])

                // WHEN: Revoke one controller but leave others
                await expect(didRegistry.revokeController(did, controller1))
                    .to.emit(didRegistry, 'ControllerRevoked')
                    .withArgs(did, controller1)

                // THEN: Should still have controllers remaining
                await expectControllerState(did, 2, [
                    { controller: did, shouldExist: true },
                    { controller: controller1, shouldExist: false },
                    { controller: controller2, shouldExist: true },
                ])
            })

            it('FIXED: Should fail when trying to revoke all controllers sequentially', async () => {
                // GIVEN: Create multiple controllers
                const [controller1, controller2] = await addMultipleControllers(
                    did,
                    2
                )

                // Verify we have 3 controllers
                expect(await getControllerCount(did)).to.equal(3)

                // WHEN: Revoke controllers one by one
                // First revocation should succeed
                await didRegistry.revokeController(did, controller1)
                expect(await getControllerCount(did)).to.equal(2)

                // Second revocation should succeed
                await didRegistry.revokeController(did, controller2)
                expect(await getControllerCount(did)).to.equal(1)

                // Third revocation should fail - trying to remove the last controller
                await expectRevocationToFail(did, did)

                // THEN: Verify DID still have one controller
                await expectControllerState(did, 1, [
                    { controller: did, shouldExist: true },
                ])
            })

            it('EDGE CASE: DIDs cannot be left without controllers anymore', async () => {
                // GIVEN: A DID with a single controller (itself)
                await expectControllerState(did, 1, [
                    { controller: did, shouldExist: true },
                ])

                // WHEN/THEN: Try to remove the last controller should fail
                await expectRevocationToFail(did, did)

                // THEN: Verify DID still have its controller and remains manageable
                await expectControllerState(did, 1, [
                    { controller: did, shouldExist: true },
                ])

                // WHEN: Add another controller first
                const [newController] = await addMultipleControllers(did, 1)
                expect(await getControllerCount(did)).to.equal(2)

                // THEN: Now we can safely remove one controller, leaving the other
                await didRegistry.revokeController(did, did)
                await expectControllerState(did, 1, [
                    { controller: newController, shouldExist: true },
                    { controller: did, shouldExist: false },
                ])
            })

            it('Should handle revocation attempts with proper authorization checks', async () => {
                // GIVEN: Create additional controller
                const [controller] = await addMultipleControllers(did, 1)

                // Verify initial state
                expect(await getControllerCount(did)).to.equal(2)

                // WHEN: Authorized user (admin) can revoke controller
                await expect(didRegistry.revokeController(did, controller))
                    .to.emit(didRegistry, 'ControllerRevoked')
                    .withArgs(did, controller)

                // THEN: Controller should be removed
                await expectControllerState(did, 1, [
                    { controller, shouldExist: false },
                    { controller: did, shouldExist: true },
                ])
            })
        })

        describe('getDidDocument', () => {
            beforeEach(async () => {
                const wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )

                    const proof = generateProof(wallet)
                    did = proofToDid(proof)

                    await didRegistry.insertFirstDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ''
                    )
                }
                await loadFixture(fixture)
            })
            it('GIVEN inserted document WHEN try to get it to the future THEN cant recover vMethods', async () => {
                await mockTimestamp.setMockedTimestamp(notBefore - 1n)
                const didDocument = await didRegistry.getDidDocument(did)
                const expectedEmpty = DidDocumentBuilder.empty(baseDocument, [
                    did,
                ])
                DidDocumentVerifier.verifyDidDocument(
                    didDocument,
                    expectedEmpty
                )
            })
            it('GIVEN inserted document WHEN try to get it in present THEN can recover vMethods', async () => {
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                const didDocument = await didRegistry.getDidDocument(did)
                buildAndVerifyBasicDidDocument(
                    didDocument,
                    baseDocument,
                    did,
                    vMethodId,
                    publicKey65,
                    EllipticType.SECP_256_K1,
                    false,
                    notBefore,
                    notAfter
                )
            })
            it('GIVEN inserted document WHEN try to get it in past THEN cant recover vMethodsIds', async () => {
                await mockTimestamp.setMockedTimestamp(notAfter + 1n)
                DidDocumentVerifier.verifyDidDocument(
                    await didRegistry.getDidDocument(did),
                    DidDocumentBuilder.empty(baseDocument, [did])
                )
            })
        })

        describe('getDidDocumentByTimestamp', () => {
            beforeEach(async () => {
                const wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )

                    const proof = generateProof(wallet)
                    did = proofToDid(proof)

                    await didRegistry.insertFirstDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ''
                    )
                }
                await loadFixture(fixture)
            })
            it('GIVEN inserted document WHEN try to get it to the future THEN cant recover vMethods', async () => {
                const didDocument = await didRegistry.getDidDocumentByTimestamp(
                    did,
                    notBefore - 1n
                )
                const expectedEmpty = DidDocumentBuilder.empty(baseDocument, [
                    did,
                ])
                DidDocumentVerifier.verifyDidDocument(
                    didDocument,
                    expectedEmpty
                )
            })
            it('GIVEN inserted document WHEN try to get it in present THEN can recover vMethods', async () => {
                const didDocument = await didRegistry.getDidDocumentByTimestamp(
                    did,
                    notBefore + 1n
                )
                buildAndVerifyBasicDidDocument(
                    didDocument,
                    baseDocument,
                    did,
                    vMethodId,
                    publicKey65,
                    EllipticType.SECP_256_K1,
                    false,
                    notBefore,
                    notAfter
                )
            })
            it('GIVEN inserted document WHEN try to get it in past THEN cant recover vMethodsIds', async () => {
                DidDocumentVerifier.verifyDidDocument(
                    await didRegistry.getDidDocumentByTimestamp(
                        did,
                        notAfter + 1n
                    ),
                    DidDocumentBuilder.empty(baseDocument, [did])
                )
            })
        })

        describe('checkController', () => {
            let wallet: HDNodeWallet
            beforeEach(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )

                    const proof = generateProof(wallet)
                    did = proofToDid(proof)

                    await didRegistry.insertFirstDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        proof,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter,
                        ''
                    )
                }
                await loadFixture(fixture)
            })
            it('GIVEN inserted document WHEN check controller with a non linked did THEN fails', async () => {
                // Set timestamp before notBefore to ensure capability invocation is not yet active
                await mockTimestamp.setMockedTimestamp(notBefore - 1n)
                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    false
                )
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
            })
            it('GIVEN inserted document WHEN check controller with a linked did THEN success', async () => {
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    true
                )
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.true
            })

            it('GIVEN revoked verification method WHEN checking controller THEN returns false', async () => {
                // Move to valid time window first
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // Verify controller status is true initially
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.true

                // Revoke the verification method
                await didRegistry.revokeVerificationMethod(
                    did,
                    vMethodId,
                    notBefore
                )

                // Now controller check should return false
                // This tests the branch where:
                // - vMethodId exists (condition1 = false)
                // - vMethod IS revoked (condition2 = true)
                // - capabilityInvocation mapping still exists (condition3 = false)
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
            })

            it('GIVEN verification method without capability invocation WHEN checking controller THEN returns false', async () => {
                // Move to valid time window for the current did
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // Add another vMethod to the existing DID (this vMethod won't have capability invocation by default)
                const wallet3 = deriveWallet(wallet, '11')
                const publicKey3 = wallet3.signingKey.publicKey
                const vMethodId3 = randomDid()

                await didRegistry.addVerificationMethod(
                    did,
                    vMethodId3,
                    publicKey3,
                    EllipticType.SECP_256_K1
                )

                // This address has a vMethod but no capability invocation relationship
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        await wallet3.getAddress()
                    )
                ).to.be.false
            })

            it('GIVEN address with no vMethodId mapping WHEN checking controller THEN returns false', async () => {
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // Use an address that has never been registered (no vMethodId mapping)
                const randomAddress = ethers.Wallet.createRandom().address

                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        randomAddress
                    )
                ).to.be.false
            })

            it('GIVEN all OR conditions in _hasActiveCapabilityInvocation WHEN checking various scenarios THEN covers all branches', async () => {
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // Scenario 1: Valid controller (vMethodId exists, not revoked, has capability invocation, in time window)
                const walletAddress = await wallet.getAddress()
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        walletAddress
                    )
                ).to.be.true

                // Scenario 2: Add a vMethod with SECP_256_R1 (different from network)
                // This creates a vMethod but doesn't add to vMethodIdOfAddress
                const wallet4 = deriveWallet(wallet, '12')
                const publicKey4 = wallet4.signingKey.publicKey
                const vMethodId4 = randomDid()

                await didRegistry.addVerificationMethod(
                    did,
                    vMethodId4,
                    publicKey4,
                    EllipticType.SECP_256_R1
                )

                // This address has a vMethod but since elliptic type doesn't match network,
                // it won't be in vMethodIdOfAddress mapping
                const wallet4Address = await wallet4.getAddress()
                expect(
                    await didRegistry[CHECK_CONTROLLER_BYTES_ADDRESS](
                        did,
                        wallet4Address
                    )
                ).to.be.false
            })
        })

        describe('DID Registry Query Functions', () => {
            let wallet: HDNodeWallet

            beforeEach(async () => {
                const fixture = await createStandardFixture()
                did = fixture.did
                wallet = fixture.wallet
            })

            describe('didOf', () => {
                it('GIVEN address with DID WHEN querying didOf THEN returns correct DID', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                    const walletAddress = await wallet.getAddress()

                    const resolvedDid = await didRegistry.didOf(walletAddress)

                    expect(resolvedDid).to.equal(did)
                    expect(resolvedDid).to.not.equal(ethers.ZeroHash)
                })

                it('GIVEN address without DID WHEN querying didOf THEN returns zero', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                    const unknownAddress = ethers.Wallet.createRandom().address

                    const resolvedDid = await didRegistry.didOf(unknownAddress)

                    expect(resolvedDid).to.equal(ethers.ZeroHash)
                })

                it('GIVEN address with revoked verification method WHEN querying didOf THEN returns zero', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                    const walletAddress = await wallet.getAddress()

                    // Initially returns DID
                    expect(await didRegistry.didOf(walletAddress)).to.equal(did)

                    // Revoke the verification method
                    await didRegistry.revokeVerificationMethod(
                        did,
                        vMethodId,
                        notBefore
                    )

                    // After revocation, should return zero
                    expect(await didRegistry.didOf(walletAddress)).to.equal(
                        ethers.ZeroHash
                    )
                })

                it('GIVEN address with vMethod but no capability invocation WHEN querying didOf THEN returns zero', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                    // Add a vMethod without capability invocation
                    const wallet2 = deriveWallet(wallet, '20')
                    const publicKey2 = wallet2.signingKey.publicKey
                    const vMethodId2 = randomDid()

                    await didRegistry.addVerificationMethod(
                        did,
                        vMethodId2,
                        publicKey2,
                        EllipticType.SECP_256_K1
                    )

                    // This address has a vMethod but no capability invocation
                    const wallet2Address = await wallet2.getAddress()
                    expect(await didRegistry.didOf(wallet2Address)).to.equal(
                        ethers.ZeroHash
                    )
                })
            })

            describe('isKnownDid', () => {
                it('GIVEN address with active DID WHEN checking isKnownDid THEN returns true', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                    const walletAddress = await wallet.getAddress()

                    expect(await didRegistry.isKnownDid(walletAddress)).to.be
                        .true
                })

                it('GIVEN address without DID WHEN checking isKnownDid THEN returns false', async () => {
                    const unknownAddress = ethers.Wallet.createRandom().address

                    expect(await didRegistry.isKnownDid(unknownAddress)).to.be
                        .false
                })

                it('GIVEN address with revoked capability invocation WHEN checking isKnownDid THEN returns false', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                    const walletAddress = await wallet.getAddress()

                    // Initially returns true
                    expect(await didRegistry.isKnownDid(walletAddress)).to.be
                        .true

                    // Revoke the verification method (which revokes capability invocation)
                    await didRegistry.revokeVerificationMethod(
                        did,
                        vMethodId,
                        notBefore
                    )

                    // After revocation, should return false
                    expect(await didRegistry.isKnownDid(walletAddress)).to.be
                        .false
                })

                it('GIVEN address with vMethod but no capability invocation WHEN checking isKnownDid THEN returns false', async () => {
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                    // Add a vMethod without capability invocation
                    const wallet3 = deriveWallet(wallet, '21')
                    const publicKey3 = wallet3.signingKey.publicKey
                    const vMethodId3 = randomDid()

                    await didRegistry.addVerificationMethod(
                        did,
                        vMethodId3,
                        publicKey3,
                        EllipticType.SECP_256_K1
                    )

                    // This address has a vMethod but no capability invocation
                    const wallet3Address = await wallet3.getAddress()
                    expect(await didRegistry.isKnownDid(wallet3Address)).to.be
                        .false
                })

                it('GIVEN address with expired capability invocation WHEN checking isKnownDid THEN returns false', async () => {
                    // Set time to after expiration
                    await mockTimestamp.setMockedTimestamp(notAfter + 1n)
                    const walletAddress = await wallet.getAddress()

                    // After expiration, should return false
                    expect(await didRegistry.isKnownDid(walletAddress)).to.be
                        .false
                })
            })
        })

        describe('Facet Introspection Functions', () => {
            describe('DidDocumentDetailedFacet introspection', () => {
                it('GIVEN DidDocumentDetailedFacet WHEN calling interfacesIntrospection THEN returns interface IDs', async () => {
                    const interfaces =
                        await didDocumentDetailedFacet.interfacesIntrospection()

                    expect(interfaces.length).to.be.greaterThan(0)
                    // Should contain IDidDocumentDetailed interface
                    expect(interfaces).to.not.be.empty
                })

                it('GIVEN DidDocumentDetailedFacet WHEN calling businessIdIntrospection THEN returns correct business ID', async () => {
                    const businessId =
                        await didDocumentDetailedFacet.businessIdIntrospection()

                    expect(businessId).to.equal(
                        DID_DOCUMENT_DETAILED_RESOLVER_KEY
                    )
                })

                it('GIVEN DidDocumentDetailedFacet WHEN calling selectorsIntrospection THEN returns selectors', async () => {
                    const selectors =
                        await didDocumentDetailedFacet.selectorsIntrospection()

                    expect(selectors.length).to.be.greaterThan(0)
                })
            })

            describe('DidControllerFacet introspection', () => {
                it('GIVEN DidControllerFacet WHEN calling interfacesIntrospection THEN returns interface IDs', async () => {
                    const interfaces =
                        await didControllerFacet.interfacesIntrospection()

                    expect(interfaces.length).to.be.greaterThan(0)
                    expect(interfaces).to.not.be.empty
                })

                it('GIVEN DidControllerFacet WHEN calling businessIdIntrospection THEN returns correct business ID', async () => {
                    const businessId =
                        await didControllerFacet.businessIdIntrospection()

                    expect(businessId).to.equal(DID_CONTROLLER_RESOLVER_KEY)
                })

                it('GIVEN DidControllerFacet WHEN calling selectorsIntrospection THEN returns selectors', async () => {
                    const selectors =
                        await didControllerFacet.selectorsIntrospection()

                    expect(selectors.length).to.be.greaterThan(0)
                })
            })

            describe('DidVerificationMethodFacet introspection', () => {
                it('GIVEN DidVerificationMethodFacet WHEN calling interfacesIntrospection THEN returns interface IDs', async () => {
                    const interfaces =
                        await didVerificationMethodFacet.interfacesIntrospection()

                    expect(interfaces.length).to.be.greaterThan(0)
                    expect(interfaces).to.not.be.empty
                })

                it('GIVEN DidVerificationMethodFacet WHEN calling businessIdIntrospection THEN returns correct business ID', async () => {
                    const businessId =
                        await didVerificationMethodFacet.businessIdIntrospection()

                    expect(businessId).to.equal(
                        DID_VERIFICATION_METHOD_RESOLVER_KEY
                    )
                })

                it('GIVEN DidVerificationMethodFacet WHEN calling selectorsIntrospection THEN returns selectors', async () => {
                    const selectors =
                        await didVerificationMethodFacet.selectorsIntrospection()

                    expect(selectors.length).to.be.greaterThan(0)
                })
            })

            describe('DidVerificationRelationshipFacet introspection', () => {
                it('GIVEN DidVerificationRelationshipFacet WHEN calling interfacesIntrospection THEN returns interface IDs', async () => {
                    const interfaces =
                        await didVerificationRelationshipFacet.interfacesIntrospection()

                    expect(interfaces.length).to.be.greaterThan(0)
                    expect(interfaces).to.not.be.empty
                })

                it('GIVEN DidVerificationRelationshipFacet WHEN calling businessIdIntrospection THEN returns correct business ID', async () => {
                    const businessId =
                        await didVerificationRelationshipFacet.businessIdIntrospection()

                    expect(businessId).to.equal(
                        DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY
                    )
                })

                it('GIVEN DidVerificationRelationshipFacet WHEN calling selectorsIntrospection THEN returns selectors', async () => {
                    const selectors =
                        await didVerificationRelationshipFacet.selectorsIntrospection()

                    expect(selectors.length).to.be.greaterThan(0)
                })
            })

            describe('DidRegistryQueryFacet introspection', () => {
                it('GIVEN DidRegistryQueryFacet WHEN calling interfacesIntrospection THEN returns interface IDs', async () => {
                    const interfaces =
                        await didRegistryQueryFacet.interfacesIntrospection()

                    expect(interfaces.length).to.be.greaterThan(0)
                    expect(interfaces).to.not.be.empty
                })

                it('GIVEN DidRegistryQueryFacet WHEN calling businessIdIntrospection THEN returns correct business ID', async () => {
                    const businessId =
                        await didRegistryQueryFacet.businessIdIntrospection()

                    expect(businessId).to.equal(DID_REGISTRY_QUERY_RESOLVER_KEY)
                })

                it('GIVEN DidRegistryQueryFacet WHEN calling selectorsIntrospection THEN returns selectors', async () => {
                    const selectors =
                        await didRegistryQueryFacet.selectorsIntrospection()

                    expect(selectors.length).to.be.greaterThan(0)
                    expect(selectors.length).to.equal(2) // didOf and isKnownDid
                })
            })
        })
    })
})
