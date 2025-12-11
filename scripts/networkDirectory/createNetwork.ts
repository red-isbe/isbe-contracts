import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getEvent } from '../utils/getEvent'

// Types matching Solidity enums
export enum Algorithm {
    NONE = 0,
    SECP256K1 = 1,
    SECP256R1 = 2,
}

export enum Stage {
    NONE = 0,
    DEV = 1,
    PRE = 2,
    PROD = 3,
}

export interface Resource {
    resourceId: string // bytes32
    resource: string // string
}

export interface NetworkData {
    chainId: bigint | number
    name: string // bytes32
    symbol: string // bytes32
    algorithm: Algorithm
    stage: Stage
    resources: Resource[]
}

interface EnhancedError extends Error {
    originalError: unknown
    context?: {
        operation: string
        chainId: string
        contract: string
    }
    transactionHash?: string
}

/**
 * Create network using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function createNetwork(
    network: NetworkData,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ chainId: bigint; name: string; symbol: string }> {
    // Validate inputs
    if (!network.chainId || BigInt(network.chainId) === 0n) {
        throw new Error('Invalid chainId: must be greater than 0')
    }
    if (
        !network.name ||
        network.name ===
            '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
        throw new Error('Invalid name: cannot be empty')
    }
    if (
        !network.symbol ||
        network.symbol ===
            '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
        throw new Error('Invalid symbol: cannot be empty')
    }

    console.log(
        `🌐 Using ${signatureProvider.getCurveType()} signature for network creation...`
    )

    // For secp256r1, use raw transactions
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await createNetworkWithRawTransaction(
            network,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const networkDirectory = await getNetworkDirectory(diamond, signer)

    console.log('📡 Sending createNetwork transaction...')
    let tx
    try {
        tx = await networkDirectory.createNetwork(network)
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        console.log('❌ Transaction failed to submit')
        const enhancedError: EnhancedError = new Error(
            `Failed to submit createNetwork transaction: ${error instanceof Error ? error.message : String(error)}`
        ) as EnhancedError
        enhancedError.originalError = error
        enhancedError.context = {
            operation: 'createNetwork',
            chainId: network.chainId.toString(),
            contract: diamond,
        }
        throw enhancedError
    }

    console.log('⏳ Waiting for transaction to be mined...')
    let networkCreatedEvent
    try {
        networkCreatedEvent = await getEvent(
            'NetworkCreated',
            tx,
            networkDirectory
        )
    } catch (error) {
        console.log(
            '❌ Transaction failed to mine or no NetworkCreated event found'
        )
        console.log(`   🔗 Transaction Hash: ${tx.hash}`)

        // Try to get transaction receipt for more details
        let receipt
        try {
            receipt = await tx.wait()
            console.log(
                `   📄 Transaction Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`
            )
            console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`)
        } catch (receiptError) {
            console.log(
                `   ⚠️  Could not get transaction receipt: ${receiptError.message}`
            )
        }

        const enhancedError: EnhancedError = new Error(
            `createNetwork transaction failed: ${error instanceof Error ? error.message : String(error)}`
        ) as EnhancedError
        enhancedError.originalError = error
        enhancedError.transactionHash = tx.hash
        enhancedError.context = {
            operation: 'createNetwork',
            chainId: network.chainId.toString(),
            contract: diamond,
        }
        throw enhancedError
    }

    const eventNetwork = networkCreatedEvent.args.network

    return {
        chainId: eventNetwork.chainId,
        name: eventNetwork.name,
        symbol: eventNetwork.symbol,
    }
}

/**
 * Create network using raw transactions for secp256r1 compatibility
 */
