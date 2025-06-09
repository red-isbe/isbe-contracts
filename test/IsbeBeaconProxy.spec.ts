import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapperTransparent,
    ERC20TestWrapperTransparent__factory,
    IsbeUpgradeableBeacon__factory,
    IsbeUpgradeableBeacon,
    IsbeBeaconProxy__factory,
} from '../typechain-types'
import { MINTER_ROLE } from './constants'
import { Signer } from 'ethers'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('BeaconProxy', function () {
    let admin: Signer
    let upgradeableBeaconFactory: IsbeUpgradeableBeacon__factory
    let upgradableBeaconImplementation: IsbeUpgradeableBeacon
    let beaconProxyFactory: IsbeBeaconProxy__factory

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

        upgradeableBeaconFactory = await ethers.getContractFactory(
            'IsbeUpgradeableBeacon'
        )
        upgradableBeaconImplementation = await upgradeableBeaconFactory.deploy(
            await erc20ImplementationTransparent.getAddress()
        )

        await upgradableBeaconImplementation.waitForDeployment()

        beaconProxyFactory = await ethers.getContractFactory('IsbeBeaconProxy')
    }

    before(async () => {
        await deployInitial()
    })

    beforeEach(async () => {
        const beaconProxy = await beaconProxyFactory.deploy(
            await upgradableBeaconImplementation.getAddress()
        )
        await beaconProxy.waitForDeployment()

        erc20Transparent = ERC20TestWrapperTransparentFactory.attach(
            await beaconProxy.getAddress()
        ) as ERC20TestWrapperTransparent
        await erc20Transparent.initializeErc20(NAME, SYMBOL, DECIMALS)
        await erc20Transparent.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        await erc20Transparent.initializeAccessControl(adminAddress)
        await erc20Transparent.grantRole(MINTER_ROLE, adminAddress)
    })

    it('GIVEN an ERC20 deployed WHEN using Beacon Proxy THEN it can be initialized', async () => {
        expect(await erc20Transparent.name()).to.equal(NAME)
        expect(await erc20Transparent.symbol()).to.equal(SYMBOL)
        expect(await erc20Transparent.decimals()).to.equal(DECIMALS)

        expect(await erc20Transparent.metadata()).to.deep.equal([
            NAME,
            SYMBOL,
            DECIMALS,
        ])
    })

    it('GIVEN an ERC20 deployed linked to an Beacon proxy WHEN update THEN it can be updated', async () => {
        const erc20ImplementationTransparen_NEW =
            await ERC20TestWrapperTransparentFactory.deploy()

        await erc20ImplementationTransparen_NEW.waitForDeployment()

        await upgradableBeaconImplementation.upgradeTo(
            await erc20ImplementationTransparen_NEW.getAddress()
        )

        expect(await erc20Transparent.name()).to.equal(NAME)
        expect(await erc20Transparent.symbol()).to.equal(SYMBOL)
        expect(await erc20Transparent.decimals()).to.equal(DECIMALS)

        expect(await erc20Transparent.metadata()).to.deep.equal([
            NAME,
            SYMBOL,
            DECIMALS,
        ])

        await erc20Transparent.mint(await erc20Transparent.getAddress(), 100)
    })
})
