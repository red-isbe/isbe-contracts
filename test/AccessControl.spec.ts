import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControl,
    AccessControlFacet,
    IsbeTransparentProxy,
    IsbeTransparentProxy__factory,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, ROLE_1, ROLE_2, ISBE_ROLE } from './constants'
import { deployGovernance } from './initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'

describe('Access Control', function () {
    let adminAccount: Signer
    let account_2: Signer
    let adminAccountAddress: string
    let account_2Address: string
    let accessControlFacet: AccessControlFacet
    let accessControl: AccessControl
    let accessControlGovernance: AccessControl
    let transparentProxyFactory: IsbeTransparentProxy__factory

    async function deployFixture() {
        const [adminSigner, account2Signer] = await ethers.getSigners()
        const adminAddress = await adminSigner.getAddress()
        const account2Address = await account2Signer.getAddress()

        const result = await deployGovernance(adminSigner, [])
        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        return {
            adminAccount: adminSigner,
            account_2: account2Signer,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            accessControl: result.accessControl,
            accessControlGovernance: result.accessControlGovernance,
            accessControlFacet: result.accessControlFacet,
            transparentProxyFactory: transparentFactory,
        }
    }

    async function deployWithRolesFixture(
        roles: string[],
        members: string[][]
    ) {
        const contracts = await deployFixture()

        // Deploy with specific role configurations when needed
        const roleConfigs = roles.map((role, index) => ({
            role,
            members: members[index] || [],
        }))

        const result = await deployGovernance(
            contracts.adminAccount,
            roleConfigs
        )

        return {
            ...contracts,
            accessControl: result.accessControl,
            accessControlGovernance: result.accessControlGovernance,
            accessControlFacet: result.accessControlFacet,
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        adminAccount = contracts.adminAccount
        account_2 = contracts.account_2
        adminAccountAddress = contracts.adminAccountAddress
        account_2Address = contracts.account_2Address
        accessControl = contracts.accessControl
        accessControlGovernance = contracts.accessControlGovernance
        accessControlFacet = contracts.accessControlFacet
        transparentProxyFactory = contracts.transparentProxyFactory
    })

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Access Control WHEN initializing it THEN fails', async function () {
            const account2Address = await account_2.getAddress()

            await expect(
                accessControlFacet.initializeAccessControl([
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [account2Address],
                    },
                ])
            ).to.be.revertedWithCustomError(
                accessControlFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to an Access Control WHEN initializing it THEN fails', async function () {
            const account2Address = await account_2.getAddress()

            await expect(
                accessControl.initializeAccessControl([
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [account2Address],
                    },
                ])
            ).to.be.revertedWithCustomError(
                accessControl,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a new Proxy pointing to an Access Control WHEN initializing it to address 0 THEN fails', async function () {
            await expect(
                deployGovernance(adminAccount, [
                    {
                        role: ROLE_1,
                        members: [ethers.ZeroAddress],
                    },
                ])
            ).to.be.reverted
        })

        it('GIVEN a new Proxy pointing to an Access Control WHEN initializing it without adding DEFAULT_ADMIN_ROLE THEN fails', async function () {
            const transparentProxy: IsbeTransparentProxy =
                await transparentProxyFactory.deploy(
                    await accessControlFacet.getAddress(),
                    account_2Address
                )

            const accessControlProxy = await ethers.getContractAt(
                'AccessControl',
                await transparentProxy.getAddress(),
                adminAccount
            )

            await expect(
                accessControlProxy.initializeAccessControl([
                    {
                        role: ROLE_1,
                        members: [adminAccountAddress],
                    },
                ])
            ).to.be.revertedWithCustomError(
                accessControlProxy,
                'MissingAdminRole'
            )
        })
    })

    describe('Reading roles and role admins', function () {
        it('GIVEN an Access Control WHEN reading roles THEN succeeds', async function () {
            expect(
                await accessControl.hasRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.equal(true)
            expect(
                await accessControl.hasRole(DEFAULT_ADMIN_ROLE, account_2)
            ).to.equal(false)
            expect(await accessControl.hasRole(ROLE_1, adminAccount)).to.equal(
                false
            )
            expect(await accessControl.hasRole(ROLE_1, account_2)).to.equal(
                false
            )
        })

        it('GIVEN an Access Control WHEN reading role admins THEN succeeds', async function () {
            expect(await accessControl.getRoleAdmin(ROLE_1)).to.equal(
                DEFAULT_ADMIN_ROLE
            )
        })
    })

    describe('Grant & revoke roles', function () {
        it('GIVEN an Access Control WHEN using account without admin role to grant role THEN fails', async function () {
            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.grantRole(ROLE_1, account_2)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an Access Control WHEN using account without admin role to revoke role THEN fails', async function () {
            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.revokeRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an Access Control WHEN using account with admin role to grant ISBE role THEN fails', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.grantRole(ISBE_ROLE, account_2))
                .to.be.revertedWithCustomError(accessControl, 'RoleIsImmutable')
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN an Access Control WHEN using account with admin role to revoke ISBE role THEN fails', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.revokeRole(ISBE_ROLE, adminAccount))
                .to.be.revertedWithCustomError(accessControl, 'RoleIsImmutable')
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN an Access Control Governance WHEN using account with admin role to grant ISBE role THEN succeeds', async function () {
            accessControlGovernance =
                accessControlGovernance.connect(adminAccount)

            await expect(
                accessControlGovernance.grantRole(ISBE_ROLE, account_2)
            )
                .to.emit(accessControlGovernance, 'RoleGranted')
                .withArgs(ISBE_ROLE, account_2, adminAccount)
        })

        it('GIVEN an Access Control Governance WHEN using account with admin role to revoke ISBE role THEN succeeds', async function () {
            accessControlGovernance =
                accessControlGovernance.connect(adminAccount)

            await accessControlGovernance.grantRole(ISBE_ROLE, adminAccount)

            await expect(
                accessControlGovernance.revokeRole(ISBE_ROLE, adminAccount)
            )
                .to.emit(accessControlGovernance, 'RoleRevoked')
                .withArgs(ISBE_ROLE, adminAccount, adminAccount)
        })

        it('GIVEN an Access Control WHEN renouncing ISBE role THEN fails', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.renounceRole(ISBE_ROLE))
                .to.be.revertedWithCustomError(
                    accessControl,
                    'AtLeastOneMemberForRole'
                )
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN an Access Control WHEN using account with admin role to grant role THEN succeeds', async function () {
            accessControl = accessControl.connect(adminAccount)

            const account2Address = await account_2.getAddress()

            await expect(accessControl.grantRole(ROLE_1, account_2))
                .to.emit(accessControl, 'RoleGranted')
                .withArgs(ROLE_1, account_2, adminAccount)

            expect(await accessControl.hasRole(ROLE_1, account_2)).to.equal(
                true
            )

            expect(await accessControl.getRoleMembersCount(ROLE_1)).to.equal(1)
            expect(
                await accessControl.getRoleMembers(ROLE_1, 0, 1)
            ).to.deep.equal([account2Address])
            expect(
                await accessControl.getRoleMembers(ROLE_1, 100, 1)
            ).to.deep.equal([])
            expect(
                await accessControl.getRolesByAccountCount(account_2)
            ).to.equal(1)
            expect(
                await accessControl.getRolesByAccount(account_2, 0, 100)
            ).to.deep.equal([ROLE_1])
        })

        it('GIVEN an Access Control WHEN using account with admin role to renounce role THEN succeeds', async function () {
            accessControl = accessControl.connect(adminAccount)

            // First grant the role to account_2
            await accessControl.grantRole(ROLE_1, account_2)

            await expect(accessControl.revokeRole(ROLE_1, account_2))
                .to.emit(accessControl, 'RoleRevoked')
                .withArgs(ROLE_1, account_2, adminAccount)

            expect(await accessControl.hasRole(ROLE_1, account_2)).to.equal(
                false
            )

            expect(await accessControl.getRoleMembersCount(ROLE_1)).to.equal(0)
            expect(
                await accessControl.getRolesByAccountCount(account_2)
            ).to.equal(0)
        })

        it('GIVEN an Access Control WHEN renouncing role THEN succeeds', async function () {
            const account2Address = await account_2.getAddress()

            async function deployWithRole() {
                return deployWithRolesFixture([ROLE_1], [[account2Address]])
            }

            const { accessControl: roleAccessControl } =
                await loadFixture(deployWithRole)

            await expect(
                roleAccessControl.connect(account_2).renounceRole(ROLE_1)
            )
                .to.emit(roleAccessControl, 'RoleRevoked')
                .withArgs(ROLE_1, account_2, account_2)

            expect(await roleAccessControl.hasRole(ROLE_1, account_2)).to.equal(
                false
            )

            expect(
                await roleAccessControl.getRoleMembersCount(ROLE_1)
            ).to.equal(0)
            expect(
                await roleAccessControl.getRolesByAccountCount(account_2)
            ).to.equal(0)
        })

        it('GIVEN an Access Control WHEN using account with admin role to grant role that was already granted THEN succeeds', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(
                accessControl.grantRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.not.emit(accessControl, 'RoleGranted')
        })

        it('GIVEN an Access Control WHEN using account with admin role to revoke role that was already revoked THEN succeeds', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(
                accessControl.revokeRole(DEFAULT_ADMIN_ROLE, account_2)
            ).to.not.emit(accessControl, 'RoleRevoked')
        })

        it('GIVEN an Access Control WHEN renouncing role that user does not have THEN succeeds', async function () {
            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.renounceRole(DEFAULT_ADMIN_ROLE)
            ).to.not.emit(accessControl, 'RoleRevoked')
        })

        it('GIVEN an Access Control WHEN renouncing ISBE role when there are more than 1 ISBE role members THEN succeeds', async function () {
            const transparentProxy: IsbeTransparentProxy =
                await transparentProxyFactory.deploy(
                    await accessControlFacet.getAddress(),
                    adminAccountAddress
                )

            const accessControlProxy = await ethers.getContractAt(
                'AccessControl',
                await transparentProxy.getAddress(),
                account_2
            )

            await accessControlProxy.initializeAccessControl([
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [adminAccountAddress],
                },
                {
                    role: ISBE_ROLE,
                    members: [account_2Address, adminAccountAddress],
                },
            ])

            await expect(accessControlProxy.renounceRole(ISBE_ROLE))
                .to.emit(accessControlProxy, 'RoleRevoked')
                .withArgs(ISBE_ROLE, account_2, account_2)

            expect(
                await accessControlProxy.hasRole(ISBE_ROLE, account_2)
            ).to.equal(false)
        })
    })

    describe('set admin Roles', function () {
        it('GIVEN an Access Control WHEN using account without admin role to set role admin THEN fails', async function () {
            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.setRoleAdmin(ROLE_1, ROLE_2)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an Access Control WHEN using account with admin role to set role admin THEN succeeds', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.setRoleAdmin(ROLE_1, ROLE_2))
                .to.emit(accessControl, 'RoleAdminChanged')
                .withArgs(ROLE_1, DEFAULT_ADMIN_ROLE, ROLE_2, adminAccount)

            expect(await accessControl.getRoleAdmin(ROLE_1)).to.equal(ROLE_2)
        })

        it('GIVEN an Access Control WHEN using account with admin role to set role admin to the same admin role THEN succeeds', async function () {
            accessControl = accessControl.connect(adminAccount)

            await expect(
                accessControl.setRoleAdmin(ROLE_1, DEFAULT_ADMIN_ROLE)
            ).to.not.emit(accessControl, 'RoleAdminChanged')

            expect(await accessControl.getRoleAdmin(ROLE_1)).to.equal(
                DEFAULT_ADMIN_ROLE
            )
        })
    })
})
