import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    EIP2535AccessControl,
    AccessControl,
    ISBEPause,
    MockTimestamp,
    HashTimestampTestWrapper,
} from '../typechain-types/index.js'
import { HASH_TIMESTAMP_ROLE, PAUSER_ROLE } from './constants'
import { deployAll } from './initialization'

describe('Hash Timestamp', function () {
    const HASH =
        '0x0000000000000000000000000000000000000000000000000000000000000001'

    const BLOCK_TIMESTAMP = 1234567890

    let diamondProxy: EIP2535AccessControl

    let adminAccount: Signer
    let hashTimestamp: HashTimestampTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl
    let mockTimestamp: MockTimestamp

    async function deploy() {
        ;[adminAccount] = await ethers.getSigners()
        const adminAccountAddress = await adminAccount.getAddress()

        let result = await deployAll()
        diamondProxy = result.diamondProxy
        hashTimestamp = result.hashTimestamp
        pause = result.pause
        accessControl = result.accessControl
        mockTimestamp = result.mockTimestamp

        await accessControl.grantRole(PAUSER_ROLE, adminAccountAddress)
        await accessControl.grantRole(HASH_TIMESTAMP_ROLE, adminAccountAddress)
    }

    describe('Timestamping hashes', function () {
        it('GIVEN a Hash Timestamp WHEN timestamp hash THEN succeeds', async function () {
            await deploy()

            hashTimestamp = hashTimestamp.connect(adminAccount)
            await hashTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            await expect(hashTimestamp.timestampHash(HASH))
                .to.emit(hashTimestamp, 'HashTimestamped')
                .withArgs(
                    HASH,
                    await adminAccount.getAddress(),
                    BLOCK_TIMESTAMP
                )

            expect(await hashTimestamp.exists(HASH)).to.equal(true)
            expect(await hashTimestamp.getTimestamp(HASH)).to.equal(
                BLOCK_TIMESTAMP
            )
        })

        it('GIVEN a Hash Timestamp WHEN hash is already timestamped THEN fails', async function () {
            await deploy()

            hashTimestamp = hashTimestamp.connect(adminAccount)

            await hashTimestamp.timestampHash(HASH)

            expect(await hashTimestamp.exists(HASH)).to.equal(true)

            await expect(
                hashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'HashAlreadyExists')
        })

        it('GIVEN a Hash Timestamp WHEN contract is paused THEN fails', async function () {
            await deploy()

            hashTimestamp = hashTimestamp.connect(adminAccount)
            await pause.pause()

            await expect(
                hashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'IsPaused')
        })

        it('GIVEN a Hash Timestamp WHEN account has no roles THEN fails', async function () {
            await deploy()

            hashTimestamp = hashTimestamp.connect(adminAccount)

            await accessControl.revokeRole(
                HASH_TIMESTAMP_ROLE,
                adminAccount.getAddress()
            )

            await expect(
                hashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'AccountHasNoRole')
        })
    })
})
