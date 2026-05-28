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
        describe('pauseIsbe', () => {
            // ─── Access control ──────────────────────────────────────────────
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

            it('GIVEN governance proxy WHEN try to pause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })

            // ─── InvalidProxy: EOA ────────────────────────────────────────────
            it('GIVEN an EOA address WHEN try to pause it THEN it fails with InvalidProxy', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(nonAdminAddress)
            })

            // ─── InvalidProxy: contract without pause() ───────────────────────
            it('GIVEN a contract without pause() WHEN try to pause it THEN it fails with InvalidProxy', async () => {
                const NoPauseMockFactory =
                    await ethers.getContractFactory('NoPauseMock')
                const noPauseMock: NoPauseMock =
                    await NoPauseMockFactory.deploy()
                const noPauseMockAddress = await noPauseMock.getAddress()

                await expect(
                    isbeFactory.connect(admin).pauseIsbe(noPauseMockAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(noPauseMockAddress)
            })

            // ─── InvalidProxy: ISBEPause contract not in registry ─────────────
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

            // ─── InvalidProxy: mod2 contract with wrong authorized pauser ─────
            it('GIVEN a mod2 contract authorized to a different pauser WHEN try to pause it THEN it fails with InvalidProxy', async () => {
                const Mod2Mock =
                    await ethers.getContractFactory('Mod2PausableMock')
                // nonAdminAddress as authorized pauser — governance diamond is NOT authorized
                const mod2: Mod2PausableMock =
                    await Mod2Mock.deploy(nonAdminAddress)
                const mod2Address = await mod2.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(mod2Address))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(mod2Address)
            })

            // ─── Bubbled error: registered proxy already paused ───────────────
            it('GIVEN a registered proxy that is already paused WHEN try to pause again THEN it bubbles IsPaused', async () => {
                const contracts = await loadFixture(deployPausedFixture)
                await expect(
                    contracts.isbeFactory
                        .connect(contracts.admin)
                        .pauseIsbe(contracts.deployedProxyAddress)
                ).to.be.revertedWithCustomError(contracts.pause, 'IsPaused')
            })

            // ─── Success: registered proxy (modality 1) ───────────────────────
            it('GIVEN governance proxy WHEN try to pause a deployed proxy THEN it is paused', async () => {
                await expect(
                    isbeFactory.connect(admin).pauseIsbe(deployedProxyAddress)
                )
                    .to.emit(isbeFactory, 'IsbePaused')
                    .withArgs(deployedProxyAddress, adminAddress)
                expect(await pause.paused()).to.be.true
            })

            // ─── Success: modality-2 standalone contract ───────────────────────
            it('GIVEN a mod2 contract authorized to governance WHEN paused THEN it is paused and event is emitted', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const Mod2Mock =
                    await ethers.getContractFactory('Mod2PausableMock')
                const mod2: Mod2PausableMock =
                    await Mod2Mock.deploy(governanceAddress)
                const mod2Address = await mod2.getAddress()

                await expect(isbeFactory.connect(admin).pauseIsbe(mod2Address))
                    .to.emit(isbeFactory, 'IsbePaused')
                    .withArgs(mod2Address, adminAddress)

                expect(await mod2.paused()).to.be.true
            })

            // ─── InvalidProxy: mod2 double-pause ─────────────────────────────
            // NOTE: for an UNREGISTERED (modality-2) contract, a double-pause
            // does NOT bubble `IsPaused` — it maps to `InvalidProxy` because
            // `!_isProxyDeployed` is true. Only registered (modality-1) proxies
            // have their internal errors re-bubbled.
            it('GIVEN a paused mod2 contract WHEN try to pause again THEN it fails with InvalidProxy (not IsPaused)', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const Mod2Mock =
                    await ethers.getContractFactory('Mod2PausableMock')
                const mod2: Mod2PausableMock =
                    await Mod2Mock.deploy(governanceAddress)
                const mod2Address = await mod2.getAddress()

                // First pause succeeds
                await isbeFactory.connect(admin).pauseIsbe(mod2Address)

                // Second pause: mod2 is not registered → error is mapped to InvalidProxy
                await expect(isbeFactory.connect(admin).pauseIsbe(mod2Address))
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(mod2Address)
            })

            // ─── InvalidProxy: contract with reverting fallback ───────────────
            // Exercises the `returnData.length > 0 && !_isProxyDeployed` branch
            // via a contract that is NOT ISBEPause-compliant but produces
            // non-empty revert data through its fallback.
            it('GIVEN a contract with a reverting fallback WHEN try to pause it THEN it fails with InvalidProxy', async () => {
                const FallbackMock =
                    await ethers.getContractFactory('FallbackRevertMock')
                const fallbackMock: FallbackRevertMock =
                    await FallbackMock.deploy()
                const fallbackMockAddress = await fallbackMock.getAddress()

                await expect(
                    isbeFactory.connect(admin).pauseIsbe(fallbackMockAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(fallbackMockAddress)
            })

            // ─── State: authorityLevel is set correctly after pause ───────────
            // The governance diamond holds _ISBE_ROLE on every proxy it deploys
            // (see ProxyFactoryInternal._buildIsbeRoleMembers), so its authority
            // level is always type(uint256).max.
            it('GIVEN a registered proxy WHEN paused via pauseIsbe THEN authorityLevel equals ISBE_AUTHORIZATION_LEVEL', async () => {
                await isbeFactory.connect(admin).pauseIsbe(deployedProxyAddress)
                expect(await pause.authorityLevel()).to.equal(ethers.MaxUint256)
            })
        })

        describe('unpauseIsbe', () => {
            // ─── Access control ──────────────────────────────────────────────
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

            it('GIVEN governance proxy WHEN try to unpause a zero address THEN it fails', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(
                    globalIsbePauseFacet,
                    'AddressZero'
                )
            })

            // ─── InvalidProxy: EOA ────────────────────────────────────────────
            it('GIVEN an EOA address WHEN try to unpause it THEN it fails with InvalidProxy', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(nonAdminAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(nonAdminAddress)
            })

            // ─── InvalidProxy: ISBEPause contract not in registry ─────────────
            it('GIVEN governance proxy WHEN try to unpause a non deployed proxy THEN it fails', async () => {
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

            // ─── InvalidProxy: mod2 already unpaused (no matching registered entry) ─
            it('GIVEN an unpaused mod2 contract WHEN try to unpause it THEN it fails with InvalidProxy', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const Mod2Mock =
                    await ethers.getContractFactory('Mod2PausableMock')
                const mod2: Mod2PausableMock =
                    await Mod2Mock.deploy(governanceAddress)
                const mod2Address = await mod2.getAddress()

                // mod2 starts unpaused — unpause() will revert with IsNotPaused (non-empty),
                // but since mod2 is not in the registry the catch maps it to InvalidProxy
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(mod2Address)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(mod2Address)
            })

            // ─── Bubbled error: registered proxy not paused ───────────────────
            it('GIVEN an unpaused registered proxy WHEN try to unpause it THEN it bubbles IsNotPaused', async () => {
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(deployedProxyAddress)
                ).to.be.revertedWithCustomError(pause, 'IsNotPaused')
            })

            // ─── Success: registered proxy (modality 1) ───────────────────────
            it('GIVEN governance proxy WHEN try to unpause a deployed proxy THEN it is unpaused', async () => {
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

            // ─── Success: modality-2 standalone contract ───────────────────────
            it('GIVEN a paused mod2 contract authorized to governance WHEN unpaused THEN it is unpaused and event is emitted', async () => {
                const governanceAddress = await isbeFactory.getAddress()
                const Mod2Mock =
                    await ethers.getContractFactory('Mod2PausableMock')
                const mod2: Mod2PausableMock =
                    await Mod2Mock.deploy(governanceAddress)
                const mod2Address = await mod2.getAddress()

                // First pause via governance
                await isbeFactory.connect(admin).pauseIsbe(mod2Address)
                expect(await mod2.paused()).to.be.true

                // Now unpause via governance
                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(mod2Address)
                )
                    .to.emit(isbeFactory, 'IsbeUnpaused')
                    .withArgs(mod2Address, adminAddress)

                expect(await mod2.paused()).to.be.false
            })

            // ─── InvalidProxy: contract with reverting fallback ───────────────
            it('GIVEN a contract with a reverting fallback WHEN try to unpause it THEN it fails with InvalidProxy', async () => {
                const FallbackMock =
                    await ethers.getContractFactory('FallbackRevertMock')
                const fallbackMock: FallbackRevertMock =
                    await FallbackMock.deploy()
                const fallbackMockAddress = await fallbackMock.getAddress()

                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(fallbackMockAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(fallbackMockAddress)
            })

            // ─── InvalidProxy: NoPauseMock (returnData empty on unpause) ─────
            it('GIVEN a contract without unpause() WHEN try to unpause it THEN it fails with InvalidProxy', async () => {
                const NoPauseMockFactory =
                    await ethers.getContractFactory('NoPauseMock')
                const noPauseMock: NoPauseMock =
                    await NoPauseMockFactory.deploy()
                const noPauseMockAddress = await noPauseMock.getAddress()

                await expect(
                    isbeFactory.connect(admin).unpauseIsbe(noPauseMockAddress)
                )
                    .to.be.revertedWithCustomError(
                        globalIsbePauseFacet,
                        'InvalidProxy'
                    )
                    .withArgs(noPauseMockAddress)
            })

            // ─── State: authorityLevel resets to 0 after unpause ─────────────
            it('GIVEN a paused registered proxy WHEN unpaused via unpauseIsbe THEN authorityLevel resets to zero', async () => {
                const contracts = await loadFixture(deployPausedFixture)

                // Before unpause: authority level should be ISBE_AUTHORIZATION_LEVEL (max)
                // because governance (which has _ISBE_ROLE on every proxy it deploys)
                // performed the initialization pause.
                expect(await contracts.pause.authorityLevel()).to.equal(
                    ethers.MaxUint256
                )

                await contracts.isbeFactory
                    .connect(contracts.admin)
                    .unpauseIsbe(contracts.deployedProxyAddress)

                expect(await contracts.pause.authorityLevel()).to.equal(0)
            })

            // ─── NOTE: InsufficientAuthorityLevel is unreachable via unpauseIsbe ─
            // The governance diamond always holds `_ISBE_ROLE` on every proxy it
            // deploys (ProxyFactoryInternal._buildIsbeRoleMembers). Its authority
            // level on any registered proxy is therefore `type(uint256).max`, which
            // always satisfies `_checkAuthorityLevel`. This error can only be
            // triggered by calling `proxy.unpause()` directly from an address that
            // holds only `PAUSER_ROLE` after a higher-authority pause — it is out of
            // scope for `GlobalIsbePause` and is covered in the `Pause` unit tests.
        })
    })
})
