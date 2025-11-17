import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress, AbiCoder } from 'ethers'
import {
    MockEntryPoint,
    Paymaster,
    ISBEPauseFacet,
} from '../../typechain-types'
import {
    PAUSER_ROLE,
    CONFIGURATION_AA_PAYMASTER,
    AA_PAYMASTER_PAYMASTER_KEY,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'
import { deployPaymasterUseCaseFacets } from '../fixtures/paymaster'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { PackedUserOperationStruct } from 'typechain-types/contracts/accountabstraction/MockEntryPoint'

const SIG_VALIDATION_SUCCESS = 0n
const SIG_VALIDATION_FAILED = 1n

describe('Account Abstraction Paymaster', () => {
    let adminAccountAddress: string
    let account_2: Signer
    let account_2Address: string

    let governance: string
    let entryPoint: MockEntryPoint
    let paymaster: Paymaster
    let pause: ISBEPauseFacet

    const pack128 = (hi: bigint, lo: bigint) =>
        ethers.toBeHex((hi << 128n) | lo, 32)

    function createUserOp(sender: string, nonce: bigint) {
        const callGasLimit = 200_000n
        const verificationGasLimit = 200_000n
        const maxFeePerGas = ethers.parseUnits('10', 'gwei')
        const maxPriorityFeePerGas = ethers.parseUnits('5', 'gwei')
        return {
            sender,
            nonce: nonce,
            initCode: '0x',
            callData: '0x',
            accountGasLimits: pack128(verificationGasLimit, callGasLimit),
            preVerificationGas: 50_000n,
            gasFees: pack128(maxPriorityFeePerGas, maxFeePerGas),
            paymasterAndData: '0x',
            signature: '0x',
        } as PackedUserOperationStruct
    }

    async function deployFixture(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rbacsUseCase: any[] = [
            {
                role: PAUSER_ROLE,
                members: [],
            },
        ],
        init_pause: boolean = false
    ) {
        const [adminAccountSigner, account2Signer, account3Signer] =
            await ethers.getSigners()
        const adminAccountAddress = await adminAccountSigner.getAddress()
        const account2Address = await account2Signer.getAddress()
        const account3Address = await account3Signer.getAddress()

        // Update rbacs with actual addresses
        const updatedRbacs = rbacsUseCase.map((rbac) => ({
            ...rbac,
            members:
                rbac.members.length > 0 ? rbac.members : [adminAccountAddress],
        }))

        const entryPointFactory =
            await ethers.getContractFactory('MockEntryPoint')
        const entryPoint = await entryPointFactory.deploy()
        await entryPoint.waitForDeployment()

        // Deploy Governance
        const governanceResult = await deployGovernance(
            adminAccountSigner,
            updatedRbacs,
            CONFIGURATION_AA_PAYMASTER,
            init_pause
        )

        const isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await governanceResult.governanceContract.getAddress()
        )
        const ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')

        const result = await deployPaymasterUseCaseFacets(
            isbeFactory,
            ISBEPauseFacetFactory,
            adminAccountSigner,
            updatedRbacs,
            init_pause,
            [],
            []
        )

        return {
            adminAccount: adminAccountSigner,
            account_2: account2Signer,
            account_3: account3Signer,
            adminAccountAddress,
            account_2Address: account2Address,
            account_3Address: account3Address,
            governance: governanceResult.governanceContract,
            entryPoint: entryPoint,
            paymaster: result.paymaster,
            pause: result.pause!,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        governance = await contracts.governance.getAddress()
        entryPoint = contracts.entryPoint
        paymaster = contracts.paymaster
        pause = contracts.pause
        adminAccountAddress = contracts.adminAccountAddress
        account_2 = contracts.account_2
        account_2Address = contracts.account_2Address
    })

    describe('Paused', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await pause.pause()
            }
            await loadFixture(fixture)
        })

        it('GIVEN a paused Paymaster WHEN try to setEntryPoint THEN it fails', async () => {
            await expect(
                paymaster.setEntryPoint(entryPoint)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to whitelist THEN it fails', async () => {
            await expect(
                paymaster.whitelist(account_2Address)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to unwhitelist THEN it fails', async () => {
            await expect(
                paymaster.unwhitelist(account_2Address)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to deposit THEN it fails', async () => {
            await expect(
                paymaster.deposit({ value: 100n })
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to withdrawTo THEN it fails', async () => {
            await expect(
                paymaster.withdrawTo(paymaster, 100n)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to addStake THEN it fails', async () => {
            const value = 100n
            const unstakeDelaySec = 1n
            await expect(
                paymaster.addStake(unstakeDelaySec, { value: value })
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to unlockStake THEN it fails', async () => {
            await expect(paymaster.unlockStake()).to.be.revertedWithCustomError(
                pause,
                'IsPaused'
            )
        })

        it('GIVEN a paused Paymaster WHEN try to withdrawStake THEN it fails', async () => {
            await expect(
                paymaster.withdrawStake(paymaster)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to validatePaymasterUserOp THEN it fails', async () => {
            const sender = account_2Address
            const userOp = createUserOp(
                sender,
                await entryPoint.getNonce(sender, 0)
            )
            const userOpHash = await entryPoint.getUserOpHash(userOp)
            const maxCost = 100n
            await expect(
                paymaster.validatePaymasterUserOp(userOp, userOpHash, maxCost)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
    })

    describe('Unauthorized', () => {
        it('GIVEN Paymaster deployed WHEN initialize THEN success', async () => {
            await expect(
                paymaster.connect(account_2).initializePaymaster(entryPoint)
            )
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN setEntryPoint THEN success', async () => {
            await expect(paymaster.connect(account_2).setEntryPoint(entryPoint))
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN whitelist THEN success', async () => {
            await expect(paymaster.connect(account_2).whitelist(entryPoint))
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN unwhitelist THEN success', async () => {
            await expect(paymaster.connect(account_2).unwhitelist(entryPoint))
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN deposit THEN success', async () => {
            await expect(paymaster.connect(account_2).deposit({ value: 10n }))
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN withdrawTo THEN success', async () => {
            await expect(
                paymaster.connect(account_2).withdrawTo(entryPoint, 10n)
            )
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN addStake THEN success', async () => {
            await expect(
                paymaster.connect(account_2).addStake(100n, { value: 100n })
            )
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN unlockStake THEN success', async () => {
            await expect(paymaster.connect(account_2).unlockStake())
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })

        it('GIVEN Paymaster deployed WHEN withdrawStake THEN success', async () => {
            await expect(paymaster.connect(account_2).withdrawStake(account_2))
                .to.be.revertedWithCustomError(paymaster, 'AccountIsNotOwner')
                .withArgs(account_2Address)
        })
    })

    describe('AddressZero error', () => {
        it('GIVEN Paymaster deployed WHEN try to initialize with zero address THEN it fails', async () => {
            await expect(
                paymaster.initializePaymaster(ZeroAddress)
            ).to.be.revertedWithCustomError(paymaster, 'AddressZero')
        })

        it('GIVEN Paymaster deployed WHEN whitelist zeroAddress THEN it fails', async () => {
            await expect(
                paymaster.whitelist(ZeroAddress)
            ).to.be.revertedWithCustomError(paymaster, 'AddressZero')
        })
    })

    describe('EntryPointInterfaceMismatch error', () => {
        it('GIVEN Paymaster deployed WHEN initialize with invalid EntryPoint THEN it fails', async () => {
            await expect(paymaster.initializePaymaster(governance))
                .to.be.revertedWithCustomError(
                    paymaster,
                    'EntryPointInterfaceMismatch'
                )
                .withArgs(governance)
        })

        it('GIVEN Paymaster deployed WHEN set entryPoint with invalid EntryPoint THEN it fails', async () => {
            await expect(paymaster.setEntryPoint(governance))
                .to.be.revertedWithCustomError(
                    paymaster,
                    'EntryPointInterfaceMismatch'
                )
                .withArgs(governance)
        })
    })

    describe('NotEntryPoint error', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await paymaster.initializePaymaster(entryPoint)
            }
            await loadFixture(initialize)
        })

        it('GIVEN Paymaster deployed WHEN validatePaymasterUserOp not called by EntryPont THEN it fails', async () => {
            const sender = account_2Address
            const userOp = createUserOp(
                sender,
                await entryPoint.getNonce(sender, 0)
            )
            const userOpHash = await entryPoint.getUserOpHash(userOp)
            const maxCost = 100n

            await expect(
                paymaster.validatePaymasterUserOp(userOp, userOpHash, maxCost)
            )
                .to.be.revertedWithCustomError(paymaster, 'NotEntryPoint')
                .withArgs(adminAccountAddress)
        })

        it('GIVEN Paymaster deployed WHEN postOp not called by EntryPont THEN it fails', async () => {
            const postOpMode = 0n
            const context = '0x'
            const actualGasCost = 100n
            const actualUserOpFeePerGas = 100n
            await expect(
                paymaster.postOp(
                    postOpMode,
                    context,
                    actualGasCost,
                    actualUserOpFeePerGas
                )
            )
                .to.be.revertedWithCustomError(paymaster, 'NotEntryPoint')
                .withArgs(adminAccountAddress)
        })
    })

    describe('Initialization', () => {
        it('GIVEN Paymaster deployed WHEN try to initialize twice THEN it fails', async () => {
            expect(await paymaster.initializePaymaster(entryPoint))
                .to.emit(paymaster, 'PaymasterInitialized')
                .withArgs(await entryPoint.getAddress())

            await expect(paymaster.initializePaymaster(entryPoint))
                .to.be.revertedWithCustomError(
                    paymaster,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(AA_PAYMASTER_PAYMASTER_KEY)
        })

        it('GIVEN Paymaster deployed WHEN initialize THEN success', async () => {
            expect(await paymaster.initializePaymaster(entryPoint))
                .to.emit(paymaster, 'PaymasterInitialized')
                .withArgs(await entryPoint.getAddress())
        })
    })

    describe('EntryPoint', () => {
        describe('setEntryPoint', () => {
            it('GIVEN Paymaster deployed WHEN set entryPoint THEN success', async () => {
                expect(await paymaster.setEntryPoint(entryPoint))
                    .to.emit(paymaster, 'EntryPointUpdated')
                    .withArgs(await entryPoint.getAddress())
            })

            // TODO AA: test with only owner
        })

        describe('getEntryPoint', () => {
            it('GIVEN Paymaster deployed WHEN get entryPoint THEN it returns the address', async () => {
                await paymaster.initializePaymaster(entryPoint)
                expect(await paymaster.getEntryPoint()).to.equal(
                    await entryPoint.getAddress()
                )
            })
        })
    })

    describe('Whitelist Users', () => {
        describe('whitelist', () => {
            it('GIVEN Paymaster deployed WHEN whitelist user THEN success', async () => {
                expect(await paymaster.whitelist(account_2Address))
                    .to.emit(paymaster, 'UserWhiteListed')
                    .withArgs(account_2Address)
            })
        })

        describe('unwhitelist', () => {
            it('GIVEN Paymaster deployed WHEN whitelist user THEN success', async () => {
                expect(await paymaster.unwhitelist(account_2Address))
                    .to.emit(paymaster, 'UserUnwhiteListed')
                    .withArgs(account_2Address)
            })
        })

        describe('iswhitelisted', () => {
            it('GIVEN Paymaster deployed WHEN isWhitelisted on whitelisted THEN returns true', async () => {
                await paymaster.whitelist(account_2Address)
                expect(await paymaster.isWhitelisted(account_2Address)).to.be
                    .true
            })

            it('GIVEN Paymaster deployed WHEN isWhitelisted on unwhitelisted THEN returns false', async () => {
                expect(await paymaster.isWhitelisted(account_2Address)).to.be
                    .false
            })
        })
    })

    describe('Deposit on EntryPoint', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await paymaster.initializePaymaster(entryPoint)
            }
            await loadFixture(initialize)
        })

        describe('deposit', () => {
            it('GIVEN Paymaster deployed WHEN deposit THEN value is deposited into the EntryPoint', async () => {
                const value = 100n
                expect(await paymaster.deposit({ value: value }))
                    .to.emit(paymaster, 'AmountDeposited')
                    .withArgs(value)

                expect(
                    await entryPoint.balanceOf(await paymaster.getAddress())
                ).to.equal(value)
            })
        })

        describe('getDeposit', () => {
            it('GIVEN Paymaster deployed WHEN get deposit THEN value deposited in the EP is returned', async () => {
                const value = 100n
                await paymaster.deposit({ value: value })
                expect(
                    await entryPoint.balanceOf(await paymaster.getAddress())
                ).to.equal(await paymaster.getDeposit())
            })
        })

        describe('withdrawTo', () => {
            it('GIVEN Paymaster deployed WHEN withdraw to THEN value deposited in the EP is transferred to the recipient', async () => {
                const value = 100n
                const withdraw = value / 2n
                await paymaster.deposit({ value: value })
                expect(
                    await entryPoint.balanceOf(await paymaster.getAddress())
                ).to.equal(await paymaster.getDeposit())

                expect(await paymaster.withdrawTo(paymaster, withdraw))
                    .to.emit(paymaster, 'AmountWithdrawn')
                    .withArgs(paymaster, withdraw)

                const amountInEp = await entryPoint.balanceOf(
                    await paymaster.getAddress()
                )
                expect(amountInEp).to.equal(await paymaster.getDeposit())
                expect(amountInEp).to.equal(value - withdraw)
                expect(await ethers.provider.getBalance(paymaster)).to.equal(
                    withdraw
                )
            })
        })
    })

    describe('Stake on EntryPoint', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await paymaster.initializePaymaster(entryPoint)
            }
            await loadFixture(initialize)
        })

        describe('addStake', () => {
            it('GIVEN Paymaster deployed WHEN addStake THEN value is staked into the EntryPoint', async () => {
                const value = 100n
                const unstakeDelaySec = 1n
                expect(
                    await paymaster.addStake(unstakeDelaySec, { value: value })
                )
                    .to.emit(paymaster, 'StakeAdded')
                    .withArgs(value, unstakeDelaySec)

                const stakeInfo = await entryPoint.getDepositInfo(
                    await paymaster.getAddress()
                )
                expect(stakeInfo.staked).to.be.true
                expect(stakeInfo.stake).to.equal(value)
            })
        })

        describe('unlockStake', () => {
            it('GIVEN Paymaster deployed WHEN unlockStake THEN value staked in the EP is unlocked', async () => {
                const value = 100n
                const unstakeDelaySec = 1n
                await paymaster.addStake(unstakeDelaySec, { value: value })

                expect(await paymaster.unlockStake()).to.emit(
                    paymaster,
                    'StakedUnlocked'
                )

                const stakeInfo = await entryPoint.getDepositInfo(
                    await paymaster.getAddress()
                )
                expect(stakeInfo.staked).to.be.false
                expect(stakeInfo.stake).to.equal(value)
            })
        })

        describe('withdrawStake', () => {
            it('GIVEN Paymaster deployed WHEN withdraw Stake THEN value staked in the EP is transferred to the recipient', async () => {
                const value = 100n
                const unstakeDelaySec = 1n
                await paymaster.addStake(unstakeDelaySec, { value: value })
                await paymaster.unlockStake()
                expect(await paymaster.withdrawStake(paymaster))
                    .to.emit(paymaster, 'StakeWithdrawn')
                    .withArgs(paymaster)

                const stakeInfo = await entryPoint.getDepositInfo(
                    await paymaster.getAddress()
                )
                expect(stakeInfo.staked).to.be.false
                expect(stakeInfo.stake).to.equal(0n)
            })
        })
    })

    describe('validatePaymasterUserOp', () => {
        beforeEach(async () => {
            await paymaster.setEntryPoint(entryPoint)
        })

        it('GIVEN a Paymaster and a userOp WHEN validatePaymasterUserOp THEN returns SIG_VALIDATION_SUCCESS', async () => {
            const sender = account_2Address
            const userOp = createUserOp(
                sender,
                await entryPoint.getNonce(sender, 0)
            )
            const userOpHash = await entryPoint.getUserOpHash(userOp)
            const maxCost = 100n

            // Requirements for validation to succeed
            await paymaster.deposit({ value: maxCost })
            await paymaster.whitelist(sender)

            const response = await entryPoint.validatePaymasterUserOpMockCall(
                paymaster,
                userOp,
                userOpHash,
                maxCost
            )
            expect(response.validationData).to.equal(SIG_VALIDATION_SUCCESS)
        })

        it('GIVEN a Paymaster and a userOp WHEN validatePaymasterUserOp and sender is not whitelisted THEN returns SIG_VALIDATION_FAILED', async () => {
            const sender = account_2Address
            const userOp = createUserOp(
                sender,
                await entryPoint.getNonce(sender, 0)
            )
            const userOpHash = await entryPoint.getUserOpHash(userOp)
            const maxCost = 100n

            const response = await entryPoint.validatePaymasterUserOpMockCall(
                paymaster,
                userOp,
                userOpHash,
                maxCost
            )
            expect(response.validationData).to.equal(SIG_VALIDATION_FAILED)
        })

        it('GIVEN a Paymaster and a userOp WHEN validatePaymasterUserOp and there is not enough deposit THEN returns SIG_VALIDATION_FAILED', async () => {
            const sender = account_2Address
            const userOp = createUserOp(
                sender,
                await entryPoint.getNonce(sender, 0)
            )
            const userOpHash = await entryPoint.getUserOpHash(userOp)
            const maxCost = 100n

            await paymaster.deposit({ value: maxCost - 10n })
            await paymaster.whitelist(sender)

            const response = await entryPoint.validatePaymasterUserOpMockCall(
                paymaster,
                userOp,
                userOpHash,
                maxCost
            )
            expect(response.validationData).to.equal(SIG_VALIDATION_FAILED)
        })
    })

    describe('postOp', () => {
        beforeEach(async () => {
            await paymaster.setEntryPoint(entryPoint)
        })

        it('GIVEN a Paymaster and a reverted userOp WHEN postOp THEN emit PostOpReverted', async () => {
            const sender = account_2Address
            const maxCost = 100n
            const abiCoder = AbiCoder.defaultAbiCoder()

            const context = abiCoder.encode(['address'], [sender])

            await expect(
                entryPoint.postOpMockCall(
                    paymaster,
                    2n,
                    context,
                    maxCost,
                    maxCost
                )
            )
                .to.emit(paymaster, 'PostOpReverted')
                .withArgs(sender)
        })

        it('GIVEN a Paymaster and a userOp WHEN postOp THEN emit SponsoredUserOperation', async () => {
            const sender = account_2Address
            const maxCost = 100n
            const opMode = 0n
            const abiCoder = AbiCoder.defaultAbiCoder()

            const context = abiCoder.encode(['address'], [sender])

            await expect(
                entryPoint.postOpMockCall(
                    paymaster,
                    opMode,
                    context,
                    maxCost,
                    maxCost
                )
            )
                .to.emit(paymaster, 'SponsoredUserOperation')
                .withArgs(sender, opMode, maxCost)
        })
    })
})
