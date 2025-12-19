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
-------------------------------------------------------------- */
import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import {
    EntryPointFacet,
    EntryPointTestWrapper,
    SmartAccount,
    IIsbeFactory,
    ValidationAccountMock,
    ISBEPause,
    SmartAccountMock,
} from 'typechain-types'
import { deployGovernance } from '../fixtures/governance'
import {
    ACCOUNT_ABSTRACTION_ENTRYPOINT_RESOLVER_KEY,
    CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
    SMART_ACCOUNT_DEPLOYER_ROLE,
} from '../../utils/constants'
import {
    UserOpBuilder,
    predictSmartAccountAddress,
} from '../utils/accountabstraction/UserOpBuilder'

const AA98_INVALID_PAYMASTER =
    '0xf9536df38dadd0adc0dd82ff451fa98fdb25dd85d5d1444e7831058b8468ec43'
const AA99_INIT_CODE_TOO_SMALL =
    '0x28e973e4f59123b2e26282e4ce8ce43dd0fffb47025ffcde1e8f727ff051ea37'
const AA13_INIT_CODE_FAILED_OR_OOG =
    '0xa46d515f685002bbb631614d07729b129ca01335d4ee63cf10853491e47dee73'
const AA14_INIT_CODE_MUST_RETURN_SENDER =
    '0xcf8e5f91822a9ca4de44f9559ff5db3083e7cb35e25710632c57dc900da04602'
const AA15_INIT_CODE_MUST_CREATE_SENDER =
    '0xbb1e067ee25aabe05bbdddb7ea9a4490fa96ed7d10c6207acd0a3c723a9b7ed6'
const AA10_SENDER_ALREADY_CONSTRUCTED =
    '0x267485e0b239ff7726cfbcfb111a14e388e8253ef89a57c2a12abc410bbc1a79'
const AA20_ACCOUNT_NOT_DEPLOYED =
    '0x71b8c59e134d62690a752e786c07dbe8b7f35be51e386ddf501ff1ee93b9f00e'
const AA22_SIGNATURE_EXPIRED_OR_NOT_DUE =
    '0x4f6af422606d6fab6224761f4f503b9674de8994d20a0052616d3524b670e766'
const AA23_VALIDATION_REVERTED =
    '0xf272bf03d6e7cfb67a72dd0c4aee94925483c9b766e02beaec86cf4f0a3b9477'
const AA24_SIGNATURE_ERROR =
    '0x230fad9992163f7c7bca82563472469d2ae8f1696105d00fd8b1abf9e366de4e'
const AA25_INVALID_ACCOUNT_NONCE =
    '0x1a6d2773a48550bbfcfd396dd79645bef61ab18efc53f13933af43bfa63cc5b5'
const AA26_OVER_VERIFICATION_GAS_LIMIT =
    '0x0959e90f1dbec1bb0766cfc7e4a6f91da34d207dfa787b59651acf3926686974'
const AA31_PAYMASTER_DEPOSIT_TOO_LOW =
    '0x423a165b7dbbda2ae3873c5d3fae3c0ad56dda63b0eb4d372683317213e4df0f'
const AA93_INVALID_PAYMASTER_AND_DATA =
    '0xbed5bf2586bcf71963468f5a6e4def651dfab48dcb520989dbad3d1cd3cd8bdd'
const AA94_GAS_VALUES_OVERFLOW =
    '0x2454d602dd1245dd701375973b2bac347a9e27dc7542cb5ffbdc114cb2232f69'
const AA95_OUT_OF_GAS =
    '0xeb8aae105b33b8e3029845f6a1359760a9480648cd982f4e1c37f01a5ceaf980'

async function deployEntryPointTestWrapper(): Promise<EntryPointTestWrapper> {
    const Factory = await ethers.getContractFactory('EntryPointTestWrapper')
    const wrapper = (await Factory.deploy()) as EntryPointTestWrapper
    await wrapper.waitForDeployment()
    return wrapper
}

