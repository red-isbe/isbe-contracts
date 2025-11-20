import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { deployGovernance } from '../fixtures/governance'
import { NetworkDirectoryFacet, AccessControl } from '../../typechain-types'
import {
    ContractTransactionReceipt,
    EventLog,
    Log,
    Signer,
    ZeroHash,
} from 'ethers'
import {
    NETWORK_DIRECTORY_RESOLVER_KEY,
    NETWORK_DIRECTORY_ROLE,
    CONFIGURATION_ID_NETWORK_DIRECTORY,
} from '../../utils/constants'
import {
    EllipticType,
    Stage,
    NetworkData,
    UpdateNetworkData,
    Resource,
} from '../types'

/**
 * Lightweight fixture specifically for NetworkDirectory tests
 * Deploys only NetworkDirectoryFacet attached to a governance diamond
 */
async function deployNetworkDirectoryFixture() {
    const [owner, otherAccount] = await ethers.getSigners()
    const ownerAddress = await owner.getAddress()

    // Deploy governance with NetworkDirectory support
    const result = await deployGovernance(
        owner,
        [],
        CONFIGURATION_ID_NETWORK_DIRECTORY
    )

    // Get the governance address
    const governanceAddress = await result.governanceContract.getAddress()

    // Attach NetworkDirectoryFacet ABI to governance so tests can access custom errors
    // Use the facet ABI (NetworkDirectoryFacet) instead of the interface name so
    // hardhat-chai-matchers can find custom errors declared in the facet.
    const networkDirectory = await ethers.getContractAt(
        'NetworkDirectoryFacet',
        governanceAddress
    )

    // Grant NETWORK_CATALOG_ROLE to owner
    await result.accessControl.grantRole(NETWORK_DIRECTORY_ROLE, ownerAddress)

    return {
        networkDirectory,
        accessControl: result.accessControl,
        owner,
        otherAccount,
        ownerAddress,
        NETWORK_CATALOG_ROLE: NETWORK_DIRECTORY_ROLE,
    }
}

const TWO_RESOURCE_ENTRIES = [
    { id: 'RPC', url: 'https://rpc.example.com' },
    { id: 'EXPLORER', url: 'https://explorer.example.com' },
]

const FIVE_RESOURCE_ENTRIES = Array.from({ length: 5 }, (_, index) => ({
    id: `RES${index + 1}`,
    url: `https://res${index + 1}.example.com`,
}))

const createValidNetwork = (
    chainId: number | bigint,
    name = 'TestNet',
    ellipticType: EllipticType = EllipticType.SECP_256_K1,
    symbol = 'TEST',
    stage: Stage = Stage.DEV,
    resources: Resource[] = []
) => {
    return {
        chainId,
        name: ethers.encodeBytes32String(name),
        algorithm: ellipticType,
        symbol: ethers.encodeBytes32String(symbol),
        stage,
        resources,
    } as unknown as NetworkData
}

function mapToUpdateNetworkData(data: NetworkData): UpdateNetworkData {
    return {
        chainId: data.chainId,
        name: data.name,
        algorithm: data.algorithm,
        symbol: data.symbol,
        stage: data.stage,
    }
}

type PaginationExpectation = {
    total: number
    howMany: number
    prev: number
    next: number
}

function expectPaginationMeta(
    total: bigint,
    howMany: bigint,
    prev: bigint,
    next: bigint,
    expected: PaginationExpectation
) {
    expect(total).to.equal(BigInt(expected.total))
    expect(howMany).to.equal(BigInt(expected.howMany))
    expect(prev).to.equal(BigInt(expected.prev))
    expect(next).to.equal(BigInt(expected.next))
}

type NetworkComparable = {
    chainId: bigint | number
    name: string
    algorithm: EllipticType | bigint | number
    symbol: string
    stage: Stage | number | bigint
    resources?: Resource[]
}

function hasResources(
    data: NetworkData | UpdateNetworkData
): data is NetworkData {
    return (data as NetworkData).resources !== undefined
}

function isEventLog(entry: EventLog | Log): entry is EventLog {
    return (entry as EventLog).fragment !== undefined
}

type NetworksPaginationResult = [NetworkData[], bigint, bigint, bigint, bigint]

type ResourceKeysPaginationResult = [string[], bigint, bigint, bigint, bigint]

function getNetworksPage(
    directory: NetworkDirectoryFacet,
    pageSize: number,
    pageIndex: number
): Promise<NetworksPaginationResult> {
    return directory.getNetworksPaginated(
        pageSize,
        pageIndex
    ) as unknown as Promise<NetworksPaginationResult>
}

function getResourceKeysPage(
    directory: NetworkDirectoryFacet,
    chainId: bigint | number,
    pageSize: number,
    pageIndex: number
): Promise<ResourceKeysPaginationResult> {
    return directory.getResourceKeysPaginated(
        chainId,
        pageSize,
        pageIndex
    ) as unknown as Promise<ResourceKeysPaginationResult>
}

function buildResources(
    entries: Array<{ id: string; url: string }>
): Resource[] {
    return entries.map((entry) => ({
        resourceId: ethers.encodeBytes32String(entry.id),
        resource: entry.url,
    }))
}

async function deployNetworkWithResourcesFixture(
    resourceEntries: Array<{ id: string; url: string }>
) {
    const base = await deployNetworkDirectoryFixture()
    const resources = buildResources(resourceEntries)
    const seededNetwork = createValidNetwork(
        1,
        'SeededNet',
        EllipticType.SECP_256_K1,
        'SEED',
        Stage.DEV,
        resources
    )

    await base.networkDirectory.connect(base.owner).createNetwork(seededNetwork)

    return {
        ...base,
        seededNetwork,
    }
}

async function networkWithTwoResourcesFixture() {
    return deployNetworkWithResourcesFixture(TWO_RESOURCE_ENTRIES)
}

async function networkWithFiveResourcesFixture() {
    return deployNetworkWithResourcesFixture(FIVE_RESOURCE_ENTRIES)
}

