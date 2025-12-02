import { expect } from 'chai'
import { config, ethers, network } from 'hardhat'
import { Signer, ZeroAddress, AbiCoder, HDNodeWallet } from 'ethers'
import {
    MockEntryPoint,
    Paymaster,
    ISBEPauseFacet,
    IDidRegistry__factory,
} from '../../typechain-types'
import {
    PAUSER_ROLE,
    CONFIGURATION_ACCOUNT_ABSTRACTION_PAYMASTER,
    AA_PAYMASTER_PAYMASTER_KEY,
    DEFAULT_ADMIN_ROLE,
    DID_REGISTRY_ROLE,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'
import { deployPaymasterUseCaseFacets } from '../fixtures/paymaster'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { PackedUserOperationStruct } from 'typechain-types/contracts/accountabstraction/MockEntryPoint'
import { EllipticType } from '../types/identity'

const SIG_VALIDATION_SUCCESS = 0n
const SIG_VALIDATION_FAILED = 1n

describe('Account Abstraction Paymaster', () => {
    let adminAccount: Signer
    let adminAccountAddress: string
    let account_2: Signer
    let account_2Address: string
    let didWallet: HDNodeWallet

    let governance: string
    let entryPoint: MockEntryPoint
    let paymaster: Paymaster
    let didConnectedPaymaster: Paymaster
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
            CONFIGURATION_ACCOUNT_ABSTRACTION_PAYMASTER,
            init_pause
        )

        function walletOfFirstSigner(): HDNodeWallet {
            const mnemonic = (
                config.networks.hardhat.accounts as {
                    mnemonic: string
                    path: string
                }
            ).mnemonic
            return ethers.Wallet.fromPhrase(mnemonic)
        }

        const baseWallet = walletOfFirstSigner()
        const wallet = baseWallet.derivePath('302')
        const didId = ethers.id('did:erc20:test:1')

        // Grant DID registry role
        await governanceResult.accessControlGovernance!.grantRole(
            DID_REGISTRY_ROLE,
            adminAccountAddress
        )

        // Initialize DID registry
        const governanceAddress =
            await governanceResult.accessControlGovernance!.getAddress()
        const didRegistryWithSigner = IDidRegistry__factory.connect(
            governanceAddress,
            adminAccountSigner
        )
        await didRegistryWithSigner.initializeDiDRegistry(
            EllipticType.SECP_256_K1
        )

        // Insert DID document
        const notBefore = Math.floor(Date.now() / 1000)
        const notAfter = notBefore + 365 * 24 * 60 * 60

        const publicKey = wallet.signingKey.publicKey
        const vMethodId = ethers.id(`vmethod:${didId}`)
        const message = ethers.keccak256(
            ethers.solidityPacked(['bytes'], [publicKey])
        )
        const signature = wallet.signingKey.sign(message)
        const proof = ethers.Signature.from(signature).serialized

        await didRegistryWithSigner.insertFirstDidDocument(
            didId,
            `document:${didId}`,
            vMethodId,
            proof,
            publicKey,
            EllipticType.SECP_256_K1,
            notBefore,
            notAfter,
            ''
        )

        // Fund DID wallet
        await adminAccountSigner.sendTransaction({
            to: wallet.address,
            value: ethers.parseEther('1.0'),
        })

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
            wallet: wallet,
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
        adminAccount = contracts.adminAccount
        adminAccountAddress = contracts.adminAccountAddress
        account_2 = contracts.account_2
        account_2Address = contracts.account_2Address
        didWallet = contracts.wallet

        const didSigner = new ethers.Wallet(
            didWallet.privateKey,
            ethers.provider
        )
        didConnectedPaymaster = contracts.paymaster.connect(didSigner)
    })

    describe('Paused', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await pause.pause()
            }
            await loadFixture(fixture)
        })

        it('GIVEN an unpaused Paymaster WHEN try to setEntryPoint THEN it fails', async () => {
            await pause.unpause()
            await expect(
                paymaster.setEntryPoint(entryPoint)
            ).to.be.revertedWithCustomError(pause, 'IsNotPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to whitelist THEN it fails', async () => {
            await expect(
                didConnectedPaymaster.whitelist(account_2Address)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to unwhitelist THEN it fails', async () => {
            await expect(
                didConnectedPaymaster.unwhitelist(account_2Address)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to deposit THEN it fails', async () => {
            await expect(
                didConnectedPaymaster.deposit({ value: 100n })
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to withdrawTo THEN it fails', async () => {
            await expect(
                didConnectedPaymaster.withdrawTo(didConnectedPaymaster, 100n)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to addStake THEN it fails', async () => {
            const value = 100n
            const unstakeDelaySec = 1n
            await expect(
                didConnectedPaymaster.addStake(unstakeDelaySec, {
                    value: value,
                })
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to unlockStake THEN it fails', async () => {
            await expect(
                didConnectedPaymaster.unlockStake()
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN a paused Paymaster WHEN try to withdrawStake THEN it fails', async () => {
            await expect(
                didConnectedPaymaster.withdrawStake(didConnectedPaymaster)
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
                didConnectedPaymaster.validatePaymasterUserOp(
                    userOp,
                    userOpHash,
                    maxCost
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
    })

    describe('Unauthorized', () => {
        it('GIVEN an unauthorized signer WHEN initialize THEN AccountHasNoRole', async () => {
            await expect(
                didConnectedPaymaster
                    .connect(account_2)
                    .initializePaymaster(entryPoint)
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AccountHasNoRole'
                )
                .withArgs(account_2Address, DEFAULT_ADMIN_ROLE)
        })

        it('GIVEN an unauthorized signer WHEN setEntryPoint THEN AccountHasNoRole', async () => {
            await expect(
                didConnectedPaymaster
                    .connect(account_2)
                    .setEntryPoint(entryPoint)
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AccountHasNoRole'
                )
                .withArgs(account_2Address, DEFAULT_ADMIN_ROLE)
        })

        it('GIVEN an unkown wallet WHEN whitelist THEN AddressNotKnown', async () => {
            await expect(
                didConnectedPaymaster.connect(account_2).whitelist(entryPoint)
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
                .withArgs(account_2Address)
        })

        it('GIVEN an unkown wallet WHEN unwhitelist THEN success', async () => {
            await expect(
                didConnectedPaymaster.connect(account_2).unwhitelist(entryPoint)
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
                .withArgs(account_2Address)
        })

        it('GIVEN an unkown wallet WHEN deposit THEN success', async () => {
            await expect(
                didConnectedPaymaster.connect(account_2).deposit({ value: 10n })
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
                .withArgs(account_2Address)
        })

        it('GIVEN an unkown wallet WHEN withdrawTo THEN success', async () => {
            await expect(
                didConnectedPaymaster
                    .connect(account_2)
                    .withdrawTo(entryPoint, 10n)
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
                .withArgs(account_2Address)
        })

        it('GIVEN an unkown wallet WHEN addStake THEN success', async () => {
            await expect(
                didConnectedPaymaster
                    .connect(account_2)
                    .addStake(100n, { value: 100n })
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
                .withArgs(account_2Address)
        })

        it('GIVEN an unkown wallet WHEN unlockStake THEN success', async () => {
            await expect(didConnectedPaymaster.connect(account_2).unlockStake())
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
                .withArgs(account_2Address)
        })

        it('GIVEN an unkown wallet WHEN withdrawStake THEN success', async () => {
            await expect(
                didConnectedPaymaster
                    .connect(account_2)
                    .withdrawStake(account_2)
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'AddressNotKnown'
                )
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
                didConnectedPaymaster.whitelist(ZeroAddress)
            ).to.be.revertedWithCustomError(
                didConnectedPaymaster,
                'AddressZero'
            )
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
            await pause.pause()
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
                didConnectedPaymaster.postOp(
                    postOpMode,
                    context,
                    actualGasCost,
                    actualUserOpFeePerGas
                )
            )
                .to.be.revertedWithCustomError(
                    didConnectedPaymaster,
                    'NotEntryPoint'
                )
                .withArgs(didWallet)
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
                .withArgs(AA_PAYMASTER_PAYMASTER_KEY, 1, 1)
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
                await pause.pause()
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
                expect(await didConnectedPaymaster.whitelist(account_2Address))
                    .to.emit(didConnectedPaymaster, 'UserWhiteListed')
                    .withArgs(account_2Address)
            })
        })

        describe('unwhitelist', () => {
            it('GIVEN Paymaster deployed WHEN whitelist user THEN success', async () => {
                expect(
                    await didConnectedPaymaster.unwhitelist(account_2Address)
                )
                    .to.emit(didConnectedPaymaster, 'UserUnwhiteListed')
                    .withArgs(account_2Address)
            })
        })

        describe('iswhitelisted', () => {
            it('GIVEN Paymaster deployed WHEN isWhitelisted on whitelisted THEN returns true', async () => {
                await didConnectedPaymaster.whitelist(account_2Address)
                expect(
                    await didConnectedPaymaster.isWhitelisted(account_2Address)
                ).to.be.true
            })

            it('GIVEN Paymaster deployed WHEN isWhitelisted on unwhitelisted THEN returns false', async () => {
                expect(
                    await didConnectedPaymaster.isWhitelisted(account_2Address)
                ).to.be.false
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
                expect(await didConnectedPaymaster.deposit({ value: value }))
                    .to.emit(didConnectedPaymaster, 'AmountDeposited')
                    .withArgs(value)

                expect(
                    await entryPoint.balanceOf(
                        await didConnectedPaymaster.getAddress()
                    )
                ).to.equal(value)
            })
        })

        describe('getDeposit', () => {
            it('GIVEN Paymaster deployed WHEN get deposit THEN value deposited in the EP is returned', async () => {
                const value = 100n
                await didConnectedPaymaster.deposit({ value: value })
                expect(
                    await entryPoint.balanceOf(
                        await didConnectedPaymaster.getAddress()
                    )
                ).to.equal(await didConnectedPaymaster.getDeposit())
            })
        })

        describe('withdrawTo', () => {
            it('GIVEN Paymaster deployed WHEN withdraw to THEN value deposited in the EP is transferred to the recipient', async () => {
                const value = 100n
                const withdraw = value / 2n
                await didConnectedPaymaster.deposit({ value: value })
                expect(
                    await entryPoint.balanceOf(
                        await didConnectedPaymaster.getAddress()
                    )
                ).to.equal(await didConnectedPaymaster.getDeposit())

                expect(
                    await didConnectedPaymaster.withdrawTo(
                        didConnectedPaymaster,
                        withdraw
                    )
                )
                    .to.emit(didConnectedPaymaster, 'AmountWithdrawn')
                    .withArgs(didConnectedPaymaster, withdraw)

                const amountInEp = await entryPoint.balanceOf(
                    await didConnectedPaymaster.getAddress()
                )
                expect(amountInEp).to.equal(
                    await didConnectedPaymaster.getDeposit()
                )
                expect(amountInEp).to.equal(value - withdraw)
                expect(
                    await ethers.provider.getBalance(didConnectedPaymaster)
                ).to.equal(withdraw)
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
                    await didConnectedPaymaster.addStake(unstakeDelaySec, {
                        value: value,
                    })
                )
                    .to.emit(didConnectedPaymaster, 'StakeAdded')
                    .withArgs(value, unstakeDelaySec)

                const stakeInfo = await entryPoint.getDepositInfo(
                    await didConnectedPaymaster.getAddress()
                )
                expect(stakeInfo.staked).to.be.true
                expect(stakeInfo.stake).to.equal(value)
            })
        })

        describe('unlockStake', () => {
            it('GIVEN Paymaster deployed WHEN unlockStake THEN value staked in the EP is unlocked', async () => {
                const value = 100n
                const unstakeDelaySec = 1n
                await didConnectedPaymaster.addStake(unstakeDelaySec, {
                    value: value,
                })

                expect(await didConnectedPaymaster.unlockStake()).to.emit(
                    didConnectedPaymaster,
                    'StakedUnlocked'
                )

                const stakeInfo = await entryPoint.getDepositInfo(
                    await didConnectedPaymaster.getAddress()
                )
                expect(stakeInfo.staked).to.be.false
                expect(stakeInfo.stake).to.equal(value)
            })
        })

        describe('withdrawStake', () => {
            it('GIVEN Paymaster deployed WHEN withdraw Stake THEN value staked in the EP is transferred to the recipient', async () => {
                const value = 100n
                const unstakeDelaySec = 1n
                await didConnectedPaymaster.addStake(unstakeDelaySec, {
                    value: value,
                })
                await didConnectedPaymaster.unlockStake()
                expect(
                    await didConnectedPaymaster.withdrawStake(
                        didConnectedPaymaster
                    )
                )
                    .to.emit(didConnectedPaymaster, 'StakeWithdrawn')
                    .withArgs(didConnectedPaymaster)

                const stakeInfo = await entryPoint.getDepositInfo(
                    await didConnectedPaymaster.getAddress()
                )
                expect(stakeInfo.staked).to.be.false
                expect(stakeInfo.stake).to.equal(0n)
            })
        })
    })

    describe('validatePaymasterUserOp', () => {
        beforeEach(async () => {
            await pause.pause()
            await paymaster.setEntryPoint(entryPoint)
            await pause.unpause()
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
            await didConnectedPaymaster.deposit({ value: maxCost })
            await didConnectedPaymaster.whitelist(sender)

            const entryPointSigner = await getEntryPointSignerImpersonation()

            const response = await paymaster
                .connect(entryPointSigner)
                .validatePaymasterUserOp(userOp, userOpHash, maxCost)
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

            const entryPointSigner = await getEntryPointSignerImpersonation()

            const response = await paymaster
                .connect(entryPointSigner)
                .validatePaymasterUserOp(userOp, userOpHash, maxCost)
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

            await didConnectedPaymaster.deposit({ value: maxCost - 10n })
            await didConnectedPaymaster.whitelist(sender)

            const entryPointSigner = await getEntryPointSignerImpersonation()

            const response = await paymaster
                .connect(entryPointSigner)
                .validatePaymasterUserOp(userOp, userOpHash, maxCost)
            expect(response.validationData).to.equal(SIG_VALIDATION_FAILED)
        })
    })

    describe('postOp', () => {
        beforeEach(async () => {
            await pause.pause()
            await paymaster.setEntryPoint(entryPoint)
            await pause.unpause()
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

    async function getEntryPointSignerImpersonation(
        initialBalance?: bigint
    ): Promise<Signer> {
        const entryPointAddress = await entryPoint.getAddress()
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [entryPointAddress],
        })
        const entryPointSigner =
            await ethers.provider.getSigner(entryPointAddress)
        await adminAccount.sendTransaction({
            to: entryPointAddress,
            value: initialBalance ?? ethers.parseEther('1.0'),
        })

        return entryPointSigner
    }
})
