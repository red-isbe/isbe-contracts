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
import { ethers, network } from 'hardhat'
import { Signer, HDNodeWallet } from 'ethers'
import {
    AccessControl,
    ERC20,
    ERC203643Capped,
    ERC203643CappedSigned,
    ERC203643TransferSigned,
    ERC20BurnableSigned,
    IAccessControlDid,
    IDidRegistry__factory,
    Pause,
} from '../typechain-types'
import {
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    ERC20_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    DID_REGISTRY_ROLE,
    WHITELIST_ROLE,
    SPONSOR_ROLE,
    PAUSER_ROLE,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { EllipticType } from './types/identity'
import { config } from 'hardhat'

describe('ERC20', function () {
    const decimals = 2
    const name = 'ISBE stable token'
    const symbol = 'isbe'

    let erc20Facet: ERC20

    let erc20: ERC20
    let erc20Capped: ERC203643Capped
    let erc203643TransferSigned: ERC203643TransferSigned
    let accessControl: AccessControl
    let pause: Pause

    let owner: Signer
    let ownerAddress: string
    let otherAccount: Signer
    let otherAccountAddress: string

    async function deployFixture() {
        ;[owner, otherAccount] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()

        const result = await deployGovernance(owner)

        const contracts = {
            erc20: result.erc20,
            erc20Snapshot: result.erc20Snapshot,
            erc20Burnable: result.erc20Burnable,
            erc20Capped: result.erc203643Capped,
            erc20Controller: result.erc203643Controller,
            erc203643TransferSigned: result.erc203643TransferSigned,
            accessControl: result.accessControl,
            pause: result.pause,
            erc20Facet: result.erc20Facet,
            owner,
            ownerAddress,
            otherAccount,
            otherAccountAddress,
        }

        expect(await result.erc20Facet.businessIdIntrospection()).to.equal(
            ERC20_RESOLVER_KEY
        )

        return contracts
    }

    async function deployInitializedFixture() {
        const [ownerSigner, otherAccountSigner] = await ethers.getSigners()
        const ownerAddress = await ownerSigner.getAddress()
        const otherAccountAddress = await otherAccountSigner.getAddress()

        const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
        const CappedFactory = await ethers.getContractFactory(
            'ERC203643CappedFacet'
        )

        const businessIds = [ERC20_RESOLVER_KEY, ERC203643_CAPPED_RESOLVER_KEY]
        const data = [
            ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                name,
                symbol,
                decimals,
            ]),
            CappedFactory.interface.encodeFunctionData('initializeCap', [1000]),
        ]

        // Single deployGovernance call with initialization
        const result = await deployGovernance(
            ownerSigner,
            [],
            undefined,
            false,
            '0x',
            businessIds,
            data
        )

        expect(await result.erc20Facet.businessIdIntrospection()).to.equal(
            ERC20_RESOLVER_KEY
        )

        return {
            erc20: result.erc20,
            erc20Snapshot: result.erc20Snapshot,
            erc20Burnable: result.erc20Burnable,
            erc20Capped: result.erc203643Capped,
            erc20Controller: result.erc203643Controller,
            accessControl: result.accessControl,
            erc20Facet: result.erc20Facet,
            owner: ownerSigner,
            ownerAddress,
            otherAccount: otherAccountSigner,
            otherAccountAddress,
        }
    }

    async function deployPausedFixture() {
        const [ownerSigner, otherAccountSigner] = await ethers.getSigners()
        const ownerAddress = await ownerSigner.getAddress()
        const otherAccountAddress = await otherAccountSigner.getAddress()

        const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
        const CappedFactory = await ethers.getContractFactory(
            'ERC203643CappedFacet'
        )

        const businessIds = [ERC20_RESOLVER_KEY, ERC203643_CAPPED_RESOLVER_KEY]
        const data = [
            ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                name,
                symbol,
                decimals,
            ]),
            CappedFactory.interface.encodeFunctionData('initializeCap', [1000]),
        ]

        // Single deployGovernance call with paused initialization
        const result = await deployGovernance(
            ownerSigner,
            [],
            undefined,
            true, // init_pause = true
            '0x',
            businessIds,
            data
        )

        expect(await result.erc20Facet.businessIdIntrospection()).to.equal(
            ERC20_RESOLVER_KEY
        )

        return {
            erc20: result.erc20,
            erc20Snapshot: result.erc20Snapshot,
            erc20Burnable: result.erc20Burnable,
            erc20Capped: result.erc203643Capped,
            erc20Controller: result.erc203643Controller,
            accessControl: result.accessControl,
            erc20Facet: result.erc20Facet,
            owner: ownerSigner,
            ownerAddress,
            otherAccount: otherAccountSigner,
            otherAccountAddress,
        }
    }

    async function deployPreparedTokensFixture() {
        const [ownerSigner, otherAccountSigner] = await ethers.getSigners()
        const ownerAddress = await ownerSigner.getAddress()
        const otherAccountAddress = await otherAccountSigner.getAddress()

        const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
        const CappedFactory = await ethers.getContractFactory(
            'ERC203643CappedFacet'
        )

        const businessIds = [ERC20_RESOLVER_KEY, ERC203643_CAPPED_RESOLVER_KEY]
        const data = [
            ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                name,
                symbol,
                decimals,
            ]),
            CappedFactory.interface.encodeFunctionData('initializeCap', [1000]),
        ]

        // Single deployGovernance call with initialization
        const result = await deployGovernance(
            ownerSigner,
            [],
            undefined,
            false,
            '0x',
            businessIds,
            data
        )

        expect(await result.erc20Facet.businessIdIntrospection()).to.equal(
            ERC20_RESOLVER_KEY
        )

        // Grant necessary roles
        await result.accessControl.grantRole(MINTER_ROLE, ownerAddress)
        await result.accessControl.grantRole(CAP_ROLE, ownerAddress)
        await result.accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)
        await result.accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

        return {
            erc20: result.erc20,
            erc20Snapshot: result.erc20Snapshot,
            erc20Burnable: result.erc20Burnable,
            erc20Capped: result.erc203643Capped,
            erc20Controller: result.erc203643Controller,
            erc203645TransferSigned: result.erc203645TransferSigned,
            accessControl: result.accessControl,
            erc20Facet: result.erc20Facet,
            owner: ownerSigner,
            ownerAddress,
            otherAccount: otherAccountSigner,
            otherAccountAddress,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        erc20 = contracts.erc20
        erc20Capped = contracts.erc20Capped
        erc20Facet = contracts.erc20Facet
        erc203643TransferSigned = contracts.erc203643TransferSigned
        accessControl = contracts.accessControl
        pause = contracts.pause
        owner = contracts.owner
        ownerAddress = contracts.ownerAddress
        otherAccount = contracts.otherAccount
        otherAccountAddress = contracts.otherAccountAddress
    })

    describe('Deployment', () => {
        it('GIVEN an ERC20 WHEN it is deployed THEN the business logic is not possible to be initialized', async () => {
            await expect(erc20Facet.initializeErc20(name, symbol, decimals))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(ERC20_RESOLVER_KEY, ethers.MaxUint256, 1)
        })

        it('GIVEN an ERC20 WHEN it is deployed THEN name, symbol and decimals can be retrieved', async () => {
            await expect(erc20.initializeErc20(name, symbol, decimals))
                .to.emit(erc20, 'Erc20Initialized')
                .withArgs(name, symbol, decimals)

            expect(await erc20.decimals()).to.equal(decimals)
            expect(await erc20.name()).to.equal(name)
            expect(await erc20.symbol()).to.equal(symbol)

            expect(await erc20.totalSupply()).to.equal(0)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.allowance(ownerAddress, ownerAddress)).to.equal(
                0
            )
        })

        it('GIVEN a initialized ERC20 WHEN it try to initialize twice THEN it fails', async () => {
            const { erc20: initializedErc20 } = await loadFixture(
                deployInitializedFixture
            )
            await expect(
                initializedErc20.initializeErc20(name, symbol, decimals)
            )
                .to.be.revertedWithCustomError(
                    initializedErc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(ERC20_RESOLVER_KEY, 1, 1)
        })

        it('GIVEN an ERC20 WHEN initialize with empty name THEN it fails', async () => {
            await expect(
                erc20.initializeErc20('', symbol, decimals)
            ).to.be.revertedWithCustomError(erc20, 'EmptyString')
        })

        it('GIVEN an ERC20 WHEN initialize with empty symbol THEN it fails', async () => {
            await expect(
                erc20.initializeErc20(name, '', decimals)
            ).to.be.revertedWithCustomError(erc20, 'EmptyString')
        })
    })

    describe('Allowance', () => {
        it('GIVEN an initialized ERC20 WHEN approve to zero address THEN fails', async () => {
            const { erc20: initializedErc20 } = await loadFixture(
                deployInitializedFixture
            )
            await expect(
                initializedErc20.approve(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(initializedErc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN approve on a paused THEN fails', async () => {
            const { erc20: pausedErc20, ownerAddress: pausedOwnerAddress } =
                await loadFixture(deployPausedFixture)

            await expect(
                pausedErc20.approve(pausedOwnerAddress, 100)
            ).to.be.revertedWithCustomError(pausedErc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN increase Allowance on a paused THEN fails', async () => {
            const { erc20: pausedErc20, ownerAddress: pausedOwnerAddress } =
                await loadFixture(deployPausedFixture)

            await expect(
                pausedErc20.increaseAllowance(pausedOwnerAddress, 100)
            ).to.be.revertedWithCustomError(pausedErc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN decrease Allowance on a paused THEN fails', async () => {
            const { erc20: pausedErc20, ownerAddress: pausedOwnerAddress } =
                await loadFixture(deployPausedFixture)

            await expect(
                pausedErc20.decreaseAllowance(pausedOwnerAddress, 1)
            ).to.be.revertedWithCustomError(pausedErc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN an allowance can be set', async () => {
            const contracts = await loadFixture(deployInitializedFixture)
            await expect(
                contracts.erc20.approve(contracts.otherAccountAddress, 100)
            )
                .to.emit(contracts.erc20, 'Approval')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    100
                )

            expect(
                await contracts.erc20.allowance(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress
                )
            ).to.equal(100)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.equal(0)
            expect(await contracts.erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can increase allowance', async () => {
            const contracts = await loadFixture(deployInitializedFixture)
            await expect(
                contracts.erc20.increaseAllowance(
                    contracts.otherAccountAddress,
                    100
                )
            )
                .to.emit(contracts.erc20, 'Approval')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    100
                )

            expect(
                await contracts.erc20.allowance(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress
                )
            ).to.equal(100)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.equal(0)
            expect(await contracts.erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can decrease allowance', async () => {
            const contracts = await loadFixture(deployInitializedFixture)
            await contracts.erc20.approve(contracts.otherAccountAddress, 200)
            await expect(
                contracts.erc20.decreaseAllowance(
                    contracts.otherAccountAddress,
                    100
                )
            )
                .to.emit(contracts.erc20, 'Approval')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    100
                )

            expect(
                await contracts.erc20.allowance(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress
                )
            ).to.equal(100)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.equal(0)
            expect(await contracts.erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN cannot decrease allowance to less than 0', async () => {
            const contracts = await loadFixture(deployInitializedFixture)
            expect(contracts.owner).not.to.be.undefined
            await contracts.erc20.approve(contracts.otherAccountAddress, 100)
            await expect(
                contracts.erc20.decreaseAllowance(
                    contracts.otherAccountAddress,
                    101
                )
            ).to.be.revertedWithCustomError(
                contracts.erc20,
                'DecreasedAllowanceBellowZero'
            )
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN non-whitelisted owner approves THEN it fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist without adding owner
                await basicWhitelist.enableWhitelist()

                await expect(
                    contracts.erc20.approve(contracts.otherAccountAddress, 100)
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.ownerAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN approving non-whitelisted spender THEN it fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add owner but not spender
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20.approve(contracts.otherAccountAddress, 100)
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN increaseAllowance from non-whitelisted owner THEN it fails', async () => {
                const contracts = await loadFixture(deployInitializedFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist but don't add owner (sender)
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.increaseAllowance(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.ownerAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN increaseAllowance to non-whitelisted spender THEN it fails', async () => {
                const contracts = await loadFixture(deployInitializedFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add owner but not spender
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20.increaseAllowance(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN decreaseAllowance from non-whitelisted owner THEN it fails', async () => {
                const contracts = await loadFixture(deployInitializedFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // First approve with whitelist enabled and both whitelisted
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await contracts.erc20.approve(
                    contracts.otherAccountAddress,
                    200
                )

                // Now remove owner from whitelist
                await basicWhitelist.removeFromWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20.decreaseAllowance(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.ownerAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN decreaseAllowance to non-whitelisted spender THEN it fails', async () => {
                const contracts = await loadFixture(deployInitializedFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // First approve with whitelist enabled and both whitelisted
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await contracts.erc20.approve(
                    contracts.otherAccountAddress,
                    200
                )

                // Now remove spender from whitelist
                await basicWhitelist.removeFromWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.decreaseAllowance(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })
        })
    })

    describe('Cap', () => {
        it('GIVEN an ERC20 WHEN initializeCap with Zero THEN it fails', async () => {
            await expect(
                erc20Capped.initializeCap(0)
            ).to.be.revertedWithCustomError(erc20Capped, 'EmptyUint')
        })

        it('GIVEN an ERC20 WHEN cap is initialized THEN it can be retrieved', async () => {
            await expect(erc20Capped.initializeCap(1000))
                .to.emit(erc20Capped, 'CapSet')
                .withArgs(ownerAddress, 1000)
            await expect(erc20Capped.initializeCap(1))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(ERC203643_CAPPED_RESOLVER_KEY, 1, 1)

            expect(await erc20Capped.cap()).to.equal(1000)
        })

        it('GIVEN an initialized ERC20 WHEN mint over cap THEN it fails', async () => {
            const {
                erc20Capped: initializedErc20Capped,
                ownerAddress: initOwnerAddress,
            } = await loadFixture(deployInitializedFixture)
            expect(await initializedErc20Capped.cap()).to.equal(1000)
            await expect(
                initializedErc20Capped.mint(initOwnerAddress, 1001)
            ).to.be.revertedWithCustomError(
                initializedErc20Capped,
                'CapExceeded'
            )
        })

        it('GIVEN an initialized ERC20 WHEN setting cap below total supply THEN it fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            const totalSupply = 10

            await contracts.erc20Capped.mint(
                contracts.ownerAddress,
                totalSupply
            )

            const newCap = totalSupply - 1

            await expect(contracts.erc20Capped.setCap(newCap))
                .to.be.revertedWithCustomError(
                    contracts.erc20Capped,
                    'NewCapIsLessThanTotalSupply'
                )
                .withArgs(newCap, totalSupply)
        })

        it('GIVEN an initialized ERC20 WHEN setting cap on a paused token THEN it fails', async () => {
            const contracts = await loadFixture(deployPausedFixture)

            await expect(
                contracts.erc20Capped.setCap(1000000)
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non capper setting cap THEN it fails', async () => {
            const contracts = await loadFixture(deployInitializedFixture)

            await expect(
                contracts.erc20Capped.setCap(1)
            ).to.be.revertedWithCustomError(
                contracts.accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an initialized ERC20 WHEN setting cap over total supply THEN it succeeds', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            const totalSupply = 10

            await contracts.erc20Capped.mint(
                contracts.ownerAddress,
                totalSupply
            )

            const newCap = totalSupply + 1

            await expect(contracts.erc20Capped.setCap(newCap))
                .to.emit(contracts.erc20Capped, 'CapSet')
                .withArgs(contracts.ownerAddress, newCap)
        })
    })

    describe('Mint', () => {
        it('GIVEN an initialized ERC20 WHEN mint to zero address THEN fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.mint(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN mint a paused token THEN fails', async () => {
            const contracts = await loadFixture(deployPausedFixture)

            await expect(
                contracts.erc20Capped.mint(contracts.ownerAddress, 100)
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non MINTER mints THEN it fails', async () => {
            const contracts = await loadFixture(deployInitializedFixture)

            await expect(
                contracts.erc20Capped.mint(contracts.ownerAddress, 0)
            ).to.be.revertedWithCustomError(
                contracts.accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN mint can be made', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.mint(contracts.ownerAddress, 100)
            )
                .to.emit(contracts.erc20Capped, 'Transfer')
                .withArgs(ethers.ZeroAddress, contracts.ownerAddress, 100)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN minting to non-whitelisted recipient THEN it fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist
                await basicWhitelist.enableWhitelist()

                await expect(
                    contracts.erc20Capped.mint(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN minting to whitelisted recipient THEN it succeeds', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add recipient
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20Capped.mint(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        ethers.ZeroAddress,
                        contracts.otherAccountAddress,
                        100
                    )
            })

            it('GIVEN an ERC20 with whitelist disabled WHEN minting to non-whitelisted recipient THEN it succeeds', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Disable whitelist if it was enabled
                if (await basicWhitelist.isWhitelistEnabled()) {
                    await basicWhitelist.disableWhitelist()
                }

                await expect(
                    contracts.erc20Capped.mint(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        ethers.ZeroAddress,
                        contracts.otherAccountAddress,
                        100
                    )
            })

            it('GIVEN an ERC20 with whitelisted recipient WHEN removed from whitelist THEN mint fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist, add recipient, then remove
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.removeFromWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20Capped.mint(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with removed recipient WHEN re-added to whitelist THEN mint succeeds', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist, add, remove, then re-add recipient
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.removeFromWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20Capped.mint(
                        contracts.otherAccountAddress,
                        100
                    )
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        ethers.ZeroAddress,
                        contracts.otherAccountAddress,
                        100
                    )
            })
        })
    })

    describe('BatchMint', () => {
        it('GIVEN an initialized ERC20 WHEN non MINTER tries batchMint THEN it fails', async () => {
            const contracts = await loadFixture(deployInitializedFixture)

            await expect(
                contracts.erc20Capped.batchMint([contracts.ownerAddress], [100])
            ).to.be.revertedWithCustomError(
                contracts.accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an initialized ERC20 WHEN batchMint on paused token THEN it fails', async () => {
            const contracts = await loadFixture(deployPausedFixture)

            await expect(
                contracts.erc20Capped.batchMint([contracts.ownerAddress], [100])
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN arrays have different lengths THEN it fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.batchMint(
                    [contracts.ownerAddress, contracts.otherAccountAddress],
                    [100]
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'NotSameLength')
        })

        it('GIVEN an initialized ERC20 WHEN batchMint exceeds cap THEN it fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.batchMint(
                    [contracts.ownerAddress, contracts.otherAccountAddress],
                    [600, 600]
                )
            ).to.be.revertedWithCustomError(
                contracts.erc20Capped,
                'CapExceeded'
            )
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN batchMint with empty arrays succeeds', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            const initialSupply = await contracts.erc20.totalSupply()

            await expect(contracts.erc20Capped.batchMint([], [])).to.not.be
                .reverted

            expect(await contracts.erc20.totalSupply()).to.equal(initialSupply)
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN batchMint to multiple addresses succeeds', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            const recipients = [
                contracts.ownerAddress,
                contracts.otherAccountAddress,
            ]
            const amounts = [100, 200]

            await expect(contracts.erc20Capped.batchMint(recipients, amounts))
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, recipients[0], amounts[0])
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, recipients[1], amounts[1])

            expect(await contracts.erc20.totalSupply()).to.equal(300)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.equal(100)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.equal(200)
        })

        it('GIVEN an ERC20 WHEN batchMint to single address THEN it succeeds', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.batchMint([contracts.ownerAddress], [150])
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, contracts.ownerAddress, 150)

            expect(await contracts.erc20.totalSupply()).to.equal(150)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.equal(150)
        })

        it('GIVEN an ERC20 WHEN batchMint with exact cap THEN it succeeds', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.batchMint(
                    [contracts.ownerAddress, contracts.otherAccountAddress],
                    [400, 600]
                )
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, contracts.ownerAddress, 400)
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(
                    ethers.ZeroAddress,
                    contracts.otherAccountAddress,
                    600
                )

            expect(await contracts.erc20.totalSupply()).to.equal(1000)
            expect(await contracts.erc20Capped.cap()).to.equal(1000)
        })

        it('GIVEN an ERC20 WHEN batchMint with zero amounts THEN it succeeds', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            await expect(
                contracts.erc20Capped.batchMint([contracts.ownerAddress], [0])
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, contracts.ownerAddress, 0)

            expect(await contracts.erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN batchMint after partial supply THEN it respects remaining cap', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)

            // Mint 300 first
            await contracts.erc20Capped.mint(contracts.ownerAddress, 300)

            // Batch mint remaining 700
            await expect(
                contracts.erc20Capped.batchMint(
                    [contracts.ownerAddress, contracts.otherAccountAddress],
                    [400, 300]
                )
            ).to.not.be.reverted

            expect(await contracts.erc20.totalSupply()).to.equal(1000)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN batchMinting to non-whitelisted recipient THEN it fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist
                await basicWhitelist.enableWhitelist()

                await expect(
                    contracts.erc20Capped.batchMint(
                        [contracts.otherAccountAddress],
                        [100]
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelistedInBatch'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN batchMinting to whitelisted recipients THEN it succeeds', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add recipients
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20Capped.batchMint(
                        [contracts.ownerAddress, contracts.otherAccountAddress],
                        [100, 200]
                    )
                ).to.not.be.reverted

                expect(await contracts.erc20.totalSupply()).to.equal(300)
            })
        })
    })

    describe('Burn', () => {
        async function deployWithTokensFixture() {
            const contracts = await deployPreparedTokensFixture()
            await contracts.erc20Capped.mint(contracts.ownerAddress, 100)
            return contracts
        }

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            const contracts = await loadFixture(deployInitializedFixture)
            await expect(
                contracts.erc20Burnable.burn(100)
            ).to.be.revertedWithCustomError(
                contracts.erc20,
                'BurnAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to burn a paused token THEN it fails', async () => {
            const contracts = await loadFixture(deployPausedFixture)

            await expect(
                contracts.erc20Burnable.burn(0)
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            const contracts = await loadFixture(deployWithTokensFixture)
            await expect(contracts.erc20Burnable.burn(100))
                .to.emit(contracts.erc20Burnable, 'Transfer')
                .withArgs(contracts.ownerAddress, ethers.ZeroAddress, 100)

            expect(await contracts.erc20.totalSupply()).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(0)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN burn from non-whitelisted address THEN it fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                // Grant whitelist role and enable whitelist
                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )
                await basicWhitelist.enableWhitelist()

                // Add otherAccount to whitelist to allow minting
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                // Mint tokens to otherAccount (owner is whitelisted by default)
                await contracts.erc20Capped.mint(
                    contracts.otherAccountAddress,
                    100
                )

                // Remove otherAccount from whitelist
                await basicWhitelist.removeFromWhitelist(
                    contracts.otherAccountAddress
                )

                // Try to burn from non-whitelisted address (burn only takes amount)
                await expect(
                    contracts.erc20Burnable
                        .connect(contracts.otherAccount)
                        .burn(50)
                ).to.be.revertedWithCustomError(
                    basicWhitelist,
                    'NotWhitelisted'
                )
            })
        })
    })

    describe('BurnFrom', () => {
        const prepare = async (init_pause: boolean = false) => {
            const contracts = init_pause
                ? await loadFixture(deployPausedFixture)
                : await loadFixture(deployPreparedTokensFixture)

            if (init_pause) return contracts

            await contracts.erc20Capped.mint(contracts.otherAccountAddress, 50)
            await contracts.erc20
                .connect(contracts.otherAccount)
                .approve(contracts.ownerAddress, 100)
            return contracts
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            await expect(
                contracts.erc20Burnable.burnFrom(ethers.ZeroAddress, 0)
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Burnable.burnFrom(
                    contracts.otherAccountAddress,
                    100
                )
            ).to.be.revertedWithCustomError(
                contracts.erc20,
                'BurnAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to burn a paused token THEN it fails', async () => {
            const contracts = await prepare(true)

            await expect(
                contracts.erc20Burnable.burnFrom(
                    contracts.otherAccountAddress,
                    0
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Burnable.burnFrom(
                    contracts.otherAccountAddress,
                    25
                )
            )
                .to.emit(contracts.erc20Burnable, 'Transfer')
                .withArgs(contracts.otherAccountAddress, ethers.ZeroAddress, 25)
                .to.emit(contracts.erc20Burnable, 'Approval')
                .withArgs(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    75
                )

            expect(await contracts.erc20.totalSupply()).to.be.equal(25)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(25)
            expect(
                await contracts.erc20.allowance(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress
                )
            ).to.be.equal(75)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN burnFrom from non-whitelisted address THEN it fails', async () => {
                const contracts = await loadFixture(deployPreparedTokensFixture)
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                // Grant whitelist role
                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Mint tokens to otherAccount first (no whitelist active yet)
                await contracts.erc20Capped.mint(
                    contracts.otherAccountAddress,
                    100
                )

                // otherAccount approves owner to burn
                await contracts.erc20
                    .connect(contracts.otherAccount)
                    .approve(contracts.ownerAddress, 100)

                // Enable whitelist (owner is automatically whitelisted, otherAccount is not)
                await basicWhitelist.enableWhitelist()

                // Try to burnFrom with non-whitelisted target address
                await expect(
                    contracts.erc20Burnable.burnFrom(
                        contracts.otherAccountAddress,
                        50
                    )
                ).to.be.revertedWithCustomError(
                    basicWhitelist,
                    'NotWhitelisted'
                )
            })
        })
    })

    describe('Transfer', () => {
        const prepare = async (init_pause: boolean = false) => {
            const contracts = init_pause
                ? await loadFixture(deployPausedFixture)
                : await loadFixture(deployPreparedTokensFixture)

            if (init_pause) return contracts

            await contracts.erc20Capped.mint(contracts.ownerAddress, 100)
            return contracts
        }

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough balance THEN it fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            await expect(
                contracts.erc20.transfer(contracts.ownerAddress, 100)
            ).to.be.revertedWithCustomError(
                contracts.erc20,
                'TransferAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer from a paused token THEN it fails', async () => {
            const contracts = await loadFixture(deployPausedFixture)

            await expect(
                contracts.erc20.transfer(contracts.ownerAddress, 0)
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.transfer(contracts.otherAccountAddress, 100)
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    100
                )

            expect(await contracts.erc20.totalSupply()).to.be.equal(100)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(100)
            expect(
                await contracts.erc20.allowance(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress
                )
            ).to.be.equal(0)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN non-whitelisted sender transfers THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist but don't add owner
                await basicWhitelist.enableWhitelist()

                await expect(
                    contracts.erc20.transfer(contracts.otherAccountAddress, 50)
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.ownerAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN transferring to non-whitelisted recipient THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20.transfer(contracts.otherAccountAddress, 50)
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN transferring to whitelisted recipient THEN it succeeds', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add recipient
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.transfer(contracts.otherAccountAddress, 50)
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        contracts.ownerAddress,
                        contracts.otherAccountAddress,
                        50
                    )
            })

            it('GIVEN an ERC20 with whitelist disabled WHEN transferring to non-whitelisted recipient THEN it succeeds', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Disable whitelist if it was enabled
                if (await basicWhitelist.isWhitelistEnabled()) {
                    await basicWhitelist.disableWhitelist()
                }

                await expect(
                    contracts.erc20.transfer(contracts.otherAccountAddress, 50)
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        contracts.ownerAddress,
                        contracts.otherAccountAddress,
                        50
                    )
            })

            it('GIVEN an ERC20 with whitelisted recipient WHEN removed from whitelist THEN transfer fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist, add recipient, then remove
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.removeFromWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.transfer(contracts.otherAccountAddress, 50)
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with removed recipient WHEN re-added to whitelist THEN transfer succeeds', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist, add, remove, then re-add recipient
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.removeFromWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.transfer(contracts.otherAccountAddress, 50)
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        contracts.ownerAddress,
                        contracts.otherAccountAddress,
                        50
                    )
            })
        })
    })

    describe('TransferFrom', () => {
        const prepare = async (init_pause: boolean = false) => {
            const contracts = init_pause
                ? await loadFixture(deployPausedFixture)
                : await loadFixture(deployPreparedTokensFixture)

            if (init_pause) return contracts

            await contracts.erc20Capped.mint(contracts.ownerAddress, 100)
            await contracts.erc20Capped.mint(contracts.otherAccountAddress, 100)
            await contracts.erc20
                .connect(contracts.otherAccount)
                .approve(contracts.ownerAddress, 100)
            return contracts
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.transferFrom(
                    ethers.ZeroAddress,
                    contracts.otherAccountAddress,
                    0
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
            await expect(
                contracts.erc20.transferFrom(
                    contracts.ownerAddress,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough allowance THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.transferFrom(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    101
                )
            ).to.be.revertedWithCustomError(
                contracts.erc20,
                'InsufficientAllowance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer from a paused token THEN it fails', async () => {
            const contracts = await prepare(true)

            await expect(
                contracts.erc20.transferFrom(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    0
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.transferFrom(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    100
                )
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    100
                )
                .to.emit(contracts.erc20, 'Approval')
                .withArgs(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    0
                )

            expect(await contracts.erc20.totalSupply()).to.be.equal(200)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(200)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(0)
            expect(
                await contracts.erc20.allowance(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress
                )
            ).to.be.equal(0)
        })

        it(
            'GIVEN an ERC20 ' +
                'WHEN transferFrom with max(uint256) to allowance ' +
                'THEN a transfer can be made',
            async () => {
                const contracts = await prepare()
                await contracts.erc20
                    .connect(contracts.otherAccount)
                    .approve(contracts.ownerAddress, ethers.MaxUint256)
                await expect(
                    contracts.erc20.transferFrom(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        100
                    )
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        100
                    )

                expect(await contracts.erc20.totalSupply()).to.be.equal(200)
                expect(
                    await contracts.erc20.balanceOf(contracts.ownerAddress)
                ).to.be.equal(200)
                expect(
                    await contracts.erc20.balanceOf(
                        contracts.otherAccountAddress
                    )
                ).to.be.equal(0)
                expect(
                    await contracts.erc20.allowance(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress
                    )
                ).to.be.equal(ethers.MaxUint256)
            }
        )

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN transferFrom from non-whitelisted account THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Approve before enabling whitelist
                await contracts.erc20
                    .connect(contracts.otherAccount)
                    .approve(contracts.ownerAddress, 100)

                // Enable whitelist but don't add otherAccount (from)
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20.transferFrom(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        50
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN transferFrom to non-whitelisted recipient THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Approve and enable whitelist
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await contracts.erc20
                    .connect(contracts.otherAccount)
                    .approve(contracts.ownerAddress, 100)

                // Create a third account that is not whitelisted
                const [, , thirdAccount] = await ethers.getSigners()
                const thirdAccountAddress = await thirdAccount.getAddress()

                await expect(
                    contracts.erc20.transferFrom(
                        contracts.otherAccountAddress,
                        thirdAccountAddress,
                        50
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(thirdAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN transferFrom to whitelisted recipient THEN it succeeds', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Approve, enable whitelist, and add recipient
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await contracts.erc20
                    .connect(contracts.otherAccount)
                    .approve(contracts.ownerAddress, 100)

                await expect(
                    contracts.erc20.transferFrom(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        50
                    )
                )
                    .to.emit(contracts.erc20, 'Transfer')
                    .withArgs(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        50
                    )
            })
        })
    })

    describe('BatchTransfer', () => {
        const prepare = async (init_pause: boolean = false) => {
            const contracts = init_pause
                ? await loadFixture(deployPausedFixture)
                : await loadFixture(deployPreparedTokensFixture)

            if (init_pause) return contracts

            await contracts.erc20Capped.mint(contracts.ownerAddress, 300)
            return contracts
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) in recipients THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.batchTransfer(
                    [ethers.ZeroAddress, contracts.otherAccountAddress],
                    [50, 50]
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN arrays have different lengths THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.batchTransfer(
                    [contracts.otherAccountAddress],
                    [50, 100]
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'NotSameLength')
        })

        it('GIVEN an ERC20 initialized WHEN try to batch transfer without enough balance THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.batchTransfer(
                    [contracts.otherAccountAddress, contracts.ownerAddress],
                    [200, 200]
                )
            ).to.be.revertedWithCustomError(
                contracts.erc20,
                'TransferAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to batch transfer from a paused token THEN it fails', async () => {
            const contracts = await loadFixture(deployPausedFixture)

            await expect(
                contracts.erc20.batchTransfer([contracts.ownerAddress], [0])
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a batch transfer can be made', async () => {
            const contracts = await prepare()
            const recipients = [
                contracts.otherAccountAddress,
                contracts.ownerAddress,
            ]
            const amounts = [100, 50]

            await expect(contracts.erc20.batchTransfer(recipients, amounts))
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(contracts.ownerAddress, recipients[0], amounts[0])
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(contracts.ownerAddress, recipients[1], amounts[1])

            expect(await contracts.erc20.totalSupply()).to.be.equal(300)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(200)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(100)
        })

        it('GIVEN an ERC20 WHEN batch transfer with empty arrays THEN it succeeds without transfers', async () => {
            const contracts = await prepare()
            await expect(contracts.erc20.batchTransfer([], [])).to.not.be
                .reverted

            expect(await contracts.erc20.totalSupply()).to.be.equal(300)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(300)
        })

        it('GIVEN an ERC20 WHEN batch transfer to single recipient THEN it succeeds', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.batchTransfer(
                    [contracts.otherAccountAddress],
                    [150]
                )
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    150
                )

            expect(await contracts.erc20.totalSupply()).to.be.equal(300)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(150)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(150)
        })

        it('GIVEN an ERC20 WHEN batch transfer with exact balance THEN it succeeds', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20.batchTransfer(
                    [contracts.otherAccountAddress, contracts.ownerAddress],
                    [200, 100]
                )
            )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    200
                )
                .to.emit(contracts.erc20, 'Transfer')
                .withArgs(contracts.ownerAddress, contracts.ownerAddress, 100)

            expect(await contracts.erc20.totalSupply()).to.be.equal(300)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(100)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(200)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN batchTransfer from non-whitelisted sender THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist but don't add owner (sender)
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.batchTransfer(
                        [contracts.otherAccountAddress],
                        [100]
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.ownerAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN batchTransfer to non-whitelisted recipient THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20.batchTransfer(
                        [contracts.otherAccountAddress],
                        [100]
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelistedInBatch'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN batchTransfer to whitelisted recipients THEN it succeeds', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add recipients
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20.batchTransfer(
                        [contracts.ownerAddress, contracts.otherAccountAddress],
                        [100, 200]
                    )
                ).to.not.be.reverted

                expect(await contracts.erc20.totalSupply()).to.equal(300)
            })
        })
    })

    describe('Snapshot', () => {
        const prepare = async (init_pause: boolean = false) => {
            const contracts = init_pause
                ? await loadFixture(deployPausedFixture)
                : await loadFixture(deployPreparedTokensFixture)

            if (init_pause) return contracts

            await contracts.erc20Capped.mint(contracts.ownerAddress, 100)
            return contracts
        }

        it('GIVEN an ERC20 WHEN not exists snapshot THEN balanceOfAt and totalSupplyAt fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Snapshot.balanceOfAt(contracts.ownerAddress, 0)
            ).to.be.revertedWithCustomError(
                contracts.erc20Snapshot,
                'SnapshotWithIdZero'
            )
            await expect(
                contracts.erc20Snapshot.totalSupplyAt(0)
            ).to.be.revertedWithCustomError(
                contracts.erc20Snapshot,
                'SnapshotWithIdZero'
            )
            await expect(
                contracts.erc20Snapshot.balanceOfAt(contracts.ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                contracts.erc20Snapshot,
                'NonExistentSnapshotId'
            )
            await expect(
                contracts.erc20Snapshot.totalSupplyAt(1)
            ).to.be.revertedWithCustomError(
                contracts.erc20Snapshot,
                'NonExistentSnapshotId'
            )
        })

        it('GIVEN an ERC20 WHEN taking a snapshot of a paused token THEN fails', async () => {
            const contracts = await prepare(true)

            await expect(
                contracts.erc20Snapshot.snapshot()
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN non snapshoter takes a snapshot THEN fails', async () => {
            const contracts = await prepare()

            const erc20SnapshotConnected = contracts.erc20Snapshot.connect(
                contracts.otherAccount
            )

            await expect(
                erc20SnapshotConnected.snapshot()
            ).to.be.revertedWithCustomError(
                contracts.accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a snapshot can be made', async () => {
            const contracts = await prepare()

            await expect(contracts.erc20Snapshot.snapshot())
                .to.emit(contracts.erc20Snapshot, 'Snapshot')
                .withArgs(1)
            expect(
                await contracts.erc20Snapshot.balanceOfAt(
                    contracts.ownerAddress,
                    1
                )
            ).to.be.equal(100)
            expect(
                await contracts.erc20Snapshot.balanceOfAt(
                    contracts.otherAccountAddress,
                    1
                )
            ).to.be.equal(0)
            expect(await contracts.erc20Snapshot.totalSupplyAt(1)).to.be.equal(
                100
            )
            await contracts.erc20.transfer(contracts.otherAccountAddress, 25)
            await contracts.erc20Capped.mint(contracts.otherAccountAddress, 25)
            expect(
                await contracts.erc20Snapshot.balanceOfAt(
                    contracts.ownerAddress,
                    1
                )
            ).to.be.equal(100)
            expect(
                await contracts.erc20Snapshot.balanceOfAt(
                    contracts.otherAccountAddress,
                    1
                )
            ).to.be.equal(0)
            expect(await contracts.erc20Snapshot.totalSupplyAt(1)).to.be.equal(
                100
            )
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(75)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(50)
            expect(await contracts.erc20.totalSupply()).to.be.equal(125)
        })
    })

    describe('Controller', () => {
        const MINTED = 100

        const prepare = async (init_pause: boolean = false) => {
            const contracts = init_pause
                ? await loadFixture(deployPausedFixture)
                : await loadFixture(deployPreparedTokensFixture)

            if (init_pause) return contracts

            await contracts.erc20Capped.mint(
                contracts.otherAccountAddress,
                MINTED
            )
            return contracts
        }

        it('GIVEN an ERC20 initialized WHEN try to force burn a paused token THEN it fails', async () => {
            const contracts = await prepare(true)

            await expect(
                contracts.erc20Controller.forceBurn(
                    contracts.otherAccountAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force burn THEN it fails', async () => {
            const contracts = await prepare()

            const erc20ControllerConnected = contracts.erc20Controller.connect(
                contracts.otherAccount
            )

            await expect(
                erc20ControllerConnected.forceBurn(
                    contracts.otherAccountAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(
                contracts.accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an ERC20 WHEN forceBurn from zero address THEN it fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Controller.forceBurn(ethers.ZeroAddress, MINTED)
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force burn can be made', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Controller.forceBurn(
                    contracts.otherAccountAddress,
                    MINTED
                )
            )
                .to.emit(contracts.erc20Controller, 'ForcedBurn')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    MINTED
                )

            expect(await contracts.erc20.totalSupply()).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(0)
        })

        it('GIVEN an ERC20 initialized WHEN try to force transfer a paused token THEN it fails', async () => {
            const contracts = await prepare(true)

            await expect(
                contracts.erc20Controller.forceTransfer(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force transfer THEN it fails', async () => {
            const contracts = await prepare()

            const erc20ControllerConnected = contracts.erc20Controller.connect(
                contracts.otherAccount
            )

            await expect(
                erc20ControllerConnected.forceTransfer(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(
                contracts.accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an ERC20 WHEN forceTransfer from zero address THEN fails', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Controller.forceTransfer(
                    ethers.ZeroAddress,
                    contracts.ownerAddress,
                    MINTED
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force transfer can be made', async () => {
            const contracts = await prepare()
            await expect(
                contracts.erc20Controller.forceTransfer(
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    MINTED
                )
            )
                .to.emit(contracts.erc20Controller, 'ForcedTransfer')
                .withArgs(
                    contracts.ownerAddress,
                    contracts.otherAccountAddress,
                    contracts.ownerAddress,
                    MINTED
                )

            expect(await contracts.erc20.totalSupply()).to.be.equal(MINTED)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.ownerAddress)
            ).to.be.equal(MINTED)
        })

        describe('Whitelist Integration', () => {
            it('GIVEN an ERC20 with whitelist enabled WHEN forceTransfer from non-whitelisted account THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist but don't add otherAccount (from)
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20Controller.forceTransfer(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        MINTED
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN forceTransfer to non-whitelisted account THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist and add from but not to
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(
                    contracts.otherAccountAddress
                )

                await expect(
                    contracts.erc20Controller.forceTransfer(
                        contracts.otherAccountAddress,
                        contracts.ownerAddress,
                        MINTED
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.ownerAddress)
            })

            it('GIVEN an ERC20 with whitelist enabled WHEN forceBurn from non-whitelisted account THEN it fails', async () => {
                const contracts = await prepare()
                const basicWhitelist = await ethers.getContractAt(
                    'BasicWhitelistFacet',
                    await contracts.erc20.getAddress()
                )

                await contracts.accessControl.grantRole(
                    WHITELIST_ROLE,
                    contracts.ownerAddress
                )

                // Enable whitelist but don't add otherAccount
                await basicWhitelist.enableWhitelist()
                await basicWhitelist.addToWhitelist(contracts.ownerAddress)

                await expect(
                    contracts.erc20Controller.forceBurn(
                        contracts.otherAccountAddress,
                        MINTED
                    )
                )
                    .to.be.revertedWithCustomError(
                        basicWhitelist,
                        'NotWhitelisted'
                    )
                    .withArgs(contracts.otherAccountAddress)
            })
        })
    })

    describe('Mixed DID and Address Role Access', function () {
        let didWallet: HDNodeWallet
        let did: string
        let addressAccount: Signer
        let addressAccountAddress: string
        let useCaseAccessControlDid: IAccessControlDid
        let erc20Mixed: ERC20
        let erc20CappedMixed: ERC203643Capped
        let accessControlMixed: unknown

        function walletOfFirstSigner(): HDNodeWallet {
            const mnemonic = (
                config.networks.hardhat.accounts as {
                    mnemonic: string
                    path: string
                }
            ).mnemonic
            return ethers.Wallet.fromPhrase(mnemonic)
        }

        async function deployMixedFixture() {
            const [admin, addressAcc] = await ethers.getSigners()
            const adminAddr = await admin.getAddress()
            const addressAccAddr = await addressAcc.getAddress()

            // Create test wallet and DID
            const baseWallet = walletOfFirstSigner()
            const wallet = baseWallet.derivePath('302')
            const didId = ethers.id('did:erc20:test:1')

            // Deploy ERC20 with initialization
            const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
            const CappedFactory = await ethers.getContractFactory(
                'ERC203643CappedFacet'
            )

            const businessIds = [
                ERC20_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
            ]
            const data = [
                ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                    name,
                    symbol,
                    decimals,
                ]),
                CappedFactory.interface.encodeFunctionData(
                    'initializeCap',
                    [1000]
                ),
            ]

            const govResult = await deployGovernance(
                admin,
                [],
                undefined,
                false,
                '0x',
                businessIds,
                data
            )

            // Grant DID registry role
            await govResult.accessControlGovernance!.grantRole(
                DID_REGISTRY_ROLE,
                adminAddr
            )

            // Initialize DID registry
            const governanceAddress =
                await govResult.accessControlGovernance!.getAddress()
            const didRegistryWithSigner = IDidRegistry__factory.connect(
                governanceAddress,
                admin
            )
            await didRegistryWithSigner.initializeDiDRegistry(
                EllipticType.SECP_256_K1
            )

            // Insert DID document
            const notBefore = Math.floor(Date.now() / 1000)
            const notAfter = notBefore + 365 * 24 * 60 * 60

            const publicKey = wallet.signingKey.publicKey
            const vMethodId = ethers.id(`vmethod:${didId}`)
            const message = ethers.keccak256(
                ethers.solidityPacked(['bytes'], [publicKey])
            )
            const signature = wallet.signingKey.sign(message)
            const proof = ethers.Signature.from(signature).serialized

            await didRegistryWithSigner.insertFirstDidDocument(
                didId,
                `document:${didId}`,
                vMethodId,
                proof,
                publicKey,
                EllipticType.SECP_256_K1,
                notBefore,
                notAfter,
                ''
            )

            // Set mock timestamp to valid period
            const mockTimestampWithSigner =
                govResult.mockTimestamp.connect(admin)
            await mockTimestampWithSigner.setMockedTimestamp(notBefore + 1)

            // Get AccessControlDid interface for use case
            const AccessControlDidFactory = await ethers.getContractFactory(
                'AccessControlDidFacet'
            )
            const useCaseAccessControlDid = AccessControlDidFactory.attach(
                await govResult.accessControl.getAddress()
            ) as IAccessControlDid

            // Grant MINTER_ROLE to address
            await govResult.accessControl.grantRole(MINTER_ROLE, addressAccAddr)

            // Grant MINTER_ROLE to DID
            await govResult.accessControl.grantRole(MINTER_ROLE, adminAddr)
            await useCaseAccessControlDid.grantDidRole(MINTER_ROLE, didId)

            // Grant CAP_ROLE to DID
            await govResult.accessControl.grantRole(CAP_ROLE, adminAddr)
            await useCaseAccessControlDid.grantDidRole(CAP_ROLE, didId)

            // Fund DID wallet
            await admin.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther('1.0'),
            })

            return {
                erc20: govResult.erc20,
                erc20Capped: govResult.erc203643Capped,
                erc20Snapshot: govResult.erc20Snapshot,
                accessControl: govResult.accessControl,
                useCaseAccessControlDid,
                didWallet: wallet,
                did: didId,
                addressAccount: addressAcc,
                addressAccountAddress: addressAccAddr,
                adminAccount: admin,
            }
        }

        beforeEach(async function () {
            const contracts = await loadFixture(deployMixedFixture)
            erc20Mixed = contracts.erc20
            erc20CappedMixed = contracts.erc20Capped
            accessControlMixed = contracts.accessControl
            useCaseAccessControlDid = contracts.useCaseAccessControlDid
            didWallet = contracts.didWallet
            did = contracts.did
            addressAccount = contracts.addressAccount
            addressAccountAddress = contracts.addressAccountAddress
        })

        it('GIVEN MINTER_ROLE granted to address and DID WHEN both mint tokens THEN both succeed', async function () {
            // Address mints
            const connectedErc20CappedAddress =
                erc20CappedMixed.connect(addressAccount)
            await expect(
                connectedErc20CappedAddress.mint(addressAccountAddress, 100)
            )
                .to.emit(erc20Mixed, 'Transfer')
                .withArgs(ethers.ZeroAddress, addressAccountAddress, 100)

            // DID wallet mints
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedErc20CappedDid = erc20CappedMixed.connect(didSigner)
            await expect(connectedErc20CappedDid.mint(didWallet.address, 200))
                .to.emit(erc20Mixed, 'Transfer')
                .withArgs(ethers.ZeroAddress, didWallet.address, 200)

            expect(await erc20Mixed.balanceOf(addressAccountAddress)).to.equal(
                100
            )
            expect(await erc20Mixed.balanceOf(didWallet.address)).to.equal(200)
            expect(await erc20Mixed.totalSupply()).to.equal(300)
        })

        it('GIVEN MINTER_ROLE granted to DID WHEN hasRole checks address THEN returns true', async function () {
            // Check if DID wallet address has role via DID resolution
            const hasRole = await accessControlMixed.hasRole(
                MINTER_ROLE,
                didWallet.address
            )
            expect(hasRole).to.be.true
        })

        it('GIVEN CAP_ROLE granted to DID WHEN DID wallet sets cap THEN succeeds', async function () {
            // DID wallet sets cap
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedErc20CappedDid = erc20CappedMixed.connect(didSigner)
            await expect(connectedErc20CappedDid.setCap(2000))
                .to.emit(erc20CappedMixed, 'CapSet')
                .withArgs(didWallet.address, 2000)

            expect(await erc20CappedMixed.cap()).to.equal(2000)
        })

        it('GIVEN role revoked from DID WHEN DID wallet executes THEN fails', async function () {
            // Revoke MINTER_ROLE from DID
            await useCaseAccessControlDid.revokeDidRole(MINTER_ROLE, did)

            // DID wallet should fail
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedErc20CappedDid = erc20CappedMixed.connect(didSigner)
            await expect(
                connectedErc20CappedDid.mint(didWallet.address, 100)
            ).to.be.revertedWithCustomError(
                accessControlMixed,
                'AccountHasNoRole'
            )
        })

        it('GIVEN role revoked from address WHEN address executes THEN fails but DID still works', async function () {
            // Revoke MINTER_ROLE from address
            await accessControlMixed.revokeRole(
                MINTER_ROLE,
                addressAccountAddress
            )

            // Address should fail
            const connectedErc20CappedAddress =
                erc20CappedMixed.connect(addressAccount)
            await expect(
                connectedErc20CappedAddress.mint(addressAccountAddress, 100)
            ).to.be.revertedWithCustomError(
                accessControlMixed,
                'AccountHasNoRole'
            )

            // DID wallet should still work
            const didSigner = new ethers.Wallet(
                didWallet.privateKey,
                ethers.provider
            )
            const connectedErc20CappedDid = erc20CappedMixed.connect(didSigner)
            await expect(
                connectedErc20CappedDid.mint(didWallet.address, 100)
            ).to.emit(erc20Mixed, 'Transfer')
        })

        it('GIVEN DID has multiple roles WHEN checking hasRoleForDid THEN returns true for all', async function () {
            // Check MINTER_ROLE
            const hasMinterRole = await useCaseAccessControlDid.hasRoleForDid(
                MINTER_ROLE,
                did
            )
            expect(hasMinterRole).to.be.true

            // Check CAP_ROLE
            const hasCapRole = await useCaseAccessControlDid.hasRoleForDid(
                CAP_ROLE,
                did
            )
            expect(hasCapRole).to.be.true
        })
    })

    describe('ERC712', () => {
        // New comprehensive fixtures to replace repetitive beforeEach setups

        const commonRolesFixture = async () => {
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await accessControl.grantRole(SPONSOR_ROLE, otherAccountAddress)
        }

        const signatureReadyFixture = async () => {
            await commonRolesFixture()
            await erc20Capped.initializeCap(1000)
            await erc20Capped.mint(ownerAddress, 500)
        }

        const sponsorOnlyFixture = async () => {
            await accessControl.grantRole(SPONSOR_ROLE, otherAccountAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await erc20Capped.initializeCap(1000)
        }

        const fullSponsorSetupFixture = async () => {
            await accessControl.grantRole(SPONSOR_ROLE, ownerAddress)
            await accessControl.grantRole(SPONSOR_ROLE, otherAccountAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc20Capped.initializeCap(1000)
        }

        const domain = {
            name: 'ERC203643',
            version: '1',
            chainId: 0, // Will be set in beforeEach
            verifyingContract: '', // Will be set in beforeEach
        }
        beforeEach(async function () {
            domain.chainId = await network.provider.send('eth_chainId')
            domain.verifyingContract = await erc20.getAddress()
        })
        describe('TransferWithSignature', () => {
            const transferTypes = {
                TransferWithSignature: [
                    { name: 'to', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'sender', type: 'address' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            const transferFromTypes = {
                TransferFromWithSignature: [
                    { name: 'from', type: 'address' },
                    { name: 'to', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'sender', type: 'address' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            beforeEach(async function () {
                await loadFixture(signatureReadyFixture)
            })

            it('GIVEN paused contract WHEN calling transferWithSignature THEN should revert with IsPaused', async function () {
                // Pause the contract
                await pause.pause()

                await expect(
                    erc203643TransferSigned
                        .connect(otherAccount)
                        .transferWithSignature(
                            otherAccountAddress,
                            100,
                            ownerAddress,
                            100,
                            1,
                            '0xdead'
                        )
                ).to.be.revertedWithCustomError(erc20, 'IsPaused')
            })

            it('GIVEN paused contract WHEN calling transferFromWithSignature THEN should revert with IsPaused', async function () {
                // Pause the contract
                await pause.pause()
                await expect(
                    erc203643TransferSigned
                        .connect(otherAccount)
                        .transferFromWithSignature(
                            ownerAddress,
                            otherAccountAddress,
                            10,
                            otherAccountAddress,
                            10,
                            1,
                            '0xdead'
                        )
                ).to.be.revertedWithCustomError(erc20, 'IsPaused')
            })

            it('GIVEN caller without SPONSOR_ROLE WHEN calling transferWithSignature THEN should revert with AccountHasNoRole', async function () {
                await expect(
                    erc203643TransferSigned.transferWithSignature(
                        otherAccountAddress,
                        100,
                        ownerAddress,
                        10,
                        1,
                        '0xdead'
                    )
                )
                    .to.be.revertedWithCustomError(
                        accessControl,
                        'AccountHasNoRole'
                    )
                    .withArgs(ownerAddress, SPONSOR_ROLE)
            })

            it('GIVEN caller without SPONSOR_ROLE WHEN calling transferFromWithSignature THEN should revert with AccountHasNoRole', async function () {
                await expect(
                    erc203643TransferSigned.transferFromWithSignature(
                        ownerAddress,
                        otherAccountAddress,
                        100,
                        otherAccountAddress,
                        100,
                        1,
                        '0xdead'
                    )
                )
                    .to.be.revertedWithCustomError(
                        accessControl,
                        'AccountHasNoRole'
                    )
                    .withArgs(ownerAddress, SPONSOR_ROLE)
            })

            it('GIVEN valid signed transfer data WHEN calling transferWithSignature THEN should successfully transfer tokens and emit event', async function () {
                const amount = 100
                const nonce = 1
                const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

                const message = {
                    to: otherAccountAddress,
                    amount: amount,
                    sender: ownerAddress,
                    deadline: deadline,
                    nonce: nonce,
                }

                const signature = await owner.signTypedData(
                    domain,
                    transferTypes,
                    message
                )

                const tx = await erc203643TransferSigned
                    .connect(otherAccount) // Sponsor calls the function
                    .transferWithSignature(
                        otherAccountAddress,
                        amount,
                        ownerAddress,
                        deadline,
                        nonce,
                        signature
                    )

                await expect(tx)
                    .to.emit(
                        erc203643TransferSigned,
                        'WithSignatureTransferred'
                    )
                    .withArgs(
                        ownerAddress,
                        otherAccountAddress,
                        amount,
                        ownerAddress,
                        deadline,
                        nonce,
                        signature
                    )

                // Verify balances
                expect(await erc20.balanceOf(ownerAddress)).to.equal(400) // 500 - 100
                expect(await erc20.balanceOf(otherAccountAddress)).to.equal(100)
            })

            it('GIVEN valid signed transferFrom data WHEN calling transferFromWithSignature THEN should successfully transfer tokens and emit event', async function () {
                // Set up allowance for the sponsor (otherAccount) to spend owner's tokens
                await erc20.connect(owner).approve(otherAccountAddress, 200)

                const amount = 150
                const nonce = 1
                const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

                const message = {
                    from: ownerAddress,
                    to: otherAccountAddress,
                    amount: amount,
                    sender: otherAccountAddress, // Sponsor is the sender
                    deadline: deadline,
                    nonce: nonce,
                }

                const signature = await otherAccount.signTypedData(
                    domain,
                    transferFromTypes,
                    message
                )

                const tx = await erc203643TransferSigned
                    .connect(otherAccount) // Sponsor calls the function
                    .transferFromWithSignature(
                        ownerAddress,
                        otherAccountAddress,
                        amount,
                        otherAccountAddress,
                        deadline,
                        nonce,
                        signature
                    )

                await expect(tx)
                    .to.emit(
                        erc203643TransferSigned,
                        'WithSignatureTransferred'
                    )
                    .withArgs(
                        ownerAddress,
                        otherAccountAddress,
                        amount,
                        otherAccountAddress,
                        deadline,
                        nonce,
                        signature
                    )

                // Verify balances and allowance
                expect(await erc20.balanceOf(ownerAddress)).to.equal(350) // 500 - 150
                expect(await erc20.balanceOf(otherAccountAddress)).to.equal(150)
                expect(
                    await erc20.allowance(ownerAddress, otherAccountAddress)
                ).to.equal(50) // 200 - 150
            })
        })

        describe('MintWithSignature', () => {
            let erc203643CappedSigned: ERC203643CappedSigned // Replace with actual type when available

            const mintTypes = {
                MintWithSignature: [
                    { name: 'to', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'sender', type: 'address' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            beforeEach(async function () {
                erc203643CappedSigned = await ethers.getContractAt(
                    'ERC203643CappedSigned',
                    await erc20.getAddress()
                )
            })

            describe('Modifier Coverage', () => {
                beforeEach(async function () {
                    await loadFixture(sponsorOnlyFixture)
                })

                it('GIVEN paused contract WHEN calling mintWithSignature THEN should revert with IsPaused', async function () {
                    // Pause the contract
                    await pause.pause()

                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                otherAccountAddress,
                                100,
                                ownerAddress,
                                Math.floor(Date.now() / 1000) + 3600,
                                1,
                                '0xdead'
                            )
                    ).to.be.revertedWithCustomError(erc20, 'IsPaused')
                })

                it('GIVEN caller without SPONSOR_ROLE WHEN calling mintWithSignature THEN should revert with AccountHasNoRole', async function () {
                    // Revoke role to ensure it doesn't have it
                    await accessControl.revokeRole(
                        SPONSOR_ROLE,
                        otherAccountAddress
                    )

                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                otherAccountAddress,
                                100,
                                ownerAddress,
                                Math.floor(Date.now() / 1000) + 3600,
                                1,
                                '0xdead'
                            )
                    )
                        .to.be.revertedWithCustomError(
                            accessControl,
                            'AccountHasNoRole'
                        )
                        .withArgs(otherAccountAddress, SPONSOR_ROLE)
                })

                it('GIVEN the signer of 712 is not MINTER_ROLE WHEN calling mintWithSignature THEN fails', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

                    const message = {
                        to: otherAccountAddress,
                        amount: amount,
                        sender: ownerAddress,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        mintTypes,
                        message
                    )

                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                otherAccountAddress,
                                amount,
                                ownerAddress,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            accessControl,
                            'AccountHasNoRole'
                        )
                        .withArgs(ownerAddress, MINTER_ROLE)
                })
            })

            describe('Successful Operations', () => {
                beforeEach(async function () {
                    await loadFixture(fullSponsorSetupFixture)
                })

                it('GIVEN valid signed mint data WHEN calling mintWithSignature THEN should successfully mint tokens and emit event', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

                    const message = {
                        to: otherAccountAddress,
                        amount: amount,
                        sender: ownerAddress,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        mintTypes,
                        message
                    )

                    const tx = await erc203643CappedSigned
                        .connect(otherAccount) // Sponsor calls the function
                        .mintWithSignature(
                            otherAccountAddress,
                            amount,
                            ownerAddress,
                            deadline,
                            nonce,
                            signature
                        )

                    await expect(tx)
                        .to.emit(erc203643CappedSigned, 'WithSignatureMinted')
                        .withArgs(
                            otherAccountAddress,
                            amount,
                            ownerAddress,
                            deadline,
                            nonce,
                            signature
                        )

                    // Verify balances and supply
                    expect(await erc20.balanceOf(otherAccountAddress)).to.equal(
                        100
                    )
                    expect(await erc20.totalSupply()).to.equal(100)
                })

                it('GIVEN valid signed mint data to zero address WHEN calling mintWithSignature THEN should fail with AddressZero', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    const message = {
                        to: ethers.ZeroAddress,
                        amount: amount,
                        sender: ownerAddress,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        mintTypes,
                        message
                    )

                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                ethers.ZeroAddress,
                                amount,
                                ownerAddress,
                                deadline,
                                nonce,
                                signature
                            )
                    ).to.be.revertedWithCustomError(erc20, 'AddressZero')
                })

                it('GIVEN expired signature WHEN calling mintWithSignature THEN should fail with ExpiredDeadline', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = 1
                    const message = {
                        to: otherAccountAddress,
                        amount: amount,
                        sender: ownerAddress,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        mintTypes,
                        message
                    )

                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                otherAccountAddress,
                                amount,
                                ownerAddress,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc203643CappedSigned,
                            'ExpiredDeadline'
                        )
                        .withArgs(deadline)
                })

                it('GIVEN invalid signature WHEN calling mintWithSignature THEN should fail with InvalidSignature', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                otherAccountAddress,
                                amount,
                                ownerAddress,
                                deadline,
                                nonce,
                                '0x' + '00'.repeat(65) // Invalid signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc203643CappedSigned,
                            'InvalidSignature'
                        )
                        .withArgs(ownerAddress)
                })

                it('GIVEN duplicate nonce WHEN calling mintWithSignature THEN should fail with WrongNonce', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    const message = {
                        to: otherAccountAddress,
                        amount: amount,
                        sender: ownerAddress,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        mintTypes,
                        message
                    )

                    // First call with valid nonce
                    await erc203643CappedSigned
                        .connect(otherAccount)
                        .mintWithSignature(
                            otherAccountAddress,
                            amount,
                            ownerAddress,
                            deadline,
                            nonce,
                            signature
                        )

                    // Second call with same nonce should fail
                    await expect(
                        erc203643CappedSigned
                            .connect(otherAccount)
                            .mintWithSignature(
                                otherAccountAddress,
                                amount,
                                ownerAddress,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc203643CappedSigned,
                            'WrongNonce'
                        )
                        .withArgs(nonce, ownerAddress)
                })
            })
        })

        describe('BurnWithSignature', () => {
            let erc20BurnableSigned: ERC20BurnableSigned

            const burnTypes = {
                BurnWithSignature: [
                    { name: 'account', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            const burnFromTypes = {
                BurnFromWithSignature: [
                    { name: 'sender', type: 'address' },
                    { name: 'account', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            }

            beforeEach(async function () {
                erc20BurnableSigned = await ethers.getContractAt(
                    'ERC20BurnableSignedFacet',
                    await erc20.getAddress()
                )
            })

            describe('Modifier Coverage', () => {
                beforeEach(async function () {
                    // Setup roles and initial state
                    await accessControl.grantRole(
                        SPONSOR_ROLE,
                        otherAccountAddress
                    )
                    await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                    await accessControl.grantRole(MINTER_ROLE, ownerAddress)
                    await erc20Capped.initializeCap(1000)
                    await erc20Capped.mint(ownerAddress, 500)
                })

                it('GIVEN paused contract WHEN calling burnWithSignature THEN should revert with IsPaused', async function () {
                    // Pause the contract
                    await pause.pause()

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnWithSignature(
                                ownerAddress,
                                100,
                                Math.floor(Date.now() / 1000) + 3600,
                                1,
                                '0xdead'
                            )
                    ).to.be.revertedWithCustomError(erc20, 'IsPaused')
                })

                it('GIVEN caller without SPONSOR_ROLE WHEN calling burnWithSignature THEN should revert with AccountHasNoRole', async function () {
                    await expect(
                        erc20BurnableSigned.burnWithSignature(
                            ownerAddress,
                            100,
                            Math.floor(Date.now() / 1000) + 3600,
                            1,
                            '0xdead'
                        )
                    )
                        .to.be.revertedWithCustomError(
                            accessControl,
                            'AccountHasNoRole'
                        )
                        .withArgs(ownerAddress, SPONSOR_ROLE)
                })
            })

            describe('Successful Operations', () => {
                beforeEach(async function () {
                    // Setup roles and initial state
                    await accessControl.grantRole(SPONSOR_ROLE, ownerAddress)
                    await accessControl.grantRole(
                        SPONSOR_ROLE,
                        otherAccountAddress
                    )
                    await accessControl.grantRole(MINTER_ROLE, ownerAddress)
                    await erc20Capped.initializeCap(1000)
                    await erc20Capped.mint(ownerAddress, 500)
                })

                it('GIVEN valid signed burn data WHEN calling burnWithSignature THEN should successfully burn tokens and emit event', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

                    const message = {
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        burnTypes,
                        message
                    )

                    const tx = await erc20BurnableSigned
                        .connect(otherAccount) // Sponsor calls the function
                        .burnWithSignature(
                            ownerAddress,
                            amount,
                            deadline,
                            nonce,
                            signature
                        )

                    await expect(tx)
                        .to.emit(erc20BurnableSigned, 'WithSignatureBurned')
                        .withArgs(
                            ownerAddress,
                            amount,
                            deadline,
                            nonce,
                            signature
                        )

                    // Verify balances and supply
                    expect(await erc20.balanceOf(ownerAddress)).to.equal(400) // 500 - 100
                    expect(await erc20.totalSupply()).to.equal(400) // 500 - 100
                })

                it('GIVEN expired signature WHEN calling burnWithSignature THEN should fail with ExpiredDeadline', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = 1
                    const message = {
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        burnTypes,
                        message
                    )

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnWithSignature(
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc20BurnableSigned,
                            'ExpiredDeadline'
                        )
                        .withArgs(deadline)
                })

                it('GIVEN invalid signature WHEN calling burnWithSignature THEN should fail with InvalidSignature', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnWithSignature(
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                '0x' + '00'.repeat(65) // Invalid signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc20BurnableSigned,
                            'InvalidSignature'
                        )
                        .withArgs(ownerAddress)
                })

                it('GIVEN duplicate nonce WHEN calling burnWithSignature THEN should fail with WrongNonce', async function () {
                    const amount = 100
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    const message = {
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await owner.signTypedData(
                        domain,
                        burnTypes,
                        message
                    )

                    // First call with valid nonce
                    await erc20BurnableSigned
                        .connect(otherAccount)
                        .burnWithSignature(
                            ownerAddress,
                            amount,
                            deadline,
                            nonce,
                            signature
                        )

                    // Second call with same nonce should fail
                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnWithSignature(
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc20BurnableSigned,
                            'WrongNonce'
                        )
                        .withArgs(nonce, ownerAddress)
                })
            })

            describe('burnFromWithSignature - Modifier Coverage', () => {
                beforeEach(async function () {
                    // Setup roles and initial state
                    await accessControl.grantRole(
                        SPONSOR_ROLE,
                        otherAccountAddress
                    )
                    await accessControl.grantRole(MINTER_ROLE, ownerAddress)
                    await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
                    await erc20Capped.initializeCap(1000)
                    await erc20Capped.mint(ownerAddress, 500)
                })

                it('GIVEN paused contract WHEN calling burnFromWithSignature THEN should revert with IsPaused', async function () {
                    // Pause the contract
                    await pause.pause()

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnFromWithSignature(
                                ownerAddress,
                                ownerAddress,
                                100,
                                Math.floor(Date.now() / 1000) + 3600,
                                1,
                                '0xdead'
                            )
                    ).to.be.revertedWithCustomError(erc20, 'IsPaused')
                })

                it('GIVEN caller without SPONSOR_ROLE WHEN calling burnFromWithSignature THEN should revert with AccountHasNoRole', async function () {
                    // Revoke role to ensure it doesn't have it
                    await accessControl.revokeRole(
                        SPONSOR_ROLE,
                        otherAccountAddress
                    )

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnFromWithSignature(
                                ownerAddress,
                                ownerAddress,
                                100,
                                Math.floor(Date.now() / 1000) + 3600,
                                1,
                                '0xdead'
                            )
                    )
                        .to.be.revertedWithCustomError(
                            accessControl,
                            'AccountHasNoRole'
                        )
                        .withArgs(otherAccountAddress, SPONSOR_ROLE)
                })
            })

            describe('burnFromWithSignature - Successful Operations', () => {
                beforeEach(async function () {
                    // Setup roles and initial state
                    await accessControl.grantRole(SPONSOR_ROLE, ownerAddress)
                    await accessControl.grantRole(MINTER_ROLE, ownerAddress)
                    await accessControl.grantRole(
                        SPONSOR_ROLE,
                        otherAccountAddress
                    )
                    await erc20Capped.initializeCap(1000)
                    await erc20Capped.mint(ownerAddress, 500)
                })

                it('GIVEN valid signed burnFrom data WHEN calling burnFromWithSignature THEN should successfully burn tokens and emit event', async function () {
                    // First approve the spender
                    await erc20.connect(owner).approve(otherAccountAddress, 200)

                    const amount = 150
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

                    const message = {
                        sender: otherAccountAddress, // Sponsor is the sender
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await otherAccount.signTypedData(
                        domain,
                        burnFromTypes,
                        message
                    )

                    const tx = await erc20BurnableSigned
                        .connect(otherAccount) // Sponsor calls the function
                        .burnFromWithSignature(
                            otherAccountAddress,
                            ownerAddress,
                            amount,
                            deadline,
                            nonce,
                            signature
                        )

                    await expect(tx)
                        .to.emit(erc20BurnableSigned, 'WithSignatureBurnedFrom')
                        .withArgs(
                            otherAccountAddress,
                            ownerAddress,
                            amount,
                            deadline,
                            nonce,
                            signature
                        )

                    // Verify balances and allowance
                    expect(await erc20.balanceOf(ownerAddress)).to.equal(350) // 500 - 150
                    expect(await erc20.totalSupply()).to.equal(350) // 500 - 150
                    expect(
                        await erc20.allowance(ownerAddress, otherAccountAddress)
                    ).to.equal(50) // 200 - 150
                })

                it('GIVEN expired signature WHEN calling burnFromWithSignature THEN should fail with ExpiredDeadline', async function () {
                    // First approve the spender
                    await erc20.connect(owner).approve(otherAccountAddress, 200)

                    const amount = 150
                    const nonce = 1
                    const deadline = 1
                    const message = {
                        sender: otherAccountAddress,
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await otherAccount.signTypedData(
                        domain,
                        burnFromTypes,
                        message
                    )

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnFromWithSignature(
                                otherAccountAddress,
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc20BurnableSigned,
                            'ExpiredDeadline'
                        )
                        .withArgs(deadline)
                })

                it('GIVEN invalid signature WHEN calling burnFromWithSignature THEN should fail with InvalidSignature', async function () {
                    // First approve the spender
                    await erc20.connect(owner).approve(otherAccountAddress, 200)

                    const amount = 150
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnFromWithSignature(
                                otherAccountAddress,
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                '0x' + '00'.repeat(65) // Invalid signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc20BurnableSigned,
                            'InvalidSignature'
                        )
                        .withArgs(otherAccountAddress)
                })
                it('GIVEN duplicate nonce WHEN calling burnFromWithSignature THEN should fail with WrongNonce', async function () {
                    // First approve the spender
                    await erc20.connect(owner).approve(otherAccountAddress, 200)

                    const amount = 150
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    const message = {
                        sender: otherAccountAddress,
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await otherAccount.signTypedData(
                        domain,
                        burnFromTypes,
                        message
                    )

                    // First call with valid nonce
                    await erc20BurnableSigned
                        .connect(otherAccount)
                        .burnFromWithSignature(
                            otherAccountAddress,
                            ownerAddress,
                            amount,
                            deadline,
                            nonce,
                            signature
                        )

                    // Second call with same nonce should fail
                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnFromWithSignature(
                                otherAccountAddress,
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                signature
                            )
                    )
                        .to.be.revertedWithCustomError(
                            erc20BurnableSigned,
                            'WrongNonce'
                        )
                        .withArgs(nonce, otherAccountAddress)
                })

                it('GIVEN insufficient allowance WHEN calling burnFromWithSignature THEN should fail with InsufficientAllowance', async function () {
                    // First approve less than needed
                    await erc20.connect(owner).approve(otherAccountAddress, 50)

                    const amount = 150 // More than approved
                    const nonce = 1
                    const deadline = Math.floor(Date.now() / 1000) + 3600

                    const message = {
                        sender: otherAccountAddress,
                        account: ownerAddress,
                        amount: amount,
                        deadline: deadline,
                        nonce: nonce,
                    }

                    const signature = await otherAccount.signTypedData(
                        domain,
                        burnFromTypes,
                        message
                    )

                    await expect(
                        erc20BurnableSigned
                            .connect(otherAccount)
                            .burnFromWithSignature(
                                otherAccountAddress,
                                ownerAddress,
                                amount,
                                deadline,
                                nonce,
                                signature
                            )
                    ).to.be.revertedWithCustomError(
                        erc20BurnableSigned,
                        'InsufficientAllowance'
                    )
                })
            })
        })
    })
})
