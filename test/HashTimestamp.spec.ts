import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControl,
    ISBEPause,
    HashTimestampTestWrapper,
} from '../typechain-types'
import { HASH_TIMESTAMP_ROLE, PAUSER_ROLE } from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { randomBytes32 } from './support'

describe('Hash Timestamp', function () {
    const HASH = randomBytes32()
    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let hashTimestamp: HashTimestampTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAccountAddress = await adminSigner.getAddress()

        const result = await deployGovernance(adminSigner)

        await result.accessControl.grantRole(PAUSER_ROLE, adminAccountAddress)
        await result.accessControl.grantRole(
            HASH_TIMESTAMP_ROLE,
            adminAccountAddress
        )

        return {
            adminAccount: adminSigner,
            hashTimestamp: result.hashTimestamp,
            pause: result.pause,
            accessControl: result.accessControl,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        adminAccount = contracts.adminAccount
        hashTimestamp = contracts.hashTimestamp
        pause = contracts.pause
        accessControl = contracts.accessControl
    })

    describe('Timestamping hashes', function () {
        it('GIVEN a Hash Timestamp WHEN timestamp hash THEN succeeds', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)
            await connectedHashTimestamp.setMockedTimestamp(BLOCK_TIMESTAMP)

            await expect(connectedHashTimestamp.timestampHash(HASH))
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
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)

            await connectedHashTimestamp.timestampHash(HASH)

            expect(await hashTimestamp.exists(HASH)).to.equal(true)

            await expect(
                connectedHashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'HashAlreadyExists')
        })

        it('GIVEN a Hash Timestamp WHEN contract is paused THEN fails', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)
            await pause.pause()

            await expect(
                connectedHashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'IsPaused')
        })

        it('GIVEN a Hash Timestamp WHEN account has no roles THEN fails', async function () {
            const connectedHashTimestamp = hashTimestamp.connect(adminAccount)

            await accessControl.revokeRole(
                HASH_TIMESTAMP_ROLE,
                await adminAccount.getAddress()
            )

            await expect(
                connectedHashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'AccountHasNoRole')
        })
    })
})
