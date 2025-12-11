import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import {
    createNetwork,
    Algorithm,
    Stage,
    Resource,
} from '../../scripts/networkDirectory/createNetwork'
import { ethers } from 'ethers'

/**
 * Converts a string to bytes32
 */
function stringToBytes32(str: string): string {
    // If already a valid bytes32 hex string, return it
    if (str.startsWith('0x') && str.length === 66) {
        return str
    }
    // Otherwise, encode the string as bytes32
    return ethers.encodeBytes32String(str.slice(0, 31)) // Max 31 chars for bytes32
}

/**
 * Parses resources from JSON string
 * Expected format: [{"resourceId": "RPC", "resource": "https://..."}]
 */
function parseResources(resourcesJson: string): Resource[] {
    if (!resourcesJson || resourcesJson === '[]') {
        return []
    }
    try {
        const parsed = JSON.parse(resourcesJson)
        return parsed.map((r: { resourceId: string; resource: string }) => ({
            resourceId: stringToBytes32(r.resourceId),
            resource: r.resource,
        }))
    } catch (error) {
        throw new Error(
            `Invalid resources JSON format: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

/**
 npx hardhat createNetwork --network localhost \
  --chain-id 2024 \
  --name "Alastria T" \
  --symbol "ALAT" \
  --algorithm 1 \
  --stage 1 \
  --resources '[{"resourceId":"RPC","resource":"https://rpc.alastria.io"}]' \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('createNetwork', 'Creates a new network in the NetworkDirectory')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam(
        'name',
        'The name of the network (string, will be converted to bytes32)'
    )
    .addParam(
        'symbol',
        'The symbol of the network (string, will be converted to bytes32)'
    )
    .addParam(
        'algorithm',
        'The algorithm type: 0=NONE, 1=SECP256K1, 2=SECP256R1',
        undefined,
        types.int
    )
    .addParam(
        'stage',
        'The stage: 0=NONE, 1=DEV, 2=PRE, 3=PROD',
        undefined,
        types.int
    )
    .addOptionalParam(
        'resources',
        'JSON array of resources: [{"resourceId":"RPC","resource":"https://..."}]',
        '[]'
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, name, symbol, algorithm, stage, resources, diamond } =
            taskArgs

        // Validate algorithm enum
        if (algorithm < 0 || algorithm > 2) {
            throw new Error(
                `Invalid algorithm: ${algorithm}. Must be 0 (NONE), 1 (SECP256K1), or 2 (SECP256R1)`
            )
        }

        // Validate stage enum
        if (stage < 0 || stage > 3) {
            throw new Error(
                `Invalid stage: ${stage}. Must be 0 (NONE), 1 (DEV), 2 (PRE), or 3 (PROD)`
            )
        }

        console.log(
            '🌐 Initializing signature provider for network creation...'
        )
        const signatureProvider = SignatureProviderFactory.create(hre)

        // Parse resources
        const parsedResources = parseResources(resources)

        // Build network data
        const networkData = {
            chainId: BigInt(chainId),
            name: stringToBytes32(name),
            symbol: stringToBytes32(symbol),
            algorithm: algorithm as Algorithm,
            stage: stage as Stage,
            resources: parsedResources,
        }

        console.log('📋 Creating network with parameters:')
        console.log(`   Chain ID: ${chainId}`)
        console.log(`   Name: ${name} (${networkData.name})`)
        console.log(`   Symbol: ${symbol} (${networkData.symbol})`)
        console.log(`   Algorithm: ${Algorithm[algorithm]} (${algorithm})`)
        console.log(`   Stage: ${Stage[stage]} (${stage})`)
        console.log(`   Resources: ${parsedResources.length}`)
        if (parsedResources.length > 0) {
            parsedResources.forEach((r, i) => {
                console.log(`      [${i}] ${r.resourceId}: ${r.resource}`)
            })
        }
        console.log(`   Diamond: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await createNetwork(
            networkData,
            diamond,
            signatureProvider
        )

        console.log('\n✅ Network created successfully:')
        console.log(`   Chain ID: ${result.chainId}`)
        console.log(`   Name: ${result.name}`)
        console.log(`   Symbol: ${result.symbol}`)
    })
