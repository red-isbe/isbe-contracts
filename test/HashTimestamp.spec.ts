import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    HashTimestampTestWrapper__factory,
    HashTimestampTestWrapper,
    DiamondCutAccessControlFacet__factory,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet__factory,
    DiamondLoupeFacet,
    AccessControl__factory,
    AccessControl,
    ISBEPause__factory,
    ISBEPause,
} from '../typechain-types/index.js'
import {
    DEFAULT_ADMIN_ROLE,
    HASH_TIMESTAMP_ROLE,
    PAUSER_ROLE,
} from './constants'

describe('Hash Timestamp', function () {
    const HASH =
        '0x0000000000000000000000000000000000000000000000000000000000000001'

    const BLOCK_TIMESTAMP = 1234567890

    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let AccessControlFactory: AccessControl__factory
    let ISBEPauseFactory: ISBEPause__factory
    let HashTimestampTestWrapperFactory: HashTimestampTestWrapper__factory

    let diamondCutFacet: DiamondCutAccessControlFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let accessControlFacet: AccessControl
    let pauseFacet: ISBEPause
    let hashTimestampFacet: HashTimestampTestWrapper

    let diamondProxy: EIP2535AccessControl

    let facetAddresses: string[]
    let adminAccount: Signer
    let hashTimestamp: HashTimestampTestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl

    async function deploy() {
        ;[adminAccount] = await ethers.getSigners()
        const adminAccountAddress = await adminAccount.getAddress()

        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
            'DiamondCutAccessControlFacet'
        )
        DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')

        AccessControlFactory = await ethers.getContractFactory('AccessControl')
        ISBEPauseFactory = await ethers.getContractFactory('ISBEPause')
        HashTimestampTestWrapperFactory = await ethers.getContractFactory(
            'HashTimestampTestWrapper'
        )

        diamondCutFacet = await DiamondCutAccessControlFacetFactory.deploy()
        diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        accessControlFacet = await AccessControlFactory.deploy()
        pauseFacet = await ISBEPauseFactory.deploy()
        hashTimestampFacet = await HashTimestampTestWrapperFactory.deploy()

        await diamondCutFacet.waitForDeployment()
        await diamondLoupeFacet.waitForDeployment()
        await accessControlFacet.waitForDeployment()
        await pauseFacet.waitForDeployment()
        await hashTimestampFacet.waitForDeployment()

        facetAddresses = [
            await diamondCutFacet.getAddress(),
            await diamondLoupeFacet.getAddress(),
            await accessControlFacet.getAddress(),
            await pauseFacet.getAddress(),
            await hashTimestampFacet.getAddress(),
        ]

        diamondProxy = await EIP2535AccessControlFactory.deploy(
            facetAddresses,
            {
                rbacs: [
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [adminAccountAddress],
                    },
                    {
                        role: PAUSER_ROLE,
                        members: [adminAccountAddress],
                    },
                    {
                        role: HASH_TIMESTAMP_ROLE,
                        members: [adminAccountAddress],
                    },
                ],
                init: ethers.ZeroAddress,
                initCalldata: '0x',
            }
        )
        await diamondProxy.waitForDeployment()
        hashTimestamp = HashTimestampTestWrapperFactory.attach(
            await diamondProxy.getAddress()
        ) as HashTimestampTestWrapper
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
            pause = ISBEPauseFactory.attach(
                await diamondProxy.getAddress()
            ) as ISBEPause
            await pause.pause()

            await expect(
                hashTimestamp.timestampHash(HASH)
            ).to.be.revertedWithCustomError(hashTimestamp, 'IsPaused')
        })

        it('GIVEN a Hash Timestamp WHEN account has no roles THEN fails', async function () {
            await deploy()

            hashTimestamp = hashTimestamp.connect(adminAccount)

            accessControl = AccessControlFactory.attach(
                await diamondProxy.getAddress()
            ) as AccessControl
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
