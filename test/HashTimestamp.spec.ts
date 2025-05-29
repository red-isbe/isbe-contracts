import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { HashTimestampTestWrapper } from '../typechain-types/index.js'

describe('Hash Timestamp', function () {
    const HASH =
        '0x0000000000000000000000000000000000000000000000000000000000000001'

    const BLOCK_TIMESTAMP = 1234567890

    let adminAccount: Signer
    let hashTimestamp: HashTimestampTestWrapper

    async function deploy() {
        ;[adminAccount] = await ethers.getSigners()
        const adminAccountAddress = await adminAccount.getAddress()

        const HashTimestamp = await ethers.getContractFactory(
            'HashTimestampTestWrapper'
        )
        hashTimestamp = await HashTimestamp.deploy({
            from: adminAccountAddress,
        })
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
    })
})
