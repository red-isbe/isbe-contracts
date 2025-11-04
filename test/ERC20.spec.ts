import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, HDNodeWallet } from 'ethers'
import {
    ERC20,
    ERC20Snapshot,
    ERC203643Capped,
    ERC203643Controller,
} from '../typechain-types'
import {
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    ERC20_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    DID_REGISTRY_ROLE,
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
    let erc20Snapshot: ERC20Snapshot
    let erc203643Capped: ERC203643Capped
    let erc203643Controller: ERC203643Controller
    let accessControl: AccessControl

    let owner: Signer
    let ownerAddress: string
    let otherAccount: Signer
    let otherAccountAddress: string
    let alice: Signer
    let aliceAddress: string

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
        const CappedFactory = await ethers.getContractFactory(
            'ERC203643CappedFacet'
        )

        const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
        const data = [
            ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                name,
                symbol,
                decimals,
            ]),
            CappedFactory.interface.encodeFunctionData('initializeCap', [1000]),
        ]

        businessIds.push(ERC20_RESOLVER_KEY)
        businessIds.push(ERC203643_CAPPED_RESOLVER_KEY)

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

        erc20 = result.erc20
        erc20Snapshot = result.erc20Snapshot
        erc20Burnable = result.erc20Burnable
        erc203643Capped = result.erc203643Capped
        erc203643Controller = result.erc203643Controller

        accessControl = result.accessControl
        erc20Facet = result.erc20Facet

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

        it('GIVEN an ERC20 WHEN initializing with empty name THEN it fails', async () => {
            await deploy()
            await expect(
                erc20.initializeErc20('', symbol, decimals)
            ).to.be.revertedWithCustomError(erc20, 'EmptyString')
        })

        it('GIVEN an ERC20 WHEN initializing with empty symbol THEN it fails', async () => {
            await deploy()
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
    })

    describe('Cap', () => {
        it('GIVEN an ERC20 WHEN initializeCap with Zero THEN it fails', async () => {
            await expect(
                erc203643Capped.initializeCap(0)
            ).to.be.revertedWithCustomError(erc203643Capped, 'CapIsZero')
        })

        it('GIVEN an ERC20 WHEN cap is initialized THEN it can be retrieved', async () => {
            await expect(erc203643Capped.initializeCap(1000))
                .to.emit(erc203643Capped, 'CapSet')
                .withArgs(ownerAddress, 1000)
            await expect(erc203643Capped.initializeCap(1))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x1f3e5d6c7b8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8'
                )

            expect(await erc203643Capped.cap()).to.equal(1000)
        })

        it('GIVEN an initialized ERC20 WHEN mint over cap THEN it fails', async () => {
            await deploy(true)
            expect(await erc203643Capped.cap()).to.equal(1000)
            await expect(
                erc203643Capped.mint(ownerAddress, 1001)
            ).revertedWithCustomError(erc203643Capped, 'CapExceeded')
        })

        it('GIVEN an initialized ERC20 WHEN setting cap below total supply THEN it fails', async () => {
            await loadFixture(deployPreparedTokensFixture)
            const totalSupply = 10

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc203643Capped.mint(ownerAddress, totalSupply)

            const newCap = totalSupply - 1

            await expect(erc203643Capped.setCap(newCap))
                .revertedWithCustomError(
                    erc203643Capped,
                    'NewCapIsLessThanTotalSupply'
                )
                .withArgs(newCap, totalSupply)
        })

        it('GIVEN an initialized ERC20 WHEN setting cap on a paused token THEN it fails', async () => {
            await loadFixture(deployPausedFixture)

            await expect(
                erc203643Capped.setCap(1000000)
            ).revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non capper setting cap THEN it fails', async () => {
            await loadFixture(deployInitializedFixture)

            await expect(
                erc203643Capped.setCap(1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an initialized ERC20 WHEN setting cap over total supply THEN it succeeds', async () => {
            await loadFixture(deployPreparedTokensFixture)
            const totalSupply = 10

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc203643Capped.mint(ownerAddress, totalSupply)

            const newCap = totalSupply + 1

            await expect(erc203643Capped.setCap(newCap))
                .to.emit(erc203643Capped, 'CapSet')
                .withArgs(ownerAddress, newCap)
        })
    })

    describe('Mint', () => {
        it('GIVEN an initialized ERC20 WHEN mint to zero address THEN fails', async () => {
            await loadFixture(deployPreparedTokensFixture)

            await expect(
                erc203643Capped.mint(ethers.ZeroAddress, 100)
            ).to.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN mint a paused token THEN fails', async () => {
            await loadFixture(deployPausedFixture)

            await expect(
                erc203643Capped.mint(ownerAddress, 100)
            ).to.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non MINTER mints THEN it fails', async () => {
            await loadFixture(deployInitializedFixture)

            await expect(
                erc203643Capped.mint(ownerAddress, 0)
            ).revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN mint can be made', async () => {
            await loadFixture(deployPreparedTokensFixture)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(erc203643Capped.mint(ownerAddress, 100))
                .to.emit(erc203643Capped, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 100)
        })
    })

    describe('Burn', () => {
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

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(otherAccountAddress, 50)
            await erc20.connect(otherAccount).approve(ownerAddress, 100)
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

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            return { erc20, owner, otherAccount }
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

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            await erc203643Capped.mint(otherAccountAddress, 100)
            await erc20.connect(otherAccount).approve(ownerAddress, 100)
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

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            return { erc20, owner, otherAccount }
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
            expect(await erc20Snapshot.totalSupplyAt(1)).to.be.equal(100)
            await erc20.transfer(otherAccountAddress, 25)
            await erc203643Capped.mint(otherAccountAddress, 25)
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

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

            await erc203643Capped.mint(otherAccountAddress, MINTED)
        }

        it('GIVEN an ERC20 initialized WHEN try to force burn a paused token THEN it fails', async () => {
            await prepare(true)

            await expect(
                erc203643Controller.forceBurn(otherAccountAddress, MINTED - 1)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force burn THEN it fails', async () => {
            await prepare()

            erc203643Controller = erc203643Controller.connect(otherAccount)

            await expect(
                erc203643Controller.forceBurn(otherAccountAddress, MINTED - 1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN forceBurn from zero address THEN it fails', async () => {
            await prepare()
            await expect(
                erc203643Controller.forceBurn(ethers.ZeroAddress, MINTED)
            ).revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force burn can be made', async () => {
            await prepare()
            await expect(
                erc203643Controller.forceBurn(otherAccountAddress, MINTED)
            )
                .to.emit(erc203643Controller, 'ForceBurn')
                .withArgs(ownerAddress, otherAccountAddress, MINTED)

            expect(await contracts.erc20.totalSupply()).to.be.equal(0)
            expect(
                await contracts.erc20.balanceOf(contracts.otherAccountAddress)
            ).to.be.equal(0)
        })

        it('GIVEN an ERC20 initialized WHEN try to force transfer a paused token THEN it fails', async () => {
            const contracts = await prepare(true)

            await expect(
                erc203643Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force transfer THEN it fails', async () => {
            const contracts = await prepare()

            erc203643Controller = erc203643Controller.connect(otherAccount)

            await expect(
                erc203643Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
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
                erc203643Controller.forceTransfer(
                    ethers.ZeroAddress,
                    contracts.ownerAddress,
                    MINTED
                )
            ).to.be.revertedWithCustomError(contracts.erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force transfer can be made', async () => {
            const contracts = await prepare()
            await expect(
                erc203643Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED
                )
            )
                .to.emit(erc203643Controller, 'ForceTransfer')
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

    describe('Mixed DID and Address Role Access', function () {
        let didWallet: HDNodeWallet
        let did: string
        let addressAccount: Signer
        let addressAccountAddress: string
        let useCaseAccessControlDid: IAccessControlDid
        let erc20Mixed: ERC20
        let erc20CappedMixed: ERC20Capped
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
            const CappedFactory =
                await ethers.getContractFactory('ERC20CappedFacet')

            const businessIds = [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY]
            const data = [
                ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                    name,
                    symbol,
                    decimals,
                ]),
                CappedFactory.interface.encodeFunctionData('initializeCap', [
                    1000,
                ]),
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
                erc20Capped: govResult.erc20Capped,
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

    describe('batchTransfer', () => {
        const prepare = async (init_pause: boolean = false) => {
            await deploy(true, init_pause)

            if (init_pause) return

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            return { erc20, owner, alice }
        }

        it('GIVEN ERC20 mode WHEN arrays length mismatch THEN reverts with NotSameLengthArray', async () => {
            await prepare()
            ;[alice] = await ethers.getSigners()
            aliceAddress = await alice.getAddress()
            const bobAddress = otherAccountAddress
            await expect(
                erc20.connect(alice).batchTransfer([bobAddress], [100n, 200n])
            ).to.be.revertedWithCustomError(erc20, 'NotSameLengthArray')
        })

        it('GIVEN ERC20 mode WHEN empty arrays THEN succeeds without operations', async () => {
            await prepare()
            ;[alice] = await ethers.getSigners()
            aliceAddress = await alice.getAddress()
            const initialBalance = await erc20.balanceOf(aliceAddress)

            await erc20.connect(alice).batchTransfer([], [])

            expect(await erc20.balanceOf(aliceAddress)).to.equal(initialBalance)
        })

        it('GIVEN ERC20 mode WHEN batchTransfer exceeds total balance THEN reverts', async () => {
            await prepare()
            ;[alice] = await ethers.getSigners()
            aliceAddress = await alice.getAddress()
            const bobAddress = otherAccountAddress
            const totalBalance = await erc20Facet.balanceOf(aliceAddress)
            const excessAmount = totalBalance + 1n

            await expect(
                erc20Facet
                    .connect(alice)
                    .batchTransfer([bobAddress], [excessAmount])
            ).to.be.reverted
        })
    })
})
