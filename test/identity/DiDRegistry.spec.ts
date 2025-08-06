import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    DidDocumentDetailedFacet,
    IDidRegistry,
    MockTimestampFacet,
} from '../../typechain-types'
import { Signer, Wallet } from 'ethers'
import { DID_DOCUMENT_DETAILED_RESOLVER_KEY } from '../constants'
import {
    CONFIGURATION_ID_DID_REGISTRY,
    deployGovernance,
} from '../initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

enum EllipticType {
    NONE = 0,
    SECP_256_K1 = 1,
    SECP_256_R1 = 2,
}

describe('DiDRegistry', function () {
    let admin: Signer
    let didDocumentDetailedFacet: DidDocumentDetailedFacet
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
        ;[admin] = await ethers.getSigners()
        const gov = await deployGovernance(
            admin,
            undefined,
            CONFIGURATION_ID_DID_REGISTRY
        )
        didDocumentDetailedFacet = gov.didDocumentDetailedFacet
        didRegistry = gov.didRegistry
        mockTimestap = gov.mockTimestamp
        expect(
            await didDocumentDetailedFacet.businessIdIntrospection()
        ).to.be.equal(DID_DOCUMENT_DETAILED_RESOLVER_KEY)
        expect(
            await didDocumentDetailedFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x62e92ee6'])
    }

    beforeEach(async () => {
        await loadFixture(deployInitial)
    })

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
                baseDocument = randomStr()
                vMethodId = randomStr()
                publicKeyInvalindLength = randomHx()
                publicKey65Incorrect = randomHx(65)
                const wallet: Wallet = ethers.Wallet.createRandom()
                publicKey65 = wallet.signingKey.publicKey
                publicKey64 = '0x'.concat(publicKey65.slice(4))
                notBefore = randomInt()
                notAfter = notBefore + 1000000000000000000n
            })
            beforeEach(async () => {
                await didRegistry.initializeDiDRegistry(
                    EllipticType.SECP_256_K1
                )
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
                await mockTimestap.setMockedTimestamp(notBefore - 1n)
                let didDocument = await didRegistry.getDidDocument(did)
                expect(didDocument[0]).to.equal(baseDocument)
                expect(didDocument[1]).to.deep.equal([did])
                expect(didDocument[2]).to.deep.equal([])
                expect(didDocument[3]).to.have.lengthOf(0)
                expect(didDocument[4]).to.have.lengthOf(0)

                await mockTimestap.setMockedTimestamp(notBefore + 1n)
                didDocument = await didRegistry.getDidDocument(did)
                expect(didDocument[0]).to.equal(baseDocument)
                expect(didDocument[1]).to.deep.equal([did])
                expect(didDocument[2]).to.deep.equal([vMethodId])
                expect(didDocument[3]).to.have.lengthOf(1)
                expect(didDocument[3][0][0]).to.deep.equal(publicKey64)
                expect(didDocument[3][0][1]).to.deep.equal(
                    EllipticType.SECP_256_K1
                )
                expect(didDocument[3][0][2]).to.deep.equal(false)
                expect(didDocument[4]).to.have.lengthOf(2)
                expect(didDocument[4][0][0]).to.deep.equal('authentication')
                expect(didDocument[4][0][1]).to.deep.equal(vMethodId)
                expect(didDocument[4][0][2]).to.deep.equal(notBefore)
                expect(didDocument[4][0][3]).to.deep.equal(notAfter)
                expect(didDocument[4][0][4]).to.deep.equal(0)
                expect(didDocument[4][1][0]).to.deep.equal(
                    'capabilityInvocation'
                )
                expect(didDocument[4][1][1]).to.deep.equal(vMethodId)
                expect(didDocument[4][1][2]).to.deep.equal(notBefore)
                expect(didDocument[4][1][3]).to.deep.equal(notAfter)
                expect(didDocument[4][1][4]).to.deep.equal(0)

                await mockTimestap.setMockedTimestamp(notAfter + 1n)
                didDocument = await didRegistry.getDidDocument(did)
                expect(didDocument[0]).to.equal(baseDocument)
                expect(didDocument[1]).to.deep.equal([did])
                expect(didDocument[2]).to.deep.equal([])
                expect(didDocument[3]).to.have.lengthOf(0)
                expect(didDocument[4]).to.have.lengthOf(0)
            })
        })
    })
})