async function createNetworkWithRawTransaction(
    network: NetworkData,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ chainId: bigint; name: string; symbol: string }> {
    const { NetworkDirectoryFacet__factory } =
        await import('../../typechain-types')

    const networkDirectoryInterface =
        NetworkDirectoryFacet__factory.createInterface()

    // Prepare the network data tuple for encoding
    const networkTuple = [
        BigInt(network.chainId),
        network.name,
        network.symbol,
        network.algorithm,
        network.stage,
        network.resources.map((r) => [r.resourceId, r.resource]),
    ]

    const functionData = networkDirectoryInterface.encodeFunctionData(
        'createNetwork',
        [networkTuple]
    )

    console.log('📡 Sending createNetwork raw transaction...')
    console.log(`   📍 Target contract: ${diamond}`)
    console.log(`   📄 Function data: ${functionData.slice(0, 66)}...`)
    console.log(`   🔗 Chain ID: ${network.chainId}`)
    console.log(`   📛 Name: ${network.name}`)
    console.log(`   🏷️  Symbol: ${network.symbol}`)
    console.log(`   🔐 Algorithm: ${Algorithm[network.algorithm]}`)
    console.log(`   📊 Stage: ${Stage[network.stage]}`)
    console.log(`   📦 Resources: ${network.resources.length}`)

    let txResponse
    try {
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 500000n, // Higher gas limit for complex struct
        })
        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit createNetwork raw transaction: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    console.log('⏳ Waiting for raw transaction to be mined...')
    let receipt
    try {
        receipt = await txResponse.wait()
        if (!receipt || receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
        console.log(`   📄 Transaction Receipt Details:`)
        console.log(`      • Status: ${receipt.status}`)
        console.log(`      • Block: ${receipt.blockNumber}`)
        console.log(`      • Gas Used: ${receipt.gasUsed.toString()}`)
        console.log(`      • Logs Count: ${receipt.logs.length}`)
    } catch (error) {
        console.log(`❌ Raw transaction failed to mine`)
        console.log(`   🔗 Transaction Hash: ${txResponse.hash}`)
        throw error
    }

    // Parse NetworkCreated event from the receipt
    let networkCreatedEvent = null
    const parseErrors: string[] = []

    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i]
        try {
            const parsed = networkDirectoryInterface.parseLog(log)
            if (parsed && parsed.name === 'NetworkCreated') {
                networkCreatedEvent = parsed
                break
            }
        } catch (error) {
            parseErrors.push(
                `Log ${i}: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    if (!networkCreatedEvent) {
        // Try to find NetworkCreated event by topic hash as fallback
        // keccak256("NetworkCreated((uint256,bytes32,bytes32,uint8,uint8,(bytes32,string)[]))")
        console.log(`   🔍 Analyzing ${receipt.logs.length} logs in receipt:`)
        receipt.logs.forEach((log, index) => {
            console.log(
                `      Log ${index}: topic0=${log.topics[0]}, address=${log.address}`
            )
        })

        // If transaction was successful, try to verify by reading state
        console.log(
            '   🔍 No NetworkCreated event found, verifying by state check...'
        )
        try {
            const signer = await signatureProvider.getSigner()
            const networkDirectory = await getNetworkDirectory(diamond, signer)
            const createdNetwork = await networkDirectory.getNetwork(
                BigInt(network.chainId)
            )

            if (
                createdNetwork &&
                createdNetwork.chainId === BigInt(network.chainId)
            ) {
                console.log(
                    '   ✅ Network was successfully created (verified by direct state check)'
                )
                return {
                    chainId: BigInt(network.chainId),
                    name: network.name,
                    symbol: network.symbol,
                }
            }
        } catch (stateCheckError) {
            console.log(
                `   ⚠️  Could not verify network state: ${stateCheckError instanceof Error ? stateCheckError.message : String(stateCheckError)}`
            )
        }

        const errorMessage =
            parseErrors.length > 0
                ? `NetworkCreated event not found. Parse errors: ${parseErrors.join('; ')}`
                : `NetworkCreated event not found in ${receipt.logs.length} logs.`
        throw new Error(errorMessage)
    }

    const eventNetwork = networkCreatedEvent.args.network

    return {
        chainId: eventNetwork.chainId,
        name: eventNetwork.name,
        symbol: eventNetwork.symbol,
    }
}

/**
 * Helper to get NetworkDirectory contract instance
 */
async function getNetworkDirectory(diamond: string, signer: Signer) {
    const { NetworkDirectoryFacet__factory } =
        await import('../../typechain-types')
    return NetworkDirectoryFacet__factory.connect(diamond, signer)
}
