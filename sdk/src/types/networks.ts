/**
 * Network configuration types for ISBE SDK
 */

export type NetworkType = 'dev' | 'main';

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  gasPrice?: number;
  gas?: number;
  blockGasLimit?: number;
  curve?: string;
  factoryDiamondAddress: string;
  blockExplorer?: string;
}

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  dev: {
    name: 'Besu Dev Network',
    rpcUrl: 'https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/',
    chainId: 11073,
    gasPrice: 0,
    gas: 80_000_000,  // Aumentado para deployments grandes
    blockGasLimit: 90_000_000,  // Aumentado también
    curve: 'secp256k1',
    factoryDiamondAddress: '0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de',
    blockExplorer: 'https://blockscout.dev.aws.envs.redisbe.com/', // Local dev network
  },
  main: {
    name: 'ISBE Mainnet',
    rpcUrl: 'https://rpc.isbe.network', // Placeholder for future mainnet
    chainId: 9999, // Placeholder chainId
    factoryDiamondAddress: '0x0000000000000000000000000000000000000000', // To be deployed
    blockExplorer: 'https://explorer.isbe.network',
  },
};
