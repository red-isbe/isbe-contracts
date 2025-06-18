import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    IsbeTransparentProxy__factory,
    IsbeProxyAdmin,
    IsbeProxyAdmin__factory,
    ERC20TestWrapperTransparent__factory,
    ERC20TestWrapperTransparent,
} from '../typechain-types'
import { MINTER_ROLE } from './constants'
import { Signer } from 'ethers'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('TransparentProxy', function () {
    let admin: Signer
    let TransparentProxyFactory: IsbeTransparentProxy__factory
    let ProxyAdminFactory: IsbeProxyAdmin__factory
    let proxyAdmin: IsbeProxyAdmin

    let ERC20TestWrapperTransparentFactory: ERC20TestWrapperTransparent__factory
    let erc20ImplementationTransparent: ERC20TestWrapperTransparent
    let erc20Transparent: ERC20TestWrapperTransparent

    async function deployInitial() {
        ;[admin] = await ethers.getSigners()
        ERC20TestWrapperTransparentFactory = await ethers.getContractFactory(
            'ERC20TestWrapperTransparent'
        )
        erc20ImplementationTransparent =
            await ERC20TestWrapperTransparentFactory.deploy()

        await erc20ImplementationTransparent.waitForDeployment()

        TransparentProxyFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )
        ProxyAdminFactory = await ethers.getContractFactory('IsbeProxyAdmin')
        proxyAdmin = await ProxyAdminFactory.deploy()

        await proxyAdmin.waitForDeployment()
    }

    before(async () => {
        await deployInitial()
    })

    beforeEach(async () => {
        const transparentProxy = await TransparentProxyFactory.deploy(
            await erc20ImplementationTransparent.getAddress(),
            await proxyAdmin.getAddress()
        )

        await transparentProxy.waitForDeployment()

        erc20Transparent = ERC20TestWrapperTransparentFactory.attach(
            await transparentProxy.getAddress()
        ) as ERC20TestWrapperTransparent

        await erc20Transparent.initializeErc20(NAME, SYMBOL, DECIMALS)
        await erc20Transparent.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        await erc20Transparent.initializeAccessControl(adminAddress)
        await erc20Transparent.grantRole(MINTER_ROLE, adminAddress)
    })

    it('GIVEN an ERC20 deployed WHEN using Transparent Proxy THEN it can be initialized', async () => {
        expect(await erc20Transparent.name()).to.equal(NAME)
        expect(await erc20Transparent.symbol()).to.equal(SYMBOL)
        expect(await erc20Transparent.decimals()).to.equal(DECIMALS)
    })

    it('GIVEN an ERC20 deployed linked to an Transparent proxy WHEN update THEN it can be updated', async () => {
        const erc20ImplementationTransparent_2 =
            await ERC20TestWrapperTransparentFactory.deploy()

        await erc20ImplementationTransparent_2.waitForDeployment()

        await proxyAdmin.upgrade(
            await erc20Transparent.getAddress(),
            await erc20ImplementationTransparent_2.getAddress()
        )

        expect(await erc20Transparent.name()).to.equal(NAME)
        expect(await erc20Transparent.symbol()).to.equal(SYMBOL)
        expect(await erc20Transparent.decimals()).to.equal(DECIMALS)
    })
})
