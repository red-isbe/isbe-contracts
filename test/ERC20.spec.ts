import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    AccessControl,
    ERC20,
    ERC20Burnable,
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
} from './constants'
import { deployGovernance } from './initialization'
describe('ERC20', function () {
    const decimals = 2
    const name = 'ISBE stable token'
    const symbol = 'isbe'

    let erc20Facet: ERC20

    let erc20: ERC20
    let erc20Snapshot: ERC20Snapshot
    let erc20Burnable: ERC20Burnable
    let erc203643Capped: ERC203643Capped
    let erc203643Controller: ERC203643Controller
    let accessControl: AccessControl

    let owner: Signer
    let ownerAddress: string
    let otherAccount: Signer
    let otherAccountAddress: string
    let alice: Signer
    let aliceAddress: string

    async function deploy(
        initialize: boolean = false,
        init_pause: boolean = false,
        initCap: number = 1000
    ) {
        ;[owner, otherAccount] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()

        const businessIds = []
        const data = []

        if (initialize) {
            const ERC20Factory = await ethers.getContractFactory('ERC20Facet')
            const CappedFactory = await ethers.getContractFactory(
                'ERC203643CappedFacet'
            )

            // Use the interfaces to encode the init data
            data.push(
                ERC20Factory.interface.encodeFunctionData('initializeErc20', [
                    name,
                    symbol,
                    decimals,
                ])
            )

            data.push(
                CappedFactory.interface.encodeFunctionData('initializeCap', [
                    initCap,
                ])
            )

            businessIds.push(ERC20_RESOLVER_KEY)
            businessIds.push(ERC203643_CAPPED_RESOLVER_KEY)
        }

        const result = await deployGovernance(
            owner,
            [],
            undefined,
            init_pause,
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
    }

    describe('Deployment', () => {
        it('GIVEN an ERC20 WHEN it is deployed THEN the business logic is not possible to be initialized', async () => {
            await deploy()

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
            await deploy()
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
            await deploy(true)
            await expect(erc20.initializeErc20(name, symbol, decimals))
                .to.be.revertedWithCustomError(
                    erc20,
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
            await deploy(true)
            await expect(
                erc20.approve(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN approve on a paused THEN fails', async () => {
            await deploy(true, true)

            //await pause.initializePause(true)

            await expect(
                erc20.approve(ownerAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN increase Allowance on a paused THEN fails', async () => {
            await deploy(true, true)

            //await pause.initializePause(true)

            await expect(
                erc20.increaseAllowance(ownerAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN decrease Allowance on a paused THEN fails', async () => {
            await deploy(true, true)

            //await pause.initializePause(true)

            await expect(
                erc20.decreaseAllowance(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN an allowance can be set', async () => {
            await deploy(true)
            await expect(erc20.approve(otherAccountAddress, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can increase allowance', async () => {
            await deploy(true)
            await expect(erc20.increaseAllowance(otherAccountAddress, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can decrease allowance', async () => {
            await deploy(true)
            await erc20.approve(otherAccountAddress, 200)
            await expect(erc20.decreaseAllowance(otherAccountAddress, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN cannot decrease allowance to less than 0', async () => {
            await deploy()
            expect(owner).not.to.be.undefined
            await erc20.approve(otherAccountAddress, 100)
            await expect(
                erc20.decreaseAllowance(otherAccountAddress, 101)
            ).to.be.revertedWithCustomError(
                erc20,
                'DecreasedAllowanceBellowZero'
            )
        })
    })

    describe('Cap', () => {
        it('GIVEN an ERC20 WHEN initializeCap with Zero THEN it fails', async () => {
            await deploy()
            await expect(
                erc203643Capped.initializeCap(0)
            ).to.be.revertedWithCustomError(erc203643Capped, 'CapIsZero')
        })

        it('GIVEN an ERC20 WHEN cap is initialized THEN it can be retrieved', async () => {
            await deploy()
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
            await deploy(true)
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
            await deploy(true, true)

            await expect(
                erc203643Capped.setCap(1000000)
            ).revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non capper setting cap THEN it fails', async () => {
            await deploy(true)

            await expect(
                erc203643Capped.setCap(1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an initialized ERC20 WHEN setting cap over total supply THEN it succeeds', async () => {
            await deploy(true)
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
            await deploy(true)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(
                erc203643Capped.mint(ethers.ZeroAddress, 100)
            ).to.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN mint a paused token THEN fails', async () => {
            await deploy(true, true)

            await expect(
                erc203643Capped.mint(ownerAddress, 100)
            ).to.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non MINTER mints THEN it fails', async () => {
            await deploy(true)

            await expect(
                erc203643Capped.mint(ownerAddress, 0)
            ).revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN mint can be made', async () => {
            await deploy(true)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(erc203643Capped.mint(ownerAddress, 100))
                .to.emit(erc203643Capped, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 100)
        })
    })

    describe('Burn', () => {
        const prepare = async () => {
            await deploy(true)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await erc203643Capped.mint(ownerAddress, 100)
        }

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            await deploy(true)
            await expect(erc20Burnable.burn(100)).to.be.revertedWithCustomError(
                erc20,
                'BurnAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to burn a paused token THEN it fails', async () => {
            await deploy(true, true)

            await expect(erc20Burnable.burn(0)).to.be.revertedWithCustomError(
                erc20,
                'IsPaused'
            )
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            await prepare()
            await expect(erc20Burnable.burn(100))
                .to.emit(erc20Burnable, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 100)

            expect(await erc20.totalSupply()).to.be.equal(0)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
        })
    })

    describe('BurnFrom', () => {
        const prepare = async (init_pause: boolean = false) => {
            await deploy(true, init_pause)

            if (init_pause) return

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(otherAccountAddress, 50)
            await erc20.connect(otherAccount).approve(ownerAddress, 100)
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            await deploy(true)
            await expect(
                erc20Burnable.burnFrom(ethers.ZeroAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            await prepare()
            await expect(
                erc20Burnable.burnFrom(otherAccountAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'BurnAmountExceedsBalance')
        })

        it('GIVEN an ERC20 initialized WHEN try to burn a paused token THEN it fails', async () => {
            await prepare(true)

            await expect(
                erc20Burnable.burnFrom(otherAccountAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            await prepare()
            await expect(erc20Burnable.burnFrom(otherAccountAddress, 25))
                .to.emit(erc20Burnable, 'Transfer')
                .withArgs(otherAccountAddress, ethers.ZeroAddress, 25)
                .to.emit(erc20Burnable, 'Approval')
                .withArgs(otherAccountAddress, ownerAddress, 75)

            expect(await erc20.totalSupply()).to.be.equal(25)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(25)
            expect(
                await erc20.allowance(otherAccountAddress, ownerAddress)
            ).to.be.equal(75)
        })
    })

    describe('Transfer', () => {
        const prepare = async (init_pause: boolean = false) => {
            await deploy(true, init_pause)

            if (init_pause) return

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            await deploy(true)
            await expect(
                erc20.transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough balance THEN it fails', async () => {
            await deploy(true)
            await expect(
                erc20.transfer(ownerAddress, 100)
            ).to.be.revertedWithCustomError(
                erc20,
                'TransferAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer from a paused token THEN it fails', async () => {
            await deploy(true, true)

            await expect(
                erc20.transfer(ownerAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            await prepare()
            await expect(erc20.transfer(otherAccountAddress, 100))
                .to.emit(erc20, 'Transfer')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(await erc20.totalSupply()).to.be.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(100)
            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.be.equal(0)
        })
    })

    describe('TransferFrom', () => {
        const prepare = async (init_pause: boolean = false) => {
            await deploy(true, init_pause)

            if (init_pause) return

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            await erc203643Capped.mint(otherAccountAddress, 100)
            await erc20.connect(otherAccount).approve(ownerAddress, 100)
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            await prepare()
            await expect(
                erc20.transferFrom(ethers.ZeroAddress, otherAccountAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
            await expect(
                erc20.transferFrom(ownerAddress, ethers.ZeroAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough allowance THEN it fails', async () => {
            await prepare()
            await expect(
                erc20.transferFrom(otherAccountAddress, ownerAddress, 101)
            ).to.be.revertedWithCustomError(erc20, 'InsufficientAllowance')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer from a paused token THEN it fails', async () => {
            await prepare(true)

            await expect(
                erc20.transferFrom(otherAccountAddress, ownerAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            await prepare()
            await expect(
                erc20.transferFrom(otherAccountAddress, ownerAddress, 100)
            )
                .to.emit(erc20, 'Transfer')
                .withArgs(otherAccountAddress, ownerAddress, 100)
                .to.emit(erc20, 'Approval')
                .withArgs(otherAccountAddress, ownerAddress, 0)

            expect(await erc20.totalSupply()).to.be.equal(200)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(200)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
            expect(
                await erc20.allowance(otherAccountAddress, ownerAddress)
            ).to.be.equal(0)
        })

        it(
            'GIVEN an ERC20 ' +
                'WHEN transferFrom with max(uint256) to allowance ' +
                'THEN a transfer can be made',
            async () => {
                await prepare()
                await erc20
                    .connect(otherAccount)
                    .approve(ownerAddress, ethers.MaxUint256)
                await expect(
                    erc20.transferFrom(otherAccountAddress, ownerAddress, 100)
                )
                    .to.emit(erc20, 'Transfer')
                    .withArgs(otherAccountAddress, ownerAddress, 100)

                expect(await erc20.totalSupply()).to.be.equal(200)
                expect(await erc20.balanceOf(ownerAddress)).to.be.equal(200)
                expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(
                    0
                )
                expect(
                    await erc20.allowance(otherAccountAddress, ownerAddress)
                ).to.be.equal(ethers.MaxUint256)
            }
        )
    })

    describe('Snapshot', () => {
        const prepare = async (init_pause: boolean = false) => {
            await deploy(true, init_pause)

            if (init_pause) return

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc203643Capped.mint(ownerAddress, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 WHEN not exists snapshot THEN balanceOfAt and totalSupplyAt fails', async () => {
            await prepare()
            await expect(
                erc20Snapshot.balanceOfAt(ownerAddress, 0)
            ).to.revertedWithCustomError(erc20Snapshot, 'SnapshotWithIdZero')
            await expect(
                erc20Snapshot.totalSupplyAt(0)
            ).to.revertedWithCustomError(erc20Snapshot, 'SnapshotWithIdZero')
            await expect(
                erc20Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.revertedWithCustomError(erc20Snapshot, 'NonExistentSnapshotId')
            await expect(
                erc20Snapshot.totalSupplyAt(1)
            ).to.revertedWithCustomError(erc20Snapshot, 'NonExistentSnapshotId')
        })

        it('GIVEN an ERC20 WHEN taking a snapshot of a paused token THEN fails', async () => {
            await prepare(true)

            await expect(
                erc20Snapshot.snapshot()
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN non snapshoter takes a snapshot THEN fails', async () => {
            await prepare()

            erc20Snapshot = erc20Snapshot.connect(otherAccount)

            await expect(
                erc20Snapshot.snapshot()
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a snapshot can be made', async () => {
            await prepare()
            await accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)

            await expect(erc20Snapshot.snapshot())
                .to.emit(erc20Snapshot, 'Snapshot')
                .withArgs(1)
            expect(
                await erc20Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.equal(100)
            expect(
                await erc20Snapshot.balanceOfAt(otherAccountAddress, 1)
            ).to.be.equal(0)
            expect(await erc20Snapshot.totalSupplyAt(1)).to.be.equal(100)
            await erc20.transfer(otherAccountAddress, 25)
            await erc203643Capped.mint(otherAccountAddress, 25)
            expect(
                await erc20Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.equal(100)
            expect(
                await erc20Snapshot.balanceOfAt(otherAccountAddress, 1)
            ).to.be.equal(0)
            expect(await erc20Snapshot.totalSupplyAt(1)).to.be.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(75)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(50)
            expect(await erc20.totalSupply()).to.be.equal(125)
        })
    })

    describe('Controller', () => {
        const MINTED = 100

        const prepare = async (init_pause: boolean = false) => {
            await deploy(true, init_pause)

            if (init_pause) return

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

            expect(await erc20.totalSupply()).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
        })

        it('GIVEN an ERC20 initialized WHEN try to force transfer a paused token THEN it fails', async () => {
            await prepare(true)

            await expect(
                erc203643Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force transfer THEN it fails', async () => {
            await prepare()

            erc203643Controller = erc203643Controller.connect(otherAccount)

            await expect(
                erc203643Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN forceTransfer from zero address THEN fails', async () => {
            await prepare()
            await expect(
                erc203643Controller.forceTransfer(
                    ethers.ZeroAddress,
                    ownerAddress,
                    MINTED
                )
            ).revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force transfer can be made', async () => {
            await prepare()
            await expect(
                erc203643Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED
                )
            )
                .to.emit(erc203643Controller, 'ForceTransfer')
                .withArgs(
                    ownerAddress,
                    otherAccountAddress,
                    ownerAddress,
                    MINTED
                )

            expect(await erc20.totalSupply()).to.be.equal(MINTED)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(MINTED)
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
