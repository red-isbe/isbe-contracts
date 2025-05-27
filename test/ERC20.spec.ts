import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ERC20 } from '../typechain-types/index.js'

describe('ERC20', function () {
    const decimals = 2
    const name = 'ISBE stable token'
    const symbol = 'isbe'
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deploy(initialize: boolean = false) {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners()

        const ERC20 = await ethers.getContractFactory('ERC20')
        const erc20Implementation = await ERC20.deploy()

        const Proxy = await ethers.getContractFactory('DumbProxy')
        const proxy = await Proxy.deploy(erc20Implementation)
        await proxy.waitForDeployment()

        const erc20 = ERC20.attach(await proxy.getAddress()) as ERC20

        if (initialize) await erc20.initializeErc20(name, symbol, decimals)

        return {
            erc20: erc20,
            implementation: erc20Implementation,
            owner,
            otherAccount,
        }
    }

    describe('Deployment', () => {
        it('GIVEN an ERC20 WHEN it is deployed THEN the business logic is not possible to be initialized', async () => {
            const { erc20, implementation } = await deploy()

            await expect(implementation.initializeErc20(name, symbol, decimals))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
                )
        })

        it('GIVEN an ERC20 WHEN it is deployed THEN name, symbol and decimals can be retrieved', async () => {
            const { erc20, implementation, owner } = await deploy()
            expect(implementation).not.to.be.undefined
            await expect(erc20.initializeErc20(name, symbol, decimals))
                .to.emit(erc20, 'Erc20Initialized')
                .withArgs(name, symbol, decimals)

            expect(await erc20.decimals()).to.equal(decimals)
            expect(await erc20.name()).to.equal(name)
            expect(await erc20.symbol()).to.equal(symbol)

            expect(await erc20.totalSupply()).to.equal(0)
            expect(await erc20.balanceOf(owner.address)).to.equal(0)
            expect(
                await erc20.allowance(owner.address, owner.address)
            ).to.equal(0)
        })

        it('GIVEN a initialized ERC20 WHEN it try to initialize twice THEN it fails', async () => {
            const { erc20 } = await deploy(true)
            await expect(erc20.initializeErc20(name, symbol, decimals))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
                )
        })
    })

    describe('Allowance', () => {
        it('GIVEN an initialized ERC20 WHEN approve to zero address THEN fails', async () => {
            const { erc20 } = await deploy(true)
            await expect(
                erc20.approve(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN an allowance can be set', async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy(true)
            expect(implementation).not.to.be.undefined
            await expect(erc20.approve(otherAccount.address, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(owner.address, otherAccount.address, 100)

            expect(
                await erc20.allowance(owner.address, otherAccount.address)
            ).to.equal(100)
            expect(await erc20.balanceOf(owner.address)).to.equal(0)
            expect(await erc20.balanceOf(otherAccount.address)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can increase allowance', async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy(true)
            expect(implementation).not.to.be.undefined
            await expect(erc20.increaseAllowance(otherAccount.address, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(owner.address, otherAccount.address, 100)

            expect(
                await erc20.allowance(owner.address, otherAccount.address)
            ).to.equal(100)
            expect(await erc20.balanceOf(owner.address)).to.equal(0)
            expect(await erc20.balanceOf(otherAccount.address)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can decrease allowance', async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy(true)
            expect(implementation).not.to.be.undefined
            await erc20.approve(otherAccount.address, 200)
            await expect(erc20.decreaseAllowance(otherAccount.address, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(owner.address, otherAccount.address, 100)

            expect(
                await erc20.allowance(owner.address, otherAccount.address)
            ).to.equal(100)
            expect(await erc20.balanceOf(owner.address)).to.equal(0)
            expect(await erc20.balanceOf(otherAccount.address)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN cannot decrease allowance to less than 0', async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy()
            expect(implementation).not.to.be.undefined
            expect(owner).not.to.be.undefined
            await erc20.approve(otherAccount.address, 100)
            await expect(
                erc20.decreaseAllowance(otherAccount.address, 101)
            ).to.be.revertedWithCustomError(
                erc20,
                'DecreasedAllowanceBellowZero'
            )
        })
    })

    describe('Mint', () => {
        it('GIVEN an initialized ERC20 WHEN mint to zero address THEN fails', async () => {
            const { erc20 } = await deploy()
            await expect(
                erc20.mint(ethers.ZeroAddress, 100)
            ).to.revertedWithCustomError(erc20, 'AddressZero')
        })
        it('GIVEN an ERC20 WHEN it is initialized THEN mint can be made', async () => {
            const { erc20, implementation, owner } = await deploy()
            expect(implementation).not.to.be.undefined
            await expect(erc20.mint(owner.address, 100))
                .to.emit(erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, owner.address, 100)
        })
    })

    describe('Burn', () => {
        const prepare = async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy(true)
            expect(implementation).not.to.be.undefined
            await erc20.mint(owner.address, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            const { erc20 } = await deploy(true)
            await expect(
                erc20.burn(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            const { erc20, implementation, owner } = await deploy(true)
            expect(implementation).not.to.be.undefined
            await expect(
                erc20.burn(owner.address, 100)
            ).to.be.revertedWithCustomError(erc20, 'BurnAmountExceedsBalance')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            const { erc20, owner, otherAccount } = await prepare()
            await expect(erc20.burn(owner.address, 100))
                .to.emit(erc20, 'Transfer')
                .withArgs(owner.address, ethers.ZeroAddress, 100)

            expect(await erc20.totalSupply()).to.be.equal(0)
            expect(await erc20.balanceOf(owner.address)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccount.address)).to.be.equal(0)
        })
    })

    describe('Transfer', () => {
        const prepare = async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy(true)
            expect(implementation).not.to.be.undefined
            await erc20.mint(owner.address, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            const { erc20 } = await deploy(true)
            await expect(
                erc20.transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough balance THEN it fails', async () => {
            const { erc20, implementation, owner } = await deploy(true)
            expect(implementation).not.to.be.undefined
            await expect(
                erc20.transfer(owner.address, 100)
            ).to.be.revertedWithCustomError(
                erc20,
                'TransferAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            const { erc20, owner, otherAccount } = await prepare()
            await expect(erc20.transfer(otherAccount.address, 100))
                .to.emit(erc20, 'Transfer')
                .withArgs(owner.address, otherAccount.address, 100)

            expect(await erc20.totalSupply()).to.be.equal(100)
            expect(await erc20.balanceOf(owner.address)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccount.address)).to.be.equal(100)
            expect(
                await erc20.allowance(owner.address, otherAccount.address)
            ).to.be.equal(0)
        })
    })

    describe('TransferFrom', () => {
        const prepare = async () => {
            const { erc20, implementation, owner, otherAccount } =
                await deploy(true)
            expect(implementation).not.to.be.undefined
            await erc20.mint(owner.address, 100)
            await erc20.mint(otherAccount.address, 100)
            await erc20.connect(otherAccount).approve(owner.address, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            const { erc20, owner, otherAccount } = await prepare()
            await expect(
                erc20.transferFrom(ethers.ZeroAddress, otherAccount.address, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
            await expect(
                erc20.transferFrom(owner.address, ethers.ZeroAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough allowance THEN it fails', async () => {
            const { erc20, owner, otherAccount } = await prepare()
            await expect(
                erc20.transferFrom(otherAccount.address, owner.address, 101)
            ).to.be.revertedWithCustomError(erc20, 'InsufficientAllowance')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            const { erc20, owner, otherAccount } = await prepare()
            await expect(
                erc20.transferFrom(otherAccount.address, owner.address, 100)
            )
                .to.emit(erc20, 'Transfer')
                .withArgs(otherAccount.address, owner.address, 100)
                .to.emit(erc20, 'Approval')
                .withArgs(otherAccount.address, owner.address, 0)

            expect(await erc20.totalSupply()).to.be.equal(200)
            expect(await erc20.balanceOf(owner.address)).to.be.equal(200)
            expect(await erc20.balanceOf(otherAccount.address)).to.be.equal(0)
            expect(
                await erc20.allowance(owner.address, otherAccount.address)
            ).to.be.equal(0)
        })
    })
})
