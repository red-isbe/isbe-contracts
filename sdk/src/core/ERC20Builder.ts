/**
 * ERC20Builder - Fluent API for creating ERC20 tokens
 * 
 * This builder provides a user-friendly interface for configuring
 * and deploying ERC20 tokens with various features.
 */

import { ethers } from 'ethers';
import { ConfigurationResolver, TokenConfiguration } from './ConfigurationResolver';
import { ISBE_ROLES } from '../admin/RoleManager';
import { decodeError, formatError } from '../utils/errorDecoder';

// Import ABIs from sdk/abi
import ProxyFactoryArtifact from '../../abi/ProxyFactory.json';
import ERC20FacetArtifact from '../../abi/ERC20Facet.json';
import ERC20CappedFacetArtifact from '../../abi/ERC20CappedFacet.json';

export interface ERC20TokenParams {
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: bigint;
  cap?: bigint;
}

export interface DeploymentResult {
  success: boolean;
  tokenAddress?: string;
  configId?: string;
  txHash?: string;
  error?: string;
}

/**
 * ERC20Builder - Build and deploy ERC20 tokens
 */
export class ERC20Builder {
  private features: Set<string> = new Set(['base']);
  private params: Partial<ERC20TokenParams> = {};
  private resolver: ConfigurationResolver;
  private signer: ethers.Signer;
  private factoryAddress: string;

  constructor(factoryAddress: string, signer: ethers.Signer) {
    this.factoryAddress = factoryAddress;
    this.signer = signer;
    this.resolver = new ConfigurationResolver();
  }

  /**
   * Set token basic parameters
   */
  setTokenInfo(name: string, symbol: string, decimals: number = 18): this {
    this.params.name = name;
    this.params.symbol = symbol;
    this.params.decimals = decimals;
    return this;
  }

  /**
   * Set initial supply (requires MINTER_ROLE)
   */
  setInitialSupply(supply: bigint): this {
    this.params.initialSupply = supply;
    return this;
  }

  /**
   * Add burnable feature
   * Allows tokens to be burned (destroyed)
   */
  addBurnable(): this {
    this.features.add('burnable');
    return this;
  }

  /**
   * Add capped feature
   * Limits maximum supply (requires CAP_ROLE to modify cap)
   */
  addCapped(cap: bigint): this {
    this.features.add('capped');
    this.params.cap = cap;
    return this;
  }

  /**
   * Add snapshot feature
   * Allows taking snapshots of balances (requires SNAPSHOT_ROLE)
   */
  addSnapshot(): this {
    this.features.add('snapshot');
    return this;
  }

  /**
   * Add controller feature
   * Allows forced transfers (requires CONTROLLER_ROLE)
   */
  addController(): this {
    this.features.add('controller');
    return this;
  }

  /**
   * Get the configuration that matches selected features
   */
  getConfiguration(): TokenConfiguration | null {
    const featuresArray = Array.from(this.features).sort();
    return this.resolver.findByFeatures('ERC20', featuresArray);
  }

  /**
   * Get required roles for the selected configuration
   */
  getRequiredRoles(): string[] {
    const config = this.getConfiguration();
    if (!config) return ['DEFAULT_ADMIN_ROLE'];
    
    const roles = new Set(config.requiredRoles);
    
    // Add MINTER_ROLE if initial supply is set
    if (this.params.initialSupply && this.params.initialSupply > 0n) {
      roles.add('MINTER_ROLE');
    }
    
    return Array.from(roles);
  }

  /**
   * Get role bytes32 values
   */
  getRoleBytes(): { [roleName: string]: string } {
    const requiredRoles = this.getRequiredRoles();
    const roleBytes: { [roleName: string]: string } = {};
    
    requiredRoles.forEach(roleName => {
      roleBytes[roleName] = ISBE_ROLES[roleName as keyof typeof ISBE_ROLES];
    });
    
    return roleBytes;
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.params.name) {
      errors.push('Token name is required');
    }
    
    if (!this.params.symbol) {
      errors.push('Token symbol is required');
    }
    
    if (this.features.has('capped') && !this.params.cap) {
      errors.push('Cap is required when using capped feature');
    }
    
    if (this.params.cap && this.params.initialSupply && this.params.initialSupply > this.params.cap) {
      errors.push('Initial supply cannot exceed cap');
    }
    
