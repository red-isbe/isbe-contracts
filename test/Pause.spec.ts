import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { ISBEPause } from '../typechain-types/index.js'
//import { PAUSER_ROLE, ISBE_ROLE } from './constants'

describe('Pause', function () {
    const PAUSE_INIT_STATE = false

    let adminAccount: Signer
    //let account_2: Signer
    let pauseImplementation: ISBEPause
    let pause: ISBEPause

    async function deploy(initialize: boolean = true) {
        ;[adminAccount] = await ethers.getSigners()

        const Pause = await ethers.getContractFactory('ISBEPause')
        pauseImplementation = await Pause.deploy()

        const Proxy = await ethers.getContractFactory('DumbProxy')
        const proxy = await Proxy.deploy(pauseImplementation)
        await proxy.waitForDeployment()

        pause = (await Pause.attach(await proxy.getAddress())) as ISBEPause

        if (initialize) await pause.initialize(PAUSE_INIT_STATE)
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN a Pause WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                pauseImplementation.initialize(false)
            ).to.be.revertedWithCustomError(
                pauseImplementation,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to a Pause WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(pause.initialize(true)).to.be.revertedWithCustomError(
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
    })

    describe('Pause & Unpause', function () {
        it('GIVEN a Pause WHEN using account without pauser or ISBE role to pause THEN fails', async function () {
            await deploy()

            pause = pause.connect(adminAccount)

            await expect(pause.pause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })

        it('GIVEN a Pause WHEN using account without pauser or ISBE role to unpause THEN fails', async function () {
            await deploy()

            pause = pause.connect(adminAccount)

            await expect(pause.unpause()).to.be.revertedWithCustomError(
                pause,
                'AccountHasNoRoles'
            )
        })
    })
})
