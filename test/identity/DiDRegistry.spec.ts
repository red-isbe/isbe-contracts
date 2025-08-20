import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import {
    DidControllerFacet,
    DidDocumentDetailedFacet,
    DidVerificationMethodFacet,
    DidVerificationRelationshipFacet,
    IDidRegistry,
    MockTimestampFacet,
} from '../../typechain-types'
import { HDNodeWallet, Signer, Typed } from 'ethers'
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
} from './utils'
import { RollArgsStruct } from '../../typechain-types/contracts/identity/didregistry/IDidRegistry'

enum EllipticType {
    NONE = 0,
    SECP_256_K1 = 1,
    SECP_256_R1 = 2,
}

describe('DiDRegistry', function () {
    let admin: Signer
    let other: Signer
    let otherAddress: string
    let didDocumentDetailedFacet: DidDocumentDetailedFacet
    let didControllerFacet: DidControllerFacet
    let didVerificationMethodFacet: DidVerificationMethodFacet
    let didVerificationRelationshipFacet: DidVerificationRelationshipFacet
    let didRegistry: IDidRegistry
    let mockTimestap: MockTimestampFacet
    const emptyString = ''
    const emptyBytes = randomHx(0)
    let did: string
    let baseDocument: string
    let vMethodId: string
    let publicKey65Incorrect: string
    let notBefore: bigint
    let notAfter: bigint
    let publicKeyInvalindLength: string
    let publicKey65: string
    let publicKey64: string

    const walletToPublicKey = (wallet: HDNodeWallet): string => {
        return wallet.signingKey.publicKey
    }

    const randomizeDidDocument = (wallet: HDNodeWallet) => {
        baseDocument = randomStr()
        vMethodId = randomStr()
        publicKeyInvalindLength = randomHx()
        publicKey65Incorrect = randomHx(65)
        publicKey65 = walletToPublicKey(wallet)
        publicKey64 = '0x'.concat(publicKey65.slice(4))
        notBefore = randomInt()
        notAfter = notBefore + 1000000000000000000n
    }

    // Generar string hexadecimal aleatorio
    function randomHx(length: number = 32): string {
        return ethers.hexlify(ethers.randomBytes(length))
    }

    // Generar string aleatorio desde bytes
    function randomStr(length: number = 10): string {
        const bytes = ethers.randomBytes(Math.ceil(length / 2))
        const hex = ethers.hexlify(bytes).slice(2) // Quitar '0x'
        return hex.slice(0, length)
    }

    function randomInt(): bigint {
        const randomBytes = ethers.randomBytes(32)
        return ethers.toBigInt(ethers.hexlify(randomBytes))
    }

    async function deployInitial() {
        ;[admin, other] = await ethers.getSigners()
        otherAddress = await other.getAddress()
        const gov = await deployGovernance(
            admin,
            undefined,
            CONFIGURATION_ID_DID_REGISTRY
        )
        didDocumentDetailedFacet = gov.didDocumentDetailedFacet
        didControllerFacet = gov.didControllerFacet
        didVerificationMethodFacet = gov.didVerificationMethodFacet
        didVerificationRelationshipFacet = gov.didVerificationRelationshipFacet
        didRegistry = gov.didRegistry
        mockTimestap = gov.mockTimestamp
        expect(
            await didDocumentDetailedFacet.businessIdIntrospection()
        ).to.be.equal(DID_DOCUMENT_DETAILED_RESOLVER_KEY)
        expect(
            await didDocumentDetailedFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x40350ddb'])
    }

    beforeEach(async () => {
        await loadFixture(deployInitial)
    })

    function walletOfFirstSigner() {
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

    describe('DiDRegistry', () => {
        describe('initializeDidRegistry', () => {
            it('GIVEN deployed didRegistry WHEN try to initialize with non elliptic type THEN it fails', async () => {
                await expect(
                    didRegistry.initializeDiDRegistry(EllipticType.NONE)
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
                did = randomStr()
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        emptyString,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty baseDocument THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        emptyString,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty vMethodId THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        emptyString,
                        publicKey65Incorrect,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty publicKey65Incorrect THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
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
            it('GIVEN initialized didRegistry WHEN try to insert did document with empty elliptic type THEN it fails', async () => {
                await expect(
                    didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65Incorrect,
                        EllipticType.NONE,
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
            let wallet: HDNodeWallet
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                }
                await loadFixture(fixture)
            })

            it('GIVEN an inserted document WHEN try to update with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.updateBaseDocument('', randomStr())
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to update with empty baseDocument THEN it fails', async () => {
                await expect(
                    didRegistry.updateBaseDocument(randomStr(), '')
                ).to.be.revertedWithCustomError(
                    didDocumentDetailedFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to update an not inserted did THEN it fails', async () => {
                const neewDid = randomStr()
                await expect(
                    didRegistry.updateBaseDocument(neewDid, randomStr())
                )
                    .to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'DidNotExists'
                    )
                    .withArgs(neewDid)
            })

            it('GIVEN an inserted document WHEN try to update without rights THEN it fails', async () => {
                await expect(didRegistry.updateBaseDocument(did, randomStr()))
                    .to.be.revertedWithCustomError(
                        didDocumentDetailedFacet,
                        'ControllerNotAuthorized'
                    )
                    .withArgs(did, await admin.getAddress())
            })

            it('GIVEN initialized didRegistry WHEN try to insert did document in current time THEN it success', async () => {
                const newBaseDocument = randomStr()
                await mockTimestap.setMockedTimestamp(notBefore + 1n)
                await expect(
                    didRegistry.updateBaseDocument(did, newBaseDocument)
                )
                    .to.emit(didRegistry, 'BaseDocumentUpdated')
                    .withArgs(did, newBaseDocument)
            })
        })

        describe('addVerificationMethod', () => {
            let wallet: HDNodeWallet
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
                }
                await loadFixture(fixture)
            })

            it('GIVEN an inserted document WHEN try to add V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        emptyString,
                        randomStr(),
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with empty vMethod THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        randomStr(),
                        emptyString,
                        publicKey64,
                        EllipticType.SECP_256_K1
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with empty PK THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationMethod(
                        randomStr(),
                        randomStr(),
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
                        randomStr(),
                        randomStr(),
                        publicKey64,
                        EllipticType.NONE
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'InvalidEllipticCurve'
                )
            })
            it('GIVEN an inserted document WHEN try to add V.M. with not inserted did THEN it fails', async () => {
                const newDid = randomStr()
                await expect(
                    didRegistry.addVerificationMethod(
                        newDid,
                        randomStr(),
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
                const newVMethodId = randomStr()
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
                const newMethodId = randomStr()
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
                const newVMethodId = randomStr()
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
        })

        describe('revokeVerificationMethod', () => {
            let wallet: HDNodeWallet
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
                }
                await loadFixture(fixture)
            })

            it('GIVEN an inserted document WHEN try to revoke V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        emptyString,
                        randomStr(),
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with empty vMethod THEN it fails', async () => {
                await expect(
                    didRegistry.revokeVerificationMethod(
                        randomStr(),
                        emptyString,
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to revoke V.M. with not inserted did THEN it fails', async () => {
                const newDid = randomStr()
                await expect(
                    didRegistry.revokeVerificationMethod(
                        newDid,
                        randomStr(),
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
                const newVMethodId = randomStr()
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
                const expectedComplete = new DidDocumentBuilder(baseDocument, [
                    did,
                ])
                    .addVMethod(
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        true
                    )
                    .addVRelationship(
                        AUTHENTICATION_RELATIONSHIP,
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
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await admin.getAddress()
                    )
                ).to.be.false
            })
        })

        describe('expireVerificationMethod', () => {
            let wallet: HDNodeWallet
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
                }
                await loadFixture(fixture)
            })

            it('GIVEN an inserted document WHEN try to expire V.M. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        emptyString,
                        randomStr(),
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with empty vMethod THEN it fails', async () => {
                await expect(
                    didRegistry.expireVerificationMethod(
                        randomStr(),
                        emptyString,
                        randomInt()
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to expire V.M. with not inserted did THEN it fails', async () => {
                const newDid = randomStr()
                await expect(
                    didRegistry.expireVerificationMethod(
                        newDid,
                        randomStr(),
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
                const newVMethodId = randomStr()
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
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await admin.getAddress()
                    )
                ).to.be.false
            })
            it('GIVEN an inserted document WHEN try to expire V.M. of added NW THEN it success', async () => {
                const newVMethodId = randomStr()
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
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await admin.getAddress()
                    )
                ).to.be.true
            })
        })

        describe('rollVerificationMethod', () => {
            let wallet: HDNodeWallet
            let rolledWallet: HDNodeWallet
            const rollArgsTemplate: RollArgsStruct = {
                did: did,
                vMethodId: randomStr(),
                publicKey: publicKey65,
                ellipticType: EllipticType.SECP_256_K1,
                notBefore: 0n,
                notAfter: 0n,
                oldVMethodId: vMethodId,
                duration: randomInt() % (356n * 12n * 60n * 60n),
            }
            let rollArgs: Typed | RollArgsStruct
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
                    rolledWallet = deriveWallet(wallet, '1')
                    const newNotBefore = notAfter + (randomInt() % 1_000_000n)
                    rollArgs = {
                        did: did,
                        vMethodId: rollArgsTemplate.vMethodId,
                        publicKey: rolledWallet.signingKey.publicKey,
                        ellipticType: EllipticType.SECP_256_K1,
                        notBefore: newNotBefore,
                        notAfter: newNotBefore + (randomInt() % 100_000_000n),
                        oldVMethodId: vMethodId,
                        duration: rollArgsTemplate.duration,
                    }
                }
                await loadFixture(fixture)
            })

            it('GIVEN an inserted document WHEN try to roll V.M. with empty did THEN it fails', async () => {
                rollArgs.did = emptyString
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty vMethod THEN it fails', async () => {
                rollArgs.vMethodId = emptyString
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })
            it('GIVEN an inserted document WHEN try to roll V.M. with empty ellipticType THEN it fails', async () => {
                rollArgs.ellipticType = EllipticType.NONE
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
                rollArgs.oldVMethodId = emptyString
                await expect(
                    didRegistry.rollVerificationMethod(rollArgs)
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
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
                rollArgs.did = randomStr()
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
                rollArgs.oldVMethodId = randomStr()
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

                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await rolledWallet.getAddress()
                    )
                ).to.be.false

                await mockTimestap.setMockedTimestamp(rollArgs.notBefore + 1n)
                const didDocument = await didRegistry.getDidDocument(did)
                const newNotAfter = rollArgs.notBefore + rollArgs.duration
                const expectedComplete = new DidDocumentBuilder(baseDocument, [
                    did,
                ])
                    .addVMethod(
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        false
                    )
                    .addVMethod(
                        rollArgs.vMethodId,
                        rollArgs.publicKey,
                        EllipticType.SECP_256_K1,
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
                        rollArgs.vMethodId,
                        rollArgs.notBefore,
                        rollArgs.notAfter,
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
                        rollArgs.vMethodId,
                        rollArgs.notBefore,
                        rollArgs.notAfter,
                        0
                    )
                    .build()
                DidDocumentVerifier.verifyDidDocument(
                    didDocument,
                    expectedComplete
                )
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await rolledWallet.getAddress()
                    )
                ).to.be.true
            })
            it('GIVEN an inserted document WHEN try to roll V.M. of different elliptic type than NW THEN it success', async () => {
                rollArgs.ellipticType = EllipticType.SECP_256_R1
                expect(await didRegistry.rollVerificationMethod(rollArgs))
                    .to.emit(
                        didVerificationMethodFacet,
                        'VerificationMethodRolled'
                    )
                    .withArgs(Object.values(rollArgs))

                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await rolledWallet.getAddress()
                    )
                ).to.be.false

                await mockTimestap.setMockedTimestamp(rollArgs.notBefore + 1n)
                const didDocument = await didRegistry.getDidDocument(did)
                const newNotAfter = rollArgs.notBefore + rollArgs.duration
                const expectedComplete = new DidDocumentBuilder(baseDocument, [
                    did,
                ])
                    .addVMethod(
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        false
                    )
                    .addVMethod(
                        rollArgs.vMethodId,
                        rollArgs.publicKey,
                        EllipticType.SECP_256_R1,
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
                        rollArgs.vMethodId,
                        rollArgs.notBefore,
                        rollArgs.notAfter,
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
                        rollArgs.vMethodId,
                        rollArgs.notBefore,
                        rollArgs.notAfter,
                        0
                    )
                    .build()
                DidDocumentVerifier.verifyDidDocument(
                    didDocument,
                    expectedComplete
                )
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await rolledWallet.getAddress()
                    )
                ).to.be.false
            })
            it('GIVEN an inserted document WHEN try to roll V.M. recently added THEN it success', async () => {
                const newVMethodId = randomStr()
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

                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.true
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await rolledWallet.getAddress()
                    )
                ).to.be.false

                //await mockTimestap.setMockedTimestamp(rollArgs.notBefore + 1n)
                const didDocument = await didRegistry.getDidDocument(
                    rollArgs.did
                )
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
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.true
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await rolledWallet.getAddress()
                    )
                ).to.be.false
            })
        })

        describe('addVerificationRelationship', () => {
            let wallet: HDNodeWallet
            before(async () => {
                wallet = walletOfFirstSigner()
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
                }
                await loadFixture(fixture)
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        emptyString,
                        randomStr(),
                        randomStr(),
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty name THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        randomStr(),
                        emptyString,
                        randomStr(),
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
                        randomStr(),
                        randomStr(),
                        emptyString,
                        notBefore,
                        notAfter
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyString'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with empty notBefore THEN it fails', async () => {
                await expect(
                    didRegistry.addVerificationRelationship(
                        randomStr(),
                        randomStr(),
                        randomStr(),
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
                        randomStr(),
                        randomStr(),
                        randomStr(),
                        notBefore,
                        0n
                    )
                ).to.be.revertedWithCustomError(
                    didVerificationMethodFacet,
                    'EmptyUint'
                )
            })

            it('GIVEN an inserted document WHEN try to add V.R. with non existent DID THEN it fails', async () => {
                const wrongDid = randomStr()
                await expect(
                    didRegistry.addVerificationRelationship(
                        wrongDid,
                        randomStr(),
                        randomStr(),
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
                const wrongVMethod = randomStr()
                await expect(
                    didRegistry.addVerificationRelationship(
                        did,
                        randomStr(),
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
                            randomStr(),
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
                const wrongName = randomStr()
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
                        'InvalidVerificationMethod'
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
        })

        describe('addController', () => {
            let wallet: HDNodeWallet
            before(async () => {
                const mnemonic = (
                    config.networks.hardhat.accounts as {
                        mnemonic: string
                        path: string
                    }
                ).mnemonic
                wallet = ethers.Wallet.fromPhrase(mnemonic)
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                }
                await loadFixture(fixture)
            })

            it('GIVEN deployed DiDRegistry WHEN try to add empty did THEN it fails', async () => {
                await expect(
                    didRegistry.addController(emptyString, randomStr())
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyString'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to add empty controller THEN it fails', async () => {
                await expect(
                    didRegistry.addController(randomStr(), emptyString)
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyString'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to add non existent did THEN it fails', async () => {
                const randomDiD = randomStr()
                await expect(didRegistry.addController(randomDiD, randomStr()))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to add non existent controller THEN it fails', async () => {
                const randomDiD = randomStr()
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
                const controller = randomStr()
                await didRegistry.insertDidDocument(
                    controller,
                    randomStr(),
                    randomStr(),
                    publicKey64,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter
                )
                await mockTimestap.setMockedTimestamp(notBefore + 1n)

                // WHEN
                expect(await didRegistry.addController(did, controller))
                    .to.emit(didRegistry, 'ControllerAdded')
                    .withArgs(did, controller)
            })
        })

        describe('revokeController', () => {
            let wallet: HDNodeWallet
            async function addNewController() {
                const controller = randomStr()
                await didRegistry.insertDidDocument(
                    controller,
                    randomStr(),
                    randomStr(),
                    publicKey64,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter
                )
                await didRegistry.addController(did, controller)
                return controller
            }
            before(async () => {
                const mnemonic = (
                    config.networks.hardhat.accounts as {
                        mnemonic: string
                        path: string
                    }
                ).mnemonic
                wallet = ethers.Wallet.fromPhrase(mnemonic)
                randomizeDidDocument(wallet)
            })
            beforeEach(async () => {
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await didRegistry.insertDidDocument(
                        did,
                        baseDocument,
                        vMethodId,
                        publicKey65,
                        EllipticType.SECP_256_K1,
                        notBefore,
                        notAfter
                    )
                }
                await loadFixture(fixture)
            })

            it('GIVEN deployed DiDRegistry WHEN try to revoke empty did THEN it fails', async () => {
                await expect(
                    didRegistry.revokeController(emptyString, randomStr())
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyString'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke empty controller THEN it fails', async () => {
                await expect(
                    didRegistry.revokeController(randomStr(), emptyString)
                ).to.be.revertedWithCustomError(
                    didControllerFacet,
                    'EmptyString'
                )
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke non existent did THEN it fails', async () => {
                const randomDiD = randomStr()
                await expect(
                    didRegistry.revokeController(randomDiD, randomStr())
                )
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke non existent controller THEN it fails', async () => {
                const randomDiD = randomStr()
                await expect(didRegistry.revokeController(did, randomDiD))
                    .to.be.revertedWithCustomError(
                        didControllerFacet,
                        'DidNotExists'
                    )
                    .withArgs(randomDiD)
            })
            it('GIVEN deployed DiDRegistry WHEN try to revoke not linked controller THEN it fails', async () => {
                // GIVEN
                const controller = randomStr()
                await didRegistry.insertDidDocument(
                    controller,
                    randomStr(),
                    randomStr(),
                    publicKey64,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter
                )

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
                await mockTimestap.setMockedTimestamp(notBefore + 1n)
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
                randomStr(),
                randomStr(),
                randomStr(),
                randomStr(),
                randomStr(),
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
                randomStr(),
                randomStr(),
                randomStr(),
                randomStr(),
                randomStr(),
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
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
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
                controller = randomStr()
                insertedDids = [
                    randomStr(),
                    randomStr(),
                    randomStr(),
                    randomStr(),
                ]
                const fixture = async () => {
                    await didRegistry.initializeDiDRegistry(
                        EllipticType.SECP_256_K1
                    )
                    await mockTimestap.setMockedTimestamp(notBefore + 1n)
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
                await mockTimestap.setMockedTimestamp(notBefore - 1n)
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
                await mockTimestap.setMockedTimestamp(notBefore + 1n)
                const didDocument = await didRegistry.getDidDocument(did)
                const expectedComplete = new DidDocumentBuilder(baseDocument, [
                    did,
                ])
                    .addVMethod(
                        vMethodId,
                        publicKey64,
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
            it('GIVEN inserted document WHEN try to get it in past THEN cant recover vMethodsIds', async () => {
                await mockTimestap.setMockedTimestamp(notAfter + 1n)
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
                const expectedComplete = new DidDocumentBuilder(baseDocument, [
                    did,
                ])
                    .addVMethod(
                        vMethodId,
                        publicKey64,
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
                        CAPABILITY_INVOCATION_RELATIONSHIP,
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .build()

                DidDocumentVerifier.verifyDidDocument(
                    await didRegistry.getDidDocumentByTimestamp(
                        did,
                        notBefore + 1n
                    ),
                    expectedComplete
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
            let hexDid: string
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
                hexDid = ethers.hexlify(ethers.toUtf8Bytes(did))
            })
            it('GIVEN inserted document WHEN check controller with a non linked did THEN fails', async () => {
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.false
                expect(
                    await didRegistry['checkController(bytes,address)'](
                        hexDid,
                        await wallet.getAddress()
                    )
                ).to.be.false
            })
            it('GIVEN inserted document WHEN check controller with a linked did THEN success', async () => {
                await mockTimestap.setMockedTimestamp(notBefore + 1n)
                expect(
                    await didRegistry['checkController(string,address)'](
                        did,
                        await wallet.getAddress()
                    )
                ).to.be.true
                expect(
                    await didRegistry['checkController(bytes,address)'](
                        hexDid,
                        await wallet.getAddress()
                    )
                ).to.be.true
            })
        })
    })
})
