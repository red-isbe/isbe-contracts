import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapper,
    ERC20TestWrapper__factory,
    ERC20TestWrapperUpdated__factory,
    ERC20TestWrapperUpdated,
    IsbeERC1967Proxy__factory,
} from '../typechain-types'
import { MINTER_ROLE } from './constants'
import { Signer } from 'ethers/lib.esm'

describe('IsbeERC1967Proxy', function () {
    let admin: Signer
    let IsbeERC1967ProxyFactory: IsbeERC1967Proxy__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let ERC20TestWrapperUpdatedFactory: ERC20TestWrapperUpdated__factory
    let erc20Impl: ERC20TestWrapper
    let erc20ImplUpdated: ERC20TestWrapperUpdated
    let erc20: ERC20TestWrapper
    let erc20Updated: ERC20TestWrapperUpdated

    async function deployInitial() {
        ;[admin] = await ethers.getSigners()
        // Despliegue AccessControl logic
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')
        erc20Impl = await ERC20TestWrapperFactory.deploy()
        ERC20TestWrapperUpdatedFactory = await ethers.getContractFactory(
            'ERC20TestWrapperUpdated'
        )
        erc20ImplUpdated = await ERC20TestWrapperUpdatedFactory.deploy()
        IsbeERC1967ProxyFactory =
            await ethers.getContractFactory('IsbeERC1967Proxy')
        await erc20Impl.waitForDeployment()
        await erc20ImplUpdated.waitForDeployment()
    }

    before(async () => {
        await deployInitial()
    })

    beforeEach(async () => {
        const IsbeERC1967Proxy = await IsbeERC1967ProxyFactory.deploy(
            await erc20Impl.getAddress()
        )
        await IsbeERC1967Proxy.waitForDeployment()
        erc20 = ERC20TestWrapperFactory.attach(
            await IsbeERC1967Proxy.getAddress()
        ) as ERC20TestWrapper
        await erc20.initializeErc20('My Token', 'MTK', 18)
        await erc20.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        await erc20.initializeAccessControl(adminAddress)
        await erc20.grantRole(MINTER_ROLE, adminAddress)
        erc20Updated = ERC20TestWrapperUpdatedFactory.attach(
            await IsbeERC1967Proxy.getAddress()
        ) as ERC20TestWrapperUpdated
    })

    it('GIVEN an ERC20 deployed WHEN deploy a Uups proxy THEN it can be initialized', async () => {
        expect(await erc20.name()).to.equal('My Token')
        expect(await erc20.symbol()).to.equal('MTK')
        expect(await erc20.decimals()).to.equal(18)
        await expect(erc20Updated.metadata()).to.be.revertedWithoutReason()
    })

    it('GIVEN an ERC20 deployed linked to an UUPS proxy WHEN update THEN it can be updated', async () => {
        await erc20.upgradeTo(await erc20ImplUpdated.getAddress())
        expect(await erc20.name()).to.equal('My Token')
        expect(await erc20.symbol()).to.equal('MTK')
        expect(await erc20.decimals()).to.equal(18)
        expect(await erc20Updated.metadata()).to.be.deep.equal([
            'My Token',
            'MTK',
            18,
        ])
        // To complete coverage
        await erc20.upgradeTo(await erc20ImplUpdated.getAddress())
        await erc20.mint(await erc20.getAddress(), 100)
    })
})
