import { expect } from 'chai'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { AccessControl, AccessControlFacet } from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, ROLE_1, ROLE_2 } from './constants'
import { deployAll } from './initialization'

describe('Access Control', function () {
    let adminAccount: Signer
    let account_2: Signer
    let accessControlFacet: AccessControlFacet
    let accessControl: AccessControl

    before(async () => {
        ;[adminAccount, account_2] = await ethers.getSigners()
    })

    async function deploy(initialize: boolean = true) {
        const result = await deployAll()
        accessControl = result.accessControl
        accessControlFacet = result.accessControlFacet

        if (initialize)
            await accessControl.initializeAccessControl(adminAccount)
    }

    describe('Testing initialization and constructor', function () {
        it('GIVEN an Access Control WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                accessControlFacet.initializeAccessControl(account_2)
            ).to.be.revertedWithCustomError(
                accessControlFacet,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a Proxy pointing to an Access Control WHEN initializing it THEN fails', async function () {
            await deploy()

            await expect(
                accessControl.initializeAccessControl(account_2)
            ).to.be.revertedWithCustomError(
                accessControl,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN a new Proxy pointing to an Access Control WHEN initializing it to address 0 THEN fails', async function () {
            await deploy(false)

            await expect(
                accessControl.initializeAccessControl(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(accessControl, 'AddressZero')
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

        it('GIVEN an Access Control WHEN using account with admin role to grant role THEN succeeds', async function () {
            await deploy()

            accessControl = accessControl.connect(adminAccount)

            await expect(accessControl.grantRole(ROLE_1, account_2))
                .to.emit(accessControl, 'RoleGranted')
                .withArgs(ROLE_1, account_2, adminAccount)

            expect(await accessControl.hasRole(ROLE_1, account_2)).to.equal(
                true
            )
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
