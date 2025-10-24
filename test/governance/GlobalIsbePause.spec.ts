import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {
    GlobalIsbePauseFacet,
    ISBEPause,
    IIsbeFactory,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY,
    ISBE_PAUSER_ROLE,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'

describe('GlobalIsbePause', function () {
    let admin: Signer
    let adminAddress: string
    let nonAdmin: Signer
    let nonAdminAddress: string
    let globalIsbePauseFacet: GlobalIsbePauseFacet
    let isbeFactory: IIsbeFactory
    let deployedProxyAddress: string
    let pause: ISBEPause

    async function deployFixture(init_pause: boolean = false) {
        const [adminSigner, nonAdminSigner] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()
        const nonAdminAddress = await nonAdminSigner.getAddress()

        const result = await deployGovernance(
            adminSigner,
            [],
            undefined,
            init_pause
        )

        const isbeFactoryInstance = await ethers.getContractAt(
            'IIsbeFactory',
            await result.governanceContract.getAddress()
        )

        const globalIsbePauseFacetInstance = await ethers.getContractAt(
            'GlobalIsbePauseFacet',
            await result.governanceContract.getAddress()
        )

        expect(
            await result.globalIsbePauseFacet.businessIdIntrospection()
        ).to.be.equal(GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY)

        return {
            admin: adminSigner,
            nonAdmin: nonAdminSigner,
            adminAddress,
            nonAdminAddress,
            isbeFactory: isbeFactoryInstance,
            globalIsbePauseFacet: globalIsbePauseFacetInstance,
            deployedProxyAddress: result.useCaseProxy,
            pause: result.pause,
        }
    }

    async function deployPausedFixture() {
        return deployFixture(true)
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        admin = contracts.admin
        nonAdmin = contracts.nonAdmin
        adminAddress = contracts.adminAddress
        nonAdminAddress = contracts.nonAdminAddress
        isbeFactory = contracts.isbeFactory
        globalIsbePauseFacet = contracts.globalIsbePauseFacet
        deployedProxyAddress = contracts.deployedProxyAddress
        pause = contracts.pause
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
                const contracts = await loadFixture(deployPausedFixture)
                const pausedIsbeFactory = contracts.isbeFactory
                const pausedDeployedProxyAddress =
                    contracts.deployedProxyAddress
                const pausedAdminAddress = contracts.adminAddress
                const pausedPause = contracts.pause
                const pausedAdmin = contracts.admin

                await expect(
                    pausedIsbeFactory
                        .connect(pausedAdmin)
                        .unpauseIsbe(pausedDeployedProxyAddress)
                )
                    .to.emit(pausedIsbeFactory, 'IsbeUnpaused')
                    .withArgs(pausedDeployedProxyAddress, pausedAdminAddress)
                expect(await pausedPause.paused()).to.be.false
            })
        })
    })
})
