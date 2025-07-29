import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    Ownable2Step,
    Ownable,
    ISBEPause,
    OwnableBase,
    AccessControl,
} from '../typechain-types'
import { deployGovernance } from './initialization'
import { OWNABLE_RESOLVER_KEY, PAUSER_ROLE } from './constants'

describe('Ownable & Ownable2Step', function () {
    let adminAccount: Signer
    let adminAccountAddress: string
    let account_2: Signer
    //let ownable2Step: Ownable2Step
    let ownable2StepFacet: Ownable2Step
    let ownable: OwnableBase
    let pause: ISBEPause
    let accessControl: AccessControl

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
        adminAccountAddress = await adminAccount.getAddress()
    })

    async function deployOwnable(
        initialize: boolean = true,
        isOwnable: boolean = false,
        init_pause: boolean = false
    ) {
        //const result = await deployAll(true)
        const [owner] = await ethers.getSigners()

        const businessIds = []
        const data = []

        if (initialize) {
            const OwnableFactory =
                await ethers.getContractFactory('OwnableFacet')

            data.push(
                OwnableFactory.interface.encodeFunctionData(
                    'initializeOwnable',
                    [adminAccountAddress]
                )
            )

            businessIds.push(OWNABLE_RESOLVER_KEY)
        }

        const result = await deployGovernance(
            owner,
            [],
            init_pause,
            '0x',
            businessIds,
            data,
            isOwnable
        )

        ownable = result.ownable
        pause = result.pause
        ownable2StepFacet = result.ownableFacet
        accessControl = result.accessControl
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Ownable2Step WHEN initializing it THEN fails', async function () {
            await deployOwnable()

            await expect(
                ownable2StepFacet.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable2StepFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to an Ownable2Step WHEN initializing it THEN fails', async function () {
            await deployOwnable()

            await expect(
                ownable.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a new Proxy pointing to an Ownable2Step WHEN initializing it to address 0 THEN fails', async function () {
            await deployOwnable(false)

            await expect(
                ownable.initializeOwnable(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(ownable, 'AddressZero')
        })
    })

    describe('Transfer, Renounce ownership', function () {
        it('GIVEN an Ownable WHEN using non-owner account to transfer ownership THEN fails', async function () {
            await deployOwnable(true, true)

            await TransferNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable WHEN using non-owner account to renounce ownership THEN fails', async function () {
            await deployOwnable(true, true)

            await RenounceNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            await deployOwnable(true, true)

            await TransferOwnerAccountToZeroTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            await deployOwnable(true, true, true)

            await TransferOwnerAccountWhenPausedTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            await deployOwnable(true, true, true)

            await RenounceOwnerAccountWhenPausedTest(ownable)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership THEN succeeds', async function () {
            await deployOwnable(true, true)

            ownable = ownable.connect(adminAccount)

            await expect(ownable.transferOwnership(account_2))
                .to.emit(ownable, 'OwnershipTransferred')
                .withArgs(adminAccount, account_2)

            expect(await ownable.owner()).to.equal(account_2)
        })

        it('GIVEN an Ownable WHEN using owner account to renounce ownership THEN succeeds', async function () {
            await deployOwnable(true, true)

            await RenounceSuccessTest(ownable)
        })
    })

    describe('Transfer, Renounce, Accept ownership 2 step', function () {
        it('GIVEN an Ownable2Step WHEN using non-owner account to transfer ownership THEN fails', async function () {
            await deployOwnable()

            await TransferNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable2Step WHEN using non-owner account to renounce ownership THEN fails', async function () {
            await deployOwnable()

            await RenounceNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable2Step WHEN using non-pending owner account to accept ownership THEN fails', async function () {
            await deployOwnable()

            const ownable2Step = ownable.connect(account_2) as Ownable2Step

            await expect(ownable2Step.acceptOwnership())
                .to.be.revertedWithCustomError(
                    ownable2Step,
                    'AccountIsNotPendingOwner'
                )
                .withArgs(account_2)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            await deployOwnable()

            await TransferOwnerAccountToZeroTest(ownable as Ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            await deployOwnable(true, false, true)

            await TransferOwnerAccountWhenPausedTest(ownable as Ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            await deployOwnable(true, false, true)

            await RenounceOwnerAccountWhenPausedTest(ownable as Ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using pending owner account to accept ownership while token is paused THEN fails', async function () {
            await deployOwnable()

            let ownable2Step = ownable.connect(adminAccount) as Ownable2Step

            await ownable2Step.transferOwnership(account_2)

            await accessControl.grantRole(PAUSER_ROLE, adminAccount)

            await pause.pause()

            ownable2Step = ownable2Step.connect(account_2)

            await expect(
                ownable2Step.acceptOwnership()
            ).to.be.revertedWithCustomError(ownable2Step, 'IsPaused')
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership THEN succeeds', async function () {
            await deployOwnable()

            const ownable2Step = ownable.connect(adminAccount) as Ownable2Step

            await expect(ownable2Step.transferOwnership(account_2))
                .to.emit(ownable2Step, 'OwnershipTransferStarted')
                .withArgs(adminAccount, account_2)

            expect(await ownable2Step.pendingOwner()).to.equal(account_2)
            expect(await ownable2Step.owner()).to.equal(adminAccount)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership THEN succeeds', async function () {
            await deployOwnable()

            await RenounceSuccessTest(ownable as Ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to accept ownership THEN succeeds', async function () {
            await deployOwnable()

            let ownable2Step = ownable.connect(adminAccount) as Ownable2Step

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
        contract = contract.connect(adminAccount)

        await expect(
            contract.transferOwnership(account_2)
        ).to.be.revertedWithCustomError(contract, 'IsPaused')
    }

    async function RenounceOwnerAccountWhenPausedTest(
        contract: Ownable | Ownable2Step
    ) {
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
