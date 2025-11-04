/**
 * ConfigurationManager - Manages token configuration mappings
 * 
 * This class provides a registry of pre-defined token configurations
 * that map to specific business logic combinations in the Factory Diamond.
 */

import { TokenConfiguration, TokenStandard } from '../types';

export class ConfigurationManager {
  private configurations: Map<string, TokenConfiguration>;

  constructor() {
    this.configurations = new Map();
    this.initializeDefaultConfigurations();
  }

  /**
   * Initialize the default configurations from deployed setups
   */
  private initializeDefaultConfigurations(): void {
    // Configuration 1: Basic ERC20
    this.registerConfiguration({
      configId: '0x0000000000000000000000000000000000000000000000000000000000000020',
      name: 'ERC20 Basic',
      standard: 'ERC20',
      businessLogics: ['ERC20Facet'],
      features: ['Basic transfers', 'Balance queries', 'Allowances'],
      description: 'Simple ERC20 token with standard functionality',
    });

    // Configuration 2: ERC20 Mintable + Capped
    this.registerConfiguration({
      configId: '0x0000000000000000000000000000000000000000000000000000000000002a20',
      name: 'ERC20 Mintable with Cap',
      standard: 'ERC20',
      businessLogics: ['ERC20Facet', 'ERC20CappedFacet', 'ERC20MintableFacet'],
      features: ['Minting', 'Supply cap', 'Role-based access'],
      description: 'ERC20 token with minting capability and maximum supply cap',
    });

    // Configuration 3: ERC20 + Controller
    this.registerConfiguration({
      configId: '0x000000000000000000000000000000000000000000000000000000000000006a',
      name: 'ERC20 with Controller',
      standard: 'ERC20',
      businessLogics: ['ERC20Facet', 'ERC20ControllerFacet'],
      features: ['Administrative control', 'Forced transfers', 'Balance management'],
      description: 'ERC20 token with controller capabilities for administrative operations',
    });

    // Additional configurations can be added as they are deployed
  }

  /**
   * Register a new configuration
   */
  registerConfiguration(config: TokenConfiguration): void {
    this.configurations.set(config.configId, config);
  }

  /**
   * Get a configuration by ID
   */
  getConfiguration(configId: string): TokenConfiguration | undefined {
    return this.configurations.get(configId);
  }

  /**
   * Get configuration by name
   */
  getConfigurationByName(name: string): TokenConfiguration | undefined {
    return Array.from(this.configurations.values()).find(
      (config) => config.name === name
    );
  }

  /**
   * List all available configurations
   */
  listConfigurations(): TokenConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * List configurations by token standard
   */
  listConfigurationsByStandard(standard: TokenStandard): TokenConfiguration[] {
    return Array.from(this.configurations.values()).filter(
      (config) => config.standard === standard
    );
  }

  /**
   * List configurations by feature
   */
  listConfigurationsByFeature(feature: string): TokenConfiguration[] {
    return Array.from(this.configurations.values()).filter(
      (config) => config.features.some((f) => f.toLowerCase().includes(feature.toLowerCase()))
    );
  }

  /**
   * Check if a configuration exists
   */
  hasConfiguration(configId: string): boolean {
    return this.configurations.has(configId);
  }

  /**
   * Get the total number of registered configurations
   */
  getConfigurationCount(): number {
    return this.configurations.size;
  }
}