    const config = this.getConfiguration();
    if (!config) {
      errors.push(`No configuration found for features: ${Array.from(this.features).join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Display configuration summary
   */
  displaySummary(): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ERC20 TOKEN CONFIGURATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Token Parameters:');
    console.log(`  Name: ${this.params.name || 'Not set'}`);
    console.log(`  Symbol: ${this.params.symbol || 'Not set'}`);
    console.log(`  Decimals: ${this.params.decimals || 18}`);
    
    if (this.params.initialSupply) {
      console.log(`  Initial Supply: ${ethers.formatEther(this.params.initialSupply)} tokens`);
    }
    
    if (this.params.cap) {
      console.log(`  Cap: ${ethers.formatEther(this.params.cap)} tokens`);
    }
    
    console.log(`\nSelected Features:`);
    const features = Array.from(this.features).filter(f => f !== 'base');
    if (features.length === 0) {
      console.log(`  Basic ERC20 (no additional features)`);
    } else {
      features.forEach(feature => {
        console.log(`  ✓ ${feature}`);
      });
    }
    
    const config = this.getConfiguration();
    if (config) {
      console.log(`\nConfiguration:`);
      console.log(`  Name: ${config.name}`);
      console.log(`  Config ID: ${config.configId}`);
      console.log(`  Facets: ${config.facetCount}`);
      console.log(`  Description: ${config.description}`);
    }
    
    console.log(`\nRequired Roles:`);
    const requiredRoles = this.getRequiredRoles();
    const roleBytes = this.getRoleBytes();
    requiredRoles.forEach(role => {
      console.log(`  • ${role}`);
      console.log(`    ${roleBytes[role]}`);
    });
    
    const validation = this.validate();
    console.log(`\nValidation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.valid) {
      validation.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Get deployment parameters for Factory
   */
  getDeploymentParams(): any {
    const config = this.getConfiguration();
    if (!config) {
      throw new Error('Invalid configuration');
    }
    
    // This will be used to call Factory.deployToken()
    return {
      configId: config.configId,
      name: this.params.name,
      symbol: this.params.symbol,
      decimals: this.params.decimals || 18,
      initialSupply: this.params.initialSupply || 0n,
      cap: this.params.cap || 0n,
    };
  }

  /**
   * Deploy the token using Factory
   */
  async deploy(): Promise<DeploymentResult> {
    const validation = this.validate();
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }
    
    try {
      const config = this.getConfiguration();
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      console.log('\n Deploying ERC20 token...');
      console.log(`   Config: ${config.name}`);
      console.log(`   Name: ${this.params.name}`);
      console.log(`   Symbol: ${this.params.symbol}`);
      
      // Create Factory contract instance
      const factory = new ethers.Contract(
        this.factoryAddress,
        ProxyFactoryArtifact.abi,
        this.signer
      );
      
      // Get deployer address
      const deployerAddress = await this.signer.getAddress();
      
      // RBAC: Empty array - roles must be managed separately by admin
      // User must have required roles already assigned by Factory admin
      const rbacs: any[] = [];
      
      // Prepare initialization data for ERC20
      const erc20Interface = new ethers.Interface(ERC20FacetArtifact.abi);
      
      // Find the ERC20 business logic key from config (resolver key for ERC20Facet)
      const ERC20_RESOLVER_KEY = '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad';
      
      // Initialize ERC20 basic functionality
      const erc20InitData = erc20Interface.encodeFunctionData('initializeErc20', [
        this.params.name,
        this.params.symbol,
        this.params.decimals || 18
      ]);
      
      const initBusinessIds = [ERC20_RESOLVER_KEY];
      const initDatas = [erc20InitData];
      
      // If capped, add cap initialization
      if (this.features.has('capped') && this.params.cap) {
        // ERC20CappedFacet resolver key
        const ERC20_CAPPED_RESOLVER_KEY = '0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b';
        
        // Use already imported ERC20CappedFacet artifact
        const cappedInterface = new ethers.Interface(ERC20CappedFacetArtifact.abi);
        
        const cappedInitData = cappedInterface.encodeFunctionData('initializeCap', [
          this.params.cap
        ]);
        
        initBusinessIds.push(ERC20_CAPPED_RESOLVER_KEY);
        initDatas.push(cappedInitData);
      }
      
      console.log(`   Configuration ID: ${config.configId}`);
      console.log(`   Deployer: ${deployerAddress}`);
      console.log(`   ⚠️  Note: Roles must be assigned by Factory admin`);
      console.log('');
      
      // Deploy the token
      const tx = await factory.deployUseCase(
        config.configId,    // _configurationId
        1,                  // _version
        rbacs,              // _rbacs (empty - roles managed by admin)
        false,              // _initPause
        initBusinessIds,    // _initBusinessIds
        initDatas           // _initData
      );
      
      console.log(`   📤 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Deployed! (Block: ${receipt.blockNumber})`);
      
      // Extract token address from UseCaseDeployed event
      const useCaseDeployedEvent = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === 'UseCaseDeployed';
        } catch {
          return false;
        }
      });
      
      if (!useCaseDeployedEvent) {
        throw new Error('UseCaseDeployed event not found in transaction receipt');
      }
      
      const parsed = factory.interface.parseLog(useCaseDeployedEvent);
      const tokenAddress = parsed?.args.proxy;
      
      console.log(`   📍 Token address: ${tokenAddress}`);
      
      // Save deployment to client configurations
      try {
        const { ClientConfigurationManager } = require('./ClientConfigurationManager');
        const clientConfigManager = new ClientConfigurationManager();
        
        const deployment = {
          tokenAddress,
          configId: config.configId,
          configName: config.name,
          tokenName: this.params.name!,
          tokenSymbol: this.params.symbol!,
          deployedAt: new Date().toISOString(),
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          network: 'dev' as const, // TODO: Get from provider
        };
        
        clientConfigManager.addDeployment(deployerAddress, deployment);
        console.log(`   💾 Deployment saved to client-configurations/${deployerAddress.toLowerCase()}.json\n`);
      } catch (saveError: any) {
        console.warn(`   ⚠️  Failed to save to client-configurations: ${saveError.message}\n`);
      }
      
      return {
        success: true,
        tokenAddress,
        configId: config.configId,
        txHash: tx.hash
      };
      
    } catch (error: any) {
      console.error(`   ❌ Deployment failed:\n`);
      const decodedError = decodeError(error);
      const errorMessage = formatError(decodedError);
      console.error(errorMessage);
      console.error('');
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export default ERC20Builder;
