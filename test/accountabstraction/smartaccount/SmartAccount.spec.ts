import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    IEntryPoint,
    SmartAccount,
    SmartAccountTestWrapper,
} from 'typechain-types'
import { UserOperationUtils } from './UserOperationUtils'
import { deploySmartAccountUseCaseFacets } from '../../fixtures/smartaccount'
import { deployGovernance } from '../../fixtures/governance'
import {
    CONFIGURATION_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
    PAUSER_ROLE,
} from '../../../utils/constants'
import { Signer, ZeroAddress } from 'ethers'

describe('SmartAccount', function () {
    let smartAccount: SmartAccount
    let smartAccountAddress: string
    let entryPoint: IEntryPoint
    let entryPointAddress: string
    let adminAccount: Signer
    let adminAccountAddress: string
    let account2: Signer
    let account2Address: string

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
        const [adminAccountSigner, account2Signer] = await ethers.getSigners()
        const adminAccountAddress = await adminAccountSigner.getAddress()

        // Update rbacs with actual addresses
        const updatedRbacs = rbacsUseCase.map((rbac) => ({
            ...rbac,
            members:
                rbac.members.length > 0 ? rbac.members : [adminAccountAddress],
        }))

        // Deploy Governance
        const governanceResult = await deployGovernance(
            adminAccountSigner,
            updatedRbacs,
            CONFIGURATION_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
            init_pause
        )

        const isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await governanceResult.governanceContract.getAddress()
        )
        const ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')

        const result = await deploySmartAccountUseCaseFacets(
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
            entryPoint: result.entryPoint,
            smartAccount: result.smartAccount,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        smartAccount = contracts.smartAccount
        smartAccountAddress = await smartAccount.getAddress()
        entryPoint = contracts.entryPoint
        entryPointAddress = await entryPoint.getAddress()
        adminAccount = contracts.adminAccount
        adminAccountAddress = await adminAccount.getAddress()
        account2 = contracts.account_2
        account2Address = await account2.getAddress()
    })

    describe('initializeSmartAccount', () => {
        it('GIVEN a deployed smart account WHEN initializing with a wrong owner THEN the execution is reverted', async () => {
            await expect(
                smartAccount
                    .connect(account2)
                    .initializeSmartAccount(entryPoint)
            )
                .to.be.revertedWithCustomError(
                    smartAccount,
                    'AccountIsNotOwner'
                )
                .withArgs(account2Address)
        })

        it('GIVEN a deployed smart account WHEN initializing with a zero entrypoint address THEN the execution is reverted', async () => {
            await expect(
                smartAccount.initializeSmartAccount(ZeroAddress)
            ).to.be.revertedWithCustomError(smartAccount, 'AddressZero')
        })

        it('GIVEN a deployed smart account WHEN initializing with an non-entrypoint THEN the execution is reverted', async () => {
            await expect(smartAccount.initializeSmartAccount(smartAccount))
                .to.be.revertedWithCustomError(
                    smartAccount,
                    'EntryPointInterfaceMismatch'
                )
                .withArgs(smartAccountAddress)
        })

        it('GIVEN a deployed smart account WHEN initializing twice THEN the execution is reverted', async () => {
            await smartAccount.initializeSmartAccount(entryPoint)
            await expect(
                smartAccount.initializeSmartAccount(entryPoint)
            ).to.be.revertedWithCustomError(
                smartAccount,
                'ContractIsAlreadyInitialized'
            )
        })
    })

    describe('validateUserOp', () => {
        beforeEach(async () => {
            await smartAccount.initializeSmartAccount(entryPoint)
        })

        it('GIVEN a smart account WHEN a non-entrypoint tries to validate a userOp THEN the execution is reverted', async () => {
            const { userOp, hash } =
                await UserOperationUtils.generateSignedUserOperation(
                    adminAccount,
                    entryPoint,
                    await adminAccount.getAddress()
                )

            await expect(
                smartAccount.validateUserOp(userOp, hash, 0n)
            ).to.be.revertedWithCustomError(
                smartAccount,
                'SmartAccount_NotFromEntryPoint'
            )
        })

        it('GIVEN a userOp and missing funds WHEN the entrypoint validates it THEN the missing funds are paid', async () => {
            const { userOp, hash } =
                await UserOperationUtils.generateSignedUserOperation(
                    adminAccount,
                    entryPoint,
                    await adminAccount.getAddress()
                )
            const missingFunds = ethers.parseEther('0.5')
            const originalBalanceOfEntryPoint = ethers.parseEther('1.0')

            await adminAccount.sendTransaction({
                to: smartAccountAddress,
                value: ethers.parseEther('1.0'),
            })

            const entryPointSigner = await getEntryPointSignerImpersonation(
                originalBalanceOfEntryPoint
            )

            const tx = await smartAccount
                .connect(entryPointSigner)
                .validateUserOp(userOp, hash, missingFunds)
            const receipt = await tx.wait()

            const gasUsedByEntryPoint =
                (receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n)

            const balanceOfEntryPointAfterPrefundPaid =
                await ethers.provider.getBalance(entryPointAddress)
            expect(balanceOfEntryPointAfterPrefundPaid).to.equal(
                originalBalanceOfEntryPoint - gasUsedByEntryPoint + missingFunds
            )
        })

        it('GIVEN a invalid userOp WHEN the entrypoint validates it THEN 1 is returned', async () => {
            await validateUserOpWithTestWrapper(account2, 1)
        })

        it('GIVEN a valid userOp WHEN the entrypoint validates it THEN 0 is returned', async () => {
            await validateUserOpWithTestWrapper(adminAccount, 0)
        })

        async function validateUserOpWithTestWrapper(
            signatureAccount: Signer,
            expectedResult: number
        ) {
            const { userOp, hash } =
                await UserOperationUtils.generateSignedUserOperation(
                    signatureAccount,
                    entryPoint,
                    await adminAccount.getAddress()
                )
            const testWrapperFactory = await ethers.getContractFactory(
                'SmartAccountTestWrapper'
            )
            const testWrapper =
                (await testWrapperFactory.deploy()) as SmartAccountTestWrapper
            await testWrapper.waitForDeployment()

            await testWrapper.initializeSmartAccount(
                entryPoint,
                adminAccountAddress
            )

            const entryPointSigner = await getEntryPointSignerImpersonation()

            await expect(
                testWrapper
                    .connect(entryPointSigner)
                    .validateUserOp(userOp, hash, 0n)
            )
                .to.emit(testWrapper, 'UserOpValidated')
                .withArgs(expectedResult)
        }
    })

    describe('execute', () => {
        beforeEach(async () => {
            await smartAccount.initializeSmartAccount(entryPoint)
        })

        it('GIVEN a smart account WHEN a non-entrypoint / non-owner tries to execute a call THEN the execution is reverted', async () => {
            const destinationContractFactory = await ethers.getContractFactory(
                'SmartAccountTestWrapper'
            )
            const destinationContract =
                (await destinationContractFactory.deploy()) as SmartAccountTestWrapper
            await destinationContract.waitForDeployment()
            const destinationContractAddress =
                await destinationContract.getAddress()

            await expect(
                smartAccount
                    .connect(account2)
                    .execute(destinationContractAddress, 0, '0x')
            ).to.be.revertedWithCustomError(
                smartAccount,
                'SmartAccount_NotFromEntryPointOrOwner'
            )
        })

        it('GIVEN an invalid calldata WHEN the smart account executes it THEN the execution is reverted', async () => {
            const destinationContractFactory = await ethers.getContractFactory(
                'SmartAccountTestWrapper'
            )
            const destinationContract =
                (await destinationContractFactory.deploy()) as SmartAccountTestWrapper
            await destinationContract.waitForDeployment()
            const destinationContractAddress =
                await destinationContract.getAddress()

            const callData = destinationContract.interface.encodeFunctionData(
                'dummyFunction',
                [false]
            )

            await expect(
                smartAccount.execute(destinationContractAddress, 0, callData)
            ).to.be.revertedWithCustomError(
                smartAccount,
                'SmartAccount_CallFailed'
            )
        })

        it('GIVEN a valid calldata WHEN the owner tries to execute it THEN the execution is performed', async () => {
            const destinationContractFactory = await ethers.getContractFactory(
                'SmartAccountTestWrapper'
            )
            const destinationContract =
                (await destinationContractFactory.deploy()) as SmartAccountTestWrapper
            await destinationContract.waitForDeployment()
            const destinationContractAddress =
                await destinationContract.getAddress()

            const callData = destinationContract.interface.encodeFunctionData(
                'dummyFunction',
                [true]
            )

            await expect(
                smartAccount.execute(destinationContractAddress, 0, callData)
            ).not.to.be.reverted
        })

        it('GIVEN a valid calldata WHEN the entrypoint tries to execute it THEN the execution is performed', async () => {
            const destinationContractFactory = await ethers.getContractFactory(
                'SmartAccountTestWrapper'
            )
            const destinationContract =
                (await destinationContractFactory.deploy()) as SmartAccountTestWrapper
            await destinationContract.waitForDeployment()
            const destinationContractAddress =
                await destinationContract.getAddress()
            const callData = destinationContract.interface.encodeFunctionData(
                'dummyFunction',
                [true]
            )
            const entryPointSigner = await getEntryPointSignerImpersonation()

            await expect(
                smartAccount
                    .connect(entryPointSigner)
                    .execute(destinationContractAddress, 0, callData)
            ).not.to.be.reverted
        })
    })

    describe('onERC721Received', () => {
        it('GIVEN a smart account WHEN calling onERC721Received THEN the selector is returned', async () => {
            const expectedSelector = ethers
                .id('onERC721Received(address,address,uint256,bytes)')
                .slice(0, 10)

            const response = await smartAccount.onERC721Received(
                entryPointAddress,
                entryPointAddress,
                0,
                '0x'
            )

            expect(response).to.equal(expectedSelector)
        })
    })

    describe('onERC1155Received', () => {
        it('GIVEN a smart account WHEN calling onERC1155Received THEN the selector is returned', async () => {
            const expectedSelector = ethers
                .id('onERC1155Received(address,address,uint256,uint256,bytes)')
                .slice(0, 10)

            const response = await smartAccount.onERC1155Received(
                entryPointAddress,
                entryPointAddress,
                0,
                0,
                '0x'
            )

            expect(response).to.equal(expectedSelector)
        })
    })

    describe('onERC1155BatchReceived', () => {
        it('GIVEN a smart account WHEN calling onERC1155BatchReceived THEN the selector is returned', async () => {
            const expectedSelector = ethers
                .id(
                    'onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)'
                )
                .slice(0, 10)

            const response = await smartAccount.onERC1155BatchReceived(
                entryPointAddress,
                entryPointAddress,
                [0],
                [0],
                '0x'
            )

            expect(response).to.equal(expectedSelector)
        })
    })

    async function getEntryPointSignerImpersonation(
        initialBalance?: bigint
    ): Promise<Signer> {
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
