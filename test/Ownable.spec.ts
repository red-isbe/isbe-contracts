import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { Ownable2Step } from '../typechain-types/index.js'
import { ADDRESS_0 } from './constants'

describe('Ownable', function () {
    let adminAccount: Signer
    let account_2: Signer
    let ownable2StepImplementation: Ownable2Step
    let ownable2Step: Ownable2Step

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
    })

    async function deploy(initialize: boolean = true) {
        const Ownable2Step = await ethers.getContractFactory('Ownable2Step')
        ownable2StepImplementation = await Ownable2Step.deploy()

        const Proxy = await ethers.getContractFactory('DummyProxy')
        const proxy = await Proxy.deploy(ownable2StepImplementation)
        await proxy.waitForDeployment()

        ownable2Step = Ownable2Step.attach(
            await proxy.getAddress()
        ) as Ownable2Step

        if (initialize) await ownable2Step.initializeOwnable(adminAccount)
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Ownable2Step WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                ownable2StepImplementation.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable2StepImplementation,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to an Ownable2Step WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                ownable2Step.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable2Step,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a new Proxy pointing to an Ownable2Step WHEN initializing it to address 0 THEN fails', async function () {
            await deploy(false)

            await expect(
                ownable2Step.initializeOwnable(ADDRESS_0)
            ).to.be.revertedWithCustomError(ownable2Step, 'AddressZero')
        })
    })

    describe('Transfer ownership', function () {
        it('GIVEN an Ownable2Step WHEN using non-owner account to transfer ownership THEN fails', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(account_2)

            await expect(ownable2Step.transferOwnership(account_2))
                .to.be.revertedWithCustomError(
                    ownable2Step,
                    'AccountIsNotOwner'
                )
                .withArgs(account_2)
        })

        it('GIVEN an Ownable2Step WHEN using non-owner account to renounce ownership THEN fails', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(account_2)

            await expect(ownable2Step.renounceOwnership())
                .to.be.revertedWithCustomError(
                    ownable2Step,
                    'AccountIsNotOwner'
                )
                .withArgs(account_2)
        })

        it('GIVEN an Ownable2Step WHEN using non-pending owner account to accept ownership THEN fails', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(account_2)

            await expect(ownable2Step.acceptOwnership())
                .to.be.revertedWithCustomError(
                    ownable2Step,
                    'AccountIsNotPendingOwner'
                )
                .withArgs(account_2)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(adminAccount)

            await expect(ownable2Step.transferOwnership(ADDRESS_0))
                .to.be.revertedWithCustomError(ownable2Step, 'AddressZero')
                .withArgs(ADDRESS_0)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            await deploy()

            await ownable2Step.initializePause(true)

            ownable2Step = ownable2Step.connect(adminAccount)

            await expect(
                ownable2Step.transferOwnership(account_2)
            ).to.be.revertedWithCustomError(ownable2Step, 'IsPaused')
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            await deploy()

            await ownable2Step.initializePause(true)

            ownable2Step = ownable2Step.connect(adminAccount)

            await expect(
                ownable2Step.renounceOwnership()
            ).to.be.revertedWithCustomError(ownable2Step, 'IsPaused')
        })

        it('GIVEN an Ownable2Step WHEN using pending owner account to accept ownership while token is paused THEN fails', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(adminAccount)

            await ownable2Step.transferOwnership(account_2)

            await ownable2Step.initializePause(true)

            ownable2Step = ownable2Step.connect(account_2)

            await expect(
                ownable2Step.acceptOwnership()
            ).to.be.revertedWithCustomError(ownable2Step, 'IsPaused')
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership THEN succeeds', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(adminAccount)

            await expect(ownable2Step.transferOwnership(account_2))
                .to.emit(ownable2Step, 'OwnershipTransferStarted')
                .withArgs(adminAccount, account_2)

            expect(await ownable2Step.pendingOwner()).to.equal(account_2)
            expect(await ownable2Step.owner()).to.equal(adminAccount)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership THEN succeeds', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(adminAccount)

            await expect(ownable2Step.renounceOwnership())
                .to.emit(ownable2Step, 'OwnershipRenounced')
                .withArgs(adminAccount)

            expect(await ownable2Step.owner()).to.equal(ADDRESS_0)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to accept ownership THEN succeeds', async function () {
            await deploy()

            ownable2Step = ownable2Step.connect(adminAccount)

            await ownable2Step.transferOwnership(account_2)

            ownable2Step = ownable2Step.connect(account_2)

            await expect(ownable2Step.acceptOwnership())
                .to.emit(ownable2Step, 'OwnershipAccepted')
                .withArgs(account_2)

            expect(await ownable2Step.pendingOwner()).to.equal(ADDRESS_0)
            expect(await ownable2Step.owner()).to.equal(account_2)
        })
    })
})
