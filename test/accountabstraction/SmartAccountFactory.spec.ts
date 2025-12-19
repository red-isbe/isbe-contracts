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
import { AccessControl, IIsbeFactory, ISBEPause } from 'typechain-types'
import { deployGovernance } from '../fixtures/governance'
import {
    ACCOUNT_ABSTRACTION_SMART_ACCOUNT_FACTORY_RESOLVER_KEY,
    CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
    SMART_ACCOUNT_DEPLOYER_ROLE,
} from '../../utils/constants'
import { Signer } from 'ethers'
import { predictSmartAccountAddress } from '../utils/accountabstraction/UserOpBuilder'

describe('SmartAccountFactory', function () {
    let admin: Signer
    let adminAddress: string
    let isbeFactory: IIsbeFactory
    let isbeFactoryAddress: string
    const VERSION = 1

    describe('createAccount', () => {
        describe('without smart account configuration set', () => {
            async function deployFixture() {
                const [adminSigner] = await ethers.getSigners()

                const result = await deployGovernance(adminSigner, [])

                const isbeFactory = await ethers.getContractAt(
                    'IIsbeFactory',
                    await result.governanceContract.getAddress()
                )

                expect(
                    await result.smartAccountFactoryFacet.businessIdIntrospection()
                ).to.be.equal(
                    ACCOUNT_ABSTRACTION_SMART_ACCOUNT_FACTORY_RESOLVER_KEY
                )

                return {
                    adminSigner,
                    isbeFactory,
                }
            }

            beforeEach(async () => {
                const contracts = await loadFixture(deployFixture)
                admin = contracts.adminSigner
                adminAddress = await admin.getAddress()
                isbeFactory = contracts.isbeFactory
            })

            it('GIVEN a deployed factory WHEN configuration not defined THEN the execution is reverted', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .createAccount(adminAddress, ethers.ZeroHash)
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'InvalidConfiguration'
                    )
                    .withArgs(
                        CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT,
                        VERSION
                    )
            })
        })

        describe('with smart account configuration set', () => {
            let nonAdmin: Signer
            let nonAdminAddress: string
            let entryPointSigner: Signer
            let entryPointAddress: string
            let pause: ISBEPause
            let pauseFacetAddress: string
            let accessControlGovernance: AccessControl
            let accessControlFacetAddress: string
            let ownableFacetAddress: string
            let smartAccountFacetAddress: string

            async function deployFixture() {
                const [adminSigner, nonAdminSigner] = await ethers.getSigners()

                const result = await deployGovernance(
                    adminSigner,
                    [],
                    CONFIGURATION_ID_ACCOUNT_ABSTRACTION_SMART_ACCOUNT
                )

                const isbeFactory = await ethers.getContractAt(
                    'IIsbeFactory',
                    await result.governanceContract.getAddress()
                )

                const entryPoint = result.entryPoint

                expect(
                    await result.smartAccountFactoryFacet.businessIdIntrospection()
                ).to.be.equal(
                    ACCOUNT_ABSTRACTION_SMART_ACCOUNT_FACTORY_RESOLVER_KEY
                )

                return {
                    adminSigner,
                    nonAdminSigner,
                    isbeFactory,
                    entryPoint,
                    pause: result.pauseGovernance,
                    accessControlGovernance: result.accessControlGovernance,
                    accessControlFacet: result.accessControlFacet,
                    ownableFacet: result.ownableFacet,
                    smartAccountFacet: result.smartAccountFacet,
                    pauseFacet: result.pauseFacet,
                }
            }

            beforeEach(async () => {
                const contracts = await loadFixture(deployFixture)
                admin = contracts.adminSigner
                adminAddress = await admin.getAddress()
                nonAdmin = contracts.nonAdminSigner
                nonAdminAddress = await nonAdmin.getAddress()
                isbeFactory = contracts.isbeFactory
                isbeFactoryAddress = (
                    await isbeFactory.getAddress()
                ).toLowerCase()
                entryPointAddress = await contracts.entryPoint.getAddress()
                entryPointSigner = await getEntryPointSignerImpersonation()
                pause = contracts.pause
                pauseFacetAddress = await contracts.pauseFacet.getAddress()
                accessControlGovernance = contracts.accessControlGovernance
                accessControlFacetAddress =
                    await contracts.accessControlFacet.getAddress()
                ownableFacetAddress = await contracts.ownableFacet.getAddress()
                smartAccountFacetAddress =
                    await contracts.smartAccountFacet.getAddress()

                await accessControlGovernance.grantRole(
                    SMART_ACCOUNT_DEPLOYER_ROLE,
                    entryPointAddress
                )
            })

            it('GIVEN a paused factory WHEN asking it to create an account THEN the execution is reverted', async () => {
                await pause.connect(admin).pause()

                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .createAccount(nonAdminAddress, ethers.ZeroHash)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })

            it('GIVEN a deployed factory WHEN asking it to create an account from an account without the required role THEN the execution is reverted', async () => {
                await accessControlGovernance.revokeRole(
                    SMART_ACCOUNT_DEPLOYER_ROLE,
                    entryPointAddress
                )

                await expect(
                    isbeFactory
                        .connect(entryPointSigner)
                        .createAccount(nonAdminAddress, ethers.ZeroHash)
                )
                    .to.be.revertedWithCustomError(
                        accessControlGovernance,
                        'AccountHasNoRole'
                    )
                    .withArgs(entryPointAddress, SMART_ACCOUNT_DEPLOYER_ROLE)
            })

            it('GIVEN a deployed factory WHEN asking it to create an account from a non-entrypoint THEN the execution is reverted', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .createAccount(nonAdminAddress, ethers.ZeroHash)
                )
                    .to.be.revertedWithCustomError(
                        isbeFactory,
                        'EntryPointInterfaceMismatch'
                    )
                    .withArgs(adminAddress)
            })

            it('GIVEN a deployed factory WHEN asking it to create an account from an entrypoint THEN the smart account is deployed', async () => {
                const salt =
                    '0x1234567890123456789012345678901234567890123456789012345678901234'

                const predictedAddress = await predictSmartAccountAddress(
                    salt,
                    {
                        isbeFactoryAddress: isbeFactoryAddress,
                        entryPointAddress: entryPointAddress,
                        smartAccountOwnerAddress: nonAdminAddress,
                        ownableFacetAddress: ownableFacetAddress,
                        smartAccountFacetAddress: smartAccountFacetAddress,
                        pauseFacetAddress: pauseFacetAddress,
                        accessControlFacetAddress: accessControlFacetAddress,
                    }
                )

                const beforeDeploymentCode =
                    await ethers.provider.getCode(predictedAddress)

                await isbeFactory
                    .connect(entryPointSigner)
                    .createAccount(nonAdminAddress, salt)

                const afterDeploymentCode =
                    await ethers.provider.getCode(predictedAddress)
                expect(beforeDeploymentCode).to.equal('0x')
                expect(afterDeploymentCode).to.not.equal('0x')
            })

            it('GIVEN a deployed factory WHEN asking it to create an account that already exists THEN the smart account is not deployed', async () => {
                const salt =
                    '0x1234567890123456789012345678901234567890123456789012345678901234'

                const predictedAddress = await predictSmartAccountAddress(
                    salt,
                    {
                        isbeFactoryAddress: isbeFactoryAddress,
                        entryPointAddress: entryPointAddress,
                        smartAccountOwnerAddress: nonAdminAddress,
                        ownableFacetAddress: ownableFacetAddress,
                        smartAccountFacetAddress: smartAccountFacetAddress,
                        pauseFacetAddress: pauseFacetAddress,
                        accessControlFacetAddress: accessControlFacetAddress,
                    }
                )

                const beforeDeploymentCode =
                    await ethers.provider.getCode(predictedAddress)

                await isbeFactory
                    .connect(entryPointSigner)
                    .createAccount(nonAdminAddress, salt)

                const afterDeploymentCode =
                    await ethers.provider.getCode(predictedAddress)

                expect(beforeDeploymentCode).to.equal('0x')
                expect(afterDeploymentCode).to.not.equal('0x')

                await expect(
                    isbeFactory
                        .connect(entryPointSigner)
                        .createAccount(nonAdminAddress, salt)
                ).not.to.be.reverted
            })

            async function getEntryPointSignerImpersonation(): Promise<Signer> {
                await network.provider.request({
                    method: 'hardhat_impersonateAccount',
                    params: [entryPointAddress],
                })
                const entryPointSigner =
                    await ethers.provider.getSigner(entryPointAddress)
                await admin.sendTransaction({
                    to: entryPointAddress,
                    value: ethers.parseEther('1.0'),
                })

                return entryPointSigner
            }
        })
    })
})
