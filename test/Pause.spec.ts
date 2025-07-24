import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { AccessControl, GlobalIsbePause, ISBEPause } from '../typechain-types'
import {
    PAUSER_ROLE,
    ISBE_AUTHORIZATION_LEVEL,
    PAUSER_AUTHORIZATION_LEVEL,
} from './constants'
import { deployGovernance } from './initialization'

describe('Pause', function () {
    const PAUSE_INIT_STATE = false

    let adminAccount: Signer
    let account_2: Signer
    let pauseFacet: ISBEPause
    let pause: ISBEPause
    let globalIsbePause: GlobalIsbePause
    let accessControl: AccessControl

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
    })

    async function deploy(
        init_pause: boolean = PAUSE_INIT_STATE,
        addRole?: string[],
        user?: Signer[]
    ) {
        const rbacsUseCase = []

        if (addRole && user) {
            for (let i = 0; i < addRole.length; i++) {
                const userAddress = await user[i].getAddress()
                rbacsUseCase.push({
                    role: addRole[i],
                    members: [userAddress],
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
            await deploy(true, [PAUSER_ROLE], [adminAccount, adminAccount])

            pause = pause.connect(adminAccount)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'IsPaused'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser to unpause an already unpaused token THEN fails', async function () {
            await deploy(false, [PAUSER_ROLE], [adminAccount, adminAccount])

            pause = pause.connect(adminAccount)

            await expect(pause.unpause()).to.be.revertedWithCustomError(
                pause,
                'IsNotPaused'
            )
        })

        it.skip('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with pauser role THEN succeeds', async function () {
            await deploy(true, [PAUSER_ROLE], [account_2])

            pause = pause.connect(account_2)

            await expect(pause.unpause())
                .to.emit(pause, 'Unpaused')
                .withArgs(account_2)

            expect(await pause.paused()).to.equal(false)
        })

        it.skip('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with ISBE role THEN fails', async function () {
            await deploy(true, [PAUSER_ROLE], [adminAccount, account_2])

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
