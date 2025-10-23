import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import {
    DidControllerFacet,
    DidDocumentDetailedFacet,
    DidVerificationMethodFacet,
    DidVerificationRelationshipFacet,
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
} from '../constants'
import {
    CONFIGURATION_ID_DID_REGISTRY,
    deployGovernance,
} from '../initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    DidDocumentBuilder,
    DidDocumentVerifier,
    DidsResultValidator,
    ContractGetDidsResult,
    VerificationRelationshipResultValidator,
} from '../utils/identity'
import { randomHex, randomInt, TestConstants, EMPTY_VALUES } from '../testUtils'
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

// --- Test Data Generation ---
let baseDocument: string
let vMethodId: string
let publicKeyInvalindLength: string
let publicKey65: string
let publicKey64: string
let publicKey65Incorrect: string
let notBefore: bigint
let notAfter: bigint

const randomizeDidDocument = (wallet: HDNodeWallet) => {
    baseDocument = TestConstants.randomBaseDocument()
    vMethodId = randomHex(32)
    publicKeyInvalindLength = randomHex()
    publicKey65 = walletToPublicKey(wallet)
    publicKey64 = '0x'.concat(publicKey65.slice(4))
    // Create an incorrect public key with wrong control byte (0x03 instead of 0x04)
    publicKey65Incorrect = '0x03' + publicKey65.slice(4)
    notBefore = randomInt()
    notAfter = notBefore + TEST_VALIDITY_DURATION
}

// --- Fixture Helpers ---
let didRegistry: IDidRegistry
let mockTimestamp: MockTimestampFacet
let didDocumentDetailedFacet: DidDocumentDetailedFacet
let didControllerFacet: DidControllerFacet
let didVerificationMethodFacet: DidVerificationMethodFacet
let didVerificationRelationshipFacet: DidVerificationRelationshipFacet

/**
 * Helper function to create a standard test fixture:
 * - Creates and randomizes wallet
 * - Initializes the DID registry
 * - Inserts a DID document
 * - Sets the mock timestamp to notBefore + 1
 * - Returns wallet for tests that need it
 */
async function createStandardFixture(did: string) {
    const wallet = walletOfFirstSigner()
    randomizeDidDocument(wallet)

    await didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)
    await didRegistry.insertDidDocument(
        did,
        baseDocument,
        vMethodId,
        publicKey65,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter
    )
    await mockTimestamp.setMockedTimestamp(notBefore + 1n)

    return { wallet }
}

/**
 * Helper function to insert a controller DID document with random data
 */
async function insertControllerDocument(controllerId: string): Promise<void> {
    await didRegistry.insertDidDocument(
        controllerId,
        TestConstants.randomDid(),
        TestConstants.randomDid(),
        publicKey64,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter
    )
}

// --- Assertion Helpers ---
/**
 * Helper function to test insert document with invalid parameters
 */
async function expectInsertDocumentToFail(
    did: string | typeof ZeroHash,
    baseDoc: string,
    vMethodId: string,
    publicKey: string | Uint8Array,
    ellipticType: EllipticType,
    notBefore: bigint | number,
    notAfter: bigint | number,
    expectedError: string
): Promise<void> {
    await expect(
        didRegistry.insertDidDocument(
            did,
            baseDoc,
            vMethodId,
            publicKey,
            ellipticType,
            notBefore,
            notAfter
        )
    ).to.be.revertedWithCustomError(didDocumentDetailedFacet, expectedError)
}

/**
 * Helper function to test insert document with invalid parameters
 */
async function expectInsertDocumentToFail(
    did: string | typeof ZeroHash,
    baseDoc: string,
    vMethodId: string,
    publicKey: string | Uint8Array,
    ellipticType: EllipticType,
    notBefore: bigint | number,
    notAfter: bigint | number,
    expectedError: string
): Promise<void> {
    await expect(
        didRegistry.insertDidDocument(
            did,
            baseDoc,
            vMethodId,
            publicKey,
            ellipticType,
            notBefore,
            notAfter
        )
    ).to.be.revertedWithCustomError(didDocumentDetailedFacet, expectedError)
}

// --- Assertion Helpers ---
/**
 * Helper function to test insert document with invalid parameters
 */
