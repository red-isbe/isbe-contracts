import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { ERC20, ERC20Capped } from '../typechain-types'
import {
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    ERC20_RESOLVER_KEY,
    ERC20_CAPPED_RESOLVER_KEY,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
describe('ERC20', function () {
    const decimals = 2
    const name = 'ISBE stable token'
    const symbol = 'isbe'

    let erc20Facet: ERC20

    let erc20: ERC20
    let erc20Capped: ERC20Capped

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
            erc20Capped: result.erc20Capped,
            erc20Controller: result.erc20Controller,
            accessControl: result.accessControl,
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
        const CappedFactory =
            await ethers.getContractFactory('ERC20CappedFacet')

        const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
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
            erc20Capped: result.erc20Capped,
            erc20Controller: result.erc20Controller,
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
        const CappedFactory =
            await ethers.getContractFactory('ERC20CappedFacet')

        const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
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
            erc20Capped: result.erc20Capped,
            erc20Controller: result.erc20Controller,
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
        const CappedFactory =
            await ethers.getContractFactory('ERC20CappedFacet')

        const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
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
            erc20Capped: result.erc20Capped,
            erc20Controller: result.erc20Controller,
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
                .withArgs(
                    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
                )
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
                .withArgs(
                    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
                )
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
    })

    describe('Cap', () => {
        it('GIVEN an ERC20 WHEN initializeCap with Zero THEN it fails', async () => {
            await expect(
                erc20Capped.initializeCap(0)
            ).to.be.revertedWithCustomError(erc20Capped, 'CapIsZero')
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
                .withArgs(
                    '0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b'
                )

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

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            const contracts = await loadFixture(deployPreparedTokensFixture)
            await expect(
                contracts.erc20.transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

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
                .to.emit(contracts.erc20Controller, 'ForceBurn')
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
                .to.emit(contracts.erc20Controller, 'ForceTransfer')
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
    })
})
