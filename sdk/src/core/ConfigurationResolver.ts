/**
 * ConfigurationResolver - Load and query token configurations
 * 
 * This utility loads pre-generated ERC20 and ERC721 configurations
 * and provides fast lookup methods.
 */

import erc20Configs from '../../config/erc20-configurations.json';
import erc721Configs from '../../config/erc721-configurations.json';

export interface TokenConfiguration {
  configId: string;
  name: string;
  standard: 'ERC20' | 'ERC721';
  features: string[];
  businessLogics: string[];
  facetCount: number;
  description: string;
  requiredRoles: string[];
}

export interface ConfigurationIndex {
  byFeatures: { [key: string]: string }; // feature combination -> configId
  byName: { [key: string]: string }; // name -> configId
  byConfigId: { [key: string]: number }; // configId -> array index
}

export interface ConfigurationData {
  configurations: TokenConfiguration[];
  index: ConfigurationIndex;
}

/**
 * ConfigurationResolver - Query token configurations
 */
export class ConfigurationResolver {
  private erc20Data: ConfigurationData;
  private erc721Data: ConfigurationData;

  constructor() {
    this.erc20Data = erc20Configs as ConfigurationData;
    this.erc721Data = erc721Configs as ConfigurationData;
  }

  /**
   * Get all configurations for a standard
   */
  getAllConfigurations(standard: 'ERC20' | 'ERC721'): TokenConfiguration[] {
    return standard === 'ERC20' 
      ? this.erc20Data.configurations 
      : this.erc721Data.configurations;
  }

  /**
   * Find configuration by features
   */
  findByFeatures(standard: 'ERC20' | 'ERC721', features: string[]): TokenConfiguration | null {
    const data = standard === 'ERC20' ? this.erc20Data : this.erc721Data;
    
    // Sort features to match index key format (uses + separator)
    const sortedFeatures = [...features].sort().join('+');
    const configId = data.index.byFeatures[sortedFeatures];
    
    if (!configId) return null;
    
    const index = data.index.byConfigId[configId];
    return data.configurations[index] || null;
  }

  /**
   * Find configuration by name
   */
  findByName(standard: 'ERC20' | 'ERC721', name: string): TokenConfiguration | null {
    const data = standard === 'ERC20' ? this.erc20Data : this.erc721Data;
    const configId = data.index.byName[name];
    
    if (!configId) return null;
    
    const index = data.index.byConfigId[configId];
    return data.configurations[index] || null;
  }

  /**
   * Get configuration by config ID
   */
  getByConfigId(standard: 'ERC20' | 'ERC721', configId: string): TokenConfiguration | null {
    const data = standard === 'ERC20' ? this.erc20Data : this.erc721Data;
    const index = data.index.byConfigId[configId];
    
    if (index === undefined) return null;
    
    return data.configurations[index] || null;
  }

  /**
   * List all available features for a standard
   */
  getAvailableFeatures(standard: 'ERC20' | 'ERC721'): string[] {
    const configs = this.getAllConfigurations(standard);
    const featuresSet = new Set<string>();
    
    configs.forEach(config => {
      config.features.forEach(feature => {
        if (feature !== 'base') {
          featuresSet.add(feature);
        }
      });
    });
    
    return Array.from(featuresSet).sort();
  }

  /**
   * Search configurations by partial feature match
   */
  searchByFeatures(standard: 'ERC20' | 'ERC721', requiredFeatures: string[]): TokenConfiguration[] {
    const configs = this.getAllConfigurations(standard);
    
    return configs.filter(config => {
      return requiredFeatures.every(feature => config.features.includes(feature));
    });
  }

  /**
   * Get role requirements for a configuration
   */
  getRoleRequirements(config: TokenConfiguration): string[] {
    return config.requiredRoles;
  }

  /**
   * Display configuration details
   */
  displayConfiguration(config: TokenConfiguration): void {
    console.log(`\n📋 Configuration: ${config.name}`);
    console.log(`   Standard: ${config.standard}`);
    console.log(`   Config ID: ${config.configId}`);
    console.log(`   Features: ${config.features.join(', ')}`);
    console.log(`   Facets: ${config.facetCount}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Required Roles: ${config.requiredRoles.join(', ')}`);
  }

  /**
   * List all configurations for a standard
   */
  listConfigurations(standard: 'ERC20' | 'ERC721'): void {
    const configs = this.getAllConfigurations(standard);
    
    console.log(`\n📚 Available ${standard} Configurations (${configs.length}):\n`);
    
    configs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name}`);
      console.log(`   Features: ${config.features.filter(f => f !== 'base').join(', ') || 'none'}`);
      console.log(`   Facets: ${config.facetCount}`);
      console.log('');
    });
  }
}

export default ConfigurationResolver;
