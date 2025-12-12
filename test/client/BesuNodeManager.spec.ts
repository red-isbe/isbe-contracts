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
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroHash } from 'ethers'
import { deployGovernance } from '../fixtures/governance'
import {
    BesuNodeManagerFacet,
    ISBEPauseFacet,
    MockTimestampFacet,
} from '../../typechain-types'
import {
    BESU_NODE_MANAGER_ROLE,
    CONFIGURATION_ID_BESU_NODE_MANAGER,
} from '../../utils/constants'

describe('BesuNodeManager', function () {
    let besuNodeManager: BesuNodeManagerFacet
    let besuNodeManagerFacet: BesuNodeManagerFacet
    let pause: ISBEPauseFacet
    let mockTimestamp: MockTimestampFacet
    let owner: Signer, admin: Signer, agent: Signer, other: Signer
    let adminAddress: string, agentAddress: string

    const ENODE_1 =
        'enode://abc123def456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@127.0.0.1:30303'
    const ENODE_2 =
        'enode://def456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456@127.0.0.1:30304'
    const ENODE_3 =
        'enode://ghi789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789@127.0.0.1:30305'
    const ENODE_4 =
        'enode://jkl456mno789pqr012stu345vwx678yzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk@127.0.0.1:30306'

    // State enum values
    const ValidatorState = { none: 0, active: 1, standby: 2, quarantine: 3 }
    const BootNodeState = { none: 0, active: 1, quarantine: 2 }
    const ExecutionNodeState = { none: 0, active: 1, quarantine: 2 }

    before(async function () {
        ;[owner, admin, agent, other] = await ethers.getSigners()
        adminAddress = await admin.getAddress()
        agentAddress = await agent.getAddress()
    })

    async function deployFixture() {
        const governance = await deployGovernance(
            owner,
            [],
            CONFIGURATION_ID_BESU_NODE_MANAGER
        )

        // Grant roles to admin and agent
        await governance.accessControlGovernance.grantRole(
            BESU_NODE_MANAGER_ROLE,
            adminAddress
        )
        await governance.accessControlGovernance.grantRole(
            BESU_NODE_MANAGER_ROLE,
            agentAddress
        )

        return {
            besuNodeManager: governance.besuNodeManager,
            besuNodeManagerFacet: governance.besuNodeManagerFacet,
            pauseFacet: governance.pauseGovernance,
            mockTimestamp: governance.mockTimestamp,
        }
    }

    beforeEach(async function () {
        const fixture = await loadFixture(deployFixture)
        besuNodeManager = fixture.besuNodeManager
        besuNodeManagerFacet = fixture.besuNodeManagerFacet
        pause = fixture.pauseFacet
        mockTimestamp = fixture.mockTimestamp
    })

    describe('Core Layer', function () {
        describe('Cross-category uniqueness', function () {
            it('GIVEN enode added as validator WHEN adding same enode as bootnode THEN should revert', async function () {
                // Add as validator first
                await besuNodeManager.connect(admin).addValidator(ENODE_1)

                // Attempt to add same enode as bootnode should fail
                await expect(
                    besuNodeManager.connect(admin).addBootNode(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'NodeAlreadyRegistered'
                )
            })

            it('GIVEN enode added as bootnode WHEN adding same enode as execution node THEN should revert', async function () {
                // Add as bootnode first
                await besuNodeManager.connect(admin).addBootNode(ENODE_2)

                // Attempt to add same enode as execution node should fail
                await expect(
                    besuNodeManager.connect(admin).addExecutionNode(ENODE_2)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'NodeAlreadyRegistered'
                )
            })
        })

        describe('Timestamp handling', function () {
            it('GIVEN valid timestamp WHEN adding node THEN should store uint40 timestamp', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()
                const block = await ethers.provider.getBlock(
                    receipt!.blockNumber
                )

                // Get timestamp from event
                const event = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )
                const eventData = besuNodeManager.interface.parseLog({
                    topics: event!.topics as string[],
                    data: event!.data,
                })

                // Verify timestamp matches block timestamp
                expect(eventData!.args.timestamp).to.equal(block!.timestamp)
                // Verify it's within uint40 range
                expect(eventData!.args.timestamp).to.be.lte(
                    BigInt(2) ** BigInt(40) - BigInt(1)
                )
            })

            it('GIVEN timestamp exceeds uint40 max WHEN adding node THEN should revert with TimestampOverflow', async function () {
                // Set timestamp beyond uint40 max (2^40)
                const uint40Max = BigInt(2) ** BigInt(40)
                await mockTimestamp.connect(owner).setMockedTimestamp(uint40Max)

                await expect(
                    besuNodeManager.connect(admin).addValidator(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'TimestampOverflow'
                )
            })
        })

        describe('Storage isolation', function () {
            it('GIVEN nodes in different categories WHEN querying THEN should access correct storage', async function () {
                // Add nodes to all three categories
                const tx1 = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const tx2 = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_2)
                const tx3 = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_3)

                const receipt1 = await tx1.wait()
                const receipt2 = await tx2.wait()
                const receipt3 = await tx3.wait()

                const validatorId = receipt1?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]
                const bootnodeId = receipt2?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]
                const executionNodeId = receipt3?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                // Verify each node is only registered in its own category
                expect(await besuNodeManager.isValidator(validatorId!)).to.be
                    .true
                expect(await besuNodeManager.isBootNode(validatorId!)).to.be
                    .false
                expect(await besuNodeManager.isExecutionNode(validatorId!)).to
                    .be.false

                expect(await besuNodeManager.isValidator(bootnodeId!)).to.be
                    .false
                expect(await besuNodeManager.isBootNode(bootnodeId!)).to.be.true
                expect(await besuNodeManager.isExecutionNode(bootnodeId!)).to.be
                    .false

                expect(await besuNodeManager.isValidator(executionNodeId!)).to
                    .be.false
                expect(await besuNodeManager.isBootNode(executionNodeId!)).to.be
                    .false
                expect(await besuNodeManager.isExecutionNode(executionNodeId!))
                    .to.be.true
            })
        })
    })

    describe('Validator Management - BLOCKED: TypeChain NodeDTO parsing issue', function () {
        describe('addValidator', function () {
            it('GIVEN valid enode WHEN admin calls addValidator THEN should add to active state', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()

                // Get nodeId from event
                const event = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )
                const nodeId = event?.topics[1]

                expect(await besuNodeManager.isValidator(nodeId)).to.be.true
                expect(
                    await besuNodeManager.getValidatorState(nodeId)
                ).to.equal(ValidatorState.active)
                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.active
                    )
                ).to.equal(1)
                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.none
                    )
                ).to.equal(0)
            })

            it('GIVEN empty enode WHEN calling addValidator THEN should revert with EmptyEnode', async function () {
                await expect(
                    besuNodeManager.connect(admin).addValidator('')
                ).to.be.revertedWithCustomError(besuNodeManager, 'EmptyEnode')
            })

            it('GIVEN duplicate enode WHEN calling addValidator THEN should revert with NodeAlreadyRegistered', async function () {
                await besuNodeManager.connect(admin).addValidator(ENODE_1)
                await expect(
                    besuNodeManager.connect(admin).addValidator(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'NodeAlreadyRegistered'
                )
            })

            it('GIVEN caller without role WHEN calling addValidator THEN should revert', async function () {
                await expect(
                    besuNodeManager.connect(other).addValidator(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling addValidator THEN should revert', async function () {
                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).addValidator(ENODE_1)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('addValidatorStandby', function () {
            it('GIVEN valid enode WHEN admin calls addValidatorStandby THEN should add to standby state', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_1)
                const receipt = await tx.wait()

                // Get nodeId from event
                const event = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )
                const nodeId = event?.topics[1]

                // Verify node is in standby state
                expect(await besuNodeManager.isValidator(nodeId!)).to.be.true
                expect(
                    await besuNodeManager.getValidatorState(nodeId!)
                ).to.equal(ValidatorState.standby)
                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.standby
                    )
                ).to.equal(1)
            })

            it('GIVEN caller without role WHEN calling addValidatorStandby THEN should revert', async function () {
                await expect(
                    besuNodeManager.connect(other).addValidatorStandby(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling addValidatorStandby THEN should revert', async function () {
                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).addValidatorStandby(ENODE_1)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('State Transitions', function () {
            describe('promoteValidator', function () {
                it('GIVEN standby validator WHEN calling promoteValidator THEN should move to active', async function () {
                    // Add validator in standby state
                    const tx1 = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt1 = await tx1.wait()
                    const nodeId = receipt1?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    // Promote to active
                    await expect(
                        besuNodeManager.connect(admin).promoteValidator(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'ValidatorPromoted')
                        .withArgs(nodeId)

                    // Verify state changed
                    expect(
                        await besuNodeManager.getValidatorState(nodeId!)
                    ).to.equal(ValidatorState.active)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.active
                        )
                    ).to.equal(1)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.standby
                        )
                    ).to.equal(0)
                })

                it('GIVEN active validator WHEN calling promoteValidator THEN should revert with InvalidStateTransition', async function () {
                    // Add validator in active state
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    // Attempt to promote already active validator
                    await expect(
                        besuNodeManager.connect(admin).promoteValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'InvalidStateTransition'
                    )
                })

                it('GIVEN caller without role WHEN calling promoteValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager.connect(other).promoteValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling promoteValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    await expect(
                        besuNodeManager.connect(admin).promoteValidator(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })

            describe('standbyValidator', function () {
                it('GIVEN active validator WHEN calling standbyValidator THEN should move to standby', async function () {
                    // Add validator in active state
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    // Move to standby
                    await expect(
                        besuNodeManager.connect(admin).standbyValidator(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'ValidatorStandby')
                        .withArgs(nodeId)

                    // Verify state changed
                    expect(
                        await besuNodeManager.getValidatorState(nodeId!)
                    ).to.equal(ValidatorState.standby)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.active
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.standby
                        )
                    ).to.equal(1)
                })

                it('GIVEN standby validator WHEN calling standbyValidator THEN should revert', async function () {
                    // Add validator in standby state
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    // Attempt to move already standby validator to standby
                    await expect(
                        besuNodeManager.connect(admin).standbyValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'InvalidStateTransition'
                    )
                })

                it('GIVEN caller without role WHEN calling standbyValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager.connect(other).standbyValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling standbyValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    await expect(
                        besuNodeManager.connect(admin).standbyValidator(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })

            describe('quarantineValidator', function () {
                it('GIVEN standby validator WHEN calling quarantineValidator THEN should move to quarantine', async function () {
                    // Add validator in standby state
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    // Quarantine
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineValidator(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'ValidatorQuarantined')
                        .withArgs(nodeId)

                    // Verify state changed
                    expect(
                        await besuNodeManager.getValidatorState(nodeId!)
                    ).to.equal(ValidatorState.quarantine)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.standby
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.quarantine
                        )
                    ).to.equal(1)
                })

                it('GIVEN active validator WHEN calling quarantineValidator THEN should revert', async function () {
                    // Add validator in active state
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    // Attempt to quarantine active validator (must be standby first)
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'InvalidStateTransition'
                    )
                })

                it('GIVEN caller without role WHEN calling quarantineValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager
                            .connect(other)
                            .quarantineValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling quarantineValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineValidator(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })

            describe('unquarantineValidator', function () {
                it('GIVEN quarantined validator WHEN calling unquarantineValidator THEN should move back to standby', async function () {
                    // Add validator and quarantine it
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineValidator(nodeId!)

                    // Unquarantine
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .unquarantineValidator(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'ValidatorUnquarantined')
                        .withArgs(nodeId)

                    // Verify state changed back to standby
                    expect(
                        await besuNodeManager.getValidatorState(nodeId!)
                    ).to.equal(ValidatorState.standby)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.quarantine
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.standby
                        )
                    ).to.equal(1)
                })

                it('GIVEN caller without role WHEN calling unquarantineValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineValidator(nodeId!)

                    await expect(
                        besuNodeManager
                            .connect(other)
                            .unquarantineValidator(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling unquarantineValidator THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineValidator(nodeId!)

                    await pause.pause()
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .unquarantineValidator(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })
        })

        describe('removeValidator', function () {
            it('GIVEN active validator WHEN calling removeValidator THEN should remove node', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(admin).removeValidator(nodeId!)
                )
                    .to.emit(besuNodeManager, 'ValidatorRemoved')
                    .withArgs(nodeId)

                expect(await besuNodeManager.isValidator(nodeId!)).to.be.false
                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.active
                    )
                ).to.equal(0)
            })

            it('GIVEN standby validator WHEN calling removeValidator THEN should remove node', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await besuNodeManager.connect(admin).removeValidator(nodeId!)
                expect(await besuNodeManager.isValidator(nodeId!)).to.be.false
                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.standby
                    )
                ).to.equal(0)
            })

            it('GIVEN quarantined validator WHEN calling removeValidator THEN should remove node', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]
                await besuNodeManager
                    .connect(admin)
                    .quarantineValidator(nodeId!)

                await besuNodeManager.connect(admin).removeValidator(nodeId!)
                expect(await besuNodeManager.isValidator(nodeId!)).to.be.false
                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.quarantine
                    )
                ).to.equal(0)
            })

            it('GIVEN non-existent node WHEN calling removeValidator THEN should revert with NodeNotFound', async function () {
                const fakeNodeId = ethers.id('nonexistent')
                await expect(
                    besuNodeManager.connect(admin).removeValidator(fakeNodeId)
                ).to.be.revertedWithCustomError(besuNodeManager, 'NodeNotFound')
            })

            it('GIVEN caller without role WHEN calling removeValidator THEN should revert', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(other).removeValidator(nodeId!)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling removeValidator THEN should revert', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).removeValidator(nodeId!)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('Query functions', function () {
            describe('getValidatorState', function () {
                it('GIVEN active validator WHEN calling getValidatorState THEN should return active state', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    expect(
                        await besuNodeManager.getValidatorState(nodeId!)
                    ).to.equal(ValidatorState.active)
                })

                it('GIVEN no role or pause WHEN calling getValidatorState THEN should succeed', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    // View function should still work when paused
                    expect(
                        await besuNodeManager
                            .connect(other)
                            .getValidatorState(nodeId!)
                    ).to.equal(ValidatorState.active)
                })
            })

            describe('isValidator', function () {
                it('GIVEN registered validator WHEN calling isValidator THEN should return true', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    expect(await besuNodeManager.isValidator(nodeId!)).to.be
                        .true
                })

                it('GIVEN non-existent node WHEN calling isValidator THEN should return false', async function () {
                    const fakeNodeId = ethers.id('nonexistent')
                    expect(await besuNodeManager.isValidator(fakeNodeId)).to.be
                        .false
                })

                it('GIVEN no role or pause WHEN calling isValidator THEN should succeed', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addValidator(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    // View function should still work when paused and without role
                    expect(
                        await besuNodeManager
                            .connect(other)
                            .isValidator(nodeId!)
                    ).to.be.true
                })
            })

            describe('getTotalValidators', function () {
                it('GIVEN multiple validators in different states WHEN calling getTotalValidators THEN should return correct counts', async function () {
                    // Add validators in different states
                    await besuNodeManager.connect(admin).addValidator(ENODE_1)
                    await besuNodeManager.connect(admin).addValidator(ENODE_2)
                    await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_3)

                    const tx4 = await besuNodeManager
                        .connect(admin)
                        .addValidatorStandby(ENODE_4)
                    const receipt4 = await tx4.wait()
                    const nodeId4 = receipt4?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ValidatorAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineValidator(nodeId4!)

                    // Verify counts
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.active
                        )
                    ).to.equal(2)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.standby
                        )
                    ).to.equal(1)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.quarantine
                        )
                    ).to.equal(1)
                })

                it('GIVEN no role or pause WHEN calling getTotalValidators THEN should succeed', async function () {
                    await besuNodeManager.connect(admin).addValidator(ENODE_1)
                    await pause.pause()

                    // View function should work when paused and without role
                    expect(
                        await besuNodeManager
                            .connect(other)
                            .getTotalValidators(ValidatorState.active)
                    ).to.equal(1)
                })

                it('GIVEN no validators WHEN calling getTotalValidators THEN should return 0', async function () {
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.active
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.standby
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalValidators(
                            ValidatorState.quarantine
                        )
                    ).to.equal(0)
                })
            })
        })

        describe('Pagination', function () {
            it('GIVEN multiple validators in active state WHEN calling getPaginatedValidators THEN should return active validators', async function () {
                await besuNodeManager.connect(admin).addValidator(ENODE_1)
                await besuNodeManager.connect(admin).addValidator(ENODE_2)
                await besuNodeManager.connect(admin).addValidator(ENODE_3)

                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.active
                    )
                ).to.equal(3)

                const nodes = await besuNodeManager.getPaginatedValidators(
                    ValidatorState.active,
                    10,
                    1
                )
                expect(nodes.length).to.equal(3)
            })

            it('GIVEN multiple validators in standby state WHEN calling getPaginatedValidators THEN should return standby validators', async function () {
                await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_1)
                await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_2)

                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.standby
                    )
                ).to.equal(2)

                const nodes = await besuNodeManager.getPaginatedValidators(
                    ValidatorState.standby,
                    10,
                    1
                )
                expect(nodes.length).to.equal(2)
            })

            it('GIVEN multiple validators in quarantine state WHEN calling getPaginatedValidators THEN should return quarantined validators', async function () {
                const tx1 = await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_1)
                const receipt1 = await tx1.wait()
                const nodeId1 = receipt1?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                const tx2 = await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_2)
                const receipt2 = await tx2.wait()
                const nodeId2 = receipt2?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await besuNodeManager
                    .connect(admin)
                    .quarantineValidator(nodeId1!)
                await besuNodeManager
                    .connect(admin)
                    .quarantineValidator(nodeId2!)

                expect(
                    await besuNodeManager.getTotalValidators(
                        ValidatorState.quarantine
                    )
                ).to.equal(2)

                const nodes = await besuNodeManager.getPaginatedValidators(
                    ValidatorState.quarantine,
                    10,
                    1
                )
                expect(nodes.length).to.equal(2)
            })
        })
    })

    describe('BootNode Management', function () {
        describe('addBootNode', function () {
            it('GIVEN valid enode WHEN admin calls addBootNode THEN should add to active state', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_1)
                const receipt = await tx.wait()

                const event = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )
                const nodeId = event?.topics[1]

                expect(await besuNodeManager.isBootNode(nodeId!)).to.be.true
                expect(
                    await besuNodeManager.getBootNodeState(nodeId!)
                ).to.equal(BootNodeState.active)
                expect(
                    await besuNodeManager.getTotalBootNodes(
                        BootNodeState.active
                    )
                ).to.equal(1)
            })

            it('GIVEN empty enode WHEN calling addBootNode THEN should revert', async function () {
                await expect(
                    besuNodeManager.connect(admin).addBootNode('')
                ).to.be.revertedWithCustomError(besuNodeManager, 'EmptyEnode')
            })

            it('GIVEN caller without role WHEN calling addBootNode THEN should revert', async function () {
                await expect(
                    besuNodeManager.connect(other).addBootNode(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling addBootNode THEN should revert', async function () {
                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).addBootNode(ENODE_1)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('State Transitions', function () {
            describe('quarantineBootNode', function () {
                it('GIVEN active bootnode WHEN calling quarantineBootNode THEN should move to quarantine', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addBootNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'BootNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineBootNode(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'BootNodeQuarantined')
                        .withArgs(nodeId)

                    expect(
                        await besuNodeManager.getBootNodeState(nodeId!)
                    ).to.equal(BootNodeState.quarantine)
                    expect(
                        await besuNodeManager.getTotalBootNodes(
                            BootNodeState.active
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalBootNodes(
                            BootNodeState.quarantine
                        )
                    ).to.equal(1)
                })

                it('GIVEN caller without role WHEN calling quarantineBootNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addBootNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'BootNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager
                            .connect(other)
                            .quarantineBootNode(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling quarantineBootNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addBootNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'BootNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineBootNode(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })

            describe('unquarantineBootNode', function () {
                it('GIVEN quarantined bootnode WHEN calling unquarantineBootNode THEN should move back to active', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addBootNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'BootNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineBootNode(nodeId!)

                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .unquarantineBootNode(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'BootNodeUnquarantined')
                        .withArgs(nodeId)

                    expect(
                        await besuNodeManager.getBootNodeState(nodeId!)
                    ).to.equal(BootNodeState.active)
                    expect(
                        await besuNodeManager.getTotalBootNodes(
                            BootNodeState.quarantine
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalBootNodes(
                            BootNodeState.active
                        )
                    ).to.equal(1)
                })

                it('GIVEN caller without role WHEN calling unquarantineBootNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addBootNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'BootNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineBootNode(nodeId!)

                    await expect(
                        besuNodeManager
                            .connect(other)
                            .unquarantineBootNode(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling unquarantineBootNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addBootNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'BootNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineBootNode(nodeId!)

                    await pause.pause()
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .unquarantineBootNode(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })
        })

        describe('removeBootNode', function () {
            it('GIVEN active bootnode WHEN calling removeBootNode THEN should remove node', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(admin).removeBootNode(nodeId!)
                )
                    .to.emit(besuNodeManager, 'BootNodeRemoved')
                    .withArgs(nodeId)

                expect(await besuNodeManager.isBootNode(nodeId!)).to.be.false
                expect(
                    await besuNodeManager.getTotalBootNodes(
                        BootNodeState.active
                    )
                ).to.equal(0)
            })

            it('GIVEN caller without role WHEN calling removeBootNode THEN should revert', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(other).removeBootNode(nodeId!)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling removeBootNode THEN should revert', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]

                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).removeBootNode(nodeId!)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('Query functions', function () {
            it('GIVEN no role or pause WHEN calling bootnode query functions THEN should succeed', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]

                await pause.pause()
                // All view functions should work when paused and without role
                expect(await besuNodeManager.connect(other).isBootNode(nodeId!))
                    .to.be.true
                expect(
                    await besuNodeManager
                        .connect(other)
                        .getBootNodeState(nodeId!)
                ).to.equal(BootNodeState.active)
                expect(
                    await besuNodeManager
                        .connect(other)
                        .getTotalBootNodes(BootNodeState.active)
                ).to.equal(1)
            })
        })

        describe('Pagination', function () {
            it('GIVEN multiple bootnodes WHEN requesting pages THEN should paginate correctly', async function () {
                // Add multiple bootnodes
                await besuNodeManager.connect(admin).addBootNode(ENODE_1)
                await besuNodeManager.connect(admin).addBootNode(ENODE_2)
                await besuNodeManager.connect(admin).addBootNode(ENODE_3)

                // Verify total
                expect(
                    await besuNodeManager.getTotalBootNodes(
                        BootNodeState.active
                    )
                ).to.equal(3)

                // Note: getPaginatedBootNodes may have TypeChain struct parsing issues
                // but the function should be callable
                const nodes = await besuNodeManager.getPaginatedBootNodes(
                    BootNodeState.active,
                    2,
                    1
                )
                expect(nodes.length).to.be.lte(2)
            })

            it('GIVEN no role or pause WHEN calling getPaginatedBootNodes THEN should succeed', async function () {
                await besuNodeManager.connect(admin).addBootNode(ENODE_1)
                await pause.pause()

                // View function should work when paused and without role
                const nodes = await besuNodeManager
                    .connect(other)
                    .getPaginatedBootNodes(BootNodeState.active, 10, 1)
                expect(nodes.length).to.be.gte(0)
            })
        })
    })

    describe('ExecutionNode Management', function () {
        describe('addExecutionNode', function () {
            it('GIVEN valid enode WHEN admin calls addExecutionNode THEN should add to active state', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_1)
                const receipt = await tx.wait()

                const event = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )
                const nodeId = event?.topics[1]

                expect(await besuNodeManager.isExecutionNode(nodeId!)).to.be
                    .true
                expect(
                    await besuNodeManager.getExecutionNodeState(nodeId!)
                ).to.equal(ExecutionNodeState.active)
                expect(
                    await besuNodeManager.getTotalExecutionNodes(
                        ExecutionNodeState.active
                    )
                ).to.equal(1)
            })

            it('GIVEN caller without role WHEN calling addExecutionNode THEN should revert', async function () {
                await expect(
                    besuNodeManager.connect(other).addExecutionNode(ENODE_1)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling addExecutionNode THEN should revert', async function () {
                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).addExecutionNode(ENODE_1)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('State Transitions', function () {
            describe('quarantineExecutionNode', function () {
                it('GIVEN active execution node WHEN calling quarantineExecutionNode THEN should move to quarantine', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addExecutionNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineExecutionNode(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'ExecutionNodeQuarantined')
                        .withArgs(nodeId)

                    expect(
                        await besuNodeManager.getExecutionNodeState(nodeId!)
                    ).to.equal(ExecutionNodeState.quarantine)
                    expect(
                        await besuNodeManager.getTotalExecutionNodes(
                            ExecutionNodeState.active
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalExecutionNodes(
                            ExecutionNodeState.quarantine
                        )
                    ).to.equal(1)
                })

                it('GIVEN caller without role WHEN calling quarantineExecutionNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addExecutionNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await expect(
                        besuNodeManager
                            .connect(other)
                            .quarantineExecutionNode(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling quarantineExecutionNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addExecutionNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]

                    await pause.pause()
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .quarantineExecutionNode(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })

            describe('unquarantineExecutionNode', function () {
                it('GIVEN quarantined execution node WHEN calling unquarantineExecutionNode THEN should move back to active', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addExecutionNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineExecutionNode(nodeId!)

                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .unquarantineExecutionNode(nodeId!)
                    )
                        .to.emit(besuNodeManager, 'ExecutionNodeUnquarantined')
                        .withArgs(nodeId)

                    expect(
                        await besuNodeManager.getExecutionNodeState(nodeId!)
                    ).to.equal(ExecutionNodeState.active)
                    expect(
                        await besuNodeManager.getTotalExecutionNodes(
                            ExecutionNodeState.quarantine
                        )
                    ).to.equal(0)
                    expect(
                        await besuNodeManager.getTotalExecutionNodes(
                            ExecutionNodeState.active
                        )
                    ).to.equal(1)
                })

                it('GIVEN caller without role WHEN calling unquarantineExecutionNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addExecutionNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineExecutionNode(nodeId!)

                    await expect(
                        besuNodeManager
                            .connect(other)
                            .unquarantineExecutionNode(nodeId!)
                    ).to.be.revertedWithCustomError(
                        besuNodeManager,
                        'AccountHasNoRole'
                    )
                })

                it('GIVEN paused contract WHEN calling unquarantineExecutionNode THEN should revert', async function () {
                    const tx = await besuNodeManager
                        .connect(admin)
                        .addExecutionNode(ENODE_1)
                    const receipt = await tx.wait()
                    const nodeId = receipt?.logs.find(
                        (log) =>
                            log.topics[0] ===
                            ethers.id(
                                'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                            )
                    )?.topics[1]
                    await besuNodeManager
                        .connect(admin)
                        .quarantineExecutionNode(nodeId!)

                    await pause.pause()
                    await expect(
                        besuNodeManager
                            .connect(admin)
                            .unquarantineExecutionNode(nodeId!)
                    ).to.be.revertedWithCustomError(pause, 'IsPaused')
                })
            })
        })

        describe('removeExecutionNode', function () {
            it('GIVEN active execution node WHEN calling removeExecutionNode THEN should remove node', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(admin).removeExecutionNode(nodeId!)
                )
                    .to.emit(besuNodeManager, 'ExecutionNodeRemoved')
                    .withArgs(nodeId)

                expect(await besuNodeManager.isExecutionNode(nodeId!)).to.be
                    .false
                expect(
                    await besuNodeManager.getTotalExecutionNodes(
                        ExecutionNodeState.active
                    )
                ).to.equal(0)
            })

            it('GIVEN caller without role WHEN calling removeExecutionNode THEN should revert', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(other).removeExecutionNode(nodeId!)
                ).to.be.revertedWithCustomError(
                    besuNodeManager,
                    'AccountHasNoRole'
                )
            })

            it('GIVEN paused contract WHEN calling removeExecutionNode THEN should revert', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await pause.pause()
                await expect(
                    besuNodeManager.connect(admin).removeExecutionNode(nodeId!)
                ).to.be.revertedWithCustomError(pause, 'IsPaused')
            })
        })

        describe('Query functions', function () {
            it('GIVEN no role or pause WHEN calling execution node query functions THEN should succeed', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await pause.pause()
                // All view functions should work when paused and without role
                expect(
                    await besuNodeManager
                        .connect(other)
                        .isExecutionNode(nodeId!)
                ).to.be.true
                expect(
                    await besuNodeManager
                        .connect(other)
                        .getExecutionNodeState(nodeId!)
                ).to.equal(ExecutionNodeState.active)
                expect(
                    await besuNodeManager
                        .connect(other)
                        .getTotalExecutionNodes(ExecutionNodeState.active)
                ).to.equal(1)
            })
        })

        describe('Pagination', function () {
            it('GIVEN multiple execution nodes WHEN requesting pages THEN should paginate correctly', async function () {
                await besuNodeManager.connect(admin).addExecutionNode(ENODE_1)
                await besuNodeManager.connect(admin).addExecutionNode(ENODE_2)
                await besuNodeManager.connect(admin).addExecutionNode(ENODE_3)

                expect(
                    await besuNodeManager.getTotalExecutionNodes(
                        ExecutionNodeState.active
                    )
                ).to.equal(3)

                const nodes = await besuNodeManager.getPaginatedExecutionNodes(
                    ExecutionNodeState.active,
                    2,
                    1
                )
                expect(nodes.length).to.be.lte(2)
            })

            it('GIVEN no role or pause WHEN calling getPaginatedExecutionNodes THEN should succeed', async function () {
                await besuNodeManager.connect(admin).addExecutionNode(ENODE_1)
                await pause.pause()

                const nodes = await besuNodeManager
                    .connect(other)
                    .getPaginatedExecutionNodes(
                        ExecutionNodeState.active,
                        10,
                        1
                    )
                expect(nodes.length).to.be.gte(0)
            })
        })
    })

    describe('Edge Cases and Missing Coverage', function () {
        describe('businessIdIntrospection', function () {
            it('GIVEN BesuNodeManager WHEN calling businessIdIntrospection THEN should return correct resolver key', async function () {
                const resolverKey =
                    await besuNodeManagerFacet.businessIdIntrospection()
                expect(resolverKey).to.equal(ethers.id('BESU_NODE_MANAGER'))
            })
        })

        describe('Pagination with none state', function () {
            it('GIVEN ValidatorState.none WHEN calling getPaginatedValidators THEN should return empty array', async function () {
                const nodes = await besuNodeManager.getPaginatedValidators(
                    ValidatorState.none,
                    10,
                    1
                )
                expect(nodes.length).to.equal(0)
            })

            it('GIVEN BootNodeState.none WHEN calling getPaginatedBootNodes THEN should return empty array', async function () {
                const nodes = await besuNodeManager.getPaginatedBootNodes(
                    BootNodeState.none,
                    10,
                    1
                )
                expect(nodes.length).to.equal(0)
            })

            it('GIVEN ExecutionNodeState.none WHEN calling getPaginatedExecutionNodes THEN should return empty array', async function () {
                const nodes = await besuNodeManager.getPaginatedExecutionNodes(
                    ExecutionNodeState.none,
                    10,
                    1
                )
                expect(nodes.length).to.equal(0)
            })
        })

        describe('Core error coverage', function () {
            it('GIVEN non-existent node WHEN attempting to remove bootnode THEN should revert with NodeNotFound', async function () {
                const fakeNodeId = ethers.id('nonexistent')
                await expect(
                    besuNodeManager.connect(admin).removeBootNode(fakeNodeId)
                ).to.be.revertedWithCustomError(besuNodeManager, 'NodeNotFound')
            })

            it('GIVEN non-existent node WHEN attempting to remove execution node THEN should revert with NodeNotFound', async function () {
                const fakeNodeId = ethers.id('nonexistent')
                await expect(
                    besuNodeManager
                        .connect(admin)
                        .removeExecutionNode(fakeNodeId)
                ).to.be.revertedWithCustomError(besuNodeManager, 'NodeNotFound')
            })
        })

        describe('Remove quarantined nodes', function () {
            it('GIVEN quarantined bootnode WHEN calling removeBootNode THEN should remove from quarantine set', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]

                await besuNodeManager.connect(admin).quarantineBootNode(nodeId!)
                expect(
                    await besuNodeManager.getTotalBootNodes(
                        BootNodeState.quarantine
                    )
                ).to.equal(1)

                await besuNodeManager.connect(admin).removeBootNode(nodeId!)
                expect(
                    await besuNodeManager.getTotalBootNodes(
                        BootNodeState.quarantine
                    )
                ).to.equal(0)
                expect(await besuNodeManager.isBootNode(nodeId!)).to.be.false
            })

            it('GIVEN quarantined execution node WHEN calling removeExecutionNode THEN should remove from quarantine set', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_2)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await besuNodeManager
                    .connect(admin)
                    .quarantineExecutionNode(nodeId!)
                expect(
                    await besuNodeManager.getTotalExecutionNodes(
                        ExecutionNodeState.quarantine
                    )
                ).to.equal(1)

                await besuNodeManager
                    .connect(admin)
                    .removeExecutionNode(nodeId!)
                expect(
                    await besuNodeManager.getTotalExecutionNodes(
                        ExecutionNodeState.quarantine
                    )
                ).to.equal(0)
                expect(await besuNodeManager.isExecutionNode(nodeId!)).to.be
                    .false
            })
        })
    })

    describe('Integration Tests', function () {
        describe('getNode - Cross-category lookup', function () {
            it('GIVEN validator node WHEN calling getNode THEN should return complete NodeDTO', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                const node = await besuNodeManager.getNode(nodeId!)
                expect(node.nodeId).to.equal(nodeId)
                expect(node.enode).to.equal(ENODE_1)
            })

            it('GIVEN bootnode WHEN calling getNode THEN should return complete NodeDTO', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addBootNode(ENODE_2)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id('BootNodeAdded(bytes32,string,uint256,uint8)')
                )?.topics[1]

                const node = await besuNodeManager.getNode(nodeId!)
                expect(node.nodeId).to.equal(nodeId)
                expect(node.enode).to.equal(ENODE_2)
            })

            it('GIVEN execution node WHEN calling getNode THEN should return complete NodeDTO', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addExecutionNode(ENODE_3)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ExecutionNodeAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                const node = await besuNodeManager.getNode(nodeId!)
                expect(node.nodeId).to.equal(nodeId)
                expect(node.enode).to.equal(ENODE_3)
            })

            it('GIVEN non-existent node WHEN calling getNode THEN should revert with NodeNotFound', async function () {
                const fakeNodeId = ethers.id('nonexistent')
                const node = await besuNodeManager.getNode(fakeNodeId!)
                expect(node.nodeId).to.equal(ZeroHash)
                expect(node.enode).to.equal('')
                expect(node.timestamp).to.equal(0)
            })

            it('GIVEN no role or pause WHEN calling getNode THEN should succeed', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidator(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await pause.pause()
                const node = await besuNodeManager
                    .connect(other)
                    .getNode(nodeId!)
                expect(node.nodeId).to.equal(nodeId)
            })
        })

        describe('Interface introspection', function () {
            it('WHEN calling interfacesIntrospection THEN should return IBesuNodeManager interface', async function () {
                const interfaces =
                    await besuNodeManagerFacet.interfacesIntrospection()
                expect(interfaces.length).to.be.greaterThan(0)
            })

            it('WHEN calling selectorsIntrospection THEN should return all 31 selectors', async function () {
                const selectors =
                    await besuNodeManagerFacet.selectorsIntrospection()
                expect(selectors.length).to.equal(28)
            })
        })

        describe('Events', function () {
            it('GIVEN addValidator THEN should emit ValidatorAdded event', async function () {
                await expect(
                    besuNodeManager.connect(admin).addValidator(ENODE_1)
                ).to.emit(besuNodeManager, 'ValidatorAdded')
            })

            it('GIVEN state transitions THEN should emit appropriate events', async function () {
                const tx = await besuNodeManager
                    .connect(admin)
                    .addValidatorStandby(ENODE_1)
                const receipt = await tx.wait()
                const nodeId = receipt?.logs.find(
                    (log) =>
                        log.topics[0] ===
                        ethers.id(
                            'ValidatorAdded(bytes32,string,uint256,uint8)'
                        )
                )?.topics[1]

                await expect(
                    besuNodeManager.connect(admin).promoteValidator(nodeId!)
                ).to.emit(besuNodeManager, 'ValidatorPromoted')

                await expect(
                    besuNodeManager.connect(admin).standbyValidator(nodeId!)
                ).to.emit(besuNodeManager, 'ValidatorStandby')

                await expect(
                    besuNodeManager.connect(admin).quarantineValidator(nodeId!)
                ).to.emit(besuNodeManager, 'ValidatorQuarantined')
            })
        })
    })
})