async function expectInsertDocumentToFail(
    did: string | typeof ZeroHash,
    baseDoc: string,
    vMethodId: string,
    publicKey: string | Uint8Array,
    ellipticType: EllipticType,
    notBefore: bigint | number,
    notAfter: bigint | number,
    expectedError: string
): Promise<void> {
    await expect(
        didRegistry.insertDidDocument(
            did,
            baseDoc,
            vMethodId,
            publicKey,
            ellipticType,
            notBefore,
            notAfter
        )
    ).to.be.revertedWithCustomError(didDocumentDetailedFacet, expectedError)
}

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

/**
 * Helper function to verify rolled verification method document
 */
async function verifyRolledDocument(
    did: string,
    rollArgs: IDidVerificationMethod.RollArgsStruct,
    oldVMethodElliptic: EllipticType,
    newVMethodElliptic: EllipticType
): Promise<void> {
    await mockTimestamp.setMockedTimestamp(BigInt(rollArgs.notBefore) + 1n)
    const didDocument = await didRegistry.getDidDocument(did)
    const newNotAfter = BigInt(rollArgs.notBefore) + BigInt(rollArgs.duration)

    const expectedComplete = new DidDocumentBuilder(baseDocument, [did])
        .addVMethod(vMethodId, publicKey65, oldVMethodElliptic, false)
        .addVMethod(
            ethers.hexlify(rollArgs.vMethodId),
            ethers.hexlify(rollArgs.publicKey),
            newVMethodElliptic,
            false
        )
        .addVRelationship(
            AUTHENTICATION_RELATIONSHIP,
            vMethodId,
            notBefore,
            newNotAfter,
            0
        )
        .addVRelationship(
            AUTHENTICATION_RELATIONSHIP,
            ethers.hexlify(rollArgs.vMethodId),
            BigInt(rollArgs.notBefore),
            BigInt(rollArgs.notAfter),
            0
        )
        .addVRelationship(
            CAPABILITY_INVOCATION_RELATIONSHIP,
            vMethodId,
            notBefore,
            newNotAfter,
            0
        )
        .addVRelationship(
            CAPABILITY_INVOCATION_RELATIONSHIP,
            ethers.hexlify(rollArgs.vMethodId),
            BigInt(rollArgs.notBefore),
            BigInt(rollArgs.notAfter),
            0
        )
        .build()

    DidDocumentVerifier.verifyDidDocument(didDocument, expectedComplete)
}

// --- Controller Management Helpers ---
/**
 * Helper function to count active controllers for a DID
 */
async function getControllerCount(didId: string): Promise<number> {
    const didDocument = await didRegistry.getDidDocument(didId)
    return didDocument[1].length // controllers is the second return value
}

/**
 * Helper function to check if a DID is a controller of another DID
 */
