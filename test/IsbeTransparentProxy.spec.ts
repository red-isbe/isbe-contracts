import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {
    IsbeProxyAdmin,
    ERC20TestWrapperTransparent__factory,
    ERC20TestWrapperTransparent,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, MINTER_ROLE } from './constants'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('TransparentProxy', function () {
    let proxyAdmin: IsbeProxyAdmin
    let ERC20TestWrapperTransparentFactory: ERC20TestWrapperTransparent__factory
    let erc20Transparent: ERC20TestWrapperTransparent

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()

        const erc20TestWrapperTransparentFactory =
            await ethers.getContractFactory('ERC20TestWrapperTransparent')
        const erc20ImplementationTransparent =
            await erc20TestWrapperTransparentFactory.deploy()
        await erc20ImplementationTransparent.waitForDeployment()

        const proxyAdminFactory =
            await ethers.getContractFactory('IsbeProxyAdmin')
        const proxyAdminInstance = await proxyAdminFactory.deploy()
        await proxyAdminInstance.waitForDeployment()

        const transparentProxyFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )
        const transparentProxy = await transparentProxyFactory.deploy(
            await erc20ImplementationTransparent.getAddress(),
            await proxyAdminInstance.getAddress()
        )
        await transparentProxy.waitForDeployment()

        const erc20TransparentInstance =
            erc20TestWrapperTransparentFactory.attach(
                await transparentProxy.getAddress()
            ) as ERC20TestWrapperTransparent

        await erc20TransparentInstance.initializeErc20(NAME, SYMBOL, DECIMALS)
        await erc20TransparentInstance.initializeCap(10000)
        await erc20TransparentInstance.initializeAccessControl([
            {
                role: DEFAULT_ADMIN_ROLE,
                members: [adminAddress],
            },
        ])
        await erc20TransparentInstance.grantRole(MINTER_ROLE, adminAddress)

        return {
            admin: adminSigner,
            proxyAdmin: proxyAdminInstance,
            ERC20TestWrapperTransparentFactory:
                erc20TestWrapperTransparentFactory,
            erc20Transparent: erc20TransparentInstance,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        proxyAdmin = contracts.proxyAdmin
        ERC20TestWrapperTransparentFactory =
            contracts.ERC20TestWrapperTransparentFactory
        erc20Transparent = contracts.erc20Transparent
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
