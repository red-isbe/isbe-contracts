import { expect } from 'chai'
import { ethers, config } from 'hardhat'
import {
    DidControllerFacet,
    DidDocumentDetailedFacet,
    IDidRegistry,
    MockTimestampFacet,
} from '../../typechain-types'
import { HDNodeWallet, Signer } from 'ethers'
import { DID_DOCUMENT_DETAILED_RESOLVER_KEY } from '../constants'
import {
    CONFIGURATION_ID_DID_REGISTRY,
    deployGovernance,
} from '../initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    DidDocumentVerifier,
    DidDocumentBuilder,
    DidsResultValidator,
    ContractGetDidsResult,
} from './utils'

enum EllipticType {
    NONE = 0,
    SECP_256_K1 = 1,
    SECP_256_R1 = 2,
}

describe('DiDRegistry', function () {
    let admin: Signer
    let didDocumentDetailedFacet: DidDocumentDetailedFacet
    let didControllerFacet: DidControllerFacet
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

    const randomizeDidDocument = (wallet: HDNodeWallet) => {
        baseDocument = randomStr()
        vMethodId = randomStr()
        publicKeyInvalindLength = randomHx()
        publicKey65Incorrect = randomHx(65)
        publicKey65 = wallet.signingKey.publicKey
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
        ;[admin] = await ethers.getSigners()
        const gov = await deployGovernance(
            admin,
            undefined,
            CONFIGURATION_ID_DID_REGISTRY
        )
        didDocumentDetailedFacet = gov.didDocumentDetailedFacet
        didControllerFacet = gov.didControllerFacet
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
                        'authentication',
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .addVRelationship(
                        'capabilityInvocation',
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
                        'authentication',
                        vMethodId,
                        notBefore,
                        notAfter,
                        0
                    )
                    .addVRelationship(
                        'capabilityInvocation',
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
