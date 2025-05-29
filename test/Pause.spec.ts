import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { ISBEPause } from '../typechain-types/index.js'
import {
    PAUSER_ROLE,
    ISBE_ROLE,
    ISBE_AUTHORIZATION_LEVEL,
    PAUSER_AUTHORIZATION_LEVEL,
} from './constants'

describe('Pause', function () {
    const PAUSE_INIT_STATE = false

    let adminAccount: Signer
    let account_2: Signer
    let pauseImplementation: ISBEPause
    let pause: ISBEPause

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
    })

    async function deploy(
        init_pause: boolean = PAUSE_INIT_STATE,
        addRole?: string,
        user?: Signer
    ) {
        const Pause = await ethers.getContractFactory('ISBEPause')
        pauseImplementation = await Pause.deploy()

        const Proxy = await ethers.getContractFactory('DummyProxy')
        const proxy = await Proxy.deploy(pauseImplementation)
        await proxy.waitForDeployment()

        pause = (await Pause.attach(await proxy.getAddress())) as ISBEPause

        await pause.initializeAccessControl(adminAccount)

        if (addRole) {
            pause = pause.connect(adminAccount)
            await pause.grantRole(addRole!, user!)
        }

        await pause.initializePause(init_pause)
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN a Pause WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                pauseImplementation.initializePause(false)
            ).to.be.revertedWithCustomError(
                pauseImplementation,
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
            await deploy(true, PAUSER_ROLE, adminAccount)

            expect(await pause.authorityLevel()).to.equal(
                PAUSER_AUTHORIZATION_LEVEL
            )
        })
    })

    describe('Pause & Unpause', function () {
        it('GIVEN a Pause WHEN using account without pauser or ISBE role to pause THEN fails', async function () {
            await deploy()

            pause = pause.connect(account_2)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })

        it('GIVEN a Pause WHEN using account without pauser or ISBE role to unpause THEN fails', async function () {
            await deploy(true)

            pause = pause.connect(account_2)

            await expect(pause.unpause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser and ISBE role to pause an already paused token THEN fails', async function () {
            await deploy(true)

            pause = pause.connect(adminAccount)

            await pause.grantRole(PAUSER_ROLE, adminAccount)
            await pause.grantRole(ISBE_ROLE, adminAccount)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'IsPaused'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser and ISBE role to unpause an already unpaused token THEN fails', async function () {
            await deploy()

            pause = pause.connect(adminAccount)

            await pause.grantRole(PAUSER_ROLE, adminAccount)
            await pause.grantRole(ISBE_ROLE, adminAccount)

            await expect(pause.unpause()).to.be.revertedWithCustomError(
                pause,
                'IsNotPaused'
            )
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with pauser role THEN succeeds', async function () {
            await deploy(true, PAUSER_ROLE, adminAccount)

            pause = pause.connect(adminAccount)

            await pause.grantRole(PAUSER_ROLE, account_2)

            pause = pause.connect(account_2)

            await expect(pause.unpause())
                .to.emit(pause, 'Unpaused')
                .withArgs(account_2)

            expect(await pause.paused()).to.equal(false)
        })

        it('GIVEN a Pause WHEN using account with pauser role to unpause a token previously paused by another account with ISBE role THEN fails', async function () {
            await deploy(true, ISBE_ROLE, adminAccount)

            pause = pause.connect(adminAccount)

            await pause.grantRole(PAUSER_ROLE, account_2)

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

            await pause.grantRole(PAUSER_ROLE, adminAccount)

            await expect(pause.pause())
                .to.emit(pause, 'Paused')
                .withArgs(adminAccount)

            expect(await pause.paused()).to.equal(true)
        })

        it('GIVEN a Pause WHEN using account with ISBE role to pause THEN succeeds', async function () {
            await deploy()

            pause = pause.connect(adminAccount)

            await pause.grantRole(ISBE_ROLE, adminAccount)

            await expect(pause.pause())
                .to.emit(pause, 'Paused')
                .withArgs(adminAccount)

            expect(await pause.paused()).to.equal(true)
        })
    })
})
