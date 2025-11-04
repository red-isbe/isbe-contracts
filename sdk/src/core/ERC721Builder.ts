/**
 * ERC721Builder - Fluent API for creating ERC721 (NFT) tokens
 * 
 * This builder provides a user-friendly interface for configuring
 * and deploying ERC721 tokens with various features.
 */

import { ethers, Contract } from 'ethers';
import { ConfigurationResolver } from './ConfigurationResolver';
import { ISBE_ROLES } from '../admin/RoleManager';
import { ClientConfigurationManager } from './ClientConfigurationManager';
import { NetworkType } from '../types';
import { decodeError, formatError } from '../utils/errorDecoder';

// Import ABIs from sdk/abi
import ProxyFactoryArtifact from '../../abi/ProxyFactory.json';
import ERC721FacetArtifact from '../../abi/ERC721Facet.json';

export interface ERC721TokenParams {
  name: string;
  symbol: string;
  baseURI?: string;
}

export interface DeploymentResult {
  success: boolean;
  tokenAddress?: string;
  configId?: string;
  txHash?: string;
  error?: string;
}

export class ERC721Builder {
  private params: ERC721TokenParams = {
    name: '',
    symbol: '',
    baseURI: ''
  };
  
  private features: Set<string> = new Set(['base']);
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private factoryAddress: string;
  private configResolver: ConfigurationResolver;
  private configManager: ClientConfigurationManager;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    factoryAddress: string
  ) {
    this.provider = provider;
    this.signer = signer;
    this.factoryAddress = factoryAddress;
    this.configResolver = new ConfigurationResolver();
    this.configManager = new ClientConfigurationManager();
  }

  /**
   * Set token name and symbol
   */
  setToken(name: string, symbol: string): this {
    this.params.name = name;
    this.params.symbol = symbol;
    return this;
  }

  /**
   * Set base URI for token metadata
   */
  setBaseURI(baseURI: string): this {
    this.params.baseURI = baseURI;
    return this;
  }

  /**
   * Add burnable feature (allows token burning)
   */
  addBurnable(): this {
    this.features.add('burnable');
    return this;
  }

  /**
   * Add enumerable feature (allows token enumeration)
   */
  addEnumerable(): this {
    this.features.add('enumerable');
    return this;
  }

  /**
   * Add pausable feature (allows pausing transfers)
   */
  addPausable(): this {
    this.features.add('pausable');
    return this;
  }

  /**
   * Add URI storage feature (individual token URIs)
   */
  addURIStorage(): this {
    this.features.add('uristorage');
    return this;
  }

  /**
   * Add votes feature (governance voting)
   */
  addVotes(): this {
    this.features.add('votes');
    return this;
  }

  /**
   * Add royalty feature (ERC2981 royalty standard)
   */
  addRoyalty(): this {
    this.features.add('royalty');
    return this;
  }

  /**
   * Add snapshot feature (token snapshot for governance)
   */
  addSnapshot(): this {
    this.features.add('snapshot');
    return this;
  }

  /**
   * Add controller feature (additional control mechanisms)
   */
  addController(): this {
    this.features.add('controller');
    return this;
  }

  /**
   * Add capped feature (limits total supply, includes mint function)
   */
  addCapped(): this {
    this.features.add('capped');
    return this;
  }

  /**
   * Add consecutive feature (ERC2309 consecutive transfer)
   */
  addConsecutive(): this {
    this.features.add('consecutive');
    return this;
  }

  /**
   * Get configuration summary
   */
  getSummary() {
    const config = this.configResolver.findByFeatures(
      'ERC721',
      Array.from(this.features)
    );

    return {
      params: this.params,
      features: Array.from(this.features),
      configuration: config ? {
        name: config.name,
        configId: config.configId,
        facetCount: config.facetCount,
        description: config.description
      } : null,
      requiredRoles: this.getRequiredRoles(),
      isValid: this.validate()
    };
  }

  /**
   * Get required roles based on selected features
   */
  private getRequiredRoles(): Array<{ name: string; hash: string }> {
    const roles: Array<{ name: string; hash: string }> = [
      { name: 'DEFAULT_ADMIN_ROLE', hash: ISBE_ROLES.DEFAULT_ADMIN_ROLE as string }
    ];

    // Minter role is always needed for ERC721
    roles.push({ name: 'MINTER_ROLE', hash: ISBE_ROLES.MINTER_ROLE as string });

    if (this.features.has('pausable')) {
      roles.push({ name: 'PAUSER_ROLE', hash: ISBE_ROLES.PAUSER_ROLE as string });
    }

    if (this.features.has('controller')) {
      roles.push({ name: 'CONTROLLER_ROLE', hash: ISBE_ROLES.CONTROLLER_ROLE as string });
    }

    return roles;
  }

  /**
   * Validate configuration
   */
  validate(): boolean {
    if (!this.params.name || !this.params.symbol) {
      return false;
    }

    // Check if configuration exists
    const config = this.configResolver.findByFeatures(
      'ERC721',
      Array.from(this.features)
    );

    return config !== null;
  }

  /**
   * Deploy the ERC721 token
   */
  async deploy(): Promise<DeploymentResult> {
    try {
      // Validate
      if (!this.validate()) {
        return {
          success: false,
          error: 'Invalid configuration. Check token parameters and features.'
        };
      }

      // Get configuration
      const config = this.configResolver.findByFeatures(
        'ERC721',
        Array.from(this.features)
      );

      if (!config) {
        return {
          success: false,
          error: 'Configuration not found for selected features'
        };
      }

      console.log('\n Deploying ERC721 token...');
      console.log(`   Config: ${config.name}`);
      console.log(`   Name: ${this.params.name}`);
      console.log(`   Symbol: ${this.params.symbol}`);
      console.log(`   Configuration ID: ${config.configId}`);
      console.log(`   Deployer: ${await this.signer.getAddress()}`);
      console.log(`   ⚠️  Note: Roles must be assigned by Factory admin\n`);

      // Connect to Factory
      const factory = new Contract(
        this.factoryAddress,
        ProxyFactoryArtifact.abi,
        this.signer
      );

      // Prepare initialization data
      const erc721Interface = new ethers.Interface(ERC721FacetArtifact.abi);
      
      const erc721InitData = erc721Interface.encodeFunctionData('initializeErc721', [
        this.params.name,
        this.params.symbol
      ]);

      // ERC721Facet resolver key (from ERC721_RESOLVER_KEYS.ERC721)
      const ERC721_RESOLVER_KEY = '0x90e014dbbf0f1e8a714d05a5a0c9464d9ab25275f7dcdaf3297d1ccc80452413';
      
      const initBusinessIds = [ERC721_RESOLVER_KEY];
      const initDatas = [erc721InitData];

      // Deploy through Factory (no roles assigned)
      // deployUseCase(configId, version, rbacs, initPause, initBusinessIds, initData)
      const tx = await factory.deployUseCase(
        config.configId,
        1, // version
        [], // Empty rbacs array - roles must be assigned by admin
        false, // initPause
        initBusinessIds,
        initDatas
      );

      console.log(`   📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Deployed! (Block: ${receipt.blockNumber})`);

      // Get deployed token address from event
      const deployedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === 'UseCaseDeployed';
        } catch {
          return false;
        }
      });

      if (!deployedEvent) {
        throw new Error('Could not find UseCaseDeployed event');
      }

      const parsedEvent = factory.interface.parseLog(deployedEvent);
      const tokenAddress = parsedEvent?.args.proxy;

      console.log(`   Token address: ${tokenAddress}`);

      // Save deployment to client configurations
      const signerAddress = await this.signer.getAddress();
      await this.configManager.addDeployment(signerAddress, {
        tokenAddress,
        configId: config.configId,
        configName: config.name,
        tokenName: this.params.name,
        tokenSymbol: this.params.symbol,
        deployedAt: new Date().toISOString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        network: 'dev' as NetworkType
      });

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

  /**
   * Deploy and return token contract instance
   */
  async deployAndGetContract(): Promise<Contract | null> {
    const result = await this.deploy();
    
    if (!result.success || !result.tokenAddress) {
      return null;
    }

    return new Contract(
      result.tokenAddress,
      ERC721FacetArtifact.abi,
      this.signer
    );
  }
}
