/**
 * ISBEClient - Main SDK client for interacting with ISBE Factory Diamond
 * 
 * This is the primary entry point for the SDK. It handles network connection,
 * Factory Diamond interaction, and coordinates configuration and deployment.
 */

import { ethers, Signer, Provider } from 'ethers';
import { config as dotenvConfig } from 'dotenv';
import { NetworkType, NETWORKS, NetworkConfig, TokenConfiguration } from '../types';
import { ConfigurationManager } from './ConfigurationManager';
import { ClientConfigurationManager } from './ClientConfigurationManager';
import { ProxyDeployer } from './ProxyDeployer';

// Load environment variables
dotenvConfig();

// Factory Diamond ABI (minimal interface for deployUseCase)
const FACTORY_ABI = [
  'function deployUseCase(bytes32 configId, bytes[] memory initializeData, bytes32[2][] memory rbacData) external returns (address)',
  'function getBusinessLogicAddress(bytes32 resolver, uint256 version) external view returns (address)',
  'function getConfiguration(bytes32 configId, uint256 version) external view returns (bytes32[] memory)',
  'event ProxyDeployed(address indexed proxy, bytes32 indexed configId, address indexed deployer)',
];

export class ISBEClient {
  private network: NetworkType;
  private networkConfig: NetworkConfig;
  private provider: Provider;
  private signer?: Signer;
  private factoryContract: ethers.Contract;
  
  public configManager: ConfigurationManager;
  public clientConfigManager: ClientConfigurationManager;
  public proxyDeployer: ProxyDeployer;

  /**
   * Create a new ISBE SDK client
   * 
   * @param network Network to connect to ('dev' or 'main')
   * @param signer Optional signer for transactions (required for deployments)
   */
  constructor(network: NetworkType = 'dev', signer?: Signer) {
    this.network = network;
    this.networkConfig = NETWORKS[network];
    
    // Create provider
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
    
    // Store signer if provided
    this.signer = signer;
    
    // Initialize Factory Diamond contract
    this.factoryContract = new ethers.Contract(
      this.networkConfig.factoryDiamondAddress,
      FACTORY_ABI,
      signer || this.provider
    );
    
    // Initialize managers
    this.configManager = new ConfigurationManager();
    this.clientConfigManager = new ClientConfigurationManager();
    this.proxyDeployer = new ProxyDeployer(this.factoryContract);
    
    console.log(` ISBE SDK connected to ${this.networkConfig.name}`);
    console.log(` RPC: ${this.networkConfig.rpcUrl}`);
    console.log(` Factory Diamond: ${this.networkConfig.factoryDiamondAddress}`);
  }

  /**
   * Create client from environment variable
   * Reads ACCOUNT_PRIVATE_KEY from .env file
   */
  static fromEnv(network: NetworkType = 'dev'): ISBEClient {
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error(
        'ACCOUNT_PRIVATE_KEY not found in environment variables. ' +
        'Please set it in your .env file.'
      );
    }

