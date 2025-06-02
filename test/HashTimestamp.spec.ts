import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { HashTimestampTestWrapper } from '../typechain-types/index.js'
import { HASH_TIMESTAMP_ROLE, PAUSER_ROLE } from './constants'

describe('Hash Timestamp', function () {
    const HASH =
        '0x0000000000000000000000000000000000000000000000000000000000000001'

    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let hashTimestamp: HashTimestampTestWrapper
    let hashTimestampImplementation: HashTimestampTestWrapper

    async function deploy() {
        ;[adminAccount] = await ethers.getSigners()
        const adminAccountAddress = await adminAccount.getAddress()

        const HashTimestamp = await ethers.getContractFactory(
            'HashTimestampTestWrapper'
        )
        hashTimestampImplementation = await HashTimestamp.deploy({
            from: adminAccountAddress,
        })

        const Proxy = await ethers.getContractFactory('DummyProxy')
        const proxy = await Proxy.deploy(hashTimestampImplementation)
        await proxy.waitForDeployment()

        hashTimestamp = (await HashTimestamp.attach(
            await proxy.getAddress()
        )) as HashTimestampTestWrapper

        await hashTimestamp.initializeAccessControl(adminAccountAddress)

        hashTimestamp = hashTimestamp.connect(adminAccount)
        await hashTimestamp.grantRole(HASH_TIMESTAMP_ROLE, adminAccountAddress)
        await hashTimestamp.grantRole(PAUSER_ROLE, adminAccountAddress)

        await hashTimestamp.initializePause(false)
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
            await hashTimestamp.pause()

            await expect(
                hashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'IsPaused')
        })

        it('GIVEN a Hash Timestamp WHEN account has no roles THEN fails', async function () {
            await deploy()

            hashTimestamp = hashTimestamp.connect(adminAccount)
            await hashTimestamp.revokeRole(
                HASH_TIMESTAMP_ROLE,
                adminAccount.getAddress()
            )

            await expect(
                hashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'AccountHasNoRole')
        })
    })
})
