/**
 * ClientConfigurationManager - Manages client-specific configurations
 * 
 * This class handles loading and saving personalized token configurations
 * for each client (identified by their Ethereum address).
 */

import * as fs from 'fs';
import * as path from 'path';
import { TokenConfiguration, NetworkType } from '../types';

export interface TokenDeployment {
  tokenAddress: string;
  configId: string;
  configName: string;
  tokenName: string;
  tokenSymbol: string;
  deployedAt: string;
  transactionHash: string;
  blockNumber: number;
  network: NetworkType;
}

export interface ClientConfiguration {
  address: string;
  createdAt: string;
  updatedAt: string;
  configurations: Array<TokenConfiguration & { addedAt: string }>;
  deployments: TokenDeployment[];
}

export class ClientConfigurationManager {
  private configDir: string;

  constructor(configDir?: string) {
    // Default to sdk/client-configurations
    this.configDir = configDir || path.join(__dirname, '../../client-configurations');
    
    // Ensure directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Get the file path for a client's configuration
   */
  private getClientFilePath(address: string): string {
    const normalizedAddress = address.toLowerCase();
    return path.join(this.configDir, `${normalizedAddress}.json`);
  }

  /**
   * Load client configurations from file
   */
  loadClientConfigurations(address: string): ClientConfiguration | null {
    const filePath = this.getClientFilePath(address);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading configurations for ${address}:`, error);
      return null;
    }
  }

  /**
   * Save client configurations to file
   */
  saveClientConfigurations(clientConfig: ClientConfiguration): void {
    const filePath = this.getClientFilePath(clientConfig.address);
    
    try {
      const data = JSON.stringify(clientConfig, null, 2);
      fs.writeFileSync(filePath, data, 'utf-8');
    } catch (error) {
      console.error(`Error saving configurations for ${clientConfig.address}:`, error);
      throw error;
    }
  }

  /**
   * Add a configuration to a client's saved configurations
   */
  addConfiguration(address: string, config: TokenConfiguration): void {
    let clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      // Create new client configuration
      clientConfig = {
        address: address.toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        configurations: [],
        deployments: [],
      };
    }

    // Check if configuration already exists
    const exists = clientConfig.configurations.some(
      (c) => c.configId === config.configId
    );

    if (!exists) {
      clientConfig.configurations.push({
        ...config,
        addedAt: new Date().toISOString(),
      });
      clientConfig.updatedAt = new Date().toISOString();
      
      this.saveClientConfigurations(clientConfig);
      console.log(`✅ Configuration "${config.name}" added for ${address}`);
    } else {
      console.log(`ℹ  Configuration "${config.name}" already exists for ${address}`);
    }
  }

  /**
   * Remove a configuration from a client's saved configurations
   */
  removeConfiguration(address: string, configId: string): void {
    const clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      console.log(`ℹ️  No configurations found for ${address}`);
      return;
    }

    const initialLength = clientConfig.configurations.length;
    clientConfig.configurations = clientConfig.configurations.filter(
      (c) => c.configId !== configId
    );

    if (clientConfig.configurations.length < initialLength) {
      clientConfig.updatedAt = new Date().toISOString();
      this.saveClientConfigurations(clientConfig);
      console.log(`✅ Configuration removed for ${address}`);
    } else {
      console.log(`ℹ  Configuration not found for ${address}`);
    }
  }

  /**
   * List all configurations for a client
   */
  listConfigurations(address: string): TokenConfiguration[] {
    const clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      return [];
    }

    return clientConfig.configurations;
  }

  /**
   * Check if a client has any saved configurations
   */
  hasConfigurations(address: string): boolean {
    const clientConfig = this.loadClientConfigurations(address);
    return clientConfig !== null && clientConfig.configurations.length > 0;
  }

  /**
   * Get total count of saved configurations for a client
   */
  getConfigurationCount(address: string): number {
    const clientConfig = this.loadClientConfigurations(address);
    return clientConfig ? clientConfig.configurations.length : 0;
  }

  /**
   * Clear all configurations for a client
   */
  clearConfigurations(address: string): void {
    const filePath = this.getClientFilePath(address);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ All configurations cleared for ${address}`);
    } else {
      console.log(`ℹ  No configurations to clear for ${address}`);
    }
  }

  /**
   * Add a token deployment to client's history
   */
  addDeployment(address: string, deployment: TokenDeployment): void {
    let clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      // Create new client configuration
      clientConfig = {
        address: address.toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        configurations: [],
        deployments: [],
      };
    }

    // Add deployment
    clientConfig.deployments.push(deployment);
    clientConfig.updatedAt = new Date().toISOString();
    
    this.saveClientConfigurations(clientConfig);
    console.log(`✅ Deployment ${deployment.tokenAddress} added for ${address}`);
  }

  /**
   * List all deployments for a client
   */
  listDeployments(address: string): TokenDeployment[] {
    const clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      return [];
    }

    return clientConfig.deployments || [];
  }

  /**
   * Get a specific deployment by token address
   */
  getDeployment(address: string, tokenAddress: string): TokenDeployment | undefined {
    const clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      return undefined;
    }

    return clientConfig.deployments?.find(
      (d) => d.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );
  }

  /**
   * Get deployments by network
   */
  getDeploymentsByNetwork(address: string, network: NetworkType): TokenDeployment[] {
    const clientConfig = this.loadClientConfigurations(address);
    
    if (!clientConfig) {
      return [];
    }

    return clientConfig.deployments?.filter((d) => d.network === network) || [];
  }

  /**
   * Get total count of deployments for a client
   */
  getDeploymentCount(address: string): number {
    const clientConfig = this.loadClientConfigurations(address);
    return clientConfig?.deployments?.length || 0;
  }
}
