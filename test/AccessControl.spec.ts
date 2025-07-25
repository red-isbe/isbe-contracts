import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { AccessControl, AccessControlFacet } from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, ROLE_1, ROLE_2, ISBE_ROLE } from './constants'
import { deployAll } from './initialization'

describe('Access Control', function () {
    let adminAccount: Signer
    let account_2: Signer
    let accessControlFacet: AccessControlFacet
    let accessControl: AccessControl

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
    })

    async function deploy(
        initialize: boolean = true,
        addRole?: string[],
        user?: Signer[][],
        isGovernance: boolean = false
    ) {
        const result = await deployAll(false, isGovernance)
        accessControl = result.accessControl
        accessControlFacet = result.accessControlFacet

        if (initialize) {
            const adminAccountAddress = await adminAccount.getAddress()

            const rbacs = [
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [adminAccountAddress],
                },
            ]

            if (addRole && user) {
                for (let i = 0; i < addRole.length; i++) {
                    const users: string[] = []
                    for (let j = 0; j < user[i].length; j++) {
                        const userAddress = await user[i][j].getAddress()
                        users.push(userAddress)
                    }
                    rbacs.push({
                        role: addRole[i],
                        members: users,
                    })
                }
            }

            await accessControl.initializeAccessControl(rbacs)
        }
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Access Control WHEN initializing it THEN fails', async function () {
            await deploy()

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
            await deploy()

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
            await deploy(false)

            await expect(
                accessControl.initializeAccessControl([
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [ethers.ZeroAddress],
                    },
                ])
            ).to.be.revertedWithCustomError(accessControl, 'AddressZero')
        })

        it('GIVEN a new Proxy pointing to an Access Control WHEN initializing it without adding DEFAULT_ADMIN_ROLE THEN fails', async function () {
            await deploy(false)

            const account2Address = await account_2.getAddress()

            await expect(
                accessControl.initializeAccessControl([
                    {
                        role: ROLE_1,
                        members: [account2Address],
                    },
                ])
            ).to.be.revertedWithCustomError(accessControl, 'MissingAdminRole')
        })
    })

    describe('Reading roles and role admins', function () {
        it('GIVEN an Access Control WHEN reading roles THEN succeeds', async function () {
            await deploy()

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
            await deploy()

            expect(await accessControl.getRoleAdmin(ROLE_1)).to.equal(
                DEFAULT_ADMIN_ROLE
            )
        })
    })

    describe('Grant & revoke roles', function () {
        it('GIVEN an Access Control WHEN using account without admin role to grant role THEN fails', async function () {
            await deploy()

            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.grantRole(ROLE_1, account_2)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an Access Control WHEN using account without admin role to revoke role THEN fails', async function () {
            await deploy()

            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.revokeRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an Access Control WHEN using account with admin role to grant ISBE role THEN fails', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.grantRole(ISBE_ROLE, account_2))
                .to.be.revertedWithCustomError(accessControl, 'RoleIsImmutable')
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN an Access Control WHEN using account with admin role to revoke ISBE role THEN fails', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.revokeRole(ISBE_ROLE, adminAccount))
                .to.be.revertedWithCustomError(accessControl, 'RoleIsImmutable')
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN an Access Control Governance WHEN using account with admin role to grant ISBE role THEN succeeds', async function () {
            await deploy(undefined, undefined, undefined, true)

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.grantRole(ISBE_ROLE, account_2))
                .to.emit(accessControl, 'RoleGranted')
                .withArgs(ISBE_ROLE, account_2, adminAccount)
        })

        it('GIVEN an Access Control Governance WHEN using account with admin role to revoke ISBE role THEN succeeds', async function () {
            await deploy(true, [ISBE_ROLE], [[adminAccount]], true)

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.revokeRole(ISBE_ROLE, adminAccount))
                .to.emit(accessControl, 'RoleRevoked')
                .withArgs(ISBE_ROLE, adminAccount, adminAccount)
        })

        it('GIVEN an Access Control WHEN renouncing ISBE role THEN fails', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.renounceRole(ISBE_ROLE))
                .to.be.revertedWithCustomError(
                    accessControl,
                    'AtLeastOneMemberForRole'
                )
                .withArgs(ISBE_ROLE)
        })

        it('GIVEN an Access Control WHEN using account with admin role to grant role THEN succeeds', async function () {
            await deploy()

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

        it('GIVEN an Access Control WHEN using account with admin role to revoke role THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(
                accessControl.revokeRole(DEFAULT_ADMIN_ROLE, adminAccount)
            )
                .to.emit(accessControl, 'RoleRevoked')
                .withArgs(DEFAULT_ADMIN_ROLE, adminAccount, adminAccount)

            expect(
                await accessControl.hasRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.equal(false)

            expect(
                await accessControl.getRoleMembersCount(DEFAULT_ADMIN_ROLE)
            ).to.equal(0)
            expect(
                await accessControl.getRolesByAccountCount(adminAccount)
            ).to.equal(0)
        })

        it('GIVEN an Access Control WHEN renouncing role THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.renounceRole(DEFAULT_ADMIN_ROLE))
                .to.emit(accessControl, 'RoleRevoked')
                .withArgs(DEFAULT_ADMIN_ROLE, adminAccount, adminAccount)

            expect(
                await accessControl.hasRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.equal(false)

            expect(
                await accessControl.getRoleMembersCount(DEFAULT_ADMIN_ROLE)
            ).to.equal(0)
            expect(
                await accessControl.getRolesByAccountCount(adminAccount)
            ).to.equal(0)
        })

        it('GIVEN an Access Control WHEN using account with admin role to grant role that was already granted THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(
                accessControl.grantRole(DEFAULT_ADMIN_ROLE, adminAccount)
            ).to.not.emit(accessControl, 'RoleGranted')
        })

        it('GIVEN an Access Control WHEN using account with admin role to revoke role that was already revoked THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(
                accessControl.revokeRole(DEFAULT_ADMIN_ROLE, account_2)
            ).to.not.emit(accessControl, 'RoleRevoked')
        })

        it('GIVEN an Access Control WHEN renouncing role that user does not have THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.renounceRole(DEFAULT_ADMIN_ROLE)
            ).to.not.emit(accessControl, 'RoleRevoked')
        })

        it('GIVEN an Access Control WHEN renouncing ISBE role when there are more than 1 ISBE role members THEN succeeds', async function () {
            await deploy(true, [ISBE_ROLE], [[account_2, adminAccount]])

            accessControl = accessControl.connect(account_2)

            await expect(accessControl.renounceRole(ISBE_ROLE))
                .to.emit(accessControl, 'RoleRevoked')
                .withArgs(ISBE_ROLE, account_2, account_2)

            expect(await accessControl.hasRole(ISBE_ROLE, account_2)).to.equal(
                false
            )
        })
    })

    describe('set admin Roles', function () {
        it('GIVEN an Access Control WHEN using account without admin role to set role admin THEN fails', async function () {
            await deploy()

            accessControl = accessControl.connect(account_2)

            await expect(
                accessControl.setRoleAdmin(ROLE_1, ROLE_2)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an Access Control WHEN using account with admin role to set role admin THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.setRoleAdmin(ROLE_1, ROLE_2))
                .to.emit(accessControl, 'RoleAdminChanged')
                .withArgs(ROLE_1, DEFAULT_ADMIN_ROLE, ROLE_2, adminAccount)

            expect(await accessControl.getRoleAdmin(ROLE_1)).to.equal(ROLE_2)
        })

        it('GIVEN an Access Control WHEN using account with admin role to set role admin to the same admin role THEN succeeds', async function () {
            await deploy()

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