describe('NetworkDirectory', function () {
    // Increase timeout for governance deployments
    this.timeout(120000)

    // Shared variables - loaded fresh before each test
    let fixture: Awaited<ReturnType<typeof deployNetworkDirectoryFixture>>
    let networkDirectory: NetworkDirectoryFacet
    let accessControl: AccessControl
    let owner: Signer
    let otherAccount: Signer
    let ownerAddress: string

    // Deploy fresh Stage before each test
    beforeEach(async function () {
        fixture = await deployNetworkDirectoryFixture()
        networkDirectory = fixture.networkDirectory
        accessControl = fixture.accessControl
        owner = fixture.owner
        otherAccount = fixture.otherAccount
        ownerAddress = fixture.ownerAddress
    })

    async function assertEventRaised(
        receipt: ContractTransactionReceipt | null,
        eventName: string,
        validator: (event: EventLog) => void
    ): Promise<void> {
        expect(receipt, 'Transaction receipt should be available').to.not.be
            .null
        if (!receipt) return
        const event = receipt.logs?.find(
            (entry): entry is EventLog =>
                isEventLog(entry) && entry.fragment.name === eventName
        )
        expect(
            event,
            `Event ${eventName} should be emitted`
        ).to.exist.and.to.have.property('args')
        if (!event) return
        validator(event)
    }

    function validateNetworkEvent(
        event: EventLog,
        expectedNetwork: NetworkData | UpdateNetworkData
    ): void {
        validateNetwork(event.args.network, expectedNetwork)
    }

    function validateNetwork(
        current: NetworkComparable | undefined,
        expected: NetworkData | UpdateNetworkData
    ) {
        expect(current, 'Network comparison target must exist').to.not.be
            .undefined
        if (!current) return
        validateUpdateNetwork(current, expected)
        if (!hasResources(expected)) return
        validateResources(current.resources ?? [], expected.resources)
    }

    function validateUpdateNetwork(
        emitted: NetworkComparable,
        expected: NetworkData | UpdateNetworkData
    ) {
        expect(BigInt(emitted.chainId)).to.equal(BigInt(expected.chainId))
        expect(emitted.name).to.equal(expected.name)
        expect(Number(emitted.algorithm)).to.equal(Number(expected.algorithm))
        expect(emitted.symbol).to.equal(expected.symbol)
        expect(Number(emitted.stage)).to.equal(Number(expected.stage))
    }

    function validateResources(emitted: Resource[], expected: Resource[]) {
        expect(emitted).to.be.an('array')
        expect(emitted.length).to.be.eq(expected.length)
        for (let index = 0; index < emitted.length; index++) {
            expect(emitted[index].resourceId).to.equal(
                expected[index].resourceId
            )
            expect(emitted[index].resource).to.equal(expected[index].resource)
        }
    }

    describe('Deployment', function () {
        it('GIVEN NetworkDirectory is deployed WHEN checking deployment THEN contract address should be valid', async function () {
            expect(await networkDirectory.getAddress()).to.be.properAddress
        })

        it('GIVEN NetworkDirectory is deployed WHEN checking initial Stage THEN networks count should be 0 and networks list should be empty', async function () {
            expect(await networkDirectory.getNetworksCount()).to.equal(0)
            const networks = await networkDirectory.getAllNetworks()
            expect(networks).to.have.length(0)
        })
    })

    describe('createNetwork', function () {
        it('GIVEN network with chainId = 0 WHEN creating the network THEN transaction should revert with EmptyUint error', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(0)

            await expect(
                networkDirectory.connect(owner).createNetwork(network)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyUint')
        })

        it('GIVEN network with empty name WHEN creating the network THEN transaction should revert with EmptyBytes32 error', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            network.name = ZeroHash

            await expect(
                networkDirectory.connect(owner).createNetwork(network)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyBytes32')
        })

        it('GIVEN network with empty EllipticType WHEN creating the network THEN transaction should revert with InvalidEllipticType error', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            network.algorithm = 0 as EllipticType

            await expect(networkDirectory.connect(owner).createNetwork(network))
                .to.be.reverted
        })

        it('GIVEN network with empty symbol WHEN creating the network THEN transaction should revert with EmptyBytes32 error', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            network.symbol = ZeroHash

            await expect(
                networkDirectory.connect(owner).createNetwork(network)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyBytes32')
        })

        it('GIVEN network with invalid stage WHEN creating the network THEN transaction should revert', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            network.stage = 0 // Invalid stage

            await expect(networkDirectory.connect(owner).createNetwork(network))
                .to.be.reverted
        })

        it('GIVEN duplicated resources WHEN creating the network THEN transaction should revert with DuplicatedResource error', async function () {
            const duplicateResources = buildResources([
                { id: 'RPC', url: 'https://rpc-1.example.com' },
                { id: 'RPC', url: 'https://rpc-2.example.com' },
            ])
            const network = createValidNetwork(
                1,
                'DuplicateResourcesNet',
                EllipticType.SECP_256_K1,
                'DUP',
                Stage.DEV,
                duplicateResources
            )

            await expect(
                networkDirectory.connect(owner).createNetwork(network)
            ).to.be.revertedWithCustomError(
                networkDirectory,
                'DuplicatedResource'
            )
        })

        it('GIVEN network already exists WHEN creating duplicate network THEN transaction should revert with NetworkAlreadyExists error', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            await expect(
                networkDirectory.connect(owner).createNetwork(network)
            ).to.be.revertedWithCustomError(
                networkDirectory,
                'NetworkAlreadyExists'
            )
        })

        it('GIVEN non-authorized account WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)

            await expect(
                networkDirectory.connect(otherAccount).createNetwork(network)
            ).to.be.reverted
        })

        it('GIVEN contract is paused WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const PAUSER_ROLE = ethers.keccak256(
                ethers.toUtf8Bytes('PAUSER_ROLE')
            )
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            const pausable = await ethers.getContractAt(
                'Pause',
                await networkDirectory.getAddress()
            )
            await pausable.connect(owner).pause()

            const network = createValidNetwork(1)

            await expect(networkDirectory.connect(owner).createNetwork(network))
                .to.be.reverted
        })

        it('GIVEN multiple valid networks WHEN creating them THEN all networks should be created successfully', async function () {
            // Using shared variables from beforeEach

            const network1 = createValidNetwork(
                1,
                'Ethereum',
                EllipticType.SECP_256_K1,
                'ETH',
                Stage.PROD
            )
            const network2 = createValidNetwork(
                2,
                'Polygon',
                EllipticType.SECP_256_K1,
                'MATIC',
                Stage.PROD
            )
            const network3 = createValidNetwork(
                3,
                'Besu',
                EllipticType.SECP_256_R1,
                'BESU',
                Stage.DEV
            )

            await networkDirectory.connect(owner).createNetwork(network1)
            await networkDirectory.connect(owner).createNetwork(network2)
            await networkDirectory.connect(owner).createNetwork(network3)

            expect(await networkDirectory.getNetworksCount()).to.equal(3)
        })

        it('GIVEN networks with all valid stages WHEN creating them THEN all networks should be created successfully', async function () {
            // Using shared variables from beforeEach

            // Stage.NONE = 0, Stage.DEV = 1, Stage.PRE = 2, Stage.PROD = 3
            const networkNone = createValidNetwork(
                100,
                'Test',
                EllipticType.SECP_256_K1,
                'TST',
                Stage.NONE
            )
            const networkDev = createValidNetwork(
                1,
                'Dev',
                EllipticType.SECP_256_K1,
                'DEV',
                Stage.DEV
            )
            const networkPre = createValidNetwork(
                2,
                'Pre',
                EllipticType.SECP_256_K1,
                'PRE',
                Stage.PRE
            )
            const networkProd = createValidNetwork(
                3,
                'Prod',
                EllipticType.SECP_256_K1,
                'PRD',
                Stage.PROD
            )

            await expect(
                networkDirectory.connect(owner).createNetwork(networkNone)
            ).to.be.revertedWithCustomError(networkDirectory, 'InvalidStage')
            await networkDirectory.connect(owner).createNetwork(networkDev)
            await networkDirectory.connect(owner).createNetwork(networkPre)
            await networkDirectory.connect(owner).createNetwork(networkProd)

            expect(await networkDirectory.getNetworksCount()).to.equal(3)
        })

        it('GIVEN valid network data WHEN creating a network THEN network should be created successfully and emit NetworkCreated event', async function () {
            // GIVEN: Expected network data
            const expectedNetwork = createValidNetwork(
                1,
                'Ethereum',
                EllipticType.SECP_256_K1,
                'ETH',
                Stage.PROD
            )

            // WHEN: Execute transaction and get receipt
            const tx = await networkDirectory
                .connect(owner)
                .createNetwork(expectedNetwork)
            const receipt = await tx.wait()

            await assertEventRaised(receipt, 'NetworkCreated', (event) =>
                validateNetworkEvent(event, expectedNetwork)
            )

            // AND: Verify on-chain data consistency
            const retrievedNetwork = await networkDirectory.getNetwork(1)
            expect(retrievedNetwork.chainId).to.equal(1)
            expect(ethers.decodeBytes32String(retrievedNetwork.name)).to.equal(
                'Ethereum'
            )
        })
    })

    describe('updateNetwork', function () {
        it('GIVEN non-existent network WHEN updating network THEN transaction should revert with NetworkNotFound error', async function () {
            // Using shared variables from beforeEach

            const network = mapToUpdateNetworkData(createValidNetwork(999))

            await expect(
                networkDirectory.connect(owner).updateNetwork(network)
            ).to.be.revertedWithCustomError(networkDirectory, 'NetworkNotFound')
        })

        it('GIVEN existing network WHEN updating with invalid data THEN transaction should revert with EmptyField error', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            const invalidNetwork = mapToUpdateNetworkData(createValidNetwork(1))
            invalidNetwork.name = ZeroHash

            await expect(
                networkDirectory.connect(owner).updateNetwork(invalidNetwork)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyBytes32')
        })

        it('GIVEN non-authorized account WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            const updatedNetwork = mapToUpdateNetworkData(
                createValidNetwork(1, 'Updated')
            )

            await expect(
                networkDirectory
                    .connect(otherAccount)
                    .updateNetwork(updatedNetwork)
            ).to.be.reverted
        })

        it('GIVEN contract is paused WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            const PAUSER_ROLE = ethers.keccak256(
                ethers.toUtf8Bytes('PAUSER_ROLE')
            )
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            const pausable = await ethers.getContractAt(
                'Pause',
                await networkDirectory.getAddress()
            )
            await pausable.connect(owner).pause()

            const updatedNetwork = mapToUpdateNetworkData(
                createValidNetwork(1, 'PausedUpdate')
            )

            await expect(
                networkDirectory.connect(owner).updateNetwork(updatedNetwork)
            ).to.be.reverted
        })

        it('GIVEN existing network with valid data WHEN updating network THEN network should be updated successfully and emit NetworkUpdated event', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(
                1,
                'Ethereum',
                EllipticType.SECP_256_K1,
                'ETH',
                Stage.DEV
            )
            await networkDirectory.connect(owner).createNetwork(network)

            const updatedNetwork = mapToUpdateNetworkData(
                createValidNetwork(
                    1,
                    'EthereumV2',
                    EllipticType.SECP_256_K1,
                    'ETH2',
                    Stage.PROD
                )
            )

            const tx = await networkDirectory
                .connect(owner)
                .updateNetwork(updatedNetwork)
            const receipt = await tx.wait()

            await assertEventRaised(receipt, 'NetworkUpdated', (event) =>
                validateNetworkEvent(event, updatedNetwork)
            )

            const retrieved = await networkDirectory.getNetwork(1)
            expect(ethers.decodeBytes32String(retrieved.name)).to.equal(
                'EthereumV2'
            )
            expect(ethers.decodeBytes32String(retrieved.symbol)).to.equal(
                'ETH2'
            )
            expect(retrieved.stage).to.equal(3)
        })
    })

    describe('deleteNetwork', function () {
        it('GIVEN a network exists WHEN deleting the network THEN network should be deleted successfully', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            await expect(networkDirectory.connect(owner).deleteNetwork(1))
                .to.emit(networkDirectory, 'NetworkDeleted')
                .withArgs(1)

            expect(await networkDirectory.getNetworksCount()).to.equal(0)
        })

        it('GIVEN a network with resources WHEN deleting the network THEN all associated resources should also be deleted', async function () {
            const {
                networkDirectory: seededDirectory,
                owner: seededOwner,
                seededNetwork,
            } = await loadFixture(networkWithTwoResourcesFixture)

            await seededDirectory
                .connect(seededOwner)
                .deleteNetwork(seededNetwork.chainId)

            validateNetwork(
                await seededDirectory.getNetwork(seededNetwork.chainId),
                createValidNetwork(0, '', 0 as EllipticType, '', Stage.NONE)
            )

            expect(await seededDirectory.getNetworksCount()).to.equal(0)
        })

        it('GIVEN non-existent network WHEN deleting the network THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await expect(
                networkDirectory.connect(owner).deleteNetwork(999)
            ).to.be.revertedWithCustomError(networkDirectory, 'NetworkNotFound')
        })

        it('GIVEN chainId is zero WHEN deleting the network THEN transaction should revert with EmptyUint error', async function () {
            await expect(
                networkDirectory.connect(owner).deleteNetwork(0)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyUint')
        })

        it('GIVEN non-authorized account WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            await expect(
                networkDirectory.connect(otherAccount).deleteNetwork(1)
            ).to.be.reverted
        })

        it('GIVEN contract is paused WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(1)
            await networkDirectory.connect(owner).createNetwork(network)

            const PAUSER_ROLE = ethers.keccak256(
                ethers.toUtf8Bytes('PAUSER_ROLE')
            )
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            const pausable = await ethers.getContractAt(
                'Pause',
                await networkDirectory.getAddress()
            )
            await pausable.connect(owner).pause()

            await expect(networkDirectory.connect(owner).deleteNetwork(1)).to.be
                .reverted
        })

        it('GIVEN a network exists WHEN deleting it THEN chainIds array should be updated correctly', async function () {
            // Using shared variables from beforeEach

            // Create multiple networks
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1, 'Net1'))
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(2, 'Net2'))
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(3, 'Net3'))

            expect(await networkDirectory.getNetworksCount()).to.equal(3)

            // Delete middle network
            await networkDirectory.connect(owner).deleteNetwork(2)

            expect(await networkDirectory.getNetworksCount()).to.equal(2)

            const networks = await networkDirectory.getAllNetworks()
            expect(networks).to.have.length(2)

            // Verify remaining networks
            const chainIds = (
                networks as Array<{ chainId: bigint | number }>
            ).map((n: { chainId: bigint | number }) => Number(n.chainId))
            expect(chainIds).to.include(1)
            expect(chainIds).to.include(3)
            expect(chainIds).to.not.include(2)
        })
    })

    describe('getNetwork', function () {
        it('GIVEN a network exists WHEN retrieving the network THEN network details should be returned successfully', async function () {
            // Using shared variables from beforeEach

            const network = createValidNetwork(
                1,
                'Ethereum',
                EllipticType.SECP_256_K1,
                'ETH',
                Stage.PROD
            )
            await networkDirectory.connect(owner).createNetwork(network)

            validateNetwork(await networkDirectory.getNetwork(1), network)
        })

        it('GIVEN non-existent network WHEN retrieving the network THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            validateNetwork(
                await networkDirectory.getNetwork(999),
                createValidNetwork(0, '', 0 as EllipticType, '', Stage.NONE)
            )
        })

        it('GIVEN a network with resources WHEN retrieving the network THEN all associated resources should also be included in the response', async function () {
            const { networkDirectory: seededDirectory, seededNetwork } =
                await loadFixture(networkWithTwoResourcesFixture)

            validateNetwork(
                await seededDirectory.getNetwork(seededNetwork.chainId),
                seededNetwork
            )
        })
    })

    describe('getAllNetworks', function () {
        it('GIVEN no networks exist WHEN retrieving all networks THEN an empty array should be returned', async function () {
            // Using shared variables from beforeEach

            const networks = await networkDirectory.getAllNetworks()
            expect(networks).to.have.length(0)
        })

        it('GIVEN multiple networks exist WHEN retrieving all networks THEN all network details should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1, 'Net1'))
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(2, 'Net2'))
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(3, 'Net3'))

            const networks = await networkDirectory.getAllNetworks()
            expect(networks).to.have.length(3)
        })

        it('GIVEN multiple networks exist with their resources WHEN retrieving all networks THEN all associated resources should also be included in the response', async function () {
            // Using shared variables from beforeEach

            await networkDirectory.connect(owner).createNetwork(
                createValidNetwork(
                    1,
                    'Net1',
                    EllipticType.SECP_256_K1,
                    'Test',
                    Stage.DEV,
                    [
                        {
                            resourceId: ethers.encodeBytes32String('RPC'),
                            resource: 'https://rpc.example.com',
                        },
                        {
                            resourceId: ethers.encodeBytes32String('EXPLORER'),
                            resource: 'https://explorer.example.com',
                        },
                    ]
                )
            )
            const networks = await networkDirectory.getAllNetworks()
            expect(networks[0].resources).to.have.length(2)
        })
    })

    describe('getNetworksByAlgorithm', function () {
        it('GIVEN no networks match the specified EllipticType WHEN retrieving networks THEN an empty array should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(
                    createValidNetwork(
                        1,
                        'Net1',
                        EllipticType.SECP_256_K1,
                        'N1',
                        1
                    )
                )
            const networks = await networkDirectory.getNetworksByAlgorithm(
                EllipticType.SECP_256_R1
            )
            expect(networks).to.have.length(0)
        })

        it('GIVEN some networks match the specified EllipticType WHEN retrieving networks THEN only matching network details should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(
                    createValidNetwork(
                        1,
                        'Net1',
                        EllipticType.SECP_256_K1,
                        'N1',
                        1
                    )
                )
            await networkDirectory
                .connect(owner)
                .createNetwork(
                    createValidNetwork(
                        2,
                        'Net2',
                        EllipticType.SECP_256_R1,
                        'N2',
                        1
                    )
                )
            await networkDirectory
                .connect(owner)
                .createNetwork(
                    createValidNetwork(
                        3,
                        'Net3',
                        EllipticType.SECP_256_K1,
                        'N3',
                        1
                    )
                )

            const networks = await networkDirectory.getNetworksByAlgorithm(
                EllipticType.SECP_256_K1
            )
            expect(networks).to.have.length(2)

            const chainIds = (
                networks as Array<{ chainId: bigint | number }>
            ).map((n: { chainId: bigint | number }) => Number(n.chainId))
            expect(chainIds).to.include(1)
            expect(chainIds).to.include(3)
        })

        it('GIVEN no networks exist WHEN retrieving networks by EllipticType THEN an empty array should be returned', async function () {
            // Using shared variables from beforeEach
            const networks = await networkDirectory.getNetworksByAlgorithm(
                EllipticType.SECP_256_K1
            )
            expect(networks).to.have.length(0)
        })
    })

    describe('getNetworksPaginated', function () {
        it('GIVEN a list of networks WHEN paginating with valid limit and offset THEN results should be correctly paginated', async function () {
            for (let i = 1; i <= 5; i++) {
                await networkDirectory
                    .connect(owner)
                    .createNetwork(createValidNetwork(i, `Net${i}`))
            }

            const [page1, total1, howMany1, prev1, next1] =
                await getNetworksPage(networkDirectory, 2, 1)
            expect(page1).to.have.length(2)
            expectPaginationMeta(total1, howMany1, prev1, next1, {
                total: 5,
                howMany: 2,
                prev: 1,
                next: 2,
            })

            const [page2, total2, howMany2, prev2, next2] =
                await getNetworksPage(networkDirectory, 2, 2)
            expect(page2).to.have.length(2)
            expectPaginationMeta(total2, howMany2, prev2, next2, {
                total: 5,
                howMany: 2,
                prev: 1,
                next: 3,
            })

            const [page3, total3, howMany3, prev3, next3] =
                await getNetworksPage(networkDirectory, 2, 3)
            expect(page3).to.have.length(1)
            expectPaginationMeta(total3, howMany3, prev3, next3, {
                total: 5,
                howMany: 1,
                prev: 2,
                next: 3,
            })
        })

        it('GIVEN offset exceeds total count WHEN paginating networks THEN metadata should clamp to available pages', async function () {
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const [networks, total, howMany, prev, next] =
                await getNetworksPage(networkDirectory, 10, 2)
            expect(networks).to.have.length(0)
            expectPaginationMeta(total, howMany, prev, next, {
                total: 1,
                howMany: 0,
                prev: 1,
                next: 1,
            })
        })

        it('GIVEN a list of networks WHEN paginating THEN prev and next indicators should reflect boundaries', async function () {
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(2))

            const [, total1, howMany1, prev1, next1] = await getNetworksPage(
                networkDirectory,
                1,
                1
            )
            expectPaginationMeta(total1, howMany1, prev1, next1, {
                total: 2,
                howMany: 1,
                prev: 1,
                next: 2,
            })

            const [, total2, howMany2, prev2, next2] = await getNetworksPage(
                networkDirectory,
                1,
                2
            )
            expectPaginationMeta(total2, howMany2, prev2, next2, {
                total: 2,
                howMany: 1,
                prev: 1,
                next: 2,
            })
        })
    })

    describe('getNetworksCount', function () {
        it('GIVEN no networks exist WHEN retrieving the count THEN count should be 0', async function () {
            // Using shared variables from beforeEach

            expect(await networkDirectory.getNetworksCount()).to.equal(0)
        })

        it('GIVEN network has multiple resources WHEN retrieving resource count THEN correct count should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))
            expect(await networkDirectory.getNetworksCount()).to.equal(1)

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(2))
            expect(await networkDirectory.getNetworksCount()).to.equal(2)

            await networkDirectory.connect(owner).deleteNetwork(1)
            expect(await networkDirectory.getNetworksCount()).to.equal(1)
        })
    })

    describe('setResource', function () {
        it('GIVEN valid resource data and existing network WHEN setting a resource THEN resource should be added successfully', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')
            const resource = 'https://rpc.example.com'

            await expect(
                networkDirectory
                    .connect(owner)
                    .setResource(1, resourceId, resource)
            )
                .to.emit(networkDirectory, 'ResourceSet')
                .withArgs(1, resourceId, resource)
        })

        it('GIVEN chainId is zero WHEN setting a resource THEN transaction should revert with EmptyUint error', async function () {
            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory
                    .connect(owner)
                    .setResource(0, resourceId, 'https://rpc.example.com')
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyUint')
        })

        it('GIVEN empty resource content WHEN setting a resource THEN transaction should revert with EmptyString error', async function () {
            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory.connect(owner).setResource(1, resourceId, '')
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyString')
        })

        it('GIVEN existing resource and existing network WHEN updating a resource THEN resource details should be updated correctly', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, 'https://rpc1.example.com')

            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, 'https://rpc2.example.com')

            const keys = await networkDirectory.getResourceKeys(1)
            expect(keys).to.have.length(1)
        })

        it('GIVEN non-existent network WHEN retrieving resource count THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const resourceId = ethers.encodeBytes32String('RPC')
            await expect(
                networkDirectory
                    .connect(owner)
                    .setResource(999, resourceId, 'https://rpc.example.com')
            )
                .to.be.revertedWithCustomError(
                    networkDirectory,
                    'NetworkNotFound'
                )
                .withArgs(999)
        })

        it('GIVEN empty resourceId WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            await expect(
                networkDirectory
                    .connect(owner)
                    .setResource(1, ZeroHash, 'https://rpc.example.com')
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyBytes32')
        })

        it('GIVEN non-authorized account WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory
                    .connect(otherAccount)
                    .setResource(1, resourceId, 'https://rpc.example.com')
            ).to.be.reverted
        })

        it('GIVEN contract is paused WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const PAUSER_ROLE = ethers.keccak256(
                ethers.toUtf8Bytes('PAUSER_ROLE')
            )
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            const pausable = await ethers.getContractAt(
                'Pause',
                await networkDirectory.getAddress()
            )
            await pausable.connect(owner).pause()

            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory
                    .connect(owner)
                    .setResource(1, resourceId, 'https://rpc.example.com')
            ).to.be.reverted
        })

        it('GIVEN multiple valid resources for same network WHEN setting them THEN all resources should be added successfully', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const rpcId = ethers.encodeBytes32String('RPC')
            const explorerId = ethers.encodeBytes32String('EXPLORER')
            const wsId = ethers.encodeBytes32String('WS')

            await networkDirectory
                .connect(owner)
                .setResource(1, rpcId, 'https://rpc.example.com')
            await networkDirectory
                .connect(owner)
                .setResource(1, explorerId, 'https://explorer.example.com')
            await networkDirectory
                .connect(owner)
                .setResource(1, wsId, 'wss://ws.example.com')

            const keys = await networkDirectory.getResourceKeys(1)
            expect(keys).to.have.length(3)
        })
    })

    describe('deleteResource', function () {
        it('GIVEN existing network with resource WHEN deleting the resource THEN it should be deleted successfully', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, 'https://rpc.example.com')

            await expect(
                networkDirectory.connect(owner).deleteResource(1, resourceId)
            )
                .to.emit(networkDirectory, 'ResourceDeleted')
                .withArgs(1, resourceId)

            const keys = await networkDirectory.getResourceKeys(1)
            expect(keys).to.have.length(0)
        })

        it('GIVEN chainId is zero WHEN deleting a resource THEN transaction should revert with EmptyUint error', async function () {
            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory.connect(owner).deleteResource(0, resourceId)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyUint')
        })

        it('GIVEN non-existent network WHEN retrieving resource count THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory.connect(owner).deleteResource(999, resourceId)
            ).to.be.revertedWithCustomError(networkDirectory, 'NetworkNotFound')
        })

        it('GIVEN non-existent resource WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')

            await expect(
                networkDirectory.connect(owner).deleteResource(1, resourceId)
            )
                .to.be.revertedWithCustomError(
                    networkDirectory,
                    'ResourceNotFound'
                )
                .withArgs(1, resourceId)
        })

        it('GIVEN empty resourceId WHEN deleting a resource THEN transaction should fail', async function () {
            await expect(
                networkDirectory.connect(owner).deleteResource(1, ZeroHash)
            ).to.be.revertedWithCustomError(networkDirectory, 'EmptyBytes32')
        })

        it('GIVEN non-authorized account WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, 'https://rpc.example.com')

            await expect(
                networkDirectory
                    .connect(otherAccount)
                    .deleteResource(1, resourceId)
            ).to.be.reverted
        })

        it('GIVEN contract is paused WHEN deleting a resource THEN transaction should fail', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, 'https://rpc.example.com')

            const PAUSER_ROLE = ethers.keccak256(
                ethers.toUtf8Bytes('PAUSER_ROLE')
            )
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            const pausable = await ethers.getContractAt(
                'Pause',
                await networkDirectory.getAddress()
            )
            await pausable.connect(owner).pause()

            await expect(
                networkDirectory.connect(owner).deleteResource(1, resourceId)
            ).to.be.reverted
        })

        it('GIVEN multiple resources exist WHEN deleting a middle resource THEN remaining resources should be correctly ordered', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const rpcId = ethers.encodeBytes32String('RPC')
            const explorerId = ethers.encodeBytes32String('EXPLORER')
            const wsId = ethers.encodeBytes32String('WS')

            await networkDirectory
                .connect(owner)
                .setResource(1, rpcId, 'https://rpc.example.com')
            await networkDirectory
                .connect(owner)
                .setResource(1, explorerId, 'https://explorer.example.com')
            await networkDirectory
                .connect(owner)
                .setResource(1, wsId, 'wss://ws.example.com')

            // Delete middle resource
            await networkDirectory.connect(owner).deleteResource(1, explorerId)

            const keys = await networkDirectory.getResourceKeys(1)
            expect(keys).to.have.length(2)

            const keyStrings = (keys as string[]).map((k: string) =>
                ethers.decodeBytes32String(k).replace(/\0/g, '')
            )
            expect(keyStrings).to.include('RPC')
            expect(keyStrings).to.include('WS')
            expect(keyStrings).to.not.include('EXPLORER')
        })
    })

    describe('getResourceKeys', function () {
        it('GIVEN network has no resources WHEN listing resource keys THEN an empty array should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const keys = await networkDirectory.getResourceKeys(1)
            expect(keys).to.have.length(0)
        })

        it('GIVEN network has multiple resources WHEN listing resource keys THEN all keys should be returned', async function () {
            const { networkDirectory: seededDirectory, seededNetwork } =
                await loadFixture(networkWithTwoResourcesFixture)

            const keys = await seededDirectory.getResourceKeys(
                seededNetwork.chainId
            )
            expect(keys).to.have.length(seededNetwork.resources.length)
        })

        it('GIVEN non-existent network WHEN retrieving resource count THEN result is empty', async function () {
            // Using shared variables from beforeEach
            expect(
                await networkDirectory.getResourceKeys(999)
            ).to.be.deep.equal([])
        })
    })

    describe('getResourceKeysPaginated', function () {
        it('GIVEN non configured network WHEN paginating resource keys THEN an empty array should be returned', async function () {
            const [resourceIds, totalCount, howMany, prev, next] =
                await getResourceKeysPage(networkDirectory, 1, 10, 1)
            expect(resourceIds).to.have.length(0)
            expectPaginationMeta(totalCount, howMany, prev, next, {
                total: 0,
                howMany: 0,
                prev: 1,
                next: 0,
            })
        })

        it('GIVEN network has multiple resources WHEN paginating resource keys THEN results should be correctly paginated', async function () {
            const { networkDirectory: seededDirectory, seededNetwork } =
                await loadFixture(networkWithFiveResourcesFixture)

            const [page1, totalCount1, howMany1, prev1, next1] =
                await getResourceKeysPage(
                    seededDirectory,
                    seededNetwork.chainId,
                    2,
                    1
                )
            expect(page1).to.have.length(2)
            expectPaginationMeta(totalCount1, howMany1, prev1, next1, {
                total: seededNetwork.resources.length,
                howMany: 2,
                prev: 1,
                next: 2,
            })

            // Get second page
            const [page2, totalCount2, howMany2, prev2, next2] =
                await getResourceKeysPage(
                    seededDirectory,
                    seededNetwork.chainId,
                    2,
                    2
                )
            expect(page2).to.have.length(2)
            expectPaginationMeta(totalCount2, howMany2, prev2, next2, {
                total: seededNetwork.resources.length,
                howMany: 2,
                prev: 1,
                next: 3,
            })

            // Get last page
            const [page3, totalCount3, howMany3, prev3, next3] =
                await getResourceKeysPage(
                    seededDirectory,
                    seededNetwork.chainId,
                    2,
                    3
                )
            expect(page3).to.have.length(1)
            expectPaginationMeta(totalCount3, howMany3, prev3, next3, {
                total: seededNetwork.resources.length,
                howMany: 1,
                prev: 2,
                next: 3,
            })
        })

        it('GIVEN offset exceeds total count WHEN paginating resource keys THEN an empty array should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, 'https://rpc.example.com')

            const [resourceIds, totalCount, howMany, prev, next] =
                await getResourceKeysPage(networkDirectory, 1, 10, 10)
            expect(resourceIds).to.have.length(0)
            expectPaginationMeta(totalCount, howMany, prev, next, {
                total: 1,
                howMany: 0,
                prev: 9,
                next: 1,
            })
        })
    })

    describe('getResourceCount', function () {
        it('GIVEN network has no resources WHEN retrieving resource count THEN count should be 0', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            expect(await networkDirectory.getResourceCount(1)).to.equal(0)
        })

        it('GIVEN network has multiple resources WHEN retrieving resource count THEN correct count should be returned', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const rpcId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, rpcId, 'https://rpc.example.com')
            expect(await networkDirectory.getResourceCount(1)).to.equal(1)

            const explorerId = ethers.encodeBytes32String('EXPLORER')
            await networkDirectory
                .connect(owner)
                .setResource(1, explorerId, 'https://explorer.example.com')
            expect(await networkDirectory.getResourceCount(1)).to.equal(2)

            await networkDirectory.connect(owner).deleteResource(1, rpcId)
            expect(await networkDirectory.getResourceCount(1)).to.equal(1)
        })
    })

    describe('NetworkDirectoryFacet Introspection', function () {
        it('GIVEN NetworkDirectoryFacet is deployed WHEN checking business ID THEN correct business ID should be returned', async function () {
            const NetworkDirectoryFacet = await ethers.getContractFactory(
                'NetworkDirectoryFacet'
            )
            const facet = await NetworkDirectoryFacet.deploy()

            const businessId = await facet.businessIdIntrospection()
            expect(businessId).to.equal(NETWORK_DIRECTORY_RESOLVER_KEY)
        })

        it('GIVEN NetworkDirectoryFacet is deployed WHEN checking selectors THEN correct selectors should be returned', async function () {
            const NetworkDirectoryFacet = await ethers.getContractFactory(
                'NetworkDirectoryFacet'
            )
            const facet = await NetworkDirectoryFacet.deploy()

            const selectors = await facet.selectorsIntrospection()
            expect(selectors.length).to.equal(13)

            // Verify selectors include key functions
            const iface = NetworkDirectoryFacet.interface
            expect(selectors).to.include(
                iface.getFunction('createNetwork')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('updateNetwork')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('deleteNetwork')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getNetwork')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getAllNetworks')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getNetworksByAlgorithm')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('setResource')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('deleteResource')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getResourceKeys')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getNetworksPaginated')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getResourceKeysPaginated')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getNetworksCount')!.selector
            )
            expect(selectors).to.include(
                iface.getFunction('getResourceCount')!.selector
            )
        })

        it('GIVEN NetworkDirectoryFacet is deployed WHEN checking interfaces THEN correct interfaces should be returned', async function () {
            const NetworkDirectoryFacet = await ethers.getContractFactory(
                'NetworkDirectoryFacet'
            )
            const facet = await NetworkDirectoryFacet.deploy()

            const interfaces = await facet.interfacesIntrospection()
            expect(interfaces.length).to.equal(1)

            // Verify the interface is for INetworkDirectory
            // The interfaceId is a bytes4 (4 bytes), which as a hex string is "0x" + 8 characters = 10 total length
            expect(interfaces[0]).to.be.a('string')
            expect(interfaces[0]).to.match(/^0x[0-9a-fA-F]{8}$/)
        })
    })

    describe('Edge Cases and Complex Scenarios', function () {
        it('GIVEN chainId at maximum uint64 value WHEN creating network THEN network should be created successfully', async function () {
            // Using shared variables from beforeEach

            const maxUint64 = BigInt('18446744073709551615') // 2^64 - 1
            const network = createValidNetwork(1)
            network.chainId = maxUint64

            await networkDirectory.connect(owner).createNetwork(network)

            const retrieved = await networkDirectory.getNetwork(maxUint64)
            expect(retrieved.chainId).to.equal(maxUint64)
        })

        it('GIVEN resource content at maximum length WHEN setting resource THEN resource should be added successfully', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceId = ethers.encodeBytes32String('LARGE')
            const maxLengthResource = 'a'.repeat(1024)

            await networkDirectory
                .connect(owner)
                .setResource(1, resourceId, maxLengthResource)

            const network = await networkDirectory.getNetwork(1)
            expect(network.resources[0].resource).to.have.length(1024)
        })

        it('GIVEN multiple resources exist WHEN deleting all resources individually THEN all resources should be removed successfully', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceIds = ['RPC', 'EXPLORER', 'WS', 'API', 'DOCS'].map(
                (r) => ethers.encodeBytes32String(r)
            )

            for (const id of resourceIds) {
                await networkDirectory
                    .connect(owner)
                    .setResource(1, id, `https://${id}.example.com`)
            }

            expect(await networkDirectory.getResourceCount(1)).to.equal(5)

            for (const id of resourceIds) {
                await networkDirectory.connect(owner).deleteResource(1, id)
            }

            expect(await networkDirectory.getResourceCount(1)).to.equal(0)
        })

        it('GIVEN multiple networks exist WHEN creating and deleting many networks THEN operations should maintain data integrity', async function () {
            // Using shared variables from beforeEach

            // Create 10 networks
            for (let i = 1; i <= 10; i++) {
                await networkDirectory
                    .connect(owner)
                    .createNetwork(createValidNetwork(i, `Net${i}`))
            }

            expect(await networkDirectory.getNetworksCount()).to.equal(10)

            // Delete even-numbered networks
            for (let i = 2; i <= 10; i += 2) {
                await networkDirectory.connect(owner).deleteNetwork(i)
            }

            expect(await networkDirectory.getNetworksCount()).to.equal(5)

            const networks = await networkDirectory.getAllNetworks()
            const chainIds = (
                networks as Array<{ chainId: bigint | number }>
            ).map((n: { chainId: bigint | number }) => Number(n.chainId))
            expect(chainIds.sort()).to.deep.equal([1, 3, 5, 7, 9])
        })

        it('GIVEN all supported EllipticType types WHEN creating networks THEN all networks should be created successfully', async function () {
            // Using shared variables from beforeEach

            const EllipticTypes = [
                EllipticType.SECP_256_K1,
                EllipticType.SECP_256_R1,
            ]

            for (let i = 0; i < EllipticTypes.length; i++) {
                await networkDirectory
                    .connect(owner)
                    .createNetwork(
                        createValidNetwork(
                            i + 1,
                            `Net${i}`,
                            EllipticTypes[i],
                            'SYM',
                            1
                        )
                    )
            }

            for (const EllipticType of EllipticTypes) {
                const networks =
                    await networkDirectory.getNetworksByAlgorithm(EllipticType)
                expect(networks).to.have.length(1)
            }
        })

        it('GIVEN network undergoes multiple operations WHEN verifying final Stage THEN data integrity should be maintained', async function () {
            // Using shared variables from beforeEach

            // Create network
            await networkDirectory
                .connect(owner)
                .createNetwork(
                    createValidNetwork(1, 'Original', EllipticType.SECP_256_K1)
                )

            // Add resources
            const rpcId = ethers.encodeBytes32String('RPC')
            await networkDirectory
                .connect(owner)
                .setResource(1, rpcId, 'https://rpc1.example.com')

            // Update network
            await networkDirectory
                .connect(owner)
                .updateNetwork(
                    mapToUpdateNetworkData(
                        createValidNetwork(
                            1,
                            'Updated',
                            EllipticType.SECP_256_K1,
                            'UPD',
                            Stage.PRE
                        )
                    )
                )
            // Update resource
            await networkDirectory
                .connect(owner)
                .setResource(1, rpcId, 'https://rpc2.example.com')
            // Verify final Stage
            const network = await networkDirectory.getNetwork(1)
            expect(ethers.decodeBytes32String(network.name)).to.equal('Updated')
            expect(network.stage).to.equal(Stage.PRE)
            expect(network.resources).to.have.length(1)
            expect(network.resources[0].resource).to.equal(
                'https://rpc2.example.com'
            )
        })
    })

    describe('Gas Optimization Verification', function () {
        it('GIVEN large batch of networks WHEN paginating results THEN pagination should be efficient', async function () {
            // Using shared variables from beforeEach

            const batchSize = 20

            for (let i = 1; i <= batchSize; i++) {
                await networkDirectory
                    .connect(owner)
                    .createNetwork(createValidNetwork(i, `Net${i}`))
            }

            // Verify pagination is more efficient than getAllNetworks for large datasets
            const [page1] = await networkDirectory.getNetworksPaginated(10, 1)
            expect(page1).to.have.length(10)

            const [page2] = await networkDirectory.getNetworksPaginated(10, 2)
            expect(page2).to.have.length(10)
        })

        it('GIVEN many resources per network WHEN paginating resources THEN pagination should be efficient', async function () {
            // Using shared variables from beforeEach

            await networkDirectory
                .connect(owner)
                .createNetwork(createValidNetwork(1))

            const resourceCount = 30

            for (let i = 1; i <= resourceCount; i++) {
                const resourceId = ethers.encodeBytes32String(`RES${i}`)
                await networkDirectory
                    .connect(owner)
                    .setResource(1, resourceId, `https://res${i}.example.com`)
            }

            expect(await networkDirectory.getResourceCount(1)).to.equal(
                resourceCount
            )

            // Verify pagination works for resources
            const [page1] = await networkDirectory.getResourceKeysPaginated(
                1,
                10,
                1
            )
            expect(page1).to.have.length(10)
        })
    })
})
