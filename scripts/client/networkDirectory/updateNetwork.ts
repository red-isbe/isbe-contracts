import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { Algorithm, Stage } from './createNetwork'
import {
    executeNetworkDirectoryWrite,
    stringToBytes32,
    algorithmToString,
    stageToString,
} from './utils'

export interface UpdateNetworkData {
    chainId: bigint | number
    name: string
    symbol: string
    algorithm: Algorithm
    stage: Stage
}

export async function updateNetwork(
    networkData: UpdateNetworkData,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    if (networkData.algorithm < 0 || networkData.algorithm > 2) {
        throw new Error(
            `Invalid algorithm: ${networkData.algorithm}. Must be 0 (NONE), 1 (SECP256K1), or 2 (SECP256R1)`
        )
    }

    if (networkData.stage < 0 || networkData.stage > 3) {
        throw new Error(
            `Invalid stage: ${networkData.stage}. Must be 0 (NONE), 1 (DEV), 2 (PRE), or 3 (PROD)`
        )
    }

    const normalizedData = {
        chainId: BigInt(networkData.chainId),
        name: stringToBytes32(networkData.name),
        symbol: stringToBytes32(networkData.symbol),
        algorithm: networkData.algorithm,
        stage: networkData.stage,
    }

    console.log('🌐 Initializing signature provider for network update...')
    console.log('📋 Updating network with parameters:')
    console.log(`   Chain ID: ${normalizedData.chainId}`)
    console.log(`   Name: ${networkData.name} (${normalizedData.name})`)
    console.log(`   Symbol: ${networkData.symbol} (${normalizedData.symbol})`)
    console.log(
        `   Algorithm: ${algorithmToString(Number(normalizedData.algorithm))} (${normalizedData.algorithm})`
    )
    console.log(
        `   Stage: ${stageToString(Number(normalizedData.stage))} (${normalizedData.stage})`
    )
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeNetworkDirectoryWrite(
        diamond,
        signatureProvider,
        'updateNetwork',
        [normalizedData],
        300000n
    )

    console.log('\n✅ Network updated successfully')
}
