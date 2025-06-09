import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { Ownable2Step, Ownable, ISBEPause } from '../typechain-types'
import { deployAll } from './initialization'

describe('Ownable & Ownable2Step', function () {
    let adminAccount: Signer
    let account_2: Signer
    let ownable2Step: Ownable2Step
    let ownable2StepFacet: Ownable2Step
    let ownable: Ownable
    let pause: ISBEPause

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
    })

    async function deployOwnable2Step(initialize: boolean = true) {
        const result = await deployAll()
        ownable2Step = result.ownable2Step
        pause = result.pause
        ownable2StepFacet = result.ownable2StepFacet

        if (initialize) await ownable2Step.initializeOwnable(adminAccount)
    }

    async function deployOwnable(initialize: boolean = true) {
        const result = await deployAll(true)
        ownable = result.ownable
        pause = result.pause

        if (initialize) await ownable.initializeOwnable(adminAccount)
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Ownable2Step WHEN initializing it THEN fails', async function () {
            await deployOwnable2Step()

            await expect(
                ownable2StepFacet.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable2StepFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to an Ownable2Step WHEN initializing it THEN fails', async function () {
            await deployOwnable2Step()

            await expect(
                ownable2Step.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable2Step,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a new Proxy pointing to an Ownable2Step WHEN initializing it to address 0 THEN fails', async function () {
            await deployOwnable2Step(false)

            await expect(
                ownable2Step.initializeOwnable(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(ownable2Step, 'AddressZero')
        })
    })

    describe('Transfer, Renounce ownership', function () {
        it('GIVEN an Ownable WHEN using non-owner account to transfer ownership THEN fails', async function () {
            await deployOwnable()

            await TransferNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable WHEN using non-owner account to renounce ownership THEN fails', async function () {
            await deployOwnable()

            await RenounceNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            await deployOwnable()

            await TransferOwnerAccountToZeroTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            await deployOwnable()

            await TransferOwnerAccountWhenPausedTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            await deployOwnable()

            await RenounceOwnerAccountWhenPausedTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership THEN succeeds', async function () {
            await deployOwnable()

            ownable = ownable.connect(adminAccount)

            await expect(ownable.transferOwnership(account_2))
                .to.emit(ownable, 'OwnershipTransferred')
                .withArgs(adminAccount, account_2)

            expect(await ownable.owner()).to.equal(account_2)
        })

        it('GIVEN an Ownable WHEN using owner account to renounce ownership THEN succeeds', async function () {
            await deployOwnable()

            await RenounceSuccessTest(ownable)
        })
    })

    describe('Transfer, Renounce, Accept ownership 2 step', function () {
        it('GIVEN an Ownable2Step WHEN using non-owner account to transfer ownership THEN fails', async function () {
            await deployOwnable2Step()

            await TransferNonOwnerAccountTest(ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using non-owner account to renounce ownership THEN fails', async function () {
            await deployOwnable2Step()

            await RenounceNonOwnerAccountTest(ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using non-pending owner account to accept ownership THEN fails', async function () {
            await deployOwnable2Step()

            ownable2Step = ownable2Step.connect(account_2)

            await expect(ownable2Step.acceptOwnership())
                .to.be.revertedWithCustomError(
                    ownable2Step,
                    'AccountIsNotPendingOwner'
                )
                .withArgs(account_2)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            await deployOwnable2Step()

            await TransferOwnerAccountToZeroTest(ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            await deployOwnable2Step()

            await TransferOwnerAccountWhenPausedTest(ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            await deployOwnable2Step()

            await RenounceOwnerAccountWhenPausedTest(ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using pending owner account to accept ownership while token is paused THEN fails', async function () {
            await deployOwnable2Step()

            ownable2Step = ownable2Step.connect(adminAccount)

            await ownable2Step.transferOwnership(account_2)

            await pause.initializePause(true)

            ownable2Step = ownable2Step.connect(account_2)

            await expect(
                ownable2Step.acceptOwnership()
            ).to.be.revertedWithCustomError(ownable2Step, 'IsPaused')
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership THEN succeeds', async function () {
            await deployOwnable2Step()

            ownable2Step = ownable2Step.connect(adminAccount)

            await expect(ownable2Step.transferOwnership(account_2))
                .to.emit(ownable2Step, 'OwnershipTransferStarted')
                .withArgs(adminAccount, account_2)

            expect(await ownable2Step.pendingOwner()).to.equal(account_2)
            expect(await ownable2Step.owner()).to.equal(adminAccount)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership THEN succeeds', async function () {
            await deployOwnable2Step()

            await RenounceSuccessTest(ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to accept ownership THEN succeeds', async function () {
            await deployOwnable2Step()

            ownable2Step = ownable2Step.connect(adminAccount)

            await ownable2Step.transferOwnership(account_2)

            ownable2Step = ownable2Step.connect(account_2)

            await expect(ownable2Step.acceptOwnership())
                .to.emit(ownable2Step, 'OwnershipAccepted')
                .withArgs(account_2)

            expect(await ownable2Step.pendingOwner()).to.equal(
                ethers.ZeroAddress
            )
            expect(await ownable2Step.owner()).to.equal(account_2)
        })
    })

    async function TransferNonOwnerAccountTest(
        contract: Ownable | Ownable2Step
    ) {
        contract = contract.connect(account_2)

        await expect(contract.transferOwnership(account_2))
            .to.be.revertedWithCustomError(contract, 'AccountIsNotOwner')
            .withArgs(account_2)
    }

    async function RenounceNonOwnerAccountTest(
        contract: Ownable | Ownable2Step
    ) {
        contract = contract.connect(account_2)

        await expect(contract.renounceOwnership())
            .to.be.revertedWithCustomError(contract, 'AccountIsNotOwner')
            .withArgs(account_2)
    }

    async function TransferOwnerAccountToZeroTest(
        contract: Ownable | Ownable2Step
    ) {
        contract = contract.connect(adminAccount)

        await expect(contract.transferOwnership(ethers.ZeroAddress))
            .to.be.revertedWithCustomError(contract, 'AddressZero')
            .withArgs(ethers.ZeroAddress)
    }

    async function TransferOwnerAccountWhenPausedTest(
        contract: Ownable | Ownable2Step
    ) {
        await pause.initializePause(true)

        contract = contract.connect(adminAccount)

        await expect(
            contract.transferOwnership(account_2)
        ).to.be.revertedWithCustomError(contract, 'IsPaused')
    }

    async function RenounceOwnerAccountWhenPausedTest(
        contract: Ownable | Ownable2Step
    ) {
        await pause.initializePause(true)

        contract = contract.connect(adminAccount)

        await expect(
            contract.renounceOwnership()
        ).to.be.revertedWithCustomError(contract, 'IsPaused')
    }

    async function RenounceSuccessTest(contract: Ownable | Ownable2Step) {
        contract = contract.connect(adminAccount)

        await expect(contract.renounceOwnership())
            .to.emit(contract, 'OwnershipRenounced')
            .withArgs(adminAccount)

        expect(await contract.owner()).to.equal(ethers.ZeroAddress)
    }
})
