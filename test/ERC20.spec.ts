import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('ERC20', function () {
    const decimals = 2
    const name = 'ISBE stable token'
    const symbol = 'isbe'
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployOneYearLockFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await hre.ethers.getSigners()

        const ERC20 = await hre.ethers.getContractFactory('ERC20')
        const erc20 = await ERC20.deploy(name, symbol, decimals)

        return { erc20: erc20, owner, otherAccount }
    }

    describe('Deployment', function () {
        it('GIVEN an ERC20 WHEN it is deployed THEN name, symbol and decimals can be retrieved', async function () {
            const { erc20 } = await loadFixture(deployOneYearLockFixture)

            expect(await erc20.decimals()).to.equal(decimals)
            expect(await erc20.name()).to.equal(name)
            expect(await erc20.symbol()).to.equal(symbol)
        })
    })
})
