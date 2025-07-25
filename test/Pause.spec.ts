import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControl,
    GlobalIsbePause,
    ISBEPause,
    IsbeTransparentProxy,
    IsbeTransparentProxy__factory,
} from '../typechain-types'
import {
    PAUSER_ROLE,
    ISBE_AUTHORIZATION_LEVEL,
    PAUSER_AUTHORIZATION_LEVEL,
    DEFAULT_ADMIN_ROLE,
} from './constants'
import { deployGovernance } from './initialization'

describe('Pause', function () {
    const PAUSE_INIT_STATE = false

    let adminAccount: Signer
    let adminAccountAddress: string
    let account_2: Signer
    let account_2Address: string
    let pauseFacet: ISBEPause
    let pause: ISBEPause
    let globalIsbePause: GlobalIsbePause
    let accessControl: AccessControl
    let accessControlFacet: AccessControl
    let transparentProxyFactory: IsbeTransparentProxy__factory

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
        adminAccountAddress = await adminAccount.getAddress()
        account_2Address = await account_2.getAddress()
    })

    async function deploy(
        init_pause: boolean = PAUSE_INIT_STATE,
        addRole?: string[],
        users?: string[][]
    ) {
        const rbacsUseCase = []

        if (addRole && users) {
            for (let i = 0; i < addRole.length; i++) {
                const userAddresses = users[i]
                rbacsUseCase.push({
                    role: addRole[i],
                    members: userAddresses,
                })
            }
        }

        const result = await deployGovernance(
            adminAccount,
            rbacsUseCase,
            init_pause
        )
        pause = result.pause
        globalIsbePause = result.globalIsbePause
        accessControl = result.accessControl
        pauseFacet = result.pauseFacet
        accessControlFacet = result.accessControlFacet

        transparentProxyFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN a Pause WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                pauseFacet.initializePause(false)
            ).to.be.revertedWithCustomError(
                pauseFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to a Pause WHEN initializing it THEN fails', async function () {
            await deploy()

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
            await deploy()

            expect(await pause.paused()).to.equal(PAUSE_INIT_STATE)
        })

        it('GIVEN a Pause WHEN reading authority level THEN succeeds', async function () {
            await deploy(true)

            expect(await pause.authorityLevel()).to.equal(
                ISBE_AUTHORIZATION_LEVEL
            )
        })
    })

    describe('Pause & Unpause', function () {
        it('GIVEN a Pause WHEN using account without pauser to pause THEN fails', async function () {
            await deploy()

            pause = pause.connect(account_2)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })

        it('GIVEN a Pause WHEN using account without pauser to unpause THEN fails', async function () {
            await deploy(true)

            pause = pause.connect(account_2)

            await expect(pause.unpause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser to pause an already paused token THEN fails', async function () {
            await deploy(true, [PAUSER_ROLE], [[adminAccountAddress]])

            pause = pause.connect(adminAccount)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'IsPaused'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser to unpause an already unpaused token THEN fails', async function () {
            await deploy(false, [PAUSER_ROLE], [[adminAccountAddress]])

            pause = pause.connect(adminAccount)

            await expect(pause.unpause()).to.be.revertedWithCustomError(
                pause,
                'IsNotPaused'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with pauser role THEN succeeds', async function () {
            await deploy()

            const transparentProxy: IsbeTransparentProxy =
                await transparentProxyFactory.deploy(
                    await accessControlFacet.getAddress(),
                    adminAccountAddress
                )

            const proxy = await ethers.getContractAt(
                'ITransparentUpgradeableProxy',
                await transparentProxy.getAddress(),
                adminAccount
            )

            const accessControlProxy = await ethers.getContractAt(
                'AccessControl',
                await transparentProxy.getAddress(),
                account_2
            )

            await accessControlProxy.initializeAccessControl([
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [adminAccountAddress],
                },
                {
                    role: PAUSER_ROLE,
                    members: [account_2Address, adminAccountAddress],
                },
            ])

            await proxy.upgradeTo(await pauseFacet.getAddress())

            const pauseProxy = await ethers.getContractAt(
                'ISBEPause',
                await transparentProxy.getAddress(),
                account_2
            )

            await pauseProxy.pause()

            await expect(pauseProxy.unpause())
                .to.emit(pauseProxy, 'Unpaused')
                .withArgs(account_2)

            expect(await pauseProxy.paused()).to.equal(false)
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with ISBE role THEN fails', async function () {
            await deploy(
                true,
                [PAUSER_ROLE],
                [[adminAccountAddress, account_2Address]]
            )

            pause = pause.connect(account_2)

            await expect(pause.unpause())
                .to.be.revertedWithCustomError(
                    pause,
                    'InsufficientAuthorityLevel'
                )
                .withArgs(PAUSER_AUTHORIZATION_LEVEL, ISBE_AUTHORIZATION_LEVEL)
        })

        it('GIVEN a Pause WHEN using account with pauser role to pause THEN succeeds', async function () {
            await deploy()

            pause = pause.connect(adminAccount)

            await accessControl.grantRole(PAUSER_ROLE, adminAccount)

            await expect(pause.pause())
                .to.emit(pause, 'Paused')
                .withArgs(adminAccount)

            expect(await pause.paused()).to.equal(true)
        })

        it('GIVEN a Pause WHEN using account with ISBE role to pause THEN succeeds', async function () {
            await deploy()

            globalIsbePause = globalIsbePause.connect(adminAccount)

            const useCaseProxy = await pause.getAddress()

            await expect(globalIsbePause.pauseIsbe(useCaseProxy))
                .to.emit(globalIsbePause, 'IsbePaused')
                .withArgs(useCaseProxy, adminAccount)

            expect(await pause.paused()).to.equal(true)
        })
    })
})