describe('EntryPoint', function () {
    const OP_INDEX = 0
    let entryPoint: EntryPointFacet
    let smartAccount: SmartAccount
    let userOpSender: string
    let smartAccountFactory: IIsbeFactory
    let adminSigner: Signer
    let beneficiary: string
    let paymaster: string
    let accessControlFacetAddress: string
    let ownableFacetAddress: string
    let smartAccountFacetAddress: string
    let pauseFacetAddress: string

    let pause: ISBEPause

    let defaultCallData: string

    async function deployFixture() {
        const [adminAccountSigner, beneficiary, paymaster, otherAccountSigner] =
            await ethers.getSigners()
        const beneficiaryAddress = await beneficiary.getAddress()
        const paymasterAddress = await paymaster.getAddress()

        // Deploy Governance
        const governanceResult = await deployGovernance(
            adminAccountSigner,
            [],
            CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT
        )

        const isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await governanceResult.governanceContract.getAddress()
        )

        expect(
            await governanceResult.entryPointFacet.businessIdIntrospection()
        ).to.be.equal(ACCOUNT_ABSTRACTION_ENTRYPOINT_RESOLVER_KEY)

        return {
            entryPoint: governanceResult.entryPoint,
            smartAccountFactory: isbeFactory,
            pause: governanceResult.pauseGovernance as ISBEPause,
            adminAccountSigner,
            otherAccountSigner,
            beneficiaryAddress,
            paymasterAddress,
            accessControlGovernance: governanceResult.accessControlGovernance,
            smartAccount: governanceResult.smartAccount,
            accessControlFacet: governanceResult.accessControlFacet,
            ownableFacet: governanceResult.ownableFacet,
            smartAccountFacet: governanceResult.smartAccountFacet,
            pauseFacet: governanceResult.pauseFacet,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        entryPoint = contracts.entryPoint
        smartAccount = contracts.smartAccount
        userOpSender = await smartAccount.getAddress()
        smartAccountFactory = contracts.smartAccountFactory
        adminSigner = contracts.adminAccountSigner
        beneficiary = contracts.beneficiaryAddress
        paymaster = contracts.paymasterAddress
        pause = contracts.pause
        pauseFacetAddress = await contracts.pauseFacet.getAddress()
        accessControlFacetAddress =
            await contracts.accessControlFacet.getAddress()
        ownableFacetAddress = await contracts.ownableFacet.getAddress()
        smartAccountFacetAddress =
            await contracts.smartAccountFacet.getAddress()

        await contracts.accessControlGovernance.grantRole(
            SMART_ACCOUNT_DEPLOYER_ROLE,
            await entryPoint.getAddress()
        )

        await smartAccount.initializeSmartAccount(entryPoint)

        defaultCallData = smartAccount.interface.encodeFunctionData('execute', [
            beneficiary,
            0n,
            '0x',
        ])
    })

    describe('Paused', () => {
        beforeEach(async () => {
            await pause.pause()
        })

        it('GIVEN a paused EP WHEN handleOps THEN it fails', async () => {
            const { userOp } = await new UserOpBuilder(
                entryPoint,
                adminSigner,
                userOpSender
            ).sign()
            await expect(
                entryPoint.handleOps([userOp], beneficiary)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused EP WHEN depositTo THEN it fails', async () => {
            await expect(
                entryPoint.depositTo(ZeroAddress, { value: 10n })
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused EP WHEN addStake THEN it fails', async () => {
            await expect(
                entryPoint.addStake(10n)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused EP WHEN unlockStake THEN it fails', async () => {
            await expect(
                entryPoint.unlockStake()
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused EP WHEN withdrawStake THEN it fails', async () => {
            await expect(
                entryPoint.withdrawStake(ZeroAddress)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused EP WHEN withdrawTo THEN it fails', async () => {
            await expect(
                entryPoint.withdrawTo(ZeroAddress, 10n)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
    })

    describe('StakeManager', () => {
        describe('getDepositInfo', () => {
            it('GIVEN an empty account WHEN asking for its deposit info THEN the info is returned', async () => {
                const accountAddress = ethers.Wallet.createRandom().address

                const depositInfo =
                    await entryPoint.getDepositInfo(accountAddress)

                expect(depositInfo.deposit).to.equal(0)
                expect(depositInfo.staked).to.equal(false)
                expect(depositInfo.stake).to.equal(0)
                expect(depositInfo.unstakeDelaySec).to.equal(0)
                expect(depositInfo.withdrawTime).to.equal(0)
            })

            it('GIVEN an account with deposit WHEN asking for its deposit info THEN the info is returned', async () => {
                const accountAddress = ethers.Wallet.createRandom().address
                const amountToDeposit = 10n
                await entryPoint.depositTo(accountAddress, {
                    value: amountToDeposit,
                })

                const depositInfo =
                    await entryPoint.getDepositInfo(accountAddress)

                expect(depositInfo.deposit).to.equal(amountToDeposit)
            })

            it('GIVEN an account with stake WHEN asking for its deposit info THEN the info is returned', async () => {
                const [account] = await ethers.getSigners()
                const accountAddress = account.address
                const amountToStake = 10n
                const unstakeDelay = 10n
                await entryPoint.addStake(unstakeDelay, {
                    value: amountToStake,
                })

                const depositInfo =
                    await entryPoint.getDepositInfo(accountAddress)

                expect(depositInfo.staked).to.equal(true)
                expect(depositInfo.stake).to.equal(amountToStake)
                expect(depositInfo.unstakeDelaySec).to.equal(unstakeDelay)
            })
        })

        describe('balanceOf', () => {
            it('GIVEN an account with deposit WHEN asking for its balance THEN the deposit amount is returned', async () => {
                const accountAddress = ethers.Wallet.createRandom().address
                const amountToDeposit = 10n
                await entryPoint.depositTo(accountAddress, {
                    value: amountToDeposit,
                })

                const balance = await entryPoint.balanceOf(accountAddress)

                expect(balance).to.equal(amountToDeposit)
            })

            it('GIVEN an account without deposit WHEN asking for its balance THEN zero is returned', async () => {
                const accountAddress = ethers.Wallet.createRandom().address

                const balance = await entryPoint.balanceOf(accountAddress)

                expect(balance).to.equal(0)
            })
        })

        describe('depositTo', () => {
            it('GIVEN an account WHEN depositting an amount THEN an event is emitted', async () => {
                const accountAddress = ethers.Wallet.createRandom().address
                const amountToDeposit = 10n

                await expect(
                    entryPoint.depositTo(accountAddress, {
                        value: amountToDeposit,
                    })
                )
                    .to.emit(entryPoint, 'Deposited')
                    .withArgs(accountAddress, amountToDeposit)
            })
        })

        describe('addstake', () => {
            it('GIVEN an account WHEN staking THEN an event is emitted', async () => {
                const [account] = await ethers.getSigners()
                const amountToStake = 10n
                const unstakeDelay = 10n

                await expect(
                    entryPoint.addStake(unstakeDelay, { value: amountToStake })
                )
                    .to.emit(entryPoint, 'StakeLocked')
                    .withArgs(account.address, amountToStake, unstakeDelay)
            })

            it('GIVEN an empty unstakeDelay WHEN staking THEN it reverts', async () => {
                const amountToStake = 10n
                const unstakeDelay = 0n

                await expect(
                    entryPoint.addStake(unstakeDelay, { value: amountToStake })
                ).to.be.revertedWithCustomError(
                    entryPoint,
                    'NoUnstakeDelaySpecified'
                )
            })

            it('GIVEN an existing stake WHEN staking with lower stakeDelay THEN it reverts', async () => {
                const [account] = await ethers.getSigners()
                const amountToStake = 10n
                const unstakeDelay = 10n

                await expect(
                    entryPoint.addStake(unstakeDelay, { value: amountToStake })
                )
                    .to.emit(entryPoint, 'StakeLocked')
                    .withArgs(account.address, amountToStake, unstakeDelay)

                const newStakeDelay = 1n
                await expect(
                    entryPoint.addStake(newStakeDelay, { value: amountToStake })
                )
                    .to.be.revertedWithCustomError(
                        entryPoint,
                        'CannotDecreaseStakeTime'
                    )
                    .withArgs(amountToStake, newStakeDelay)
            })

            it('GIVEN an empty stake WHEN staking THEN it reverts', async () => {
                const amountToStake = 0n
                const unstakeDelay = 10n

                await expect(
                    entryPoint.addStake(unstakeDelay, { value: amountToStake })
                ).to.be.revertedWithCustomError(entryPoint, 'NoStakeSpecified')
            })

            it('GIVEN a huge stake WHEN staking THEN it reverts', async () => {
                const [account] = await ethers.getSigners()
                const amountToStake = 1n << 112n
                const unstakeDelay = 10n

                // This is required to get enough funds to force error
                await network.provider.send('hardhat_setBalance', [
                    await account.getAddress(),
                    '0x1000000000000006cea667a0d3300', //amountToStake
                ])

                await expect(
                    entryPoint.addStake(unstakeDelay, { value: amountToStake })
                )
                    .to.be.revertedWithCustomError(entryPoint, 'StakeOverflow')
                    .withArgs(amountToStake)
            })
        })

        describe('unlockStake', () => {
            it('GIVEN a non staking account WHEN unlocking stake THEN the execution is reverted', async () => {
                await expect(
                    entryPoint.unlockStake()
                ).to.be.revertedWithCustomError(entryPoint, 'NoActiveStake')
            })

            it('GIVEN a staking but unlocked account WHEN unlocking stake THEN the execution is reverted', async () => {
                await entryPoint.addStake(10n, { value: 10n })
                await entryPoint.unlockStake()

                await expect(
                    entryPoint.unlockStake()
                ).to.be.revertedWithCustomError(
                    entryPoint,
                    'AlreadyInUnstaking'
                )
            })

            it('GIVEN a non stacking account WHEN unlocking stake THEN an event is emitted and info is updated', async () => {
                const [account] = await ethers.getSigners()
                const unstakeDelay = 10n
                const stakedAmount = 10n
                await entryPoint.addStake(unstakeDelay, { value: stakedAmount })

                await expect(entryPoint.unlockStake())
                    .to.emit(entryPoint, 'StakeUnlocked')
                    .withArgs(
                        account.address,
                        (withdraw: number) => withdraw > unstakeDelay
                    )

                const depositInfoAfterUnlocking =
                    await entryPoint.getDepositInfo(account.address)
                expect(depositInfoAfterUnlocking.staked).to.equal(false)
                expect(depositInfoAfterUnlocking.stake).to.equal(stakedAmount)
            })
        })

        describe('withdrawStake', () => {
            it('GIVEN a non-staking account WHEN withdrawing stake THEN the execution is reverted', async () => {
                const withdrawAddress = ethers.Wallet.createRandom().address

                await expect(
                    entryPoint.withdrawStake(withdrawAddress)
                ).to.be.revertedWithCustomError(entryPoint, 'NoStakeToWithdraw')
            })

            it('GIVEN a non-unlocked staking account WHEN withdrawing stake THEN the execution is reverted', async () => {
                const withdrawAddress = ethers.Wallet.createRandom().address

                await entryPoint.addStake(10n, { value: 10n })

                await expect(
                    entryPoint.withdrawStake(withdrawAddress)
                ).to.be.revertedWithCustomError(entryPoint, 'MustUnlockFirst')
            })

            it('GIVEN an unlocked staking account WHEN withdrawing stake before the withdraw time has arrived THEN the execution is reverted', async () => {
                const entryPointAddress = await entryPoint.getAddress()
                const withdrawAddress = ethers.Wallet.createRandom().address
                const unstakeDelay = 10n

                await entryPoint.addStake(unstakeDelay, { value: 10n })
                const tx = await entryPoint.unlockStake()
                const receipt = await tx.wait()
                if (!receipt) throw new Error('Transaction receipt is null')

                let withdrawTime = 0n

                receipt.logs
                    .filter(
                        (log) =>
                            log.address.toLowerCase() ===
                            entryPointAddress.toLowerCase()
                    )
                    .forEach((log) => {
                        try {
                            const parsed = entryPoint.interface.decodeEventLog(
                                'StakeUnlocked',
                                log.data,
                                log.topics
                            )
                            withdrawTime = parsed.withdrawTime as bigint
                        } catch {
                            // skip
                        }
                    })

                await expect(entryPoint.withdrawStake(withdrawAddress))
                    .to.be.revertedWithCustomError(
                        entryPoint,
                        'StakeWithdrawalNotDue'
                    )
                    .withArgs(withdrawTime)
            })

            it('GIVEN an unlocked staking account WHEN withdrawing stake to a non-payable address THEN the execution is reverted', async () => {
                const NonPayableContract = await ethers.getContractFactory(
                    `AccessControlTestWrapper`
                )
                const withdrawAddress = (await NonPayableContract.deploy())
                    .target

                await entryPoint.addStake(1n, { value: 10n })
                await entryPoint.unlockStake()

                await expect(
                    entryPoint.withdrawStake(withdrawAddress)
                ).to.be.revertedWithCustomError(
                    entryPoint,
                    'WithdrawStakeFailed'
                )
            })

            it('GIVEN an unlocked staking account WHEN withdrawing stake THEN an event is emitted and info is updated', async () => {
                const [account] = await ethers.getSigners()
                const withdrawAddress = ethers.Wallet.createRandom().address
                const stakedAmount = 10n

                await entryPoint.addStake(1n, { value: stakedAmount })
                await entryPoint.unlockStake()

                await expect(entryPoint.withdrawStake(withdrawAddress))
                    .to.emit(entryPoint, 'StakeWithdrawn')
                    .withArgs(account.address, withdrawAddress, stakedAmount)

                const depositInfoAfterUnlocking =
                    await entryPoint.getDepositInfo(account.address)
                expect(depositInfoAfterUnlocking.staked).to.equal(false)
                expect(depositInfoAfterUnlocking.stake).to.equal(0n)
                expect(depositInfoAfterUnlocking.unstakeDelaySec).to.equal(0n)
                expect(depositInfoAfterUnlocking.withdrawTime).to.equal(0n)
            })
        })

        describe('withdrawTo', () => {
            it('GIVEN a account with deposit WHEN withdrawing an amount greater than the deposit THEN the execution is reverted', async () => {
                const withdrawAddress = ethers.Wallet.createRandom().address
                const amount = 10n
                await expect(entryPoint.withdrawTo(withdrawAddress, amount))
                    .to.be.revertedWithCustomError(
                        entryPoint,
                        'WithdrawAmountTooLarge'
                    )
                    .withArgs(amount)
            })

            it('GIVEN a account with deposit WHEN withdrawing to a non-payable address THEN the execution is reverted', async () => {
                const [account] = await ethers.getSigners()
                const NonPayableContract = await ethers.getContractFactory(
                    `AccessControlTestWrapper`
                )
                const withdrawAddress = (await NonPayableContract.deploy())
                    .target
                const depositedAmount = 10n

                await entryPoint.depositTo(account.address, {
                    value: depositedAmount,
                })

                await expect(
                    entryPoint.withdrawTo(withdrawAddress, depositedAmount)
                ).to.be.revertedWithCustomError(entryPoint, 'WithdrawFailed')
            })

            it('GIVEN a account with deposit WHEN withdrawing THEN an event is emitted and info is updated', async () => {
                const [account] = await ethers.getSigners()
                const withdrawAddress = ethers.Wallet.createRandom().address
                const depositedAmount = 10n
                const amountToWithdraw = 7n

                await entryPoint.depositTo(account.address, {
                    value: depositedAmount,
                })

                await expect(
                    entryPoint.withdrawTo(withdrawAddress, amountToWithdraw)
                )
                    .to.emit(entryPoint, 'Withdrawn')
                    .withArgs(
                        account.address,
                        withdrawAddress,
                        amountToWithdraw
                    )

                const depositInfoAfterUnlocking =
                    await entryPoint.getDepositInfo(account.address)
                expect(depositInfoAfterUnlocking.deposit).to.equal(
                    depositedAmount - amountToWithdraw
                )
            })
        })
    })

    describe('NonceManager', () => {
        it('GIVEN an address without initialized nonce WHEN asking for its nonce THEN 0 is returned', async () => {
            const [account] = await ethers.getSigners()

            const nonce = await entryPoint.getNonce(account.address, 0n)

            expect(nonce).to.equal(0)
        })

        it('GIVEN a key WHEN incrementing its nonce THEN the nonce is incremented', async () => {
            const [account] = await ethers.getSigners()
            const key = 0n

            await entryPoint.incrementNonce(key)

            const nonce = await entryPoint.getNonce(account.address, key)
            expect(nonce).to.equal(1)
        })
    })

    describe('EntryPoint handleOps', () => {
        let userOpBuilder: UserOpBuilder

        beforeEach(async () => {
            userOpBuilder = new UserOpBuilder(
                entryPoint,
                adminSigner,
                userOpSender
            )
            await entryPoint.depositTo(paymaster, {
                value: ethers.parseEther('1'),
            })
        })

        it('GIVEN no paymasterAndData WHEN handleOps THEN reverts with FailedOp: AA93', async () => {
            const { userOp } = await userOpBuilder.sign()

            await expect(entryPoint.handleOps([userOp], beneficiary))
                .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                .withArgs(OP_INDEX, AA93_INVALID_PAYMASTER_AND_DATA)
        })

        it('GIVEN zero paymaster WHEN handleOps THEN reverts with FailedOp: AA98', async () => {
            const { userOp } = await userOpBuilder
                .withPaymasterAndData({ paymaster: ZeroAddress })
                .sign()

            await expect(entryPoint.handleOps([userOp], beneficiary))
                .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                .withArgs(OP_INDEX, AA98_INVALID_PAYMASTER)
        })

        describe('Validate user operations', () => {
            describe('account deployment (_createSenderIfNeeded)', () => {
                it('GIVEN an initCode and an existing smart Account WHEN handleOps THEN reverts with FailedOp: AA10', async () => {
                    const accountFactoryAddress =
                        await smartAccountFactory.getAddress()
                    const owner = await adminSigner.getAddress()

                    const SmartAccountFactoryFactory =
                        await ethers.getContractFactory(
                            'SmartAccountFactoryFacet'
                        )
                    const initCode =
                        accountFactoryAddress +
                        SmartAccountFactoryFactory.interface
                            .encodeFunctionData('createAccount', [
                                owner,
                                ethers.encodeBytes32String('0'),
                            ])
                            .slice(2)

                    const { userOp } = await userOpBuilder
                        .withInitCode(initCode)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA10_SENDER_ALREADY_CONSTRUCTED)
                })

                it('GIVEN an initCode shorter than 20 bytes WHEN handleOps THEN reverts with FailedOp: AA99', async () => {
                    const sender = await adminSigner.getAddress()
                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withShortInitCode()
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA99_INIT_CODE_TOO_SMALL)
                })

                it('GIVEN a userOp with initCode that reverts on deployment WHEN handleOps THEN reverts with FailedOp: InitCodeFailedOrOOG', async () => {
                    const sender = await adminSigner.getAddress()

                    const SmartAccountFactoryFactory =
                        await ethers.getContractFactory('AccountFactoryMock')
                    const accountFactory =
                        await SmartAccountFactoryFactory.deploy()
                    await accountFactory.waitForDeployment()

                    const accountFactoryAddress =
                        await accountFactory.getAddress()

                    const initCode =
                        accountFactoryAddress +
                        SmartAccountFactoryFactory.interface
                            .encodeFunctionData('createAccountRevert')
                            .slice(2)

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withInitCode(initCode)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA13_INIT_CODE_FAILED_OR_OOG)
                })

                it('GIVEN a userOp with initCode whose deployed address differs from sender WHEN handleOps THEN reverts with FailedOp: AA14', async () => {
                    const sender = await adminSigner.getAddress()
                    const SmartAccountFactoryFactory =
                        await ethers.getContractFactory('AccountFactoryMock')
                    const accountFactory =
                        await SmartAccountFactoryFactory.deploy()
                    await accountFactory.waitForDeployment()

                    const accountFactoryAddress =
                        await accountFactory.getAddress()

                    const initCode =
                        accountFactoryAddress +
                        SmartAccountFactoryFactory.interface
                            .encodeFunctionData('createAccountOtherAddress')
                            .slice(2)

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withInitCode(initCode)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA14_INIT_CODE_MUST_RETURN_SENDER)
                })

                it('GIVEN a userOp with initCode that returns an EOA WHEN handleOps THEN reverts with FailedOp: AA15', async () => {
                    const sender = await adminSigner.getAddress()
                    const SmartAccountFactoryFactory =
                        await ethers.getContractFactory('AccountFactoryMock')
                    const accountFactory =
                        await SmartAccountFactoryFactory.deploy()
                    await accountFactory.waitForDeployment()

                    const accountFactoryAddress =
                        await accountFactory.getAddress()

                    const initCode =
                        accountFactoryAddress +
                        SmartAccountFactoryFactory.interface
                            .encodeFunctionData('createAccountEOA', [sender])
                            .slice(2)

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withInitCode(initCode)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA15_INIT_CODE_MUST_CREATE_SENDER)
                })
                it('GIVEN a userOp with initCode WHEN handleOps is called THEN the account is deployed and AccountDeployed is emitted', async () => {
                    const smartAccountFactoryAddress =
                        await smartAccountFactory.getAddress()
                    const salt =
                        '0x1234567890123456789012345678901234567890123456789012345678901234'
                    const SmartAccountFactoryFactory =
                        await ethers.getContractFactory(
                            'SmartAccountFactoryFacet'
                        )

                    const initCode = ethers.concat([
                        await smartAccountFactory.getAddress(),
                        SmartAccountFactoryFactory.interface.encodeFunctionData(
                            'createAccount',
                            [await adminSigner.getAddress(), salt]
                        ),
                    ])

                    const sender = await predictSmartAccountAddress(salt, {
                        isbeFactoryAddress: smartAccountFactoryAddress,
                        entryPointAddress: await entryPoint.getAddress(),
                        smartAccountOwnerAddress:
                            await adminSigner.getAddress(),
                        ownableFacetAddress: ownableFacetAddress,
                        smartAccountFacetAddress: smartAccountFacetAddress,
                        pauseFacetAddress: pauseFacetAddress,
                        accessControlFacetAddress: accessControlFacetAddress,
                    })

                    const { userOp, userOpHash } = await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        sender
                    )
                        .withSender(sender)
                        .withInitCode(initCode)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .withGasLimits({ verification: 10_000_000n }) // required to pass coverage
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.emit(entryPoint, 'AccountDeployed')
                        .withArgs(
                            userOpHash,
                            sender,
                            smartAccountFactory,
                            paymaster
                        )
                })

                it('GIVEN a userOp with initCode for an already deployed account WHEN handleOps is called THEN deployment is skipped', async () => {
                    await entryPoint.depositTo(userOpSender, {
                        value: ethers.parseEther('1'),
                    })

                    const { userOp } = await userOpBuilder
                        .withCallData(defaultCallData)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(
                        entryPoint.handleOps([userOp], beneficiary)
                    ).to.not.emit(entryPoint, 'AccountDeployed')
                })

                it('GIVEN a userOp without initCode WHEN handleOps THEN reverts with FailedOp: AA20', async () => {
                    const sender = await adminSigner.getAddress()
                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA20_ACCOUNT_NOT_DEPLOYED)
                })
            })

            describe('account validates the user operation (_callValidateUserOp)', () => {
                let mockAccount: ValidationAccountMock

                beforeEach(async () => {
                    const MockAccountFactory = await ethers.getContractFactory(
                        'ValidationAccountMock'
                    )
                    mockAccount = await MockAccountFactory.deploy(entryPoint)
                    await mockAccount.waitForDeployment()
                })
                it('GIVEN account.validateUserOp reverts with reason WHEN handleOps is called THEN reverts with FailedOpWithRevert', async () => {
                    const sender = await mockAccount.getAddress()

                    const validationReverts = true
                    const validationShouldReturnBadData = false
                    const sigFailed = false
                    const validUntil = 0
                    const vailidAfter = 0
                    const aggregator = (await ethers.getSigners())[9].address
                    await mockAccount.setValidationData(
                        validationReverts,
                        validationShouldReturnBadData,
                        sigFailed,
                        validUntil,
                        vailidAfter,
                        aggregator
                    )

                    const initialDeposit = ethers.parseEther('1')
                    await entryPoint
                        .connect(adminSigner)
                        .depositTo(sender, { value: initialDeposit })

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .sign()

                    const selector = ethers.id('Error(string)').slice(0, 10) // "0x08c379a0"
                    const encodedStr = ethers.AbiCoder.defaultAbiCoder().encode(
                        ['string'],
                        ['Validation Failed']
                    )
                    const expectedRevertData = selector + encodedStr.slice(2)
                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(
                            entryPoint,
                            'FailedOpWithRevert'
                        )
                        .withArgs(
                            0,
                            AA23_VALIDATION_REVERTED,
                            expectedRevertData
                        )
                })

                it('forces returndatasize != 32 inside validateUserOp', async () => {
                    const sender = await mockAccount.getAddress()
                    const validationReverts = false
                    const validationShouldReturnBadData = true
                    const sigFailed = false
                    const validUntil = 0
                    const vailidAfter = 0
                    const aggregator = (await ethers.getSigners())[9].address
                    await mockAccount.setValidationData(
                        validationReverts,
                        validationShouldReturnBadData,
                        sigFailed,
                        validUntil,
                        vailidAfter,
                        aggregator
                    )

                    const initialDeposit = ethers.parseEther('1')
                    await entryPoint
                        .connect(adminSigner)
                        .depositTo(sender, { value: initialDeposit })

                    const { userOp } = await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        sender
                    )
                        .withCallData('0x')
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(
                            entryPoint,
                            'FailedOpWithRevert'
                        )
                        .withArgs(0, AA23_VALIDATION_REVERTED, '0x')
                })
            })

            describe('nonce handling (_validateAndUpdateNonce)', () => {
                it('GIVEN a fresh nonce WHEN handleOps is called THEN nonce is incremented', async () => {
                    await entryPoint.depositTo(userOpSender, {
                        value: ethers.parseEther('1'),
                    })

                    const { userOp } = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(0n)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary)).to
                        .not.be.reverted

                    const epNonce = await entryPoint.getNonce(userOpSender, 0)
                    expect(epNonce).to.equal(1n)
                })

                it('GIVEN a reused nonce WHEN handleOps is called THEN reverts with FailedOp: AA25', async () => {
                    await entryPoint.depositTo(userOpSender, {
                        value: ethers.parseEther('1'),
                    })

                    const { userOp } = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(2n)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(OP_INDEX, AA25_INVALID_ACCOUNT_NONCE)
                })

                it('GIVEN multiple userOps with sequential nonces WHEN handleOps is called THEN all succeed', async () => {
                    await entryPoint.depositTo(userOpSender, {
                        value: ethers.parseEther('1'),
                    })

                    const userOp0 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster: paymaster })
                            .withNonce(0n)
                            .sign()
                    ).userOp

                    const userOp1 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster: paymaster })
                            .withNonce(1n)
                            .sign()
                    ).userOp

                    const userOp2 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster: paymaster })
                            .withNonce(2n)
                            .sign()
                    ).userOp

                    await expect(
                        entryPoint.handleOps(
                            [userOp0, userOp1, userOp2],
                            beneficiary
                        )
                    ).to.not.be.reverted

                    const epNonce = await entryPoint.getNonce(userOpSender, 0)
                    expect(epNonce).to.equal(3n)
                })

                it('GIVEN multiple userOps with nonces out of order WHEN handleOps is called THEN only valid ops are processed', async () => {
                    await entryPoint.depositTo(userOpSender, {
                        value: ethers.parseEther('1'),
                    })

                    const op0 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster: paymaster })
                            .withNonce(0n)
                            .sign()
                    ).userOp

                    const op1 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster: paymaster })
                            .withNonce(1n)
                            .sign()
                    ).userOp

                    await expect(entryPoint.handleOps([op1, op0], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA25_INVALID_ACCOUNT_NONCE)

                    const epNonce = await entryPoint.getNonce(userOpSender, 0)
                    expect(epNonce).to.equal(0n)
                })
            })

            describe('prefund & gas limits', () => {
                it('GIVEN account deposit >= prefund WHEN handleOps is called THEN prefund is reserved and refunded correctly', async () => {
                    const { userOp } = await userOpBuilder
                        .withCallData(defaultCallData)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .sign()

                    const depositBefore = await entryPoint.balanceOf(paymaster)

                    await expect(entryPoint.handleOps([userOp], beneficiary)).to
                        .not.be.reverted

                    const depositAfter = await entryPoint.balanceOf(paymaster)

                    expect(depositAfter).to.be.lessThan(depositBefore)
                    expect(depositAfter).to.be.greaterThan(0n)
                })

                it('GIVEN userOp contains gas fields causing overflow WHEN handleOps is called THEN reverts with FailedOp: AA94', async () => {
                    const huge = 1n << 120n // > type(uint120).max

                    const { userOp } = await userOpBuilder
                        .withCallData(defaultCallData)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withGasLimits({
                            call: huge,
                            verification: 1_000_000n,
                        })
                        .sign()

                    const depositBefore =
                        await entryPoint.balanceOf(userOpSender)
                    expect(depositBefore).to.equals(0n)

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA94_GAS_VALUES_OVERFLOW)
                })

                it('GIVEN a verificationGasLimit too low WHEN handleOps is called THEN reverts with FailedOp: AA26', async () => {
                    const entryPoint = await deployEntryPointTestWrapper()
                    await smartAccount.updateEntryPoint(entryPoint)
                    const { userOp } = await userOpBuilder
                        .withCallData(defaultCallData)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withGasLimits({ verification: 50_000n })
                        .sign()

                    await expect(entryPoint.testValidatePrepaymentAA26(userOp))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA26_OVER_VERIFICATION_GAS_LIMIT)
                })

                it('GIVEN a paymaster without funds WHEN handleOps is called THEN reverts with FailedOp: AA31', async () => {
                    const { userOp } = await userOpBuilder
                        .withCallData(defaultCallData)
                        .withPaymasterAndData({ paymaster: beneficiary })
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA31_PAYMASTER_DEPOSIT_TOO_LOW)
                })
            })

            describe('Account validationData', () => {
                let mockAccount: ValidationAccountMock

                beforeEach(async () => {
                    const MockAccountFactory = await ethers.getContractFactory(
                        'ValidationAccountMock'
                    )
                    mockAccount = await MockAccountFactory.deploy(entryPoint)
                    await mockAccount.waitForDeployment()
                })

                it('GIVEN validAfter in the future WHEN handleOps is called THEN reverts with FailedOp: AA22', async () => {
                    const sender = await mockAccount.getAddress()

                    const block = await ethers.provider.getBlock('latest')
                    const now = BigInt(block!.timestamp)

                    const validationReverts = false
                    const validationShouldReturnBadData = false
                    const sigFailed = false
                    const validUntil = 0
                    const vailidAfter = now + 100n
                    const aggregator = ZeroAddress
                    await mockAccount.setValidationData(
                        validationReverts,
                        validationShouldReturnBadData,
                        sigFailed,
                        validUntil,
                        vailidAfter,
                        aggregator
                    )

                    const initialDeposit = ethers.parseEther('1')
                    await entryPoint
                        .connect(adminSigner)
                        .depositTo(sender, { value: initialDeposit })

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA22_SIGNATURE_EXPIRED_OR_NOT_DUE)
                })
                it('GIVEN validUntil in the past WHEN handleOps is called THEN reverts with FailedOp: AA22', async () => {
                    const sender = await mockAccount.getAddress()

                    const block = await ethers.provider.getBlock('latest')
                    const now = BigInt(block!.timestamp)

                    const validationReverts = false
                    const validationShouldReturnBadData = false
                    const sigFailed = false
                    const validUntil = now - 1n
                    const vailidAfter = 0
                    const aggregator = ZeroAddress
                    await mockAccount.setValidationData(
                        validationReverts,
                        validationShouldReturnBadData,
                        sigFailed,
                        validUntil,
                        vailidAfter,
                        aggregator
                    )

                    const initialDeposit = ethers.parseEther('1')
                    await entryPoint
                        .connect(adminSigner)
                        .depositTo(sender, { value: initialDeposit })

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA22_SIGNATURE_EXPIRED_OR_NOT_DUE)
                })
                it('GIVEN non-zero aggregator in account validationData WHEN handleOps is called THEN reverts with FailedOp: AA24', async () => {
                    const sender = await mockAccount.getAddress()

                    const validationReverts = false
                    const validationShouldReturnBadData = false
                    const sigFailed = true
                    const validUntil = 0
                    const vailidAfter = 0
                    const aggregator = (await ethers.getSigners())[9].address
                    await mockAccount.setValidationData(
                        validationReverts,
                        validationShouldReturnBadData,
                        sigFailed,
                        validUntil,
                        vailidAfter,
                        aggregator
                    )

                    const initialDeposit = ethers.parseEther('1')
                    await entryPoint
                        .connect(adminSigner)
                        .depositTo(sender, { value: initialDeposit })

                    const { userOp } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA24_SIGNATURE_ERROR)
                })
            })
        })

        describe('Execute user operations', () => {
            type MemoryUserOp = {
                sender: string
                nonce: bigint
                verificationGasLimit: bigint
                callGasLimit: bigint
                paymasterVerificationGasLimit: bigint
                paymasterPostOpGasLimit: bigint
                preVerificationGas: bigint
                paymaster: string
                maxFeePerGas: bigint
                maxPriorityFeePerGas: bigint
            }
            type UserOpInfo = {
                mUserOp: MemoryUserOp
                userOpHash: string
                prefund: bigint
                preOpGas: bigint
                contextOffset: bigint
            }
            it('GIVEN a non EntryPoint address WHEN call innerhandleOp THEN reverts InternalCallOnly', async () => {
                const dummyCallData = '0x'

                // Build a minimal dummy opInfo. Fields can be zero / empty because
                // require(_msgSender() == address(this)) will revert before using them.
                const dummyOpInfo: UserOpInfo = {
                    mUserOp: {
                        sender: ZeroAddress,
                        nonce: 0n,
                        verificationGasLimit: 0n,
                        callGasLimit: 0n,
                        paymasterVerificationGasLimit: 0n,
                        paymasterPostOpGasLimit: 0n,
                        preVerificationGas: 0n,
                        paymaster: ZeroAddress,
                        maxFeePerGas: 0n,
                        maxPriorityFeePerGas: 0n,
                    },
                    userOpHash: ethers.ZeroHash,
                    prefund: 0n,
                    contextOffset: 0n,
                    preOpGas: 0n,
                }

                await expect(
                    entryPoint.innerHandleOp(dummyCallData, dummyOpInfo)
                ).to.revertedWithCustomError(entryPoint, 'InternalCallOnly')
            })

            describe('success path', () => {
                let smartAccountMock: SmartAccountMock
                let sender: string

                beforeEach(async () => {
                    const SmartAccountMockFactory =
                        await ethers.getContractFactory('SmartAccountMock')
                    smartAccountMock = await SmartAccountMockFactory.deploy()
                    await smartAccountMock.waitForDeployment()

                    sender = await smartAccountMock.getAddress()
                })
                it('executes successfully for a valid userOp without account call (empty call data)', async () => {
                    // GIVEN a valid UserOp whose callData is empty
                    // WHEN handleOps is called
                    // THEN _executeUserOp returns innerCost and emits UserOperationEvent(success=true)

                    const emptyCallData = '0x'

                    const { userOp, userOpHash } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(emptyCallData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOpHash,
                            sender,
                            paymaster,
                            userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )

                    expect(await smartAccountMock.validateUserOpCalls()).to.eq(
                        1
                    )
                    expect(await smartAccountMock.executeCalls()).to.eq(0)
                })

                it('executes successfully for a valid userOp with successful account call', async () => {
                    // GIVEN a valid UserOp whose callData executes successfully on the account
                    // WHEN handleOps is called
                    // THEN _executeUserOp returns innerCost and emits UserOperationEvent(success=true)

                    const callData =
                        smartAccountMock.interface.encodeFunctionData(
                            'execute',
                            [beneficiary, 0n, '0x']
                        )

                    const { userOp, userOpHash } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(callData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOpHash,
                            sender,
                            paymaster,
                            userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )

                    expect(await smartAccountMock.validateUserOpCalls()).to.eq(
                        1
                    )
                    expect(await smartAccountMock.executeCalls()).to.eq(1)
                })

                it('marks operation as failed when account call reverts with reason but innerHandleOp completes', async () => {
                    // GIVEN a valid UserOp whose callData causes the account to revert
                    //  and innerHandleOp completes and calls _postExecution with mode=opReverted
                    // WHEN handleOps is called
                    // THEN _executeUserOp returns innerCost and emits UserOperationRevertReason(reason) and UserOperationEvent(success=false)

                    const callData =
                        smartAccountMock.interface.encodeFunctionData(
                            'executeReverts',
                            [beneficiary, 0n, '0x']
                        )

                    const expectedError =
                        smartAccountMock.interface.encodeErrorResult(
                            'SmartAccountMockRevert'
                        )

                    const { userOp, userOpHash } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(callData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.emit(entryPoint, 'UserOperationRevertReason')
                        .withArgs(
                            userOpHash,
                            sender,
                            userOp.nonce,
                            expectedError
                        )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOpHash,
                            sender,
                            paymaster,
                            userOp.nonce,
                            false,
                            anyValue,
                            anyValue
                        )
                })

                it('marks operation as failed when account call reverts without reason but innerHandleOp completes', async () => {
                    // GIVEN a valid UserOp whose callData causes the account to revert
                    //  and innerHandleOp completes and calls _postExecution with mode=opReverted
                    // WHEN handleOps is called
                    // THEN _executeUserOp returns innerCost and UserOperationEvent(success=false)
                    const callData =
                        smartAccountMock.interface.encodeFunctionData(
                            'executeRevertsWithoutReason',
                            [beneficiary, 0n, '0x']
                        )

                    const { userOp, userOpHash } = await userOpBuilder
                        .withSender(sender)
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(callData)
                        .sign()

                    await expect(entryPoint.handleOps([userOp], beneficiary))
                        .to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOpHash,
                            sender,
                            paymaster,
                            userOp.nonce,
                            false,
                            anyValue,
                            anyValue
                        )
                        .and.not.to.emit(
                            entryPoint,
                            'UserOperationRevertReason'
                        )
                })
            })

            describe('INNER_OUT_OF_GAS sentinel handling', () => {
                it('reverts with AA95 when innerHandleOp fails with INNER_OUT_OF_GAS', async () => {
                    // GIVEN a UserOp that triggers INNER_OUT_OF_GAS inside innerHandleOp/_verifyGasLeft
                    // WHEN handleOps is called
                    // THEN the transaction reverts with FailedOp(AA95 out of gas)
                    const entryPoint = await deployEntryPointTestWrapper()

                    const { userOp } = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .sign()

                    await expect(
                        entryPoint.executeUserOpForceOOG(
                            userOp,
                            1_000_000_000_000_000n
                        )
                    )
                        .to.revertedWithCustomError(entryPoint, 'FailedOp')
                        .withArgs(0, AA95_OUT_OF_GAS)
                })
            })

            describe('INNER_REVERT_LOW_PREFUND sentinel handling', () => {
                it('handles low prefund via _handleLowPrefund and charges exactly prefund', async () => {
                    // GIVEN a UserOp where prefund < actualGasCost so _handleRefund reverts with INNER_REVERT_LOW_PREFUND
                    // WHEN handleOps is called
                    // THEN _executeUserOp calls _handleLowPrefund, emits UserOperationPrefundTooLow
                    //  and UserOperationEvent(success=false, actualGasCost=prefund), and returns prefund
                    const prefundOverride = 1n

                    const entryPoint = await deployEntryPointTestWrapper()

                    const { userOp, userOpHash } = await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        userOpSender
                    )
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withGasLimits({
                            call: 100_000n,
                            verification: 100_000n,
                            preVerification: 21_000n,
                        })
                        .withGasFees({
                            maxFeePerGas: ethers.parseUnits('1', 'gwei'),
                            maxPriorityFeePerGas: ethers.parseUnits(
                                '1',
                                'gwei'
                            ),
                        })
                        .withCallData(defaultCallData)
                        .sign()

                    await expect(
                        entryPoint.executeUserOpWithLowPrefund(
                            userOp,
                            prefundOverride
                        )
                    )
                        .to.emit(entryPoint, 'UserOperationPrefundTooLow')
                        .withArgs(userOpHash, userOpSender, userOp.nonce)
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOpHash,
                            userOpSender,
                            paymaster,
                            userOp.nonce,
                            false,
                            prefundOverride,
                            anyValue
                        )
                })
            })

            describe('batch interaction (multiple calls to _executeUserOp)', () => {
                it('GIVEN a batch with all valid ops WHEN handleOps is called THEN all ops execute successfully', async () => {
                    await entryPoint.depositTo(paymaster, {
                        value: ethers.parseEther('1'),
                    })

                    const userOp0 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(0n)
                        .sign()

                    const userOp1 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(1n)
                        .sign()

                    const userOp2 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(2n)
                        .sign()

                    await expect(
                        entryPoint.handleOps(
                            [userOp0.userOp, userOp1.userOp, userOp2.userOp],
                            beneficiary
                        )
                    )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOp0.userOpHash,
                            userOpSender,
                            paymaster,
                            userOp0.userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOp1.userOpHash,
                            userOpSender,
                            paymaster,
                            userOp1.userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOp2.userOpHash,
                            userOpSender,
                            paymaster,
                            userOp2.userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )
                })
                it('GIVEN first op fails in validation WHEN handleOps is called THEN entire handleOps reverts', async () => {
                    const MockAccountFactory = await ethers.getContractFactory(
                        'ValidationAccountMock'
                    )
                    const mockAccount =
                        await MockAccountFactory.deploy(entryPoint)
                    await mockAccount.waitForDeployment()
                    const otherSender = await mockAccount.getAddress()

                    const validationReverts = true
                    const validationShouldReturnBadData = false
                    const sigFailed = false
                    await mockAccount.setValidationData(
                        validationReverts,
                        validationShouldReturnBadData,
                        sigFailed,
                        0,
                        0,
                        (await ethers.getSigners())[9].address
                    )

                    const userOp0 = await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        otherSender
                    )
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(0n)
                        .sign()

                    const userOp1 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(1n)
                        .sign()

                    const userOp2 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(2n)
                        .sign()

                    await expect(
                        entryPoint.handleOps(
                            [userOp0.userOp, userOp1.userOp, userOp2.userOp],
                            beneficiary
                        )
                    ).to.be.reverted
                })
                it('GIVEN first op reverts in execution WHEN handleOps is called THEN second op still executes', async () => {
                    const SmartAccountMockFactory =
                        await ethers.getContractFactory('SmartAccountMock')
                    const smartAccountMock =
                        await SmartAccountMockFactory.deploy()
                    await smartAccountMock.waitForDeployment()

                    const sender = await smartAccountMock.getAddress()

                    const revertCallData =
                        smartAccountMock.interface.encodeFunctionData(
                            'executeReverts',
                            [beneficiary, 0n, '0x']
                        )

                    const userOp0 = await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        sender
                    )
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(0n)
                        .withCallData(revertCallData)
                        .sign()

                    const userOp1 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(0n)
                        .sign()

                    const userOp2 = await userOpBuilder
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withNonce(1n)
                        .sign()

                    await expect(
                        entryPoint.handleOps(
                            [userOp0.userOp, userOp1.userOp, userOp2.userOp],
                            beneficiary
                        )
                    )
                        .to.emit(entryPoint, 'UserOperationRevertReason')
                        .withArgs(
                            userOp0.userOpHash,
                            sender,
                            userOp0.userOp.nonce,
                            anyValue
                        )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOp0.userOpHash,
                            sender,
                            paymaster,
                            userOp0.userOp.nonce,
                            false,
                            anyValue,
                            anyValue
                        )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOp1.userOpHash,
                            userOpSender,
                            paymaster,
                            userOp1.userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )
                        .and.to.emit(entryPoint, 'UserOperationEvent')
                        .withArgs(
                            userOp2.userOpHash,
                            userOpSender,
                            paymaster,
                            userOp2.userOp.nonce,
                            true,
                            anyValue,
                            anyValue
                        )
                })
                it('GIVEN a batch with several ops WHEN handleOps is called THEN BeforeExecution is emitted once', async () => {
                    await entryPoint.depositTo(paymaster, {
                        value: ethers.parseEther('1'),
                    })

                    const op0 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster })
                            .withNonce(0n)
                            .sign()
                    ).userOp
                    const op1 = (
                        await userOpBuilder
                            .withPaymasterAndData({ paymaster })
                            .withNonce(1n)
                            .sign()
                    ).userOp

                    await expect(entryPoint.handleOps([op0, op1], beneficiary))
                        .to.emit(entryPoint, 'BeforeExecution')
                        .and.to.emit(entryPoint, 'UserOperationEvent') // sanity
                })
            })
        })

        describe('Compensate', () => {
            it('GIVEN one successful op WHEN handleOps is called THEN beneficiary receives actualGasCost', async () => {
                const entryPointAddress = await entryPoint.getAddress()

                await entryPoint.depositTo(userOpSender, {
                    value: ethers.parseEther('1'),
                })
                const { userOp } = await new UserOpBuilder(
                    entryPoint,
                    adminSigner,
                    userOpSender
                )
                    .withPaymasterAndData({ paymaster: paymaster })
                    .withCallData(defaultCallData)
                    .sign()

                const initialBalance =
                    await ethers.provider.getBalance(beneficiary)

                const tx = await entryPoint.handleOps([userOp], beneficiary)

                const receipt = await tx.wait()
                if (!receipt) throw new Error('Transaction receipt is null')

                let totalActualGasCost = 0n
                receipt.logs
                    .filter(
                        (log) =>
                            log.address.toLowerCase() ===
                            entryPointAddress.toLowerCase()
                    )
                    .forEach((log) => {
                        try {
                            const parsed = entryPoint.interface.decodeEventLog(
                                'UserOperationEvent',
                                log.data,
                                log.topics
                            )
                            totalActualGasCost += parsed.actualGasCost as bigint
                        } catch {
                            // skip log
                        }
                    })

                const after = await ethers.provider.getBalance(beneficiary)
                const diff = after - initialBalance

                expect(diff).to.equal(totalActualGasCost)
            })
            it('GIVEN multiple ops WHEN handleOps is called THEN beneficiary receives sum(actualGasCost)', async () => {
                const entryPointAddress = await entryPoint.getAddress()

                await entryPoint.depositTo(userOpSender, {
                    value: ethers.parseEther('1'),
                })
                const op1 = (
                    await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        userOpSender
                    )
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .withNonce(0n)
                        .sign()
                ).userOp
                const op2 = (
                    await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        userOpSender
                    )
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .withNonce(1n)
                        .sign()
                ).userOp
                const op3 = (
                    await new UserOpBuilder(
                        entryPoint,
                        adminSigner,
                        userOpSender
                    )
                        .withPaymasterAndData({ paymaster: paymaster })
                        .withCallData(defaultCallData)
                        .withNonce(2n)
                        .sign()
                ).userOp

                const initialBalance =
                    await ethers.provider.getBalance(beneficiary)

                const tx = await entryPoint.handleOps(
                    [op1, op2, op3],
                    beneficiary
                )

                const receipt = await tx.wait()
                if (!receipt) throw new Error('Transaction receipt is null')

                let totalActualGasCost = 0n

                receipt.logs
                    .filter(
                        (log) =>
                            log.address.toLowerCase() ===
                            entryPointAddress.toLowerCase()
                    )
                    .forEach((log) => {
                        try {
                            const parsed = entryPoint.interface.decodeEventLog(
                                'UserOperationEvent',
                                log.data,
                                log.topics
                            )
                            totalActualGasCost += parsed.actualGasCost as bigint
                        } catch {
                            // skip
                        }
                    })

                const after = await ethers.provider.getBalance(beneficiary)
                const diff = after - initialBalance
                expect(diff).to.equal(totalActualGasCost)
            })
            it('GIVEN beneficiary = address(0) WHEN handleOps is called THEN InvalidBeneficiary', async () => {
                await entryPoint.depositTo(userOpSender, {
                    value: ethers.parseEther('1'),
                })
                const { userOp } = await new UserOpBuilder(
                    entryPoint,
                    adminSigner,
                    userOpSender
                )
                    .withPaymasterAndData({ paymaster: paymaster })
                    .withCallData(defaultCallData)
                    .sign()

                await expect(entryPoint.handleOps([userOp], ZeroAddress))
                    .to.be.revertedWithCustomError(
                        entryPoint,
                        'InvalidBeneficiary'
                    )
                    .withArgs(ZeroAddress)
            })
            it('GIVEN beneficiary reverts on receiving ETH WHEN handleOps is called THEN FailedSendToBeneficiary', async () => {
                const BeneficiaryFactory = await ethers.getContractFactory(
                    'RevertingBeneficiaryMock'
                )
                const beneficiaryContract = await BeneficiaryFactory.deploy()
                await beneficiaryContract.waitForDeployment()

                await entryPoint.depositTo(userOpSender, {
                    value: ethers.parseEther('1'),
                })
                const { userOp } = await new UserOpBuilder(
                    entryPoint,
                    adminSigner,
                    userOpSender
                )
                    .withPaymasterAndData({ paymaster: paymaster })
                    .withCallData(defaultCallData)
                    .sign()

                await expect(
                    entryPoint.handleOps([userOp], beneficiaryContract)
                ).to.be.revertedWithCustomError(
                    entryPoint,
                    'FailedSendToBeneficiary'
                )
            })
        })

        describe('NonReentrancy', () => {
            it('GIVEN an account tries reentrancy into handleOps WHEN executing THEN reentrancy is prevented', async () => {
                const MaliciousAccountFactory =
                    await ethers.getContractFactory('MaliciousAccount')
                const maliciousAccount =
                    await MaliciousAccountFactory.deploy(entryPoint)
                await maliciousAccount.waitForDeployment()
                const sender = await maliciousAccount.getAddress()

                await entryPoint.depositTo(sender, {
                    value: ethers.parseEther('1'),
                })
                const { userOp } = await new UserOpBuilder(
                    entryPoint,
                    adminSigner,
                    sender
                )
                    .withPaymasterAndData({ paymaster: paymaster })
                    .withCallData(defaultCallData)
                    .sign()

                const reenterCalldata = entryPoint.interface.encodeFunctionData(
                    'handleOps',
                    [[userOp], beneficiary]
                )

                await maliciousAccount.setReenterCalldata(reenterCalldata)

                await expect(entryPoint.handleOps([userOp], beneficiary)).to.not
                    .be.reverted
                expect(await maliciousAccount.reenterAttempted()).to.equal(true)
                expect(await maliciousAccount.reenterSucceeded()).to.equal(
                    false
                )
            })
        })
    })
})
