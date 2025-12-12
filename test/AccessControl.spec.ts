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
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControl,
    AccessControlFacet,
    IsbeTransparentProxy,
    IsbeTransparentProxy__factory,
    IAccessControlDid,
} from '../typechain-types'
import {
    DEFAULT_ADMIN_ROLE,
    ROLE_1,
    ROLE_2,
    ISBE_ROLE,
    DID_REGISTRY_ROLE,
    CONFIGURATION_ID_DID_REGISTRY,
} from '../utils/constants'
import { deployGovernance } from './fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { EllipticType } from './types/identity'
import { HDNodeWallet } from 'ethers'
import { config } from 'hardhat'

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

        const result = await deployGovernance(
            adminSigner,
            [],
            CONFIGURATION_ID_DID_REGISTRY
        )
        const transparentFactory = await ethers.getContractFactory(
            'IsbeTransparentProxy'
        )

        // Grant DID registry role
        await result.accessControlGovernance!.grantRole(
            DID_REGISTRY_ROLE,
            adminAddress
        )

        // Initialize DID registry
        await result.didRegistry.initializeDiDRegistry(EllipticType.SECP_256_K1)

        // Create DID document for admin account
        const adminWallet = walletOfFirstSigner()
        const adminDid = ethers.id('did:admin:account')

        const notBefore = Math.floor(Date.now() / 1000)
        const notAfter = notBefore + 365 * 24 * 60 * 60

        const publicKey = adminWallet.signingKey.publicKey
        const vMethodId = ethers.id(`vmethod:${adminDid}`)
        const message = ethers.keccak256(
            ethers.solidityPacked(['bytes'], [publicKey])
        )
        const signature = adminWallet.signingKey.sign(message)
        const proof = ethers.Signature.from(signature).serialized

        await result.didRegistry.insertFirstDidDocument(
            adminDid,
            `document:${adminDid}`,
            vMethodId,
            proof,
            publicKey,
            EllipticType.SECP_256_K1,
            notBefore,
            notAfter,
            ''
        )

        // Set mock timestamp to valid period
        await result.mockTimestamp.setMockedTimestamp(notBefore + 1)

        return {
            adminAccount: adminSigner,
            account_2: account2Signer,
            adminAccountAddress: adminAddress,
            account_2Address: account2Address,
            accessControl: result.accessControl,
            accessControlGovernance: result.accessControlGovernance,
            accessControlFacet: result.accessControlFacet,
            transparentProxyFactory: transparentFactory,
            didRegistry: result.didRegistry,
            mockTimestamp: result.mockTimestamp,
        }
    }

    function walletOfFirstSigner(): HDNodeWallet {
        const mnemonic = (
            config.networks.hardhat.accounts as {
                mnemonic: string
                path: string
            }
        ).mnemonic
        return ethers.Wallet.fromPhrase(mnemonic)
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

    describe('DID-based Access Control', function () {
        let accessControlDid: IAccessControlDid
        let pauseGovernance: unknown
        let did1: string
        let did2: string
        let did3: string
        let wallet1: HDNodeWallet

        function walletOfFirstSigner(): HDNodeWallet {
            const mnemonic = (
                config.networks.hardhat.accounts as {
                    mnemonic: string
                    path: string
                }
            ).mnemonic
            return ethers.Wallet.fromPhrase(mnemonic)
        }

        async function deployWithDidRegistryFixture() {
            const [admin] = await ethers.getSigners()
            const adminAddress = await admin.getAddress()

            // Deploy governance with DID registry
            const result = await deployGovernance(
                admin,
                [],
                CONFIGURATION_ID_DID_REGISTRY
            )

            await result.accessControlGovernance!.grantRole(
                DID_REGISTRY_ROLE,
                adminAddress
            )

            // Initialize DID registry
            await result.didRegistry.initializeDiDRegistry(
                EllipticType.SECP_256_K1
            )

            // Create test wallets and DIDs
            const baseWallet = walletOfFirstSigner()
            const w1 = baseWallet.derivePath('100')
            const w2 = baseWallet.derivePath('101')
            const w3 = baseWallet.derivePath('102')

            const d1 = ethers.id('did:test:1')
            const d2 = ethers.id('did:test:2')
            const d3 = ethers.id('did:test:3')

            // Insert DID documents
            const notBefore = Math.floor(Date.now() / 1000)
            const notAfter = notBefore + 365 * 24 * 60 * 60

            for (const [wallet, did] of [
                [w1, d1],
                [w2, d2],
                [w3, d3],
            ]) {
                const publicKey = wallet.signingKey.publicKey
                const vMethodId = ethers.id(`vmethod:${did}`)
                const message = ethers.keccak256(
                    ethers.solidityPacked(['bytes'], [publicKey])
                )
                const signature = wallet.signingKey.sign(message)
                const proof = ethers.Signature.from(signature).serialized

                await result.didRegistry.insertFirstDidDocument(
                    did,
                    `document:${did}`,
                    vMethodId,
                    proof,
                    publicKey,
                    EllipticType.SECP_256_K1,
                    notBefore,
                    notAfter,
                    ''
                )
            }

            // Set mock timestamp to valid period
            await result.mockTimestamp.setMockedTimestamp(notBefore + 1)

            // Attach AccessControlDid interface to governance address
            const AccessControlDidFactory = await ethers.getContractFactory(
                'AccessControlDidGovernanceFacet'
            )
            const accessControlDid = AccessControlDidFactory.attach(
                await result.accessControlGovernance!.getAddress()
            ) as IAccessControlDid

            return {
                adminAccount: admin,
                adminAddress,
                accessControl: result.accessControl,
                accessControlGovernance: result.accessControlGovernance!,
                accessControlDid,
                pauseGovernance: result.pauseGovernance,
                didRegistry: result.didRegistry,
                did1: d1,
                did2: d2,
                did3: d3,
                wallet1: w1,
                wallet2: w2,
                wallet3: w3,
            }
        }

        beforeEach(async function () {
            const contracts = await loadFixture(deployWithDidRegistryFixture)
            adminAccount = contracts.adminAccount
            adminAccountAddress = contracts.adminAddress
            accessControl = contracts.accessControl
            accessControlGovernance = contracts.accessControlGovernance
            accessControlDid = contracts.accessControlDid
            pauseGovernance = contracts.pauseGovernance
            did1 = contracts.did1
            did2 = contracts.did2
            did3 = contracts.did3
            wallet1 = contracts.wallet1
        })

        describe('initializeDidAccessControl', function () {
            it('GIVEN fresh AccessControlDid WHEN initializing with DID roles THEN succeeds and emits event', async function () {
                // Get non-admin signer
                const [, nonAdminSigner] = await ethers.getSigners()
                const nonAdminAddress = await nonAdminSigner.getAddress()

                // Deploy fresh AccessControlDidGovernanceFacet
                const AccessControlDidFacetFactory =
                    await ethers.getContractFactory(
                        'AccessControlDidGovernanceFacet'
                    )
                const freshAccessControlDidFacet =
                    await AccessControlDidFacetFactory.deploy()
                await freshAccessControlDidFacet.waitForDeployment()

                // Deploy transparent proxy with non-admin as admin
                const transparentProxy = await transparentProxyFactory.deploy(
                    await freshAccessControlDidFacet.getAddress(),
                    nonAdminAddress
                )
                await transparentProxy.waitForDeployment()

                // Attach interface using adminAccount (not proxy admin)
                const freshAccessControlDid =
                    AccessControlDidFacetFactory.attach(
                        await transparentProxy.getAddress()
                    ).connect(adminAccount) as IAccessControlDid

                // Initialize with DID-based roles
                await expect(
                    freshAccessControlDid.initializeDidAccessControl([
                        {
                            role: ROLE_1,
                            dids: [did1, did2],
                        },
                        {
                            role: ROLE_2,
                            dids: [did1],
                        },
                    ])
                )
                    .to.emit(
                        freshAccessControlDid,
                        'DidAccessControlInitialized'
                    )
                    .withArgs(2, adminAccountAddress)

                // Verify roles were granted
                expect(await freshAccessControlDid.hasRoleForDid(ROLE_1, did1))
                    .to.be.true
                expect(await freshAccessControlDid.hasRoleForDid(ROLE_1, did2))
                    .to.be.true
                expect(await freshAccessControlDid.hasRoleForDid(ROLE_2, did1))
                    .to.be.true
                expect(await freshAccessControlDid.hasRoleForDid(ROLE_2, did2))
                    .to.be.false
            })

            it('GIVEN already initialized contract WHEN calling initializeDidAccessControl again THEN reverts', async function () {
                // Deploy a proxy and initialize it
                const [, nonAdminSigner] = await ethers.getSigners()
                const nonAdminAddress = await nonAdminSigner.getAddress()

                const AccessControlDidFacetFactory =
                    await ethers.getContractFactory(
                        'AccessControlDidGovernanceFacet'
                    )
                const freshAccessControlDidFacet =
                    await AccessControlDidFacetFactory.deploy()
                await freshAccessControlDidFacet.waitForDeployment()

                const transparentProxy = await transparentProxyFactory.deploy(
                    await freshAccessControlDidFacet.getAddress(),
                    nonAdminAddress
                )
                await transparentProxy.waitForDeployment()

                const freshAccessControlDid =
                    AccessControlDidFacetFactory.attach(
                        await transparentProxy.getAddress()
                    ).connect(adminAccount) as IAccessControlDid

                // Initialize first time - should succeed
                await freshAccessControlDid.initializeDidAccessControl([
                    {
                        role: ROLE_1,
                        dids: [did1],
                    },
                ])

                // Try to initialize again - should fail
                await expect(
                    freshAccessControlDid.initializeDidAccessControl([
                        {
                            role: ROLE_2,
                            dids: [did2],
                        },
                    ])
                ).to.be.revertedWithCustomError(
                    freshAccessControlDid,
                    'ContractIsAlreadyInitialized'
                )
            })
        })

        describe('grantDidRole', function () {
            it('GIVEN non-admin account WHEN granting DID role THEN reverts with AccountHasNoRole', async function () {
                const nonAdminDid = accessControlDid.connect(account_2)

                await expect(
                    nonAdminDid.grantDidRole(ROLE_1, did1)
                ).to.be.revertedWithCustomError(
                    accessControlDid,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN admin account WHEN granting DID role THEN succeeds and emits event', async function () {
                await expect(accessControlDid.grantDidRole(ROLE_1, did1))
                    .to.emit(accessControlDid, 'RoleGrantedToDid')
                    .withArgs(ROLE_1, did1, adminAccountAddress)

                expect(await accessControlDid.hasRoleForDid(ROLE_1, did1)).to.be
                    .true
            })

            it('GIVEN already granted role WHEN granting again THEN succeeds without event', async function () {
                await accessControlDid.grantDidRole(ROLE_1, did1)

                await expect(
                    accessControlDid.grantDidRole(ROLE_1, did1)
                ).to.not.emit(accessControlDid, 'RoleGrantedToDid')
            })
        })

        describe('revokeDidRole', function () {
            beforeEach(async function () {
                await accessControlDid.grantDidRole(ROLE_1, did1)
            })

            it('GIVEN non-admin account WHEN revoking DID role THEN reverts with AccountHasNoRole', async function () {
                const nonAdminDid = accessControlDid.connect(account_2)

                await expect(
                    nonAdminDid.revokeDidRole(ROLE_1, did1)
                ).to.be.revertedWithCustomError(
                    accessControlDid,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN admin account WHEN revoking DID role THEN succeeds and emits event', async function () {
                await expect(accessControlDid.revokeDidRole(ROLE_1, did1))
                    .to.emit(accessControlDid, 'RoleRevokedFromDid')
                    .withArgs(ROLE_1, did1, adminAccountAddress)

                expect(await accessControlDid.hasRoleForDid(ROLE_1, did1)).to.be
                    .false
            })

            it('GIVEN non-granted role WHEN revoking THEN succeeds without event', async function () {
                await accessControlDid.revokeDidRole(ROLE_1, did1)

                await expect(
                    accessControlDid.revokeDidRole(ROLE_1, did1)
                ).to.not.emit(accessControlDid, 'RoleRevokedFromDid')
            })
        })

        describe('DID role operations when paused', function () {
            it('GIVEN paused contract WHEN granting DID role THEN reverts with IsPaused', async function () {
                // Pause the contract
                await pauseGovernance.pause()

                await expect(
                    accessControlDid.grantDidRole(ROLE_1, did1)
                ).to.be.revertedWithCustomError(accessControlDid, 'IsPaused')
            })

            it('GIVEN paused contract WHEN revoking DID role THEN reverts with IsPaused', async function () {
                // Grant role first while not paused
                await accessControlDid.grantDidRole(ROLE_1, did1)

                // Pause the contract
                await pauseGovernance.pause()

                await expect(
                    accessControlDid.revokeDidRole(ROLE_1, did1)
                ).to.be.revertedWithCustomError(accessControlDid, 'IsPaused')
            })
        })

        describe('hasRoleForDid', function () {
            it('GIVEN DID with role WHEN checking hasRoleForDid THEN returns true', async function () {
                await accessControlDid.grantDidRole(ROLE_1, did1)

                expect(await accessControlDid.hasRoleForDid(ROLE_1, did1)).to.be
                    .true
            })

            it('GIVEN DID without role WHEN checking hasRoleForDid THEN returns false', async function () {
                expect(await accessControlDid.hasRoleForDid(ROLE_1, did1)).to.be
                    .false
            })
        })

        describe('DID role queries', function () {
            beforeEach(async function () {
                await accessControlDid.grantDidRole(ROLE_1, did1)
                await accessControlDid.grantDidRole(ROLE_1, did2)
                await accessControlDid.grantDidRole(ROLE_2, did1)
            })

            describe('getRoleMembersCountForDids', function () {
                it('GIVEN role with DID members WHEN getting count THEN returns correct value', async function () {
                    expect(
                        await accessControlDid.getRoleMembersCountForDids(
                            ROLE_1
                        )
                    ).to.equal(2)
                })

                it('GIVEN role without DID members WHEN getting count THEN returns zero', async function () {
                    expect(
                        await accessControlDid.getRoleMembersCountForDids(
                            DEFAULT_ADMIN_ROLE
                        )
                    ).to.equal(0)
                })
            })

            describe('getDidRoleMembers', function () {
                it('GIVEN role with DID members WHEN getting paginated list THEN returns correct DIDs', async function () {
                    const members = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        0,
                        10
                    )

                    expect(members.length).to.equal(2)
                    expect(members).to.include(did1)
                    expect(members).to.include(did2)
                })

                it('GIVEN multiple DIDs WHEN paginating THEN returns correct pages', async function () {
                    // Page 1: First DID
                    const page1 = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        0,
                        1
                    )
                    expect(page1.length).to.equal(1)

                    // Page 2: Second DID
                    const page2 = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        1,
                        1
                    )
                    expect(page2.length).to.equal(1)

                    // Out of bounds
                    const page3 = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        2,
                        1
                    )
                    expect(page3.length).to.equal(0)
                })

                it('GIVEN role without DID members WHEN getting list THEN returns empty array', async function () {
                    const members = await accessControlDid.getDidRoleMembers(
                        DEFAULT_ADMIN_ROLE,
                        0,
                        10
                    )

                    expect(members.length).to.equal(0)
                })
            })

            describe('getRolesByDidLength', function () {
                it('GIVEN DID with roles WHEN getting count THEN returns correct value', async function () {
                    expect(
                        await accessControlDid.getRolesByDidLength(did1)
                    ).to.equal(2)
                })

                it('GIVEN DID without roles WHEN getting count THEN returns zero', async function () {
                    expect(
                        await accessControlDid.getRolesByDidLength(did3)
                    ).to.equal(0)
                })
            })

            describe('getRolesByDid', function () {
                it('GIVEN DID with roles WHEN getting paginated roles THEN returns correct roles', async function () {
                    const roles = await accessControlDid.getRolesByDid(
                        did1,
                        0,
                        10
                    )

                    expect(roles.length).to.equal(2)
                    expect(roles).to.include(ROLE_1)
                    expect(roles).to.include(ROLE_2)
                })

                it('GIVEN DID with multiple roles WHEN paginating THEN returns correct pages', async function () {
                    // Page 1: First role
                    const page1 = await accessControlDid.getRolesByDid(
                        did1,
                        0,
                        1
                    )
                    expect(page1.length).to.equal(1)

                    // Page 2: Second role
                    const page2 = await accessControlDid.getRolesByDid(
                        did1,
                        1,
                        1
                    )
                    expect(page2.length).to.equal(1)

                    // Out of bounds
                    const page3 = await accessControlDid.getRolesByDid(
                        did1,
                        2,
                        1
                    )
                    expect(page3.length).to.equal(0)
                })

                it('GIVEN DID without roles WHEN getting roles THEN returns empty array', async function () {
                    const roles = await accessControlDid.getRolesByDid(
                        did3,
                        0,
                        10
                    )

                    expect(roles.length).to.equal(0)
                })
            })
        })

        describe('Edge Cases: Pagination and DID Resolution', function () {
            describe('Pagination boundary conditions', function () {
                it('GIVEN role with members WHEN offset exceeds length THEN returns empty array', async function () {
                    await accessControlDid.grantDidRole(ROLE_1, did1)

                    const members = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        100,
                        10
                    )
                    expect(members.length).to.equal(0)
                })

                it('GIVEN role with members WHEN length is 0 THEN returns empty array', async function () {
                    await accessControlDid.grantDidRole(ROLE_1, did1)

                    const members = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        0,
                        0
                    )
                    expect(members.length).to.equal(0)
                })

                it('GIVEN multiple roles for DID WHEN offset at boundary THEN handles correctly', async function () {
                    await accessControlDid.grantDidRole(ROLE_1, did1)
                    await accessControlDid.grantDidRole(ROLE_2, did1)

                    const rolesAtBoundary =
                        await accessControlDid.getRolesByDid(did1, 2, 1)
                    expect(rolesAtBoundary.length).to.equal(0)
                })

                it('GIVEN single role member WHEN paginating with offset 1 THEN returns empty', async function () {
                    await accessControlDid.grantDidRole(ROLE_1, did1)

                    const page = await accessControlDid.getDidRoleMembers(
                        ROLE_1,
                        1,
                        10
                    )
                    expect(page.length).to.equal(0)
                })

                it('GIVEN EOA role members WHEN offset exceeds length THEN returns empty array', async function () {
                    const members =
                        await accessControlGovernance.getRoleMembers(
                            DEFAULT_ADMIN_ROLE,
                            100,
                            10
                        )
                    expect(members.length).to.equal(0)
                })

                it('GIVEN EOA role members WHEN length is 0 THEN returns empty array', async function () {
                    const members =
                        await accessControlGovernance.getRoleMembers(
                            DEFAULT_ADMIN_ROLE,
                            0,
                            0
                        )
                    expect(members.length).to.equal(0)
                })

                it('GIVEN account with roles WHEN offset exceeds count THEN returns empty', async function () {
                    const roles =
                        await accessControlGovernance.getRolesByAccount(
                            adminAccountAddress,
                            100,
                            10
                        )
                    expect(roles.length).to.equal(0)
                })
            })

            describe('DID resolution edge cases', function () {
                it('GIVEN account without DID WHEN checking hasRole THEN only checks EOA role', async function () {
                    // Grant EOA role to account_2 (who has no DID in this fixture)
                    await accessControlGovernance.grantRole(
                        ROLE_1,
                        account_2Address
                    )

                    // account_2 has no DID but has EOA role
                    expect(
                        await accessControlGovernance.hasRole(
                            ROLE_1,
                            account_2Address
                        )
                    ).to.be.true
                })

                it('GIVEN account with DID and EOA role WHEN checking role THEN returns true', async function () {
                    // This test verifies the || operator in _hasRole works correctly
                    // First grant DID role
                    await accessControlDid.grantDidRole(ROLE_1, did1)

                    // Also grant EOA role to wallet1 address (which has did1)
                    await accessControlGovernance.grantRole(
                        ROLE_1,
                        wallet1.address
                    )

                    // Should still have role through both paths
                    expect(
                        await accessControlGovernance.hasRole(
                            ROLE_1,
                            wallet1.address
                        )
                    ).to.be.true
                })

                it('GIVEN zero address WHEN checking roles THEN returns false', async function () {
                    expect(
                        await accessControlGovernance.hasRole(
                            ROLE_1,
                            ethers.ZeroAddress
                        )
                    ).to.be.false
                })

                it('GIVEN empty role set WHEN querying by DID THEN returns empty', async function () {
                    const roles = await accessControlDid.getRolesByDid(
                        ethers.encodeBytes32String('nonexistent-did'),
                        0,
                        10
                    )
                    expect(roles.length).to.equal(0)
                })
            })

            describe('DID-based ISBE Role Protection (protectISBERole modifier)', function () {
                it('GIVEN use case with admin role WHEN grantDidRole to ISBE_ROLE THEN fails with RoleIsImmutable', async function () {
                    // Deploy a use case (ERC20) which should have protectISBERole active
                    const useCaseResult = await deployGovernance(
                        adminAccount,
                        [],
                        '0x0000000000000000000000000000000000000000000000000000000000000020' // CONFIGURATION_ID_ERC20
                    )

                    const useCaseAccessControlDid = await ethers.getContractAt(
                        'AccessControlDidFacet',
                        await useCaseResult.accessControl.getAddress()
                    )

                    await expect(
                        useCaseAccessControlDid.grantDidRole(ISBE_ROLE, did1)
                    )
                        .to.be.revertedWithCustomError(
                            useCaseAccessControlDid,
                            'RoleIsImmutable'
                        )
                        .withArgs(ISBE_ROLE)
                })

                it('GIVEN use case with admin role WHEN revokeDidRole from ISBE_ROLE THEN fails with RoleIsImmutable', async function () {
                    // Deploy a use case (ERC20) which should have protectISBERole active
                    const useCaseResult = await deployGovernance(
                        adminAccount,
                        [],
                        '0x0000000000000000000000000000000000000000000000000000000000000020' // CONFIGURATION_ID_ERC20
                    )

                    const useCaseAccessControlDid = await ethers.getContractAt(
                        'AccessControlDidFacet',
                        await useCaseResult.accessControl.getAddress()
                    )

                    await expect(
                        useCaseAccessControlDid.revokeDidRole(ISBE_ROLE, did1)
                    )
                        .to.be.revertedWithCustomError(
                            useCaseAccessControlDid,
                            'RoleIsImmutable'
                        )
                        .withArgs(ISBE_ROLE)
                })

                it('GIVEN governance with admin role WHEN grantDidRole to ISBE_ROLE THEN succeeds', async function () {
                    // Governance context - ISBE_ROLE can be granted to DIDs
                    await expect(accessControlDid.grantDidRole(ISBE_ROLE, did1))
                        .to.emit(accessControlDid, 'RoleGrantedToDid')
                        .withArgs(ISBE_ROLE, did1, adminAccountAddress)

                    // Verify the role was granted
                    expect(
                        await accessControlDid.hasRoleForDid(ISBE_ROLE, did1)
                    ).to.be.true
                })

                it('GIVEN governance with admin role WHEN revokeDidRole from ISBE_ROLE THEN succeeds', async function () {
                    // First grant the role
                    await accessControlDid.grantDidRole(ISBE_ROLE, did1)

                    // Then revoke it - should succeed in governance
                    await expect(
                        accessControlDid.revokeDidRole(ISBE_ROLE, did1)
                    )
                        .to.emit(accessControlDid, 'RoleRevokedFromDid')
                        .withArgs(ISBE_ROLE, did1, adminAccountAddress)

                    // Verify the role was revoked
                    expect(
                        await accessControlDid.hasRoleForDid(ISBE_ROLE, did1)
                    ).to.be.false
                })

                it('GIVEN DID with ISBE_ROLE in governance WHEN verifying role THEN succeeds', async function () {
                    // Grant ISBE_ROLE to DID in governance
                    await accessControlDid.grantDidRole(ISBE_ROLE, did1)

                    // Verify the DID role was granted via hasRoleForDid
                    expect(
                        await accessControlDid.hasRoleForDid(ISBE_ROLE, did1)
                    ).to.be.true

                    // Verify multiple DIDs can have the role
                    await accessControlDid.grantDidRole(ISBE_ROLE, did2)
                    expect(
                        await accessControlDid.hasRoleForDid(ISBE_ROLE, did2)
                    ).to.be.true

                    // Verify count
                    expect(
                        await accessControlDid.getRoleMembersCountForDids(
                            ISBE_ROLE
                        )
                    ).to.equal(2)

                    // This test verifies:
                    // 1. DID roles can be granted successfully for ISBE_ROLE in governance
                    // 2. hasRoleForDid correctly checks DID-based roles
                    // 3. Multiple DIDs can have the ISBE_ROLE
                })

                it('GIVEN multiple DIDs with ISBE_ROLE WHEN querying role members THEN returns all DIDs', async function () {
                    // Grant ISBE_ROLE to multiple DIDs
                    await accessControlDid.grantDidRole(ISBE_ROLE, did1)
                    await accessControlDid.grantDidRole(ISBE_ROLE, did2)
                    await accessControlDid.grantDidRole(ISBE_ROLE, did3)

                    // Check member count
                    expect(
                        await accessControlDid.getRoleMembersCountForDids(
                            ISBE_ROLE
                        )
                    ).to.equal(3)

                    // Get all members
                    const members = await accessControlDid.getDidRoleMembers(
                        ISBE_ROLE,
                        0,
                        10
                    )
                    expect(members).to.have.lengthOf(3)
                    expect(members).to.include(did1)
                    expect(members).to.include(did2)
                    expect(members).to.include(did3)
                })
            })
        })
    })
})
