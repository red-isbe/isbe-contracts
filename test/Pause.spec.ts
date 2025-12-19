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
    AccessControl,
    GlobalIsbePause,
    ISBEPause,
    IsbeTransparentProxy,
} from '../typechain-types'
import {
    PAUSER_ROLE,
    ISBE_AUTHORIZATION_LEVEL,
    PAUSER_AUTHORIZATION_LEVEL,
    DEFAULT_ADMIN_ROLE,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

describe('Pause', function () {
    const PAUSE_INIT_STATE = false

    let adminAccount: Signer
    let account_2: Signer
    let pauseFacet: ISBEPause
    let pause: ISBEPause
    let globalIsbePause: GlobalIsbePause
    let accessControl: AccessControl

    // Fixture functions
    async function deployPauseFixture() {
        const [admin, account2, account3] = await ethers.getSigners()
        const adminAddress = await admin.getAddress()
        const account2Address = await account2.getAddress()

        const result = await deployGovernance(
            admin,
            [], // no roles
            undefined,
            PAUSE_INIT_STATE // false
        )

        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        return {
            adminAccount: admin,
            account_2: account2,
            account_3: account3,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            pause: result.pause,
            globalIsbePause: result.globalIsbePause,
            accessControl: result.accessControl,
            pauseFacet: result.pauseFacet,
            accessControlFacet: result.accessControlGovernanceFacet,
            transparentProxyFactory: transparentFactory,
        }
    }

    async function deployPausePausedFixture() {
        const [admin, account2, account3] = await ethers.getSigners()
        const adminAddress = await admin.getAddress()
        const account2Address = await account2.getAddress()

        const result = await deployGovernance(
            admin,
            [], // no roles
            undefined,
            true // paused
        )

        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        return {
            adminAccount: admin,
            account_2: account2,
            account_3: account3,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            pause: result.pause,
            globalIsbePause: result.globalIsbePause,
            accessControl: result.accessControl,
            pauseFacet: result.pauseFacet,
            accessControlFacet: result.accessControlGovernanceFacet,
            transparentProxyFactory: transparentFactory,
        }
    }

    async function deployPauseWithPauserRoleFixture() {
        const [admin, account2, account3] = await ethers.getSigners()
        const adminAddress = await admin.getAddress()
        const account2Address = await account2.getAddress()

        const result = await deployGovernance(
            admin,
            [{ role: PAUSER_ROLE, members: [adminAddress] }],
            undefined,
            PAUSE_INIT_STATE // false
        )

        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        return {
            adminAccount: admin,
            account_2: account2,
            account_3: account3,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            pause: result.pause,
            globalIsbePause: result.globalIsbePause,
            accessControl: result.accessControl,
            pauseFacet: result.pauseFacet,
            accessControlFacet: result.accessControlGovernanceFacet,
            transparentProxyFactory: transparentFactory,
        }
    }

    async function deployPausePausedWithPauserRoleFixture() {
        const [admin, account2, account3] = await ethers.getSigners()
        const adminAddress = await admin.getAddress()
        const account2Address = await account2.getAddress()

        const result = await deployGovernance(
            admin,
            [{ role: PAUSER_ROLE, members: [adminAddress] }],
            undefined,
            true // paused
        )

        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        return {
            adminAccount: admin,
            account_2: account2,
            account_3: account3,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            pause: result.pause,
            globalIsbePause: result.globalIsbePause,
            accessControl: result.accessControl,
            pauseFacet: result.pauseFacet,
            accessControlFacet: result.accessControlGovernanceFacet,
            transparentProxyFactory: transparentFactory,
        }
    }

    async function deployPausePausedWithMultiplePauserRoleFixture() {
        const [admin, account2, account3] = await ethers.getSigners()
        const adminAddress = await admin.getAddress()
        const account2Address = await account2.getAddress()

        const result = await deployGovernance(
            admin,
            [{ role: PAUSER_ROLE, members: [adminAddress, account2Address] }],
            undefined,
            true // paused
        )

        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        return {
            adminAccount: admin,
            account_2: account2,
            account_3: account3,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            pause: result.pause,
            globalIsbePause: result.globalIsbePause,
            accessControl: result.accessControl,
            pauseFacet: result.pauseFacet,
            accessControlFacet: result.accessControlGovernanceFacet,
            transparentProxyFactory: transparentFactory,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployPauseFixture)
        adminAccount = contracts.adminAccount
        account_2 = contracts.account_2
        pause = contracts.pause
        globalIsbePause = contracts.globalIsbePause
        accessControl = contracts.accessControl
        pauseFacet = contracts.pauseFacet
    })

    describe('Testing initialization and constructor', function () {
        it('GIVEN a Pause WHEN initializing it THEN fails', async function () {
            await expect(
                pauseFacet.initializePause(false)
            ).to.be.revertedWithCustomError(
                pauseFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to a Pause WHEN initializing it THEN fails', async function () {
            await expect(
                pause.initializePause(true)
            ).to.be.revertedWithCustomError(
                pause,
                'ContractIsAlreadyInitialized'
            )
        })
    })

    describe('Reading pause', function () {
        it('GIVEN a Pause WHEN reading pause status THEN succeeds', async function () {
            expect(await pause.paused()).to.equal(PAUSE_INIT_STATE)
        })

        it('GIVEN a Pause WHEN reading authority level THEN succeeds', async function () {
            const { pause: pausedContract } = await loadFixture(
                deployPausePausedFixture
            )

            expect(await pausedContract.authorityLevel()).to.equal(
                ISBE_AUTHORIZATION_LEVEL
            )
        })
    })

    describe('Pause & Unpause', function () {
        it('GIVEN a Pause WHEN using account without pauser to pause THEN fails', async function () {
            pause = pause.connect(account_2)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })

        it('GIVEN a Pause WHEN using account without pauser to unpause THEN fails', async function () {
            const { pause: pausedPause } = await loadFixture(
                deployPausePausedFixture
            )
            const pauseConnected = pausedPause.connect(account_2)

            await expect(
                pauseConnected.unpause()
            ).to.be.revertedWithCustomError(pauseConnected, 'AccountHasNoRoles')
        })

        it('GIVEN a Pause WHEN using account with pauser to pause an already paused token THEN fails', async function () {
            const { pause: pausedPause, adminAccount: admin } =
                await loadFixture(deployPausePausedWithPauserRoleFixture)
            const pauseConnected = pausedPause.connect(admin)

            await expect(pauseConnected.pause()).to.be.revertedWithCustomError(
                pauseConnected,
                'IsPaused'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser to unpause an already unpaused token THEN fails', async function () {
            const { pause: unpausedPause, adminAccount: admin } =
                await loadFixture(deployPauseWithPauserRoleFixture)
            const pauseConnected = unpausedPause.connect(admin)

            await expect(
                pauseConnected.unpause()
            ).to.be.revertedWithCustomError(pauseConnected, 'IsNotPaused')
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with pauser role THEN succeeds', async function () {
            const {
                transparentProxyFactory: factory,
                accessControlFacet,
                pauseFacet,
                adminAccount: admin,
                account_2: account2,
                adminAccountAddress: adminAddress,
                account_2Address: account2Address,
            } = await loadFixture(deployPauseFixture)

            const transparentProxy: IsbeTransparentProxy = await factory.deploy(
                await accessControlFacet.getAddress(),
                adminAddress
            )

            const proxy = await ethers.getContractAt(
                'ITransparentUpgradeableProxy',
                await transparentProxy.getAddress(),
                admin
            )

            const accessControlProxy = await ethers.getContractAt(
                'AccessControl',
                await transparentProxy.getAddress(),
                account2
            )

            await accessControlProxy.initializeAccessControl([
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [adminAddress],
                },
                {
                    role: PAUSER_ROLE,
                    members: [account2Address, adminAddress],
                },
            ])

            await proxy.upgradeTo(await pauseFacet.getAddress())

            const pauseProxy = await ethers.getContractAt(
                'ISBEPause',
                await transparentProxy.getAddress(),
                account2
            )

            await pauseProxy.pause()

            await expect(pauseProxy.unpause())
                .to.emit(pauseProxy, 'Unpaused')
                .withArgs(account2)

            expect(await pauseProxy.paused()).to.equal(false)
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token paused at initialization THEN succeeds', async function () {
            const {
                transparentProxyFactory: factory,
                accessControlFacet,
                pauseFacet,
                adminAccount: admin,
                account_2: account2,
                account_3: account3,
                adminAccountAddress: adminAddress,
                account_2Address: account2Address,
            } = await loadFixture(deployPauseFixture)

            const transparentProxy: IsbeTransparentProxy = await factory.deploy(
                await accessControlFacet.getAddress(),
                adminAddress
            )

            const proxy = await ethers.getContractAt(
                'ITransparentUpgradeableProxy',
                await transparentProxy.getAddress(),
                admin
            )

            const accessControlProxy = await ethers.getContractAt(
                'AccessControl',
                await transparentProxy.getAddress(),
                account2
            )

            await accessControlProxy.initializeAccessControl([
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [adminAddress],
                },
                {
                    role: PAUSER_ROLE,
                    members: [account2Address],
                },
            ])

            await proxy.upgradeTo(await pauseFacet.getAddress())

            let pauseProxy = await ethers.getContractAt(
                'ISBEPause',
                await transparentProxy.getAddress(),
                account3
            )

            await pauseProxy.initializePause(true)

            pauseProxy = pauseProxy.connect(account2)

            await expect(pauseProxy.unpause())
                .to.emit(pauseProxy, 'Unpaused')
                .withArgs(account2)

            expect(await pauseProxy.paused()).to.equal(false)
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with ISBE role THEN fails', async function () {
            const { pause: pausedPause, account_2: account2 } =
                await loadFixture(
                    deployPausePausedWithMultiplePauserRoleFixture
                )
            const pauseConnected = pausedPause.connect(account2)

            await expect(pauseConnected.unpause())
                .to.be.revertedWithCustomError(
                    pauseConnected,
                    'InsufficientAuthorityLevel'
                )
                .withArgs(PAUSER_AUTHORIZATION_LEVEL, ISBE_AUTHORIZATION_LEVEL)
        })

        it('GIVEN a Pause WHEN using account with pauser role to pause THEN succeeds', async function () {
            pause = pause.connect(adminAccount)

            await accessControl.grantRole(PAUSER_ROLE, adminAccount)

            await expect(pause.pause())
                .to.emit(pause, 'Paused')
                .withArgs(adminAccount)

            expect(await pause.paused()).to.equal(true)
        })

        it('GIVEN a Pause WHEN using account with ISBE role to pause THEN succeeds', async function () {
            globalIsbePause = globalIsbePause.connect(adminAccount)

            const useCaseProxy = await pause.getAddress()

            await expect(globalIsbePause.pauseIsbe(useCaseProxy))
                .to.emit(globalIsbePause, 'IsbePaused')
                .withArgs(useCaseProxy, adminAccount)

            expect(await pause.paused()).to.equal(true)
        })
    })
})
