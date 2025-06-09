import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    IsbeERC1967Proxy__factory,
    ERC20TestWrapperUUPS__factory,
    ERC20TestWrapperUUPS,
} from '../typechain-types'
import { MINTER_ROLE } from './constants'
import { Signer } from 'ethers'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('IsbeERC1967Proxy', function () {
    let admin: Signer
    let IsbeERC1967ProxyFactory: IsbeERC1967Proxy__factory
    let ERC20TestWrapperUUPSFactory: ERC20TestWrapperUUPS__factory
    let erc20ImplementationUUPS: ERC20TestWrapperUUPS
    let erc20UUPS: ERC20TestWrapperUUPS

    async function deployInitial() {
        ;[admin] = await ethers.getSigners()

        ERC20TestWrapperUUPSFactory = await ethers.getContractFactory(
            'ERC20TestWrapperUUPS'
        )
        erc20ImplementationUUPS = await ERC20TestWrapperUUPSFactory.deploy()

        await erc20ImplementationUUPS.waitForDeployment()

        IsbeERC1967ProxyFactory =
            await ethers.getContractFactory('IsbeERC1967Proxy')
    }

    before(async () => {
        await deployInitial()
    })

    beforeEach(async () => {
        const IsbeERC1967Proxy = await IsbeERC1967ProxyFactory.deploy(
            await erc20ImplementationUUPS.getAddress()
        )
        await IsbeERC1967Proxy.waitForDeployment()

        erc20UUPS = ERC20TestWrapperUUPSFactory.attach(
            await IsbeERC1967Proxy.getAddress()
        ) as ERC20TestWrapperUUPS

        await erc20UUPS.initializeErc20(NAME, SYMBOL, DECIMALS)
        await erc20UUPS.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        await erc20UUPS.initializeAccessControl(adminAddress)
        await erc20UUPS.grantRole(MINTER_ROLE, adminAddress)
    })

    it('GIVEN an ERC20 deployed WHEN deploy a Uups proxy THEN it can be initialized', async () => {
        expect(await erc20UUPS.name()).to.equal(NAME)
        expect(await erc20UUPS.symbol()).to.equal(SYMBOL)
        expect(await erc20UUPS.decimals()).to.equal(DECIMALS)
        expect(await erc20UUPS.metadata()).to.deep.equal([
            NAME,
            SYMBOL,
            DECIMALS,
        ])
    })

    it('GIVEN an ERC20 deployed linked to an UUPS proxy WHEN update THEN it can be updated', async () => {
        const erc20ImplementationUUPS_2 =
            await ERC20TestWrapperUUPSFactory.deploy()

        await erc20ImplementationUUPS_2.waitForDeployment()

        await erc20UUPS.upgradeTo(await erc20ImplementationUUPS_2.getAddress())

        expect(await erc20UUPS.name()).to.equal(NAME)
        expect(await erc20UUPS.symbol()).to.equal(SYMBOL)
        expect(await erc20UUPS.decimals()).to.equal(DECIMALS)
        expect(await erc20UUPS.metadata()).to.deep.equal([
            NAME,
            SYMBOL,
            DECIMALS,
        ])
    })
})
