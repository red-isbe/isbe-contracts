import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {
    ERC20TestWrapperUUPS__factory,
    ERC20TestWrapperUUPS,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, MINTER_ROLE } from './constants'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('IsbeERC1967Proxy', function () {
    let ERC20TestWrapperUUPSFactory: ERC20TestWrapperUUPS__factory
    let erc20UUPS: ERC20TestWrapperUUPS

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()

        const erc20TestWrapperUUPSFactory = await ethers.getContractFactory(
            'ERC20TestWrapperUUPS'
        )
        const erc20ImplementationUUPS =
            await erc20TestWrapperUUPSFactory.deploy()
        await erc20ImplementationUUPS.waitForDeployment()

        const isbeERC1967ProxyFactory =
            await ethers.getContractFactory('IsbeERC1967Proxy')
        const isbeERC1967Proxy = await isbeERC1967ProxyFactory.deploy(
            await erc20ImplementationUUPS.getAddress()
        )
        await isbeERC1967Proxy.waitForDeployment()

        const erc20UUPSInstance = erc20TestWrapperUUPSFactory.attach(
            await isbeERC1967Proxy.getAddress()
        ) as ERC20TestWrapperUUPS

        await erc20UUPSInstance.initializeErc20(NAME, SYMBOL, DECIMALS)
        await erc20UUPSInstance.initializeCap(10000)
        await erc20UUPSInstance.initializeAccessControl([
            {
                role: DEFAULT_ADMIN_ROLE,
                members: [adminAddress],
            },
        ])
        await erc20UUPSInstance.grantRole(MINTER_ROLE, adminAddress)

        return {
            admin: adminSigner,
            ERC20TestWrapperUUPSFactory: erc20TestWrapperUUPSFactory,
            erc20UUPS: erc20UUPSInstance,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        ERC20TestWrapperUUPSFactory = contracts.ERC20TestWrapperUUPSFactory
        erc20UUPS = contracts.erc20UUPS
    })

    it('GIVEN an ERC20 deployed WHEN deploy a Uups proxy THEN it can be initialized', async () => {
        expect(await erc20UUPS.name()).to.equal(NAME)
        expect(await erc20UUPS.symbol()).to.equal(SYMBOL)
        expect(await erc20UUPS.decimals()).to.equal(DECIMALS)
    })

    it('GIVEN an ERC20 deployed linked to an UUPS proxy WHEN update THEN it can be updated', async () => {
        const erc20ImplementationUUPS_2 =
            await ERC20TestWrapperUUPSFactory.deploy()

        await erc20ImplementationUUPS_2.waitForDeployment()

        await erc20UUPS.upgradeTo(await erc20ImplementationUUPS_2.getAddress())

        expect(await erc20UUPS.name()).to.equal(NAME)
        expect(await erc20UUPS.symbol()).to.equal(SYMBOL)
        expect(await erc20UUPS.decimals()).to.equal(DECIMALS)
    })
})
