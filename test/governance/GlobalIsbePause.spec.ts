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
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import {
    GlobalIsbePauseFacet,
    ISBEPause,
    IIsbeFactory,
    Mod2PausableMock,
    NoPauseMock,
    FallbackRevertMock,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY,
    ISBE_PAUSER_ROLE,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'

// Function selectors — used to verify the `selector` field of PauseCallFailed
const PAUSE_SELECTOR = ethers.id('pause()').slice(0, 10) // 0x8456cb59
const UNPAUSE_SELECTOR = ethers.id('unpause()').slice(0, 10) // 0x3f4ba83a

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

    describe('GlobalIsbePausable', () => {
        describe('pauseIsbe', () => {
            // ─── Access control ───────────────────────────────────────────────
            it('GIVEN an account without ISBE_PAUSER_ROLE WHEN pauseIsbe is called THEN it reverts with AccountHasNoRole', async () => {
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

            it('GIVEN a zero address WHEN pauseIsbe is called THEN it reverts with AddressZero', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })

            // ─── InvalidProxy: EOA caught by onlyContract modifier ────────────
            it('GIVEN an EOA address WHEN pauseIsbe is called THEN it reverts with InvalidProxy', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(nonAdminAddress)
            })

            // ─── PauseCallFailed: unregistered contracts ──────────────────────
            // For any unregistered contract _execute wraps the failure in
            // PauseCallFailed(target, selector, returnData).
            // returnData is verified with anyValue since its encoding depends
            // on the target implementation.

            it('GIVEN a contract without pause() WHEN pauseIsbe is called THEN it reverts with PauseCallFailed', async () => {
                const noPauseMock: NoPauseMock = await (
                    await ethers.getContractFactory('NoPauseMock')
                ).deploy()
                const addr = await noPauseMock.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, PAUSE_SELECTOR, anyValue)
            })

            it('GIVEN the governance diamond (ISBEPause-compliant but unregistered) WHEN pauseIsbe is called on it THEN it reverts with PauseCallFailed', async () => {
                const govAddr = await isbeFactory.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(govAddr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(govAddr, PAUSE_SELECTOR, anyValue)
            })

            it('GIVEN a contract with a reverting fallback WHEN pauseIsbe is called THEN it reverts with PauseCallFailed', async () => {
                const fallbackMock: FallbackRevertMock = await (
                    await ethers.getContractFactory('FallbackRevertMock')
                ).deploy()
                const addr = await fallbackMock.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, PAUSE_SELECTOR, anyValue)
            })

            it('GIVEN a mod-2 contract not authorizing governance WHEN pauseIsbe is called THEN it reverts with PauseCallFailed', async () => {
                const mod2: Mod2PausableMock = await (
                    await ethers.getContractFactory('Mod2PausableMock')
                ).deploy(nonAdminAddress)
                const addr = await mod2.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, PAUSE_SELECTOR, anyValue)
            })

            it('GIVEN a paused mod-2 contract WHEN pauseIsbe is called again THEN it reverts with PauseCallFailed (not IsPaused)', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const mod2: Mod2PausableMock = await (
                    await ethers.getContractFactory('Mod2PausableMock')
                ).deploy(governanceAddress)
                const addr = await mod2.getAddress()

                await isbeFactory.connect(admin).pauseIsbe(addr)

                // mod-2 is unregistered: its IsPaused error is NOT bubbled,
                // it is wrapped in PauseCallFailed
                await expect(isbeFactory.connect(admin).pauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, PAUSE_SELECTOR, anyValue)
            })

            // ─── Bubbled error: registered proxy (mod-1) ──────────────────────
            // For registered proxies ISBEPause(addr).pause() is called directly:
            // the error bubbles as-is, no wrapping in PauseCallFailed.

            it('GIVEN a registered proxy that is already paused WHEN pauseIsbe is called THEN it bubbles IsPaused', async () => {
                const contracts = await loadFixture(deployPausedFixture)
                await expect(
                    contracts.isbeFactory
                        .connect(contracts.admin)
                        .pauseIsbe(contracts.deployedProxyAddress)
                ).to.be.revertedWithCustomError(contracts.pause, 'IsPaused')
            })

            // ─── Success ──────────────────────────────────────────────────────
            it('GIVEN a registered proxy WHEN pauseIsbe is called THEN it is paused and IsbePaused is emitted', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbePaused')
                    .withArgs(deployedProxyAddress, adminAddress)

                expect(await pause.paused()).to.be.true
            })

            it('GIVEN a mod-2 contract authorizing governance WHEN pauseIsbe is called THEN it is paused and IsbePaused is emitted', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const mod2: Mod2PausableMock = await (
                    await ethers.getContractFactory('Mod2PausableMock')
                ).deploy(governanceAddress)
                const addr = await mod2.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(addr))
                    .to.emit(isbeFactory, 'IsbePaused')
                    .withArgs(addr, adminAddress)

                expect(await mod2.paused()).to.be.true
            })

            // ─── State ────────────────────────────────────────────────────────
            it('GIVEN a registered proxy WHEN paused via pauseIsbe THEN authorityLevel equals ISBE_AUTHORIZATION_LEVEL', async () => {
                await isbeFactory.connect(admin).pauseIsbe(deployedProxyAddress)
                expect(await pause.authorityLevel()).to.equal(ethers.MaxUint256)
            })
        })

        describe('unpauseIsbe', () => {
            // ─── Access control ───────────────────────────────────────────────
            it('GIVEN an account without ISBE_PAUSER_ROLE WHEN unpauseIsbe is called THEN it reverts with AccountHasNoRole', async () => {
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

            it('GIVEN a zero address WHEN unpauseIsbe is called THEN it reverts with AddressZero', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })

            // ─── InvalidProxy: EOA ────────────────────────────────────────────
            it('GIVEN an EOA address WHEN unpauseIsbe is called THEN it reverts with InvalidProxy', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(nonAdminAddress)
            })

            // ─── PauseCallFailed: unregistered contracts ──────────────────────
            it('GIVEN a contract without unpause() WHEN unpauseIsbe is called THEN it reverts with PauseCallFailed', async () => {
                const noPauseMock: NoPauseMock = await (
                    await ethers.getContractFactory('NoPauseMock')
                ).deploy()
                const addr = await noPauseMock.getAddress()

                await expect(isbeFactory.connect(admin).unpauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, UNPAUSE_SELECTOR, anyValue)
            })

            it('GIVEN the governance diamond (unregistered) WHEN unpauseIsbe is called on it THEN it reverts with PauseCallFailed', async () => {
                const govAddr = await isbeFactory.getAddress()

                await expect(isbeFactory.connect(admin).unpauseIsbe(govAddr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(govAddr, UNPAUSE_SELECTOR, anyValue)
            })

            it('GIVEN a contract with a reverting fallback WHEN unpauseIsbe is called THEN it reverts with PauseCallFailed', async () => {
                const fallbackMock: FallbackRevertMock = await (
                    await ethers.getContractFactory('FallbackRevertMock')
                ).deploy()
                const addr = await fallbackMock.getAddress()

                await expect(isbeFactory.connect(admin).unpauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, UNPAUSE_SELECTOR, anyValue)
            })

            it('GIVEN an unpaused mod-2 contract WHEN unpauseIsbe is called THEN it reverts with PauseCallFailed', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const mod2: Mod2PausableMock = await (
                    await ethers.getContractFactory('Mod2PausableMock')
                ).deploy(governanceAddress)
                const addr = await mod2.getAddress()

                // mod-2 is unregistered: its IsNotPaused error is wrapped in PauseCallFailed
                await expect(isbeFactory.connect(admin).unpauseIsbe(addr))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'PauseCallFailed'
                    )
                    .withArgs(addr, UNPAUSE_SELECTOR, anyValue)
            })

            // ─── Bubbled error: registered proxy (mod-1) ──────────────────────
            it('GIVEN an unpaused registered proxy WHEN unpauseIsbe is called THEN it bubbles IsNotPaused', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(deployedProxyAddress)
                ).to.be.revertedWithCustomError(pause, 'IsNotPaused')
            })

            // ─── Success ──────────────────────────────────────────────────────
            it('GIVEN a paused registered proxy WHEN unpauseIsbe is called THEN it is unpaused and IsbeUnpaused is emitted', async () => {
                const contracts = await loadFixture(deployPausedFixture)

                await expect(
                    contracts.isbeFactory
                        .connect(contracts.admin)
                        .unpauseIsbe(contracts.deployedProxyAddress)
                )
                    .to.emit(contracts.isbeFactory, 'IsbeUnpaused')
                    .withArgs(
                        contracts.deployedProxyAddress,
                        contracts.adminAddress
                    )

                expect(await contracts.pause.paused()).to.be.false
            })

            it('GIVEN a paused mod-2 contract authorizing governance WHEN unpauseIsbe is called THEN it is unpaused and IsbeUnpaused is emitted', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const mod2: Mod2PausableMock = await (
                    await ethers.getContractFactory('Mod2PausableMock')
                ).deploy(governanceAddress)
                const addr = await mod2.getAddress()

                await isbeFactory.connect(admin).pauseIsbe(addr)
                expect(await mod2.paused()).to.be.true

                await expect(isbeFactory.connect(admin).unpauseIsbe(addr))
                    .to.emit(isbeFactory, 'IsbeUnpaused')
                    .withArgs(addr, adminAddress)

                expect(await mod2.paused()).to.be.false
            })

            // ─── State ────────────────────────────────────────────────────────
            it('GIVEN a paused registered proxy WHEN unpauseIsbe is called THEN authorityLevel resets to zero', async () => {
                const contracts = await loadFixture(deployPausedFixture)

                expect(await contracts.pause.authorityLevel()).to.equal(
                    ethers.MaxUint256
                )

                await contracts.isbeFactory
                    .connect(contracts.admin)
                    .unpauseIsbe(contracts.deployedProxyAddress)

                expect(await contracts.pause.authorityLevel()).to.equal(0)
            })

            // ─── NOTE: InsufficientAuthorityLevel es inalcanzable via unpauseIsbe ──
            // El factory siempre otorga _ISBE_ROLE al governance diamond en cada
            // proxy que despliega (ProxyFactoryInternal._buildIsbeRoleMembers).
            // Su authorityLevel = type(uint256).max satisface siempre
            // _checkAuthorityLevel. Este error solo puede surgir llamando
            // proxy.unpause() directamente desde una cuenta con PAUSER_ROLE
            // tras una pausa de mayor autoridad — fuera del scope de GlobalIsbePause.
        })
    })
})
