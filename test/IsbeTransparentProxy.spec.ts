import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapper,
    ERC20TestWrapper__factory,
    ERC20TestWrapperUpdated,
    ERC20TestWrapperUpdated__factory,
    IsbeTransparentProxy__factory,
    IsbeProxyAdmin,
    IsbeProxyAdmin__factory,
} from '../typechain-types'
import { MINTER_ROLE } from './constants'
import { Signer } from 'ethers'

describe('TransparentProxy', function () {
    let admin: Signer
    let TransparentProxyFactory: IsbeTransparentProxy__factory
    let ProxyAdminFactory: IsbeProxyAdmin__factory
    let proxyAdmin: IsbeProxyAdmin

    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let ERC20TestWrapperUpdatedFactory: ERC20TestWrapperUpdated__factory
    let erc20Implementation: ERC20TestWrapper
    let erc20ImplementationUpdated: ERC20TestWrapperUpdated
    let erc20: ERC20TestWrapper
    let erc20Updated: ERC20TestWrapperUpdated

    async function deployInitial() {
        ;[admin] = await ethers.getSigners()
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')
        erc20Implementation = await ERC20TestWrapperFactory.deploy()

        ERC20TestWrapperUpdatedFactory = await ethers.getContractFactory(
            'ERC20TestWrapperUpdated'
        )
        erc20ImplementationUpdated =
            await ERC20TestWrapperUpdatedFactory.deploy()

        TransparentProxyFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )
        ProxyAdminFactory = await ethers.getContractFactory('IsbeProxyAdmin')
        proxyAdmin = await ProxyAdminFactory.deploy()

        await erc20Implementation.waitForDeployment()
        await erc20ImplementationUpdated.waitForDeployment()
        await proxyAdmin.waitForDeployment()
    }

    before(async () => {
        await deployInitial()
    })

    beforeEach(async () => {
        const transparentProxy = await TransparentProxyFactory.deploy(
            await erc20Implementation.getAddress(),
            await proxyAdmin.getAddress()
        )
        await transparentProxy.waitForDeployment()

        erc20 = ERC20TestWrapperFactory.attach(
            await transparentProxy.getAddress()
        ) as ERC20TestWrapper
        await erc20.initializeErc20('My Token', 'MTK', 18)
        await erc20.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        await erc20.initializeAccessControl(adminAddress)
        await erc20.grantRole(MINTER_ROLE, adminAddress)
        erc20Updated = ERC20TestWrapperUpdatedFactory.attach(
            await transparentProxy.getAddress()
        ) as ERC20TestWrapperUpdated
    })

    it('GIVEN an ERC20 deployed WHEN using Transparent Proxy THEN it can be initialized', async () => {
        expect(await erc20.name()).to.equal('My Token')
        expect(await erc20.symbol()).to.equal('MTK')
        expect(await erc20.decimals()).to.equal(18)
        await expect(erc20Updated.metadata()).to.be.revertedWithoutReason()
    })

    it('GIVEN an ERC20 deployed linked to an Transparent proxy WHEN update THEN it can be updated', async () => {
        await proxyAdmin.upgrade(
            await erc20.getAddress(),
            await erc20ImplementationUpdated.getAddress()
        )

        expect(await erc20Updated.name()).to.equal('My Token')
        expect(await erc20Updated.symbol()).to.equal('MTK')
        expect(await erc20Updated.decimals()).to.equal(18)

        expect(await erc20Updated.metadata()).to.deep.equal([
            'My Token',
            'MTK',
            18,
        ])

        await proxyAdmin.upgrade(
            await erc20.getAddress(),
            await erc20ImplementationUpdated.getAddress()
        )
        await erc20Updated.mint(await erc20Updated.getAddress(), 100)
    })
})
