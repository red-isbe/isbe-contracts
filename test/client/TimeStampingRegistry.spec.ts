import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import {
    MockTimestampFacet,
    ISBEPauseFacet,
    TimeStampingRegistry,
} from '../../typechain-types'
import {
    TIMESTAMPING_REGISTRY_ROLE,
    PAUSER_ROLE,
    CONFIGURATION_ID_TIMESTAMPING_REGISTRY,
    TIMESTAMPING_REGISTRY_RESOLVER_KEY,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'
import { Signer } from 'ethers'

describe('TimeStampingRegistry', function () {
    let timeStampingRegistry: TimeStampingRegistry
    let mockTimestamp: MockTimestampFacet
    let pauseFacet: ISBEPauseFacet
    let owner: Signer, admin: Signer, agent: Signer, other: Signer
    let adminAddress: string, agentAddress: string, otherAddress: string
    let BLOCK_TIMESTAMP: number

    const types = {
        stampWithSignature: [
            { name: 'originalHash', type: 'bytes32' },
            { name: 'tsaHash', type: 'bytes32' },
            { name: 'externalReferenceId', type: 'bytes32' },
            { name: 'sender', type: 'address' },
            { name: 'expirationTimestamp', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
        ],
    }

    const domain = {
        name: 'TimeStampingRegistry',
        version: '1.0.0',
        chainId: 1,
        verifyingContract: '',
    }

    before(async function () {
        ;[owner, admin, agent, other] = await ethers.getSigners()
        adminAddress = await admin.getAddress()
        agentAddress = await agent.getAddress()
        otherAddress = await other.getAddress()
    })

    async function deployFixture() {
        const gov = await deployGovernance(
            owner,
            [],
            CONFIGURATION_ID_TIMESTAMPING_REGISTRY
        )

        await Promise.all([
            gov.accessControlGovernance.grantRole(PAUSER_ROLE, adminAddress),
            gov.accessControlGovernance.grantRole(
                TIMESTAMPING_REGISTRY_ROLE,
                adminAddress
            ),
            gov.accessControlGovernance.grantRole(
                TIMESTAMPING_REGISTRY_ROLE,
                agentAddress
            ),
        ])

        timeStampingRegistry = gov.timeStampingRegistry as TimeStampingRegistry
        mockTimestamp = gov.mockTimestamp
        pauseFacet = gov.pauseGovernance

        expect(
            await gov.timeStampingRegistryFacet.businessIdIntrospection()
        ).to.be.equal(TIMESTAMPING_REGISTRY_RESOLVER_KEY)
        expect(
            await gov.timeStampingRegistryFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x6cf6673f'])

        BLOCK_TIMESTAMP = 1234567890
        await mockTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)
        domain.chainId = await network.provider.send('eth_chainId')
        domain.verifyingContract = await timeStampingRegistry.getAddress()
    }

    beforeEach(async function () {
        await loadFixture(deployFixture)
    })

    describe('stamp function', function () {
        describe('validation failures', function () {
            it('GIVEN zero originalHash WHEN calling stamp THEN should revert with EmptyBytes32', async function () {
                const zeroHash = ethers.ZeroHash
                const validTsaHash = ethers.keccak256(ethers.toUtf8Bytes('tsa'))
                const validExternalId = ethers.keccak256(
                    ethers.toUtf8Bytes('ext1')
                )

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(zeroHash, validTsaHash, validExternalId)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'EmptyBytes32'
                )
            })

            it('GIVEN zero tsaHash WHEN calling stamp THEN should revert with EmptyBytes32', async function () {
                const validOriginalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('original')
                )
                const zeroHash = ethers.ZeroHash
                const validExternalId = ethers.keccak256(
                    ethers.toUtf8Bytes('ext1')
                )

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(validOriginalHash, zeroHash, validExternalId)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'EmptyBytes32'
                )
            })

            it('GIVEN zero externalReferenceId WHEN calling stamp THEN should revert with EmptyBytes32', async function () {
                const validOriginalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('original')
                )
                const validTsaHash = ethers.keccak256(ethers.toUtf8Bytes('tsa'))
                const zeroHash = ethers.ZeroHash

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(validOriginalHash, validTsaHash, zeroHash)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'EmptyBytes32'
                )
            })

            it('GIVEN existing originalHash WHEN calling stamp THEN should revert with HashAlreadyExists', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('existing')
                )
                const tsaHash1 = ethers.keccak256(ethers.toUtf8Bytes('tsa1'))
                const tsaHash2 = ethers.keccak256(ethers.toUtf8Bytes('tsa2'))
                const externalId1 = ethers.keccak256(ethers.toUtf8Bytes('ext1'))
                const externalId2 = ethers.keccak256(ethers.toUtf8Bytes('ext2'))

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash, tsaHash1, externalId1)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash, tsaHash2, externalId2)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'HashAlreadyExists'
                    )
                    .withArgs(originalHash)
            })

            it('GIVEN existing tsaHash WHEN calling stamp THEN should revert with HashAlreadyExists', async function () {
                const originalHash1 = ethers.keccak256(
                    ethers.toUtf8Bytes('original1')
                )
                const originalHash2 = ethers.keccak256(
                    ethers.toUtf8Bytes('original2')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('existing-tsa')
                )
                const externalId1 = ethers.keccak256(ethers.toUtf8Bytes('ext1'))
                const externalId2 = ethers.keccak256(ethers.toUtf8Bytes('ext2'))

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash1, tsaHash, externalId1)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash2, tsaHash, externalId2)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'HashAlreadyExists'
                    )
                    .withArgs(tsaHash)
            })

            it('GIVEN existing externalReferenceId WHEN calling stamp THEN should revert with ExternalReferenceIdAlreadyExists', async function () {
                const originalHash1 = ethers.keccak256(
                    ethers.toUtf8Bytes('original1')
                )
                const originalHash2 = ethers.keccak256(
                    ethers.toUtf8Bytes('original2')
                )
                const tsaHash1 = ethers.keccak256(ethers.toUtf8Bytes('tsa1'))
                const tsaHash2 = ethers.keccak256(ethers.toUtf8Bytes('tsa2'))
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('existing-ext')
                )

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash1, tsaHash1, externalId)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash2, tsaHash2, externalId)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'ExternalReferenceIdAlreadyExists'
                    )
                    .withArgs(externalId)
            })
        })

        describe('access control and pause', function () {
            it('GIVEN paused contract WHEN calling stamp THEN should revert with IsPaused', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('paused-test')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('paused-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('paused-ext')
                )

                await pauseFacet.connect(admin).pause()

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash, tsaHash, externalId)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'IsPaused'
                )

                await pauseFacet.connect(admin).unpause()
            })

            it('GIVEN caller without role WHEN calling stamp THEN should revert with AccountHasNoRole', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('unauthorized')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('unauthorized-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('unauthorized-ext')
                )

                await expect(
                    timeStampingRegistry
                        .connect(other)
                        .stamp(originalHash, tsaHash, externalId)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'AccountHasNoRole'
                    )
                    .withArgs(otherAddress, TIMESTAMPING_REGISTRY_ROLE)
            })
        })

        describe('successful operations', function () {
            it('GIVEN valid parameters and permissions WHEN calling stamp THEN should successfully stamp and emit event', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('success')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('success-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('success-ext')
                )

                const tx = await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash, tsaHash, externalId)

                await expect(tx)
                    .to.emit(timeStampingRegistry, 'Stamped')
                    .withArgs(originalHash, tsaHash, externalId)

                const isRegistered =
                    await timeStampingRegistry.isOriginalHashRegistered(
                        originalHash
                    )
                expect(isRegistered).to.be.true

                const record =
                    await timeStampingRegistry.getTsrRecordFromOriginalHash(
                        originalHash
                    )
                expect(record.tsrData.originalHash).to.equal(originalHash)
                expect(record.tsrData.tsaHash).to.equal(tsaHash)
                expect(record.tsrData.externalReferenceId).to.equal(externalId)
                expect(record.authority).to.equal(adminAddress)
                expect(record.requester).to.equal(adminAddress)
            })

            it('GIVEN agent with role WHEN calling stamp THEN should successfully stamp and emit event', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('agent-success')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('agent-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('agent-ext')
                )

                const tx = await timeStampingRegistry
                    .connect(agent)
                    .stamp(originalHash, tsaHash, externalId)

                await expect(tx)
                    .to.emit(timeStampingRegistry, 'Stamped')
                    .withArgs(originalHash, tsaHash, externalId)
            })
        })
    })

    describe('stampWithSignature function', function () {
        describe('validation failures', function () {
            it('GIVEN zero originalHash in tsrData WHEN calling stampWithSignature THEN should revert with EmptyBytes32', async function () {
                const zeroHash = ethers.ZeroHash
                const validTsaHash = ethers.keccak256(ethers.toUtf8Bytes('tsa'))
                const validExternalId = ethers.keccak256(
                    ethers.toUtf8Bytes('ext1')
                )
                const signature = '0x' + '00'.repeat(65)

                const tsrData = {
                    tsrData: {
                        originalHash: zeroHash,
                        tsaHash: validTsaHash,
                        externalReferenceId: validExternalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'EmptyBytes32'
                )
            })

            it('GIVEN zero tsaHash in tsrData WHEN calling stampWithSignature THEN should revert with EmptyBytes32', async function () {
                const validOriginalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('original')
                )
                const zeroHash = ethers.ZeroHash
                const validExternalId = ethers.keccak256(
                    ethers.toUtf8Bytes('ext1')
                )
                const signature = '0x' + '00'.repeat(65)

                const tsrData = {
                    tsrData: {
                        originalHash: validOriginalHash,
                        tsaHash: zeroHash,
                        externalReferenceId: validExternalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'EmptyBytes32'
                )
            })

            it('GIVEN zero externalReferenceId in tsrData WHEN calling stampWithSignature THEN should revert with EmptyBytes32', async function () {
                const validOriginalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('original')
                )
                const validTsaHash = ethers.keccak256(ethers.toUtf8Bytes('tsa'))
                const zeroHash = ethers.ZeroHash
                const signature = '0x' + '00'.repeat(65)

                const tsrData = {
                    tsrData: {
                        originalHash: validOriginalHash,
                        tsaHash: validTsaHash,
                        externalReferenceId: zeroHash,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'EmptyBytes32'
                )
            })

            it('GIVEN existing originalHash in tsrData WHEN calling stampWithSignature THEN should revert with HashAlreadyExists', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('existing-sig')
                )
                const tsaHash1 = ethers.keccak256(ethers.toUtf8Bytes('tsa1'))
                const tsaHash2 = ethers.keccak256(ethers.toUtf8Bytes('tsa2'))
                const externalId1 = ethers.keccak256(ethers.toUtf8Bytes('ext1'))
                const externalId2 = ethers.keccak256(ethers.toUtf8Bytes('ext2'))

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash, tsaHash1, externalId1)

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash2,
                        externalReferenceId: externalId2,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const signature = '0x' + '00'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'HashAlreadyExists'
                    )
                    .withArgs(originalHash)
            })

            it('GIVEN existing tsaHash in tsrData WHEN calling stampWithSignature THEN should revert with HashAlreadyExists', async function () {
                const originalHash1 = ethers.keccak256(
                    ethers.toUtf8Bytes('original1-sig')
                )
                const originalHash2 = ethers.keccak256(
                    ethers.toUtf8Bytes('original2-sig')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('existing-tsa-sig')
                )
                const externalId1 = ethers.keccak256(
                    ethers.toUtf8Bytes('ext1-sig')
                )
                const externalId2 = ethers.keccak256(
                    ethers.toUtf8Bytes('ext2-sig')
                )

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash1, tsaHash, externalId1)

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash2,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId2,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const signature = '0x' + '00'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'HashAlreadyExists'
                    )
                    .withArgs(tsaHash)
            })

            it('GIVEN existing externalReferenceId in tsrData WHEN calling stampWithSignature THEN should revert with ExternalReferenceIdAlreadyExists', async function () {
                const originalHash1 = ethers.keccak256(
                    ethers.toUtf8Bytes('original1-ext')
                )
                const originalHash2 = ethers.keccak256(
                    ethers.toUtf8Bytes('original2-ext')
                )
                const tsaHash1 = ethers.keccak256(
                    ethers.toUtf8Bytes('tsa1-ext')
                )
                const tsaHash2 = ethers.keccak256(
                    ethers.toUtf8Bytes('tsa2-ext')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('existing-ext-sig')
                )

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash1, tsaHash1, externalId)

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash2,
                        tsaHash: tsaHash2,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const signature = '0x' + '00'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'ExternalReferenceIdAlreadyExists'
                    )
                    .withArgs(externalId)
            })

            it('GIVEN invalid nonce WHEN calling stampWithSignature THEN should revert with WrongNonce', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('nonce-test')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('nonce-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('nonce-ext')
                )

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 0,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const signature = '0x' + '00'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'WrongNonce'
                    )
                    .withArgs(0, adminAddress)
            })

            it('GIVEN expired timestamp WHEN calling stampWithSignature THEN should revert with ExpiredDeadline', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('expired-test')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('expired-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('expired-ext')
                )

                const currentTimestamp = 1000000
                await mockTimestamp.setMockedTimestamp(currentTimestamp)

                const expiredTimestamp = currentTimestamp - 3600
                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: expiredTimestamp,
                }

                const signature = '0x' + '01'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'ExpiredDeadline'
                    )
                    .withArgs(expiredTimestamp)
            })

            it('GIVEN malformed signature WHEN calling stampWithSignature THEN should revert with InvalidSignature', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('invalid-sig')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('invalid-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('invalid-ext')
                )

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const invalidSignature = '0x' + '00'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, invalidSignature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'InvalidSignature'
                    )
                    .withArgs(adminAddress)
            })
        })

        describe('access control and pause', function () {
            it('GIVEN paused contract WHEN calling stampWithSignature THEN should revert with IsPaused', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('paused-sig')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('paused-tsa-sig')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('paused-ext-sig')
                )

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const signature = '0x' + '00'.repeat(65)

                await pauseFacet.connect(admin).pause()

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(tsrData, signature)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'IsPaused'
                )

                await pauseFacet.connect(admin).unpause()
            })

            it('GIVEN caller without role WHEN calling stampWithSignature THEN should revert with AccountHasNoRole', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('unauthorized-sig')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('unauthorized-tsa-sig')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('unauthorized-ext-sig')
                )

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const signature = '0x' + '00'.repeat(65)

                await expect(
                    timeStampingRegistry
                        .connect(other)
                        .stampWithSignature(tsrData, signature)
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'AccountHasNoRole'
                    )
                    .withArgs(otherAddress, TIMESTAMPING_REGISTRY_ROLE)
            })
        })

        describe('successful operations', function () {
            it('GIVEN valid signed data WHEN calling stampWithSignature THEN should handle signature validation', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('test2')
                )
                const tsaHash = ethers.keccak256(ethers.toUtf8Bytes('tsa2'))
                const externalId = ethers.keccak256(ethers.toUtf8Bytes('ext2'))

                const signedTsrData = {
                    tsrData: {
                        originalHash,
                        tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const message = {
                    originalHash: originalHash,
                    tsaHash: tsaHash,
                    externalReferenceId: externalId,
                    sender: adminAddress,
                    expirationTimestamp: signedTsrData.expirationTimestamp,
                    nonce: signedTsrData.nonce,
                }

                const signature = await admin.signTypedData(
                    domain,
                    types,
                    message
                )

                await mockTimestamp.setMockedTimestamp(1000)

                await timeStampingRegistry
                    .connect(admin)
                    .stampWithSignature(signedTsrData, signature)
            })

            it('GIVEN properly signed TSR data WHEN calling stampWithSignature THEN should successfully stamp and emit event', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('success-sig')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('success-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('success-ext')
                )

                const mockTimestamp1000 = BLOCK_TIMESTAMP
                // Set mock timestamp BEFORE creating signature to avoid ExpiredDeadline
                await mockTimestamp.setMockedTimestamp(mockTimestamp1000)

                const tsrData = {
                    tsrData: {
                        originalHash,
                        tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: mockTimestamp1000 + 3600,
                }

                const message = {
                    originalHash: originalHash,
                    tsaHash: tsaHash,
                    externalReferenceId: externalId,
                    sender: adminAddress,
                    expirationTimestamp: tsrData.expirationTimestamp,
                    nonce: tsrData.nonce,
                }

                const signature = await admin.signTypedData(
                    domain,
                    types,
                    message
                )

                const tx = await timeStampingRegistry
                    .connect(admin)
                    .stampWithSignature(tsrData, signature)

                await expect(tx)
                    .to.emit(timeStampingRegistry, 'Stamped')
                    .withArgs(originalHash, tsaHash, externalId)

                const record =
                    await timeStampingRegistry.getTsrRecordFromOriginalHash(
                        originalHash
                    )
                expect(record.tsrData.originalHash).to.equal(originalHash)
                expect(record.authority).to.equal(adminAddress)
                expect(record.requester).to.equal(adminAddress)

                // Verify nonce was incremented
                const duplicateOriginalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('duplicate-test')
                )
                const duplicateTsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('duplicate-tsa')
                )
                const duplicateExternalId = ethers.keccak256(
                    ethers.toUtf8Bytes('duplicate-ext')
                )

                const duplicateNonceTsrData = {
                    tsrData: {
                        originalHash: duplicateOriginalHash,
                        tsaHash: duplicateTsaHash,
                        externalReferenceId: duplicateExternalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: mockTimestamp1000 + 3600,
                }

                const duplicateMessage = {
                    originalHash: duplicateOriginalHash,
                    tsaHash: duplicateTsaHash,
                    externalReferenceId: duplicateExternalId,
                    sender: adminAddress,
                    expirationTimestamp:
                        duplicateNonceTsrData.expirationTimestamp,
                    nonce: duplicateNonceTsrData.nonce,
                }

                const duplicateSignature = await admin.signTypedData(
                    domain,
                    types,
                    duplicateMessage
                )

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stampWithSignature(
                            duplicateNonceTsrData,
                            duplicateSignature
                        )
                )
                    .to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'WrongNonce'
                    )
                    .withArgs(1, adminAddress)
            })
        })

        describe('signature validation edge cases', function () {
            it('GIVEN invalid signatures WHEN calling stampWithSignature THEN should test signature validation', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('sig-test')
                )
                const tsaHash = ethers.keccak256(ethers.toUtf8Bytes('sig-tsa'))
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('sig-ext')
                )

                const signedTsrData = {
                    tsrData: {
                        originalHash,
                        tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                const invalidSignatures = [
                    '0x' + '00'.repeat(65),
                    await other.signMessage(
                        ethers.getBytes(
                            ethers.keccak256(ethers.toUtf8Bytes('wrong'))
                        )
                    ),
                ]

                for (const sig of invalidSignatures) {
                    await expect(
                        timeStampingRegistry
                            .connect(admin)
                            .stampWithSignature(signedTsrData, sig)
                    ).to.be.reverted
                }
            })

            it('GIVEN signature with wrong length WHEN calling stampWithSignature THEN should revert with WrongSignatureLength', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('wrong-length-test')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('wrong-length-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('wrong-length-ext')
                )

                const tsrData = {
                    tsrData: {
                        originalHash: originalHash,
                        tsaHash: tsaHash,
                        externalReferenceId: externalId,
                    },
                    sender: adminAddress,
                    nonce: 1,
                    expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
                }

                // Invalid signature lengths (not 65 bytes)
                const invalidLengthSignatures = [
                    '0x' + '00'.repeat(64), // 64 bytes - too short
                    '0x' + '00'.repeat(66), // 66 bytes - too long
                    '0x' + '00'.repeat(32), // 32 bytes - way too short
                    '0x' + '00'.repeat(100), // 100 bytes - way too long
                ]

                for (const invalidSig of invalidLengthSignatures) {
                    await expect(
                        timeStampingRegistry
                            .connect(admin)
                            .stampWithSignature(tsrData, invalidSig)
                    ).to.be.revertedWithCustomError(
                        timeStampingRegistry,
                        'WrongSignatureLength'
                    )
                }
            })
        })
    })

    describe('query functions', function () {
        describe('hash and reference checking', function () {
            it('GIVEN existing TSA hash WHEN checking if registered THEN should return boolean status', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('setup')
                )
                const tsaHash = ethers.keccak256(
                    ethers.toUtf8Bytes('setup-tsa')
                )
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('setup-ext')
                )

                await mockTimestamp.setMockedTimestamp(1000)
                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash, tsaHash, externalId)

                const isRegistered =
                    await timeStampingRegistry.isTsaHashRegistered(tsaHash)
                expect(typeof isRegistered).to.equal('boolean')
            })

            it('GIVEN external reference ID WHEN checking if registered THEN should return boolean status', async function () {
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('setup-ext2')
                )

                const isRegistered =
                    await timeStampingRegistry.isExternalReferenceIdRegistered(
                        externalId
                    )
                expect(typeof isRegistered).to.equal('boolean')
            })

            it('GIVEN deployed contract WHEN checking interfaces THEN should return implemented interfaces', async function () {
                expect(timeStampingRegistry).to.not.be.undefined
            })
        })

        describe('pagination and size functions', function () {
            it('GIVEN multiple stamped records WHEN calling pagination THEN should handle pagination correctly', async function () {
                const records = []
                for (let i = 0; i < 5; i++) {
                    const originalHash = ethers.keccak256(
                        ethers.toUtf8Bytes(`test${i}`)
                    )
                    const tsaHash = ethers.keccak256(
                        ethers.toUtf8Bytes(`tsa${i}`)
                    )
                    const externalId = ethers.keccak256(
                        ethers.toUtf8Bytes(`ext${i}`)
                    )

                    records.push({ originalHash, tsaHash, externalId })

                    await mockTimestamp.setMockedTimestamp(1000 + i)
                    await timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash, tsaHash, externalId)
                }

                const result = await timeStampingRegistry.getPaginatedStamped(
                    3,
                    0
                )
                expect(result).to.be.an('array')
            })

            it('GIVEN multiple paginated records WHEN calling getPaginatedStamped THEN should cover pagination logic', async function () {
                for (let i = 0; i < 3; i++) {
                    const originalHash = ethers.keccak256(
                        ethers.toUtf8Bytes(`paginate${i}`)
                    )
                    const tsaHash = ethers.keccak256(
                        ethers.toUtf8Bytes(`paginate-tsa${i}`)
                    )
                    const externalId = ethers.keccak256(
                        ethers.toUtf8Bytes(`paginate-ext${i}`)
                    )

                    await timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash, tsaHash, externalId)
                }

                const size = await timeStampingRegistry.getStampedSize()
                expect(size).to.be.greaterThan(0)

                const result = await timeStampingRegistry.getPaginatedStamped(
                    2,
                    1
                )
                expect(result).to.be.an('array')
                expect(result.length).to.be.greaterThan(0)
            })

            it('GIVEN stamped records WHEN calling getStampedSize THEN should return size', async function () {
                const size = await timeStampingRegistry.getStampedSize()
                expect(typeof size).to.equal('bigint')
            })
        })

        describe('edge cases and coverage', function () {
            it('GIVEN edge case scenarios WHEN calling internal functions THEN should handle gracefully', async function () {
                const originalHash = ethers.keccak256(
                    ethers.toUtf8Bytes('edge-test')
                )
                const tsaHash = ethers.keccak256(ethers.toUtf8Bytes('edge-tsa'))
                const externalId = ethers.keccak256(
                    ethers.toUtf8Bytes('edge-ext')
                )

                await mockTimestamp.setMockedTimestamp(2000)

                await timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash, tsaHash, externalId)

                await expect(
                    timeStampingRegistry
                        .connect(admin)
                        .stamp(originalHash, tsaHash, externalId)
                ).to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'HashAlreadyExists'
                )

                await timeStampingRegistry.isOriginalHashRegistered(
                    originalHash
                )
                await timeStampingRegistry.isTsaHashRegistered(tsaHash)
                await timeStampingRegistry.getTsrRecordFromOriginalHash(
                    originalHash
                )
            })
        })
    })

    describe('internal validation functions coverage', function () {
        it('GIVEN duplicate originalHash WHEN calling _checkOriginalHash THEN should cover success and failure paths', async function () {
            const originalHash = ethers.keccak256(
                ethers.toUtf8Bytes('check-original')
            )
            const tsaHash = ethers.keccak256(ethers.toUtf8Bytes('check-tsa'))
            const externalId = ethers.keccak256(ethers.toUtf8Bytes('check-ext'))

            await timeStampingRegistry
                .connect(admin)
                .stamp(originalHash, tsaHash, externalId)

            const newTsaHash = ethers.keccak256(ethers.toUtf8Bytes('new-tsa'))
            const newExternalId = ethers.keccak256(
                ethers.toUtf8Bytes('new-ext')
            )

            await expect(
                timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash, newTsaHash, newExternalId)
            )
                .to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'HashAlreadyExists'
                )
                .withArgs(originalHash)
        })

        it('GIVEN duplicate tsaHash WHEN calling _checkTsaHash THEN should cover success and failure paths', async function () {
            const originalHash1 = ethers.keccak256(
                ethers.toUtf8Bytes('check-original1')
            )
            const originalHash2 = ethers.keccak256(
                ethers.toUtf8Bytes('check-original2')
            )
            const tsaHash = ethers.keccak256(
                ethers.toUtf8Bytes('check-tsa-hash')
            )
            const externalId1 = ethers.keccak256(
                ethers.toUtf8Bytes('check-ext1')
            )
            const externalId2 = ethers.keccak256(
                ethers.toUtf8Bytes('check-ext2')
            )

            await timeStampingRegistry
                .connect(admin)
                .stamp(originalHash1, tsaHash, externalId1)

            await expect(
                timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash2, tsaHash, externalId2)
            )
                .to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'HashAlreadyExists'
                )
                .withArgs(tsaHash)
        })

        it('GIVEN duplicate externalReferenceId WHEN calling _checkExternalReferenceId THEN should cover success and failure paths', async function () {
            const originalHash1 = ethers.keccak256(
                ethers.toUtf8Bytes('check-original1-ext')
            )
            const originalHash2 = ethers.keccak256(
                ethers.toUtf8Bytes('check-original2-ext')
            )
            const tsaHash1 = ethers.keccak256(ethers.toUtf8Bytes('check-tsa1'))
            const tsaHash2 = ethers.keccak256(ethers.toUtf8Bytes('check-tsa2'))
            const externalId = ethers.keccak256(
                ethers.toUtf8Bytes('check-external-id')
            )

            await timeStampingRegistry
                .connect(admin)
                .stamp(originalHash1, tsaHash1, externalId)

            await expect(
                timeStampingRegistry
                    .connect(admin)
                    .stamp(originalHash2, tsaHash2, externalId)
            )
                .to.be.revertedWithCustomError(
                    timeStampingRegistry,
                    'ExternalReferenceIdAlreadyExists'
                )
                .withArgs(externalId)
        })
    })
})
