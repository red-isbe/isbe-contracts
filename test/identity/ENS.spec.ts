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
import { Signer, ZeroAddress, ZeroHash } from 'ethers'
import { ethers } from 'hardhat'
import {
    AccessControlFacet,
    ENS,
    EnsRegistryFacet,
    ISBEPauseFacet,
} from '../../typechain-types'
import {
    ENS_MANAGER_ROLE,
    ENS_REGISTRY_RESOLVER_KEY,
    PAUSER_ROLE,
    CONFIGURATION_ID_ENS_REGISTRY,
} from '../../utils/constants'
import { deployGovernance } from '../fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { randomAddress, randomInt, randomEnsName } from '../support'

describe('ENS Registry', () => {
    let account_2: Signer
    let account_3: Signer
    let adminAccountAddress: string
    let account_2Address: string
    let account_3Address: string
    let ensRegistry: ENS
    let pause: ISBEPauseFacet
    let accessControl: AccessControlFacet
    let ensRegistryFacet: EnsRegistryFacet

    // Test data
    const ROOT_NODE = ethers.ZeroHash
    let TEST_LABEL: string
    let SUB_NODE: string
    let TEST_RESOLVER: string
    let TEST_TTL: number

    async function deployFixture(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rbacsUseCase: any[] = [
            {
                role: PAUSER_ROLE,
                members: [],
            },
            {
                role: ENS_MANAGER_ROLE,
                members: [],
            },
        ],
        init_pause: boolean = false
    ) {
        const [adminAccountSigner, account2Signer, account3Signer] =
            await ethers.getSigners()
        const adminAccountAddress = await adminAccountSigner.getAddress()
        const account2Address = await account2Signer.getAddress()
        const account3Address = await account3Signer.getAddress()

        // Initialize randomized test data
        const testString = randomEnsName().replace('.eth', '')
        const testLabel = ethers.keccak256(ethers.toUtf8Bytes(testString))
        const subNode = ethers.solidityPackedKeccak256(
            ['bytes32', 'bytes32'],
            [ZeroHash, testLabel]
        )
        const testResolver = randomAddress()
        const testTtl = Number(randomInt() % BigInt(86400)) + 1

        // Update rbacs with actual addresses
        const updatedRbacs = rbacsUseCase.map((rbac) => ({
            ...rbac,
            members:
                rbac.members.length > 0 ? rbac.members : [adminAccountAddress],
        }))

        const result = await deployGovernance(
            adminAccountSigner,
            updatedRbacs,
            CONFIGURATION_ID_ENS_REGISTRY,
            init_pause
        )

        // Grant ENS roles to admin
        await result.accessControlGovernance!.grantRole(
            ENS_MANAGER_ROLE,
            adminAccountAddress
        )

        expect(
            await result.ensRegistryFacet.businessIdIntrospection()
        ).to.be.equal(ENS_REGISTRY_RESOLVER_KEY)
        expect(
            await result.ensRegistryFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x026f5135'])

        return {
            adminAccount: adminAccountSigner,
            account_2: account2Signer,
            account_3: account3Signer,
            adminAccountAddress,
            account_2Address: account2Address,
            account_3Address: account3Address,
            ensRegistry: result.ensRegistry!,
            ensRegistryFacet: result.ensRegistryFacet!,
            pause: result.pauseGovernance!,
            accessControl: result.accessControlGovernance!,
            TEST_LABEL: testLabel,
            SUB_NODE: subNode,
            TEST_RESOLVER: testResolver,
            TEST_TTL: testTtl,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        const adminAccount = contracts.adminAccount
        account_2 = contracts.account_2
        account_3 = contracts.account_3
        adminAccountAddress = contracts.adminAccountAddress
        account_2Address = contracts.account_2Address
        account_3Address = contracts.account_3Address
        ensRegistry = contracts.ensRegistry.connect(
            adminAccount
        ) as typeof contracts.ensRegistry
        ensRegistryFacet = contracts.ensRegistryFacet
        pause = contracts.pause
        accessControl = contracts.accessControl
        TEST_LABEL = contracts.TEST_LABEL
        SUB_NODE = contracts.SUB_NODE
        TEST_RESOLVER = contracts.TEST_RESOLVER
        TEST_TTL = contracts.TEST_TTL
    })

    describe('Paused', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await pause.pause()
            }
            await loadFixture(fixture)
        })
        it('GIVEN deployed resolver WHEN try to setRecord THEN it fails', async () => {
            await expect(
                ensRegistry.setRecord(
                    ROOT_NODE,
                    adminAccountAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
        it('GIVEN deployed resolver WHEN try to setSubnodeRecord THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeRecord(
                    ROOT_NODE,
                    TEST_LABEL,
                    adminAccountAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
        it('GIVEN deployed resolver WHEN try to setSubnodeOwner THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeOwner(
                    ROOT_NODE,
                    TEST_LABEL,
                    adminAccountAddress
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
        it('GIVEN deployed resolver WHEN try to setResolver THEN it fails', async () => {
            await expect(
                ensRegistry.setResolver(TEST_LABEL, TEST_RESOLVER)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
        it('GIVEN deployed resolver WHEN try to setOwner THEN it fails', async () => {
            await expect(
                ensRegistry.setOwner(TEST_LABEL, TEST_RESOLVER)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
        it('GIVEN deployed resolver WHEN try to setTTL THEN it fails', async () => {
            await expect(
                ensRegistry.setTTL(TEST_LABEL, TEST_TTL)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
        it('GIVEN deployed resolver WHEN try to setApprovalForAll THEN it fails', async () => {
            await expect(
                ensRegistry.setApprovalForAll(account_2Address, true)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })
    })

    describe('AddressZero error', () => {
        it('GIVEN ENS Registry deployed WHEN try to initialise with zero address THEN it fails', async () => {
            await expect(
                ensRegistry.initialiseEnsRegistry(ZeroAddress)
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setRecord with owner to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setRecord(
                    TEST_LABEL,
                    ZeroAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setRecord with resolver to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setRecord(
                    TEST_LABEL,
                    adminAccountAddress,
                    ZeroAddress,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setSubnodeRecord with owner to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeRecord(
                    ZeroHash,
                    TEST_LABEL,
                    ZeroAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setSubnodeRecord with resolver to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeRecord(
                    ZeroHash,
                    TEST_LABEL,
                    adminAccountAddress,
                    ZeroAddress,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setSubnodeOwner with resolver to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeOwner(ZeroHash, TEST_LABEL, ZeroAddress)
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setResolver with resolver to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setResolver(TEST_LABEL, ZeroAddress)
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setOwner with owner to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setOwner(TEST_LABEL, ZeroAddress)
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
        it('GIVEN a deployed WHEN try to setApprovalForAll with operator to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setApprovalForAll(ZeroAddress, true)
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'AddressZero')
        })
    })

    describe('EmptyBytes32 error', () => {
        it('GIVEN a deployed WHEN try to setSubnodeRecord with label to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeRecord(
                    ZeroHash,
                    ZeroHash,
                    adminAccountAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'EmptyBytes32')
        })
        it('GIVEN a deployed WHEN try to setSubnodeOwner with label to zero THEN it fails', async () => {
            await expect(
                ensRegistry.setSubnodeOwner(
                    ZeroHash,
                    ZeroHash,
                    adminAccountAddress
                )
            ).to.be.revertedWithCustomError(ensRegistryFacet, 'EmptyBytes32')
        })
    })

    describe('Unauthorized', () => {
        it('GIVEN a deployed WHEN try to setRecord and is unauthorized THEN it fails', async () => {
            await expect(
                ensRegistry
                    .connect(account_2)
                    .setRecord(
                        TEST_LABEL,
                        adminAccountAddress,
                        TEST_RESOLVER,
                        TEST_TTL
                    )
            )
                .to.be.revertedWithCustomError(ensRegistry, 'NotAuthorised')
                .withArgs(TEST_LABEL, account_2Address)
        })
        it('GIVEN a deployed WHEN try to setSubnodeRecord and is unauthorized THEN it fails', async () => {
            await expect(
                ensRegistry
                    .connect(account_2)
                    .setSubnodeRecord(
                        ZeroHash,
                        TEST_LABEL,
                        adminAccountAddress,
                        TEST_RESOLVER,
                        TEST_TTL
                    )
            )
                .to.be.revertedWithCustomError(ensRegistry, 'NotAuthorised')
                .withArgs(ZeroHash, account_2Address)
        })
        it('GIVEN a deployed WHEN try to setSubnodeOwner and is unauthorized THEN it fails', async () => {
            await expect(
                ensRegistry
                    .connect(account_2)
                    .setSubnodeOwner(ZeroHash, TEST_LABEL, adminAccountAddress)
            )
                .to.be.revertedWithCustomError(ensRegistry, 'NotAuthorised')
                .withArgs(ZeroHash, account_2Address)
        })
        it('GIVEN a deployed WHEN try to setResolver and is unauthorized THEN it fails', async () => {
            await expect(
                ensRegistry
                    .connect(account_2)
                    .setResolver(TEST_LABEL, adminAccountAddress)
            )
                .to.be.revertedWithCustomError(ensRegistry, 'NotAuthorised')
                .withArgs(TEST_LABEL, account_2Address)
        })
        it('GIVEN a deployed WHEN try to setOwner and is unauthorized THEN it fails', async () => {
            await expect(
                ensRegistry
                    .connect(account_2)
                    .setOwner(TEST_LABEL, adminAccountAddress)
            )
                .to.be.revertedWithCustomError(ensRegistry, 'NotAuthorised')
                .withArgs(TEST_LABEL, account_2Address)
        })
        it('GIVEN a deployed WHEN try to setTTL and is unauthorized THEN it fails', async () => {
            await expect(
                ensRegistry.connect(account_2).setTTL(TEST_LABEL, TEST_TTL)
            )
                .to.be.revertedWithCustomError(ensRegistry, 'NotAuthorised')
                .withArgs(TEST_LABEL, account_2Address)
        })
    })

    describe('Initialization', () => {
        it('GIVEN ENS Registry deployed WHEN try to initialize twice THEN it fails', async () => {
            expect(await ensRegistry.initialiseEnsRegistry(adminAccountAddress))
            await expect(ensRegistry.initialiseEnsRegistry(adminAccountAddress))
                .to.be.revertedWithCustomError(
                    ensRegistryFacet,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(ENS_REGISTRY_RESOLVER_KEY, 1, 1)
        })
        it('GIVEN ENS Registry deployed WHEN try to initialize THEN success', async () => {
            expect(await ensRegistry.initialiseEnsRegistry(adminAccountAddress))
                .to.emit(ensRegistryFacet, 'Transfer')
                .withArgs(ZeroHash, adminAccountAddress)
                .to.emit(ensRegistryFacet, 'EnsRegistryInitialised')
                .withArgs(adminAccountAddress)
            expect(await ensRegistry.recordExists(ROOT_NODE)).to.be.true
            expect(await ensRegistry.owner(ROOT_NODE)).to.be.equal(
                adminAccountAddress
            )
            expect(await ensRegistry.resolver(ROOT_NODE)).to.be.equal(
                ZeroAddress
            )
            expect(await ensRegistry.ttl(ROOT_NODE)).to.be.equal(0n)
        })
    })

    describe('setRecord', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN setting record THEN success', async () => {
            expect(
                await ensRegistry.setRecord(
                    ZeroHash,
                    adminAccountAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            )
                .to.emit(ensRegistryFacet, 'Transfer')
                .withArgs(ZeroHash, adminAccountAddress)
                .to.emit(ensRegistryFacet, 'NewResolver')
                .withArgs(ZeroHash, TEST_RESOLVER)
                .to.emit(ensRegistryFacet, 'NewTTL')
                .withArgs(ZeroHash, TEST_TTL)

            expect(await ensRegistry.owner(ZeroHash)).to.equal(
                adminAccountAddress
            )
            expect(await ensRegistry.resolver(ZeroHash)).to.equal(TEST_RESOLVER)
            expect(await ensRegistry.ttl(ZeroHash)).to.equal(TEST_TTL)
            expect(await ensRegistry.owner(TEST_LABEL)).to.equal(ZeroAddress)
            expect(await ensRegistry.resolver(TEST_LABEL)).to.equal(ZeroAddress)
            expect(await ensRegistry.ttl(TEST_LABEL)).to.equal(0n)
        })
    })

    describe('setSubnodeRecord', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN setting subnode record THEN success', async () => {
            expect(
                await ensRegistry.setSubnodeRecord(
                    ZeroHash,
                    TEST_LABEL,
                    adminAccountAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            )
                .to.emit(ensRegistryFacet, 'NewOwner')
                .withArgs(ZeroHash, TEST_LABEL, adminAccountAddress)
                .to.emit(ensRegistryFacet, 'NewResolver')
                .withArgs(SUB_NODE, TEST_RESOLVER)
                .to.emit(ensRegistryFacet, 'NewTTL')
                .withArgs(SUB_NODE, TEST_TTL)
            expect(await ensRegistry.recordExists(SUB_NODE)).to.be.true
            expect(await ensRegistry.owner(SUB_NODE)).to.be.equal(
                adminAccountAddress
            )
            expect(await ensRegistry.resolver(SUB_NODE)).to.be.equal(
                TEST_RESOLVER
            )
            expect(await ensRegistry.ttl(SUB_NODE)).to.be.equal(TEST_TTL)
        })
    })

    describe('setSubnodeOwner', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
                await ensRegistry.setSubnodeRecord(
                    ZeroHash,
                    TEST_LABEL,
                    adminAccountAddress,
                    TEST_RESOLVER,
                    TEST_TTL
                )
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN setting subnode owner THEN success', async () => {
            expect(
                await ensRegistry.setSubnodeOwner(
                    ZeroHash,
                    TEST_LABEL,
                    account_2Address
                )
            )
                .to.emit(ensRegistryFacet, 'NewOwner')
                .withArgs(ZeroHash, TEST_LABEL, account_2Address)
            expect(await ensRegistry.recordExists(SUB_NODE)).to.be.true
            expect(await ensRegistry.owner(SUB_NODE)).to.be.equal(
                account_2Address
            )
            expect(await ensRegistry.resolver(SUB_NODE)).to.be.equal(
                TEST_RESOLVER
            )
            expect(await ensRegistry.ttl(SUB_NODE)).to.be.equal(TEST_TTL)
        })
    })

    describe('setResolver', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN setting resolver THEN success', async () => {
            expect(await ensRegistry.setResolver(ZeroHash, account_2Address))
                .to.emit(ensRegistryFacet, 'NewResolver')
                .withArgs(ZeroHash, account_2Address)
            expect(await ensRegistry.resolver(ZeroHash)).to.be.equal(
                account_2Address
            )
        })
    })

    describe('setOwner', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN setting owner THEN success', async () => {
            expect(await ensRegistry.setOwner(ZeroHash, account_2Address))
                .to.emit(ensRegistryFacet, 'Transfer')
                .withArgs(ZeroHash, account_2Address)
            expect(await ensRegistry.owner(ZeroHash)).to.be.equal(
                account_2Address
            )
        })
    })

    describe('setTTL', () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN setting TTL THEN success', async () => {
            const NEW_TTL = Number(randomInt() % BigInt(172800)) + 86400 // Random TTL between 86400-172800 seconds
            expect(await ensRegistry.setTTL(ZeroHash, NEW_TTL))
                .to.emit(ensRegistryFacet, 'NewTTL')
                .withArgs(ZeroHash, NEW_TTL)
            expect(await ensRegistry.ttl(ZeroHash)).to.be.equal(NEW_TTL)
        })
    })

    describe('setApprovalForAll', async () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN approve THEN new account can operate as owner', async () => {
            expect(await ensRegistry.setApprovalForAll(account_3Address, true))
                .to.emit(ensRegistryFacet, 'ApprovalForAll')
                .withArgs(adminAccountAddress, account_3Address, true)
            expect(
                await ensRegistry.isApprovedForAll(
                    adminAccountAddress,
                    account_3Address
                )
            ).to.be.equal(true)
            await ensRegistry
                .connect(account_3)
                .setResolver(ZeroHash, account_2Address)
            expect(await ensRegistry.setApprovalForAll(account_3Address, false))
                .to.emit(ensRegistryFacet, 'ApprovalForAll')
                .withArgs(adminAccountAddress, account_3Address, false)
            expect(
                await ensRegistry.isApprovedForAll(
                    adminAccountAddress,
                    account_3Address
                )
            ).to.be.equal(false)
            await expect(
                ensRegistry
                    .connect(account_3)
                    .setResolver(ZeroHash, account_2Address)
            )
                .to.be.revertedWithCustomError(
                    ensRegistryFacet,
                    'NotAuthorised'
                )
                .withArgs(ZeroHash, account_3Address)
        })
    })

    describe('has role ENS_MANAGER_ROLE', async () => {
        beforeEach(async () => {
            const initialize = async () => {
                await ensRegistry.initialiseEnsRegistry(adminAccountAddress)
            }
            await loadFixture(initialize)
        })
        it('GIVEN initialized registry WHEN approve THEN new account can operate as owner', async () => {
            await accessControl.grantRole(ENS_MANAGER_ROLE, account_3Address)
            await ensRegistry
                .connect(account_3)
                .setResolver(ZeroHash, account_2Address)
            await accessControl.revokeRole(ENS_MANAGER_ROLE, account_3Address)
            await expect(
                ensRegistry
                    .connect(account_3)
                    .setResolver(ZeroHash, account_2Address)
            )
                .to.be.revertedWithCustomError(
                    ensRegistryFacet,
                    'NotAuthorised'
                )
                .withArgs(ZeroHash, account_3Address)
        })
    })
})