async function isDidController(
    didId: string,
    controllerDid: string
): Promise<boolean> {
    const didDocument = await didRegistry.getDidDocument(didId)
    return didDocument[1].includes(controllerDid) // controllers is the second return value
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
        const controller = TestConstants.randomDid()
        await insertControllerDocument(controller)
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
            undefined,
            CONFIGURATION_ID_DID_REGISTRY
        )

        expect(
            await gov.didDocumentDetailedFacet.businessIdIntrospection()
        ).to.be.equal(DID_DOCUMENT_DETAILED_RESOLVER_KEY)
        expect(
            await gov.didDocumentDetailedFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x67803adc'])

        return {
            admin: adminSigner,
            other: otherSigner,
            otherAddress,
            didDocumentDetailedFacet: gov.didDocumentDetailedFacet,
            didControllerFacet: gov.didControllerFacet,
            didVerificationMethodFacet: gov.didVerificationMethodFacet,
            didVerificationRelationshipFacet:
                gov.didVerificationRelationshipFacet,
            didRegistry: gov.didRegistry,
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

        describe('insertDidDocument', () => {
            before(async () => {
                randomizeDidDocument(ethers.Wallet.createRandom())
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                }
                await loadFixture(fixture)
                did = TestConstants.randomDid()
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty did THEN it fails', async () => {
                await expectInsertDocumentToFail(
                    ZeroHash,
                    baseDocument,
                    vMethodId,
                    publicKey65Incorrect,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    'EmptyBytes32'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty baseDocument THEN it fails', async () => {
                await expectInsertDocumentToFail(
                    did,
                    emptyString,
                    vMethodId,
                    publicKey65Incorrect,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    'EmptyString'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty vMethodId THEN it fails', async () => {
                await expectInsertDocumentToFail(
                    did,
                    baseDocument,
                    ZeroHash,
                    publicKey65Incorrect,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    'EmptyBytes32'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty publicKey THEN it fails', async () => {
                await expectInsertDocumentToFail(
                    did,
                    baseDocument,
                    vMethodId,
                    emptyBytes,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    'EmptyBytes'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty elliptic type THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticTypeTest.NONE,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'InvalidEllipticCurve'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with different elliptic type THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_R1,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'FirstPublicKeyMustBeTheSameThanTheNetwork'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty after date THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        0,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty after date THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        0
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyUint'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with invalid dates THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notBefore - 1n
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'InvalidDates'
                )
            })
            it('GIVEN a deployed didRegistry WHEN try to insert did document with correct duplicated did THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                )
                    .to.emit(didRegistry, 'DidDocumentInserted')
                    .withArgs(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                )
                    .to.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'DidAlreadyExists'
                    )
                    .withArgs(did)
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with publicKey with bad prefix THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'InvalidControlBytes'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with publicKey 65 THEN it success', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKeyInvalindLength,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'InvalidPubKeyLength'
                )
            })

            it('GIVEN initialized didRegistry WHEN try to insert did document in current time THEN it success', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                )
                    .to.emit(didRegistry, 'DidDocumentInserted')
                    .withArgs(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
            })
        })

        describe('updateDidDocument', () => {
            beforeEach(async () => {
                did = TestConstants.randomDid()
                await createStandardFixture(did)
            })

            it('GIVEN an inserted document WHEN try to update with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.updateBaseDocument(
                        ZeroHash,
                        TestConstants.randomDid()
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyBytes32'
                )
            })

            it('GIVEN an inserted document WHEN try to update with empty baseDocument THEN it fails', async () => {
                await expect(
                    didRegistry.updateBaseDocument(
                        TestConstants.randomDid(),
                        ''
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to update an not inserted did THEN it fails', async () => {
                const newDid = TestConstants.randomDid()
                await expect(
                    didRegistry.updateBaseDocument(
                        newDid,
                        TestConstants.randomDid()
                    )
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
                        .updateBaseDocument(did, TestConstants.randomDid())
                )
                    .to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, otherAddress)
            })

            it('GIVEN initialized didRegistry WHEN try to update base document THEN it success', async () => {
                const newBaseDocument = TestConstants.randomDid()
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
                did = TestConstants.randomDid()
                const fixtures = await createStandardFixture(did)
                wallet = fixtures.wallet
            })

            it('GIVEN an inserted document WHEN try to add V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        ZeroHash,
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
                        publicKey64,
                        EllipticTypeTest.NONE
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'InvalidEllipticCurve'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with not inserted did THEN it fails', async () => {
                const newDid = TestConstants.randomDid()
                await expect(
                    didRegistry.addVerificationMethod(
                        newDid,
                        TestConstants.randomDid(),
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
                const newVMethodId = TestConstants.randomDid()
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
                const newMethodId = TestConstants.randomDid()
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
                const newVMethodId = TestConstants.randomDid()
                const newPublicKey = walletToPublicKey(
                    deriveWallet(wallet, '1')
                )

                expect(
                    await didRegistry.addVerificationMethod(
                        did,
                        newVMethodId,
                        newPublicKey,
                        EllipticType.SECP_256_R1
                    )
                )
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodAdded'
                    )
                    .withArgs(
                        did,
                        newVMethodId,
                        newPublicKey,
                        EllipticType.SECP_256_R1
                    )

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
        })

        describe('revokeVerificationMethod', () => {
            beforeEach(async () => {
                did = TestConstants.randomDid()
                await createStandardFixture(did)
            })

            it('GIVEN an inserted document WHEN try to revoke V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        ZeroHash,
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        ZeroHash,
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with not inserted did THEN it fails', async () => {
                const newDid = TestConstants.randomDid()
                await expect(
                    didRegistry.revokeVerificationMethod(
                        newDid,
                        TestConstants.randomDid(),
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
                const newVMethodId = TestConstants.randomDid()
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
                expect(
                    await didRegistry.revokeVerificationMethod(
                        did,
                        vMethodId,
                        notBefore
                    )
                )
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodRevoked'
                    )
                    .withArgs(did, vMethodId, notBefore)

                const didDocument = await didRegistry.getDidDocument(did)
                buildAndVerifyBasicDidDocument(
                    didDocument,
                    baseDocument,
                    did,
                    vMethodId,
                    publicKey65,
                    EllipticType.SECP_256_K1,
                    true,
                    notBefore,
                    notAfter
                )
                await expectControllerStatus(
                    did,
                    await admin.getAddress(),
                    false
                )
            })
        })

        describe('expireVerificationMethod', () => {
            let wallet: HDNodeWallet

            beforeEach(async () => {
                did = TestConstants.randomDid()
                const fixtures = await createStandardFixture(did)
                wallet = fixtures.wallet
            })

            it('GIVEN an inserted document WHEN try to expire V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        ZeroHash,
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        ZeroHash,
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with not inserted did THEN it fails', async () => {
                const newDid = TestConstants.randomDid()
                await expect(
                    didRegistry.expireVerificationMethod(
                        newDid,
                        TestConstants.randomDid(),
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
                const newVMethodId = TestConstants.randomDid()
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
            it('GIVEN an inserted document WHEN try to expire V.M. of same elliptic type than NW THEN it success', async () => {
                expect(
                    await didRegistry.expireVerificationMethod(
                        did,
                        vMethodId,
                        notBefore + 2n
                    )
                )
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodExpired'
                    )
                    .withArgs(did, vMethodId, notBefore)

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
                await expectControllerStatus(
                    did,
                    await admin.getAddress(),
                    false
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. of added NW THEN it success', async () => {
                const newVMethodId = TestConstants.randomDid()
                await didRegistry.addVerificationMethod(
                    did,
                    newVMethodId,
                    walletToPublicKey(deriveWallet(wallet, '1')),
                    EllipticType.SECP_256_R1
                )
                expect(
                    await didRegistry.expireVerificationMethod(
                        did,
                        newVMethodId,
                        notBefore + 2n
                    )
                )
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodExpired'
                    )
                    .withArgs(did, newVMethodId, notBefore)

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
                did = TestConstants.randomDid()
                const fixtures = await createStandardFixture(did)
                wallet = fixtures.wallet

                // Additional setup specific to roll tests
                rolledWallet = deriveWallet(wallet, '1')
                const newNotBefore = notAfter + (randomInt() % 1_000_000n)
                rollArgs = {
                    did: did,
                    vMethodId: TestConstants.randomDid(),
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
                rollArgs.did = TestConstants.randomDid()
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
                rollArgs.oldVMethodId = TestConstants.randomDid()
                await expect(didRegistry.rollVerificationMethod(rollArgs))
                    .to.be.revertedWithCustomError(
                        didVerificationMethodFacet,
                        'VerificationMethodNotExists'
                    )
                    .withArgs(did, rollArgs.oldVMethodId)
            })
            it('GIVEN an inserted document WHEN try to roll V.M. of same elliptic type than NW THEN it success', async () => {
                expect(await didRegistry.rollVerificationMethod(rollArgs))
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodRolled'
                    )
                    .withArgs(Object.values(rollArgs))

                // Before roll activation: neither wallet is controller yet
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

                // Verify rolled document structure
                await verifyRolledDocument(
                    did,
                    rollArgs,
                    EllipticType.SECP_256_K1,
                    EllipticType.SECP_256_K1
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
                const newVMethodId = TestConstants.randomDid()
                const vmWallet = deriveWallet(wallet, '1')
                await didRegistry.addVerificationMethod(
                    did,
                    newVMethodId,
                    vmWallet.signingKey.publicKey,
                    EllipticType.SECP_256_R1
                )
                rollArgs.oldVMethodId = newVMethodId
                rollArgs.ellipticType = EllipticType.SECP_256_R1
                expect(await didRegistry.rollVerificationMethod(rollArgs))
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodRolled'
                    )
                    .withArgs(Object.values(rollArgs))

                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    true
                )
                await expectControllerStatus(
                    did,
                    await rolledWallet.getAddress(),
                    false
                )

                const didDocument = await didRegistry.getDidDocument(
                    rollArgs.did
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
                await expectControllerStatus(
                    did,
                    await wallet.getAddress(),
                    true
                )
                await expectControllerStatus(
                    did,
                    await rolledWallet.getAddress(),
                    false
                )
            })

            it('GIVEN a revoked verification method WHEN try to roll THEN it fails', async () => {
                // GIVEN: Add a verification method and then revoke it
                const revokedVMethodId = TestConstants.randomDid()
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
                did = TestConstants.randomDid()
                const fixtures = await createStandardFixture(did)
                wallet = fixtures.wallet
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        ZeroHash,
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        emptyString,
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
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
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
                        notBefore,
                        0n
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with non existent DID THEN it fails', async () => {
                const wrongDid = TestConstants.randomDid()
                await expect(
                    didRegistry.addVerificationRelationship(
                        wrongDid,
                        TestConstants.randomDid(),
                        TestConstants.randomDid(),
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
                const wrongVMethod = TestConstants.randomDid()
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        TestConstants.randomDid(),
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
                            TestConstants.randomDid(),
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
                const wrongName = TestConstants.randomDid()
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
                expect(
                    await didRegistry.addVerificationRelationship(
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
                        notAfter,
                        notAfter
                    )
                await didRegistry.addVerificationRelationship(
                    did,
                    KEY_AGREEMENT_RELATIONSHIP,
                    vMethodId,
                    notBefore,
                    notAfter
                )
                const didDocument = await didRegistry.getDidDocument(did)
                const expectedComplete = new DidDocumentBuilder(baseDocument, [
                    did,
                ])
                    .addVMethod(
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        false
                    )
                    .addVRelationship(
                        AUTHENTICATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .addVRelationship(
                        CAPABILITY_DELEGATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .addVRelationship(
                        KEY_AGREEMENT_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .addVRelationship(
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .build()
                DidDocumentVerifier.verifyDidDocument(
                    didDocument,
                    expectedComplete
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
        })

        describe('addController', () => {
            beforeEach(async () => {
                did = TestConstants.randomDid()
                await createStandardFixture(did)
            })

            it('GIVEN deployed DiDRegistry WHEN try to add empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addController(
                        ZeroHash,
                        TestConstants.randomDid()
                    )
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to add empty controller THEN it fails', async () => {
                await expect(
                    didRegistry.addController(
                        TestConstants.randomDid(),
                        ZeroHash
                    )
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to add non existent did THEN it fails', async () => {
                const randomDiD = TestConstants.randomDid()
                await expect(
                    didRegistry.addController(
                        randomDiD,
                        TestConstants.randomDid()
                    )
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to add non existent controller THEN it fails', async () => {
                const randomDiD = TestConstants.randomDid()
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
                const controller = TestConstants.randomDid()
                await insertControllerDocument(controller)
                await mockTimestamp.setMockedTimestamp(notBefore + 1n)

                // WHEN
                expect(await didRegistry.addController(did, controller))
                    .to.emit(didRegistry, 'ControllerAdded')
                    .withArgs(did, controller)
            })
        })

        describe('revokeController', () => {
            async function addNewController() {
                const controller = TestConstants.randomDid()
                await insertControllerDocument(controller)
                await didRegistry.addController(did, controller)
                return controller
            }

            beforeEach(async () => {
                did = TestConstants.randomDid()
                await createStandardFixture(did)
            })

            it('GIVEN deployed DiDRegistry WHEN try to revoke empty did THEN it fails', async () => {
                await expect(
                    didRegistry.revokeController(
                        ZeroHash,
                        TestConstants.randomDid()
                    )
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke empty controller THEN it fails', async () => {
                await expect(
                    didRegistry.revokeController(
                        TestConstants.randomDid(),
                        ZeroHash
                    )
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyBytes32'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke non existent did THEN it fails', async () => {
                const randomDiD = TestConstants.randomDid()
                await expect(
                    didRegistry.revokeController(
                        randomDiD,
                        TestConstants.randomDid()
                    )
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke non existent controller THEN it fails', async () => {
                const randomDiD = TestConstants.randomDid()
                await expect(didRegistry.revokeController(did, randomDiD))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke not linked controller THEN it fails', async () => {
                // GIVEN
                const controller = TestConstants.randomDid()
                await insertControllerDocument(controller)

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
            const insertedDids = [
                TestConstants.randomDid(),
                TestConstants.randomDid(),
                TestConstants.randomDid(),
                TestConstants.randomDid(),
                TestConstants.randomDid(),
            ]

            beforeEach(async () => {
                randomizeDidDocument(ethers.Wallet.createRandom())
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    for (const did of insertedDids) {
                        await didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            publicKey64,
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
            const insertedDids = [
                TestConstants.randomDid(),
                TestConstants.randomDid(),
                TestConstants.randomDid(),
                TestConstants.randomDid(),
                TestConstants.randomDid(),
            ]
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    for (const did of insertedDids) {
                        await didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            publicKey64,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                    }
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
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
            let controller: string

            beforeEach(async () => {
                randomizeDidDocument(walletOfFirstSigner())
                controller = TestConstants.randomDid()
                insertedDids = [
                    TestConstants.randomDid(),
                    TestConstants.randomDid(),
                    TestConstants.randomDid(),
                    TestConstants.randomDid(),
                ]
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await mockTimestamp.setMockedTimestamp(notBefore + 1n)
                    await didRegistry.insertDidDocument(
                        controller,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                    for (const did of insertedDids) {
                        await didRegistry.insertDidDocument(
                            did,
                            baseDocument,
                            vMethodId,
                            publicKey64,
                            EllipticType.SECP_256_K1,
                            notBefore,
                            notAfter
                        )
                        await didRegistry.addController(did, controller)
                    }
                }
                await loadFixture(fixture)
                insertedDids = [controller].concat(insertedDids)
            })
            it('GIVEN controlled documents WHEN try to get more than exists THEN returns full list', async () => {
                const dids: ContractGetDidsResult =
                    (await didRegistry.getDidsByController(
                        controller,
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
                        controller,
                        1,
                        2
                    )) as ContractGetDidsResult
                )
                    .expectDidsArray(insertedDids.slice(0, 2))
                    .expectCounts(insertedDids.length, 2)
                    .expectPaginationInfo(1n, 2n)
                DidsResultValidator.validate(
                    (await didRegistry.getDidsByController(
                        controller,
                        2,
                        2
                    )) as ContractGetDidsResult
                )
                    .expectDidsArray(insertedDids.slice(2, 4))
                    .expectCounts(insertedDids.length, 2)
                    .expectPaginationInfo(1n, 3n)
                DidsResultValidator.validate(
                    await didRegistry.getDidsByController(controller, 3, 2)
                )
                    .expectDidsArray(insertedDids.slice(4))
                    .expectCounts(insertedDids.length, 1)
                    .expectPaginationInfo(2n, 3n)
            })
            it('GIVEN controlled documents WHEN try to get out of the list THEN returns emtpy list', async () => {
                DidsResultValidator.validate(
                    await didRegistry.getDidsByController(controller, 2, 5)
                )
                    .expectDidsArray([])
                    .expectCounts(insertedDids.length, 0)
                    .expectPaginationInfo(1n, 1n)
            })
        })

        describe('Controller Management with Last Controller Protection', () => {
            beforeEach(async () => {
                did = TestConstants.randomDid()
                await createStandardFixture(did)
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
                randomizeDidDocument(ethers.Wallet.createRandom())
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
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
                    publicKey64,
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
                randomizeDidDocument(ethers.Wallet.createRandom())
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
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
                    publicKey64,
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
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey64,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                }
                await loadFixture(fixture)
            })
            it('GIVEN inserted document WHEN check controller with a non linked did THEN fails', async () => {
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
        })
    })
})
