/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapperTransparent,
    ERC20TestWrapperTransparent__factory,
    IsbeUpgradeableBeacon,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, MINTER_ROLE } from '../utils/constants'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { randomString } from './support'

const NAME = randomString(8) + ' Token'
const SYMBOL = randomString(3).toUpperCase()
const DECIMALS = 18

describe('BeaconProxy', function () {
    let upgradableBeaconImplementation: IsbeUpgradeableBeacon
    let erc20Transparent: ERC20TestWrapperTransparent
    let ERC20TestWrapperTransparentFactory: ERC20TestWrapperTransparent__factory

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()

        const erc20TestWrapperTransparentFactory =
            await ethers.getContractFactory('ERC20TestWrapperTransparent')
        const erc20ImplementationTransparent =
            await erc20TestWrapperTransparentFactory.deploy()
        await erc20ImplementationTransparent.waitForDeployment()

        const upgradeableBeaconFactory = await ethers.getContractFactory(
            'IsbeUpgradeableBeacon'
        )
        const upgradableBeaconImplementationInstance =
            await upgradeableBeaconFactory.deploy(
                await erc20ImplementationTransparent.getAddress()
            )
        await upgradableBeaconImplementationInstance.waitForDeployment()

        const beaconProxyFactory =
            await ethers.getContractFactory('IsbeBeaconProxy')
        const beaconProxy = await beaconProxyFactory.deploy(
            await upgradableBeaconImplementationInstance.getAddress()
        )
        await beaconProxy.waitForDeployment()

        const erc20TransparentInstance =
            erc20TestWrapperTransparentFactory.attach(
                await beaconProxy.getAddress()
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
            upgradableBeaconImplementation:
                upgradableBeaconImplementationInstance,
            erc20Transparent: erc20TransparentInstance,
            ERC20TestWrapperTransparentFactory:
                erc20TestWrapperTransparentFactory,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        upgradableBeaconImplementation =
            contracts.upgradableBeaconImplementation
        erc20Transparent = contracts.erc20Transparent
        ERC20TestWrapperTransparentFactory =
            contracts.ERC20TestWrapperTransparentFactory
    })

    it('GIVEN an ERC20 deployed WHEN using Beacon Proxy THEN it can be initialized', async () => {
        expect(await erc20Transparent.name()).to.equal(NAME)
        expect(await erc20Transparent.symbol()).to.equal(SYMBOL)
        expect(await erc20Transparent.decimals()).to.equal(DECIMALS)
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

        await erc20Transparent.mint(await erc20Transparent.getAddress(), 100)
    })
})
