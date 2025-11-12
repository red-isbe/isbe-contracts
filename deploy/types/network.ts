/**
 * Network-specific types
 */

import { Network, CurveType } from './index'

export interface NetworkDefinition {
    name: Network
    chainId: number
    url: string
    curve: CurveType
    description: string
    gasPrice?: number
    gas?: number
    blockGasLimit?: number
}

export const NETWORK_DEFINITIONS: Record<Network, NetworkDefinition> = {
    [Network.HARDHAT]: {
        name: Network.HARDHAT,
        chainId: 31337,
        url: 'http://localhost:8545',
        curve: CurveType.SECP256K1,
        description: 'Local Hardhat network',
    },
    [Network.DEV]: {
        name: Network.MVP,
        chainId: 2023,
        url:
            process.env.MVP_URL ||
            'https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/',
        curve: CurveType.SECP256K1,
        description: 'ISBE DEV network',
        gasPrice: 0,
        gas: 20_000_000,
        blockGasLimit: 0x1e84800,
    },
    [Network.MVP]: {
        name: Network.MVP,
        chainId: 2023,
        url:
            process.env.MVP_URL ||
            'https://besu-node-non-validator-1.mvp.aws.envs.redisbe.com/',
        curve: CurveType.SECP256K1,
        description: 'ISBE MVP network',
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 30000000,
    },
    [Network.ARSYS]: {
        name: Network.ARSYS,
        chainId: 2024,
        url: process.env.ARSYS_URL || 'http://213.165.85.41:8545',
        curve: CurveType.SECP256K1,
        description: 'ISBE Arsys network',
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 30000000,
    },
    [Network.KEPLER]: {
        name: Network.KEPLER,
        chainId: 1003,
        url:
            process.env.KEPLER_URL ||
            'https://regular.pre.iosec.io.builders:8565',
        curve: CurveType.SECP256K1,
        description: 'IoBuilders Kepler network',
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 30000000,
    },
    [Network.CUSTOM_R1]: {
        name: Network.CUSTOM_R1,
        chainId: 2222,
        url: process.env.CUSTOM_R1_URL || 'http://172.16.240.30:8545',
        curve: CurveType.SECP256R1,
        description: 'Custom Besu secp256r1 network',
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 30000000,
    },
    [Network.BARE]: {
        name: Network.BARE,
        chainId: 10962,
        url:
            process.env.BARE_URL ||
            'https://besu-node-validator-bare-1-rpc.dev.aws.envs.redisbe.com/',
        curve: CurveType.SECP256R1,
        description: 'Besu bare network (no use cases)',
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 30000000,
    },
}

export function getNetworkDefinition(network: Network): NetworkDefinition {
    const definition = NETWORK_DEFINITIONS[network]
    if (!definition) {
        throw new Error(`Network ${network} not found`)
    }
    return definition
}

export function isSecp256r1Network(network: Network): boolean {
    const definition = getNetworkDefinition(network)
    return definition.curve === CurveType.SECP256R1
}

export function isSecp256k1Network(network: Network): boolean {
    const definition = getNetworkDefinition(network)
    return definition.curve === CurveType.SECP256K1
}
