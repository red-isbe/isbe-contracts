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
    AccessControlTestWrapper,
    AccessControlTestWrapper__factory,
    IsbeTransparentProxy__factory,
} from '../typechain-types'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { DEFAULT_ADMIN_ROLE, ROLE_1 } from '../utils/constants'

describe('AccessControlTestWrapper', function () {
    let accessControlTestWrapper: AccessControlTestWrapper
    let adminAddress: string

    async function deployFixture() {
        const [admin, proxyAdmin] = await ethers.getSigners()
        const adminAddr = await admin.getAddress()
        const proxyAdminAddr = await proxyAdmin.getAddress()

        // Deploy implementation
        const AccessControlTestWrapperFactory: AccessControlTestWrapper__factory =
            await ethers.getContractFactory('AccessControlTestWrapper')
        const wrapperImpl = await AccessControlTestWrapperFactory.deploy()
        await wrapperImpl.waitForDeployment()

        // Deploy transparent proxy
        const TransparentProxyFactory: IsbeTransparentProxy__factory =
            await ethers.getContractFactory('IsbeTransparentProxy')
        const proxy = await TransparentProxyFactory.deploy(
            await wrapperImpl.getAddress(),
            proxyAdminAddr
        )
        await proxy.waitForDeployment()

        // Attach wrapper interface to proxy
        const wrapper = AccessControlTestWrapperFactory.attach(
            await proxy.getAddress()
        ) as AccessControlTestWrapper

        // Initialize access control
        await wrapper.initializeAccessControl([
            {
                role: DEFAULT_ADMIN_ROLE,
                members: [adminAddr],
            },
        ])

        return {
            accessControlTestWrapper: wrapper,
            adminAddress: adminAddr,
            proxyAdminAddress: proxyAdminAddr,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        accessControlTestWrapper = contracts.accessControlTestWrapper
        adminAddress = contracts.adminAddress
    })

    describe('ERC165 Interface Detection', function () {
        it('GIVEN AccessControlTestWrapper WHEN checking IERC165 interface THEN returns true', async function () {
            // IERC165 interface ID is 0x01ffc9a7
            expect(
                await accessControlTestWrapper.supportsInterface('0x01ffc9a7')
            ).to.be.true
        })

        it('GIVEN AccessControlTestWrapper WHEN checking IAccessControlEoa interface THEN returns true', async function () {
            // IAccessControlEoa interface ID is 0xca6f8196
            // Computed from: initializeAccessControl, grantRole, revokeRole, renounceRole,
            // setRoleAdmin, hasRole, getRoleAdmin, getRoleMembersCount, getRoleMembers,
            // getRolesByAccountCount, getRolesByAccount
            expect(
                await accessControlTestWrapper.supportsInterface('0xca6f8196')
            ).to.be.true
        })

        it('GIVEN AccessControlTestWrapper WHEN checking forbidden interface 0xffffffff THEN returns false', async function () {
            expect(
                await accessControlTestWrapper.supportsInterface('0xffffffff')
            ).to.be.false
        })

        it('GIVEN AccessControlTestWrapper WHEN checking unknown interface THEN returns false', async function () {
            expect(
                await accessControlTestWrapper.supportsInterface('0xdeadbeef')
            ).to.be.false
        })

        it('GIVEN AccessControlTestWrapper WHEN checking zero interface THEN returns false', async function () {
            expect(
                await accessControlTestWrapper.supportsInterface('0x00000000')
            ).to.be.false
        })
    })

    describe('AccessControl Integration', function () {
        it('GIVEN initialized wrapper WHEN checking admin role THEN returns true', async function () {
            expect(
                await accessControlTestWrapper.hasRole(
                    DEFAULT_ADMIN_ROLE,
                    adminAddress
                )
            ).to.be.true
        })

        it('GIVEN initialized wrapper WHEN granting a role THEN succeeds', async function () {
            await expect(
                accessControlTestWrapper.grantRole(ROLE_1, adminAddress)
            )
                .to.emit(accessControlTestWrapper, 'RoleGranted')
                .withArgs(ROLE_1, adminAddress, adminAddress)

            expect(await accessControlTestWrapper.hasRole(ROLE_1, adminAddress))
                .to.be.true
        })
    })
})