    // Add 0x prefix if not present
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    return ISBEClient.fromPrivateKey(formattedKey, network);
  }

  /**
   * Create client from private key
   */
  static fromPrivateKey(privateKey: string, network: NetworkType = 'dev'): ISBEClient {
    const networkConfig = NETWORKS[network];
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Add 0x prefix if not present
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedKey, provider);
    
    return new ISBEClient(network, wallet);
  }

  /**
   * Create client from mnemonic
   */
  static fromMnemonic(mnemonic: string, network: NetworkType = 'dev', accountIndex: number = 0): ISBEClient {
    const networkConfig = NETWORKS[network];
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);
    
    // Derive account if index provided
    const derivedWallet = accountIndex > 0 
      ? ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic), `m/44'/60'/0'/0/${accountIndex}`).connect(provider)
      : wallet;
    
    return new ISBEClient(network, derivedWallet);
  }

  /**
   * Create read-only client (no signer)
   */
  static readOnly(network: NetworkType = 'dev'): ISBEClient {
    return new ISBEClient(network);
  }

  /**
   * Get the current network information
   */
  getNetworkInfo(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Get the connected signer address
   */
  async getSignerAddress(): Promise<string | null> {
    if (!this.signer) {
      return null;
    }
    return await this.signer.getAddress();
  }

  /**
   * Check if client has a signer (can perform transactions)
   */
  hasSigner(): boolean {
    return !!this.signer;
  }

  /**
   * Get the Factory Diamond contract instance
   */
  getFactoryContract(): ethers.Contract {
    return this.factoryContract;
  }

  /**
   * Get the provider instance
   */
  getProvider(): Provider {
    return this.provider;
  }

  /**
   * Get the signer instance
   */
  getSigner(): Signer | undefined {
    return this.signer;
  }

  /**
   * Verify Factory Diamond is accessible
   */
  async verifyConnection(): Promise<boolean> {
    try {
      // Try to get the code at the Factory address to verify it's a contract
      const code = await this.provider.getCode(this.networkConfig.factoryDiamondAddress);
      
      if (code === '0x' || code === '0x0') {
        console.error('❌ No contract found at Factory Diamond address');
        return false;
      }
      
      console.log('✅ Factory Diamond connection verified');
      return true;
    } catch (error) {
      console.error('❌ Failed to verify Factory Diamond connection:', error);
      return false;
    }
  }

  /**
   * Get network status information
   */
  async getNetworkStatus(): Promise<{
    connected: boolean;
    blockNumber: number;
    chainId: number;
    factoryAddress: string;
    signerAddress: string | null;
  }> {
    const blockNumber = await this.provider.getBlockNumber();
    const network = await this.provider.getNetwork();
    const signerAddress = await this.getSignerAddress();

    return {
      connected: true,
      blockNumber,
      chainId: Number(network.chainId),
      factoryAddress: this.networkConfig.factoryDiamondAddress,
      signerAddress,
    };
  }

  /**
   * List all available configurations
   */
  listConfigurations() {
    return this.configManager.listConfigurations();
  }

  /**
   * Get a specific configuration by ID
   */
  getConfiguration(configId: string) {
    return this.configManager.getConfiguration(configId);
  }

  /**
   * Save a configuration to client's personal collection
   */
  async saveConfiguration(configId: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to save configurations');
    }

    const address = await this.signer.getAddress();
    const config = this.configManager.getConfiguration(configId);

    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    this.clientConfigManager.addConfiguration(address, config);
  }

  /**
   * Load client's saved configurations
   */
  async loadSavedConfigurations(): Promise<TokenConfiguration[]> {
    if (!this.signer) {
      throw new Error('Signer required to load saved configurations');
    }

    const address = await this.signer.getAddress();
    return this.clientConfigManager.listConfigurations(address);
  }

  /**
   * Remove a configuration from client's saved collection
   */
  async removeSavedConfiguration(configId: string): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required to remove configurations');
    }

    const address = await this.signer.getAddress();
    this.clientConfigManager.removeConfiguration(address, configId);
  }

  /**
   * Check if client has saved configurations
   */
  async hasSavedConfigurations(): Promise<boolean> {
    if (!this.signer) {
      return false;
    }

    const address = await this.signer.getAddress();
    return this.clientConfigManager.hasConfigurations(address);
  }

  /**
   * List all deployments made by this client
   */
  async listDeployments() {
    if (!this.signer) {
      throw new Error('Signer required to list deployments');
    }

    const address = await this.signer.getAddress();
    return this.clientConfigManager.listDeployments(address);
  }

  /**
   * Get deployments filtered by network
   */
  async getDeploymentsByNetwork(network: NetworkType) {
    if (!this.signer) {
      throw new Error('Signer required to get deployments');
    }

    const address = await this.signer.getAddress();
    return this.clientConfigManager.getDeploymentsByNetwork(address, network);
  }
}
