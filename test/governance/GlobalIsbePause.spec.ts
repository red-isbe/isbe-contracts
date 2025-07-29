import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    GlobalIsbePauseFacet,
    ISBEPause,
    IIsbeFactory,
} from '../../typechain-types'
import { Signer } from 'ethers'
import { ISBE_PAUSER_ROLE } from '../constants'
import { deployGovernance } from '../initialization'

describe('GlobalIsbePause', function () {
    let admin: Signer
    let adminAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let globalIsbePauseFacet: GlobalIsbePauseFacet
    let isbeFactory: IIsbeFactory
    let deployedProxyAddress: string
    let pause: ISBEPause

    async function deployInitial(init_pause: boolean = false) {
        ;[admin, nonAdmin] = await ethers.getSigners()
        adminAddress = await admin.getAddress()
        nonAdminAddress = await nonAdmin.getAddress()
        // Despliegue AccessControl logic

        await deployIsbeFactory(init_pause)
    }

    async function deployIsbeFactory(init_pause: boolean = false) {
        const result = await deployGovernance(admin, [], init_pause)

        isbeFactory = await ethers.getContractAt(
            'IIsbeFactory',
            await result.governanceContract.getAddress()
        )

        globalIsbePauseFacet = await ethers.getContractAt(
            'GlobalIsbePauseFacet',
            await result.governanceContract.getAddress()
        )

        deployedProxyAddress = result.useCaseProxy

        pause = result.pause
    }

    beforeEach(async () => {
        await deployInitial()
    })

    describe('GlboalIsbePauable', () => {
        describe('Global ISBE pausable', () => {
            it('GIVEN governance proxy WHEN try to pause without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .pauseIsbe(deployedProxyAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(nonAdminAddress, ISBE_PAUSER_ROLE)
            })
            it('GIVEN governance proxy WHEN try to unpause without right THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(nonAdmin)
                        .unpauseIsbe(deployedProxyAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'AccountHasNoRole'
                    )
                    .withArgs(nonAdminAddress, ISBE_PAUSER_ROLE)
            })

            it('GIVEN governance proxy WHEN try to pause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })
            it('GIVEN governance proxy WHEN try to unpause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })

            it('GIVEN governance proxy WHEN try to pause a non deployed proxy THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .pauseIsbe(await isbeFactory.getAddress())
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(await isbeFactory.getAddress())
            })
            it('GIVEN governance proxy WHEN try to unpause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory
                        .connect(admin)
                        .unpauseIsbe(await isbeFactory.getAddress())
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(await isbeFactory.getAddress())
            })
            // new
            it('GIVEN governance proxy WHEN try to pause a deployed proxy THEN it is paused', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbePaused')
                    .withArgs(deployedProxyAddress, adminAddress)
                expect(await pause.paused()).to.be.true
            })

            it('GIVEN governance proxy WHEN try to unpause a deployed proxy THEN it is unpaused', async () => {
                await deployInitial(true)

                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbeUnpaused')
                    .withArgs(deployedProxyAddress, adminAddress)
                expect(await pause.paused()).to.be.false
            })
        })
    })
})
