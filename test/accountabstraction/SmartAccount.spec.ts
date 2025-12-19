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
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    ISBEPause,
    SmartAccount,
    SmartAccountTestWrapper,
} from 'typechain-types'
import { deployGovernance } from '../fixtures/governance'
import {
    CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
    PAUSER_ROLE,
} from '../../utils/constants'
import { Signer, ZeroAddress } from 'ethers'
import { UserOpBuilder } from '../utils/accountabstraction/UserOpBuilder'
import { IEntryPoint } from 'typechain-types/contracts/accountabstraction/entrypoint/IEntryPoint'

describe('SmartAccount', function () {
    let smartAccount: SmartAccount
    let smartAccountAddress: string
    let entryPoint: IEntryPoint
    let entryPointAddress: string
    let admin: Signer
    let adminAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let pause: ISBEPause

    async function deployFixture(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rbacsUseCase: any[] = [
            {
                role: PAUSER_ROLE,
                members: [],
            },
        ]
    ) {
        const [adminSigner, nonAdminSigner] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()

        // Update rbacs with actual addresses
        const updatedRbacs = rbacsUseCase.map((rbac) => ({
            ...rbac,
            members: rbac.members.length > 0 ? rbac.members : [adminAddress],
        }))

        // Deploy Governance
        const result = await deployGovernance(
            adminSigner,
            updatedRbacs,
            CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
            false
        )

        const smartAccount = await ethers.getContractAt(
            'SmartAccount',
            result.useCaseProxy
        )

        const pause = await ethers.getContractAt(
            'ISBEPauseFacet',
            result.useCaseProxy
        )

        const entryPoint = result.entryPoint

        return {
            adminSigner,
            nonAdminSigner,
            entryPoint,
            smartAccount,
            pause,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        smartAccount = contracts.smartAccount
        smartAccountAddress = await smartAccount.getAddress()
        entryPoint = contracts.entryPoint
        entryPointAddress = await entryPoint.getAddress()
        admin = contracts.adminSigner
        adminAddress = await admin.getAddress()
        nonAdmin = contracts.nonAdminSigner
        nonAdminAddress = await nonAdmin.getAddress()
        pause = contracts.pause
    })

    describe('initializeSmartAccount', () => {
        it('GIVEN a deployed smart account WHEN initializing from a non-admin role THEN the execution is reverted', async () => {
            await expect(
                smartAccount
                    .connect(nonAdmin)
                    .initializeSmartAccount(ZeroAddress)
            ).to.be.revertedWithCustomError(smartAccount, 'AccountHasNoRole')
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

        it('GIVEN a paused smart account WHEN a trying to validate a userOp THEN the execution is reverted', async () => {
            const { userOp, userOpHash } = await new UserOpBuilder(
                entryPoint,
                admin,
                await admin.getAddress()
            ).sign()

            await pause.connect(admin).pause()

            await expect(
                smartAccount.validateUserOp(userOp, userOpHash, 0n)
            ).to.be.revertedWithCustomError(smartAccount, 'IsPaused')
        })

        it('GIVEN a smart account WHEN a non-entrypoint tries to validate a userOp THEN the execution is reverted', async () => {
            const { userOp, userOpHash } = await new UserOpBuilder(
                entryPoint,
                admin,
                await admin.getAddress()
            ).sign()

            await expect(
                smartAccount.validateUserOp(userOp, userOpHash, 0n)
            ).to.be.revertedWithCustomError(
                smartAccount,
                'SmartAccount_NotFromEntryPoint'
            )
        })

        it('GIVEN a userOp and missing funds WHEN the entrypoint validates it THEN the missing funds are paid', async () => {
            const { userOp, userOpHash } = await new UserOpBuilder(
                entryPoint,
                admin,
                await admin.getAddress()
            ).sign()
            const missingFunds = ethers.parseEther('0.5')
            const originalBalanceOfEntryPoint = ethers.parseEther('1.0')

            await admin.sendTransaction({
                to: smartAccountAddress,
                value: ethers.parseEther('1.0'),
            })

            const entryPointSigner = await getEntryPointSignerImpersonation(
                originalBalanceOfEntryPoint
            )

            const tx = await smartAccount
                .connect(entryPointSigner)
                .validateUserOp(userOp, userOpHash, missingFunds)
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
            await validateUserOpWithTestWrapper(nonAdmin, 1)
        })

        it('GIVEN a valid userOp WHEN the entrypoint validates it THEN 0 is returned', async () => {
            await validateUserOpWithTestWrapper(admin, 0)
        })

        async function validateUserOpWithTestWrapper(
            signatureAccount: Signer,
            expectedResult: number
        ) {
            const { userOp, userOpHash } = await new UserOpBuilder(
                entryPoint,
                signatureAccount,
                await admin.getAddress()
            ).sign()
            const testWrapperFactory = await ethers.getContractFactory(
                'SmartAccountTestWrapper'
            )
            const testWrapper =
                (await testWrapperFactory.deploy()) as SmartAccountTestWrapper
            await testWrapper.waitForDeployment()

            await testWrapper.initializeSmartAccount(entryPoint, adminAddress)

            const entryPointSigner = await getEntryPointSignerImpersonation()

            await expect(
                testWrapper
                    .connect(entryPointSigner)
                    .validateUserOp(userOp, userOpHash, 0n)
            )
                .to.emit(testWrapper, 'UserOpValidated')
                .withArgs(expectedResult)
        }
    })

    describe('execute', () => {
        beforeEach(async () => {
            await smartAccount.initializeSmartAccount(entryPoint)
        })

        it('GIVEN a paused smart account WHEN a trying to execute a call THEN the execution is reverted', async () => {
            await pause.connect(admin).pause()

            await expect(
                smartAccount.execute(nonAdminAddress, 0, '0x')
            ).to.be.revertedWithCustomError(smartAccount, 'IsPaused')
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
                    .connect(nonAdmin)
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

    describe('updateEntryPoint', () => {
        it('GIVEN a new entry point WHEN updateEntryPoint THEN EntryPointUpdated', async () => {
            const entryPointSigner = await getEntryPointSignerImpersonation()
            await expect(smartAccount.updateEntryPoint(entryPointSigner))
                .to.emit(smartAccount, 'EntryPointUpdated')
                .withArgs(entryPointSigner)
        })

        it('GIVEN a zero address WHEN updateEntryPoint THEN reverts', async () => {
            await expect(
                smartAccount.updateEntryPoint(ZeroAddress)
            ).to.be.revertedWithCustomError(smartAccount, 'AddressZero')
        })

        it('GIVEN a non admin account WHEN updateEntryPoint THEN reverts', async () => {
            await expect(
                smartAccount.connect(nonAdmin).updateEntryPoint(ZeroAddress)
            ).to.be.revertedWithCustomError(smartAccount, 'AccountHasNoRole')
        })

        it('GIVEN a deployed smart account WHEN initializing with an non-entrypoint THEN the execution is reverted', async () => {
            await expect(smartAccount.updateEntryPoint(smartAccount))
                .to.be.revertedWithCustomError(
                    smartAccount,
                    'EntryPointInterfaceMismatch'
                )
                .withArgs(smartAccountAddress)
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
        await admin.sendTransaction({
            to: entryPointAddress,
            value: initialBalance ?? ethers.parseEther('1.0'),
        })

        return entryPointSigner
    }
})
