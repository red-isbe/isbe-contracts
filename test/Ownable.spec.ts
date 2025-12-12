/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
import { deployGovernance } from './fixtures/governance'
import { OWNABLE_RESOLVER_KEY, PAUSER_ROLE } from '../utils/constants'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

describe('Ownable & Ownable2Step', function () {
    let adminAccount: Signer
    let account_2: Signer
    //let ownable2Step: Ownable2Step
    let ownable2StepFacet: Ownable2Step
    let ownable: OwnableBase
    let pause: ISBEPause
    let accessControl: AccessControl

    // Fixture functions
    async function deployOwnableFixture() {
        const [owner, account2] = await ethers.getSigners()
        const ownerAddress = await owner.getAddress()

        const businessIds = [OWNABLE_RESOLVER_KEY]
        const OwnableFactory = await ethers.getContractFactory('OwnableFacet')
        const data = [
            OwnableFactory.interface.encodeFunctionData('initializeOwnable', [
                ownerAddress,
            ]),
        ]

        const result = await deployGovernance(
            owner,
            [],
            undefined,
            false, // init_pause
            '0x',
            businessIds,
            data,
            false // isOwnable (2-step)
        )

        return {
            adminAccount: owner,
            account_2: account2,
            adminAccountAddress: ownerAddress,
            ownable: result.ownable,
            pause: result.pause,
            ownable2StepFacet: result.ownableFacet,
            accessControl: result.accessControl,
        }
    }

    async function deployOwnable1StepFixture() {
        const [owner, account2] = await ethers.getSigners()
        const ownerAddress = await owner.getAddress()

        const businessIds = [OWNABLE_RESOLVER_KEY]
        const OwnableFactory = await ethers.getContractFactory('OwnableFacet')
        const data = [
            OwnableFactory.interface.encodeFunctionData('initializeOwnable', [
                ownerAddress,
            ]),
        ]

        const result = await deployGovernance(
            owner,
            [],
            undefined,
            false, // init_pause
            '0x',
            businessIds,
            data,
            true // isOwnable (1-step)
        )

        return {
            adminAccount: owner,
            account_2: account2,
            adminAccountAddress: ownerAddress,
            ownable: result.ownable,
            pause: result.pause,
            ownable2StepFacet: result.ownableFacet,
            accessControl: result.accessControl,
        }
    }

    async function deployOwnablePausedFixture() {
        const [owner, account2] = await ethers.getSigners()
        const ownerAddress = await owner.getAddress()

        const businessIds = [OWNABLE_RESOLVER_KEY]
        const OwnableFactory = await ethers.getContractFactory('OwnableFacet')
        const data = [
            OwnableFactory.interface.encodeFunctionData('initializeOwnable', [
                ownerAddress,
            ]),
        ]

        const result = await deployGovernance(
            owner,
            [],
            undefined,
            true, // init_pause
            '0x',
            businessIds,
            data,
            false // isOwnable (2-step)
        )

        return {
            adminAccount: owner,
            account_2: account2,
            adminAccountAddress: ownerAddress,
            ownable: result.ownable,
            pause: result.pause,
            ownable2StepFacet: result.ownableFacet,
            accessControl: result.accessControl,
        }
    }

    async function deployOwnable1StepPausedFixture() {
        const [owner, account2] = await ethers.getSigners()
        const ownerAddress = await owner.getAddress()

        const businessIds = [OWNABLE_RESOLVER_KEY]
        const OwnableFactory = await ethers.getContractFactory('OwnableFacet')
        const data = [
            OwnableFactory.interface.encodeFunctionData('initializeOwnable', [
                ownerAddress,
            ]),
        ]

        const result = await deployGovernance(
            owner,
            [],
            undefined,
            true, // init_pause
            '0x',
            businessIds,
            data,
            true // isOwnable (1-step)
        )

        return {
            adminAccount: owner,
            account_2: account2,
            adminAccountAddress: ownerAddress,
            ownable: result.ownable,
            pause: result.pause,
            ownable2StepFacet: result.ownableFacet,
            accessControl: result.accessControl,
        }
    }

    async function deployOwnableUninitializedFixture() {
        const [owner, account2] = await ethers.getSigners()
        const ownerAddress = await owner.getAddress()

        const result = await deployGovernance(
            owner,
            [],
            undefined,
            false, // init_pause
            '0x',
            [], // no business IDs
            [], // no data
            false // isOwnable (2-step)
        )

        return {
            adminAccount: owner,
            account_2: account2,
            adminAccountAddress: ownerAddress,
            ownable: result.ownable,
            pause: result.pause,
            ownable2StepFacet: result.ownableFacet,
            accessControl: result.accessControl,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployOwnableFixture)
        adminAccount = contracts.adminAccount
        account_2 = contracts.account_2
        ownable = contracts.ownable
        pause = contracts.pause
        ownable2StepFacet = contracts.ownable2StepFacet
        accessControl = contracts.accessControl
    })

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Ownable2Step WHEN initializing it THEN fails', async function () {
            await expect(
                ownable2StepFacet.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable2StepFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to an Ownable2Step WHEN initializing it THEN fails', async function () {
            await expect(
                ownable.initializeOwnable(account_2)
            ).to.be.revertedWithCustomError(
                ownable,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a new Proxy pointing to an Ownable2Step WHEN initializing it to address 0 THEN fails', async function () {
            const { ownable: uninitializedOwnable } = await loadFixture(
                deployOwnableUninitializedFixture
            )

            await expect(
                uninitializedOwnable.initializeOwnable(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(uninitializedOwnable, 'AddressZero')
        })
    })

    describe('Transfer, Renounce ownership', function () {
        it('GIVEN an Ownable WHEN using non-owner account to transfer ownership THEN fails', async function () {
            const { ownable: ownable1Step } = await loadFixture(
                deployOwnable1StepFixture
            )

            await TransferNonOwnerAccountTest(ownable1Step)
        })

        it('GIVEN an Ownable WHEN using non-owner account to renounce ownership THEN fails', async function () {
            const { ownable: ownable1Step } = await loadFixture(
                deployOwnable1StepFixture
            )

            await RenounceNonOwnerAccountTest(ownable1Step)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            const { ownable: ownable1Step } = await loadFixture(
                deployOwnable1StepFixture
            )

            await TransferOwnerAccountToZeroTest(ownable1Step)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            const { ownable: ownable1StepPaused } = await loadFixture(
                deployOwnable1StepPausedFixture
            )

            await TransferOwnerAccountWhenPausedTest(ownable1StepPaused)
        })

        it('GIVEN an Ownable WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            const { ownable: ownable1StepPaused } = await loadFixture(
                deployOwnable1StepPausedFixture
            )

            await RenounceOwnerAccountWhenPausedTest(ownable1StepPaused)
        })

        it('GIVEN an Ownable WHEN using owner account to transfer ownership THEN succeeds', async function () {
            const {
                ownable: ownable1Step,
                adminAccount: admin,
                account_2: account2,
            } = await loadFixture(deployOwnable1StepFixture)

            const ownableConnected = ownable1Step.connect(admin)

            await expect(ownableConnected.transferOwnership(account2))
                .to.emit(ownableConnected, 'OwnershipTransferred')
                .withArgs(admin, account2)

            expect(await ownableConnected.owner()).to.equal(account2)
        })

        it('GIVEN an Ownable WHEN using owner account to renounce ownership THEN succeeds', async function () {
            const { ownable: ownable1Step } = await loadFixture(
                deployOwnable1StepFixture
            )

            await RenounceSuccessTest(ownable1Step)
        })
    })

    describe('Transfer, Renounce, Accept ownership 2 step', function () {
        it('GIVEN an Ownable2Step WHEN using non-owner account to transfer ownership THEN fails', async function () {
            await TransferNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable2Step WHEN using non-owner account to renounce ownership THEN fails', async function () {
            await RenounceNonOwnerAccountTest(ownable)
        })

        it('GIVEN an Ownable2Step WHEN using non-pending owner account to accept ownership THEN fails', async function () {
            const ownable2Step = ownable.connect(account_2) as Ownable2Step

            await expect(ownable2Step.acceptOwnership())
                .to.be.revertedWithCustomError(
                    ownable2Step,
                    'AccountIsNotPendingOwner'
                )
                .withArgs(account_2)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership to address 0 THEN fails', async function () {
            await TransferOwnerAccountToZeroTest(ownable as Ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to transfer ownership while token is paused THEN fails', async function () {
            const { ownable: ownablePaused } = await loadFixture(
                deployOwnablePausedFixture
            )

            await TransferOwnerAccountWhenPausedTest(
                ownablePaused as Ownable2Step
            )
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership while token is paused THEN fails', async function () {
            const { ownable: ownablePaused } = await loadFixture(
                deployOwnablePausedFixture
            )

            await RenounceOwnerAccountWhenPausedTest(
                ownablePaused as Ownable2Step
            )
        })

        it('GIVEN an Ownable2Step WHEN using pending owner account to accept ownership while token is paused THEN fails', async function () {
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
            const ownable2Step = ownable.connect(adminAccount) as Ownable2Step

            await expect(ownable2Step.transferOwnership(account_2))
                .to.emit(ownable2Step, 'OwnershipTransferStarted')
                .withArgs(adminAccount, account_2)

            expect(await ownable2Step.pendingOwner()).to.equal(account_2)
            expect(await ownable2Step.owner()).to.equal(adminAccount)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to renounce ownership THEN succeeds', async function () {
            await RenounceSuccessTest(ownable as Ownable2Step)
        })

        it('GIVEN an Ownable2Step WHEN using owner account to accept ownership THEN succeeds', async function () {
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
