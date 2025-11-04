/**
 * BusinessLogicChecker - Admin tool to verify deployed business logics
 * 
 * This tool allows administrators to check which business logic facets
 * are deployed and registered in the Factory Diamond.
 */

import { ethers, Contract, Provider } from 'ethers';

export interface BusinessLogicInfo {
  name: string;
  resolverKey: string;
  address: string;
  isDeployed: boolean;
  hasCode: boolean;
}

// All known business logics with their resolver keys
export const BUSINESS_LOGICS = [
  // Base facets (ISBE System)
  { name: 'IsbeCutFacet', key: '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25' },
  { name: 'IsbeLoupeFacet', key: '0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2' },
  { name: 'AccessControlFacet', key: '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c' },
  { name: 'AccessControlDidFacet', key: '0x91be68699977a17d16f4f996441c2bbd87a413d1114ef61d6d70019fc7904f4a' },
  { name: 'ISBEPauseFacet', key: '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3' },
  
  // Utility facets
  { name: 'HashTimestampFacet', key: '0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a' },
  { name: 'OwnableFacet', key: '0x32d893fe746ed6e72cf641731066f84e26611cdd03031f873957cb1a29071a5f' },
  
  // ENS facets
  { name: 'ENSResolverFacet', key: '0x9daad5d269e40315c6ea27f7ccd5ec5e9cc50b975d6172504109b111170ce5d4' },
  { name: 'ENSNameResolverFacet', key: '0xb220ec5bf774f9c3a891b2fc9f0b0bbfae8503f22056a0c835252f4a2feb5b4f' },
  { name: 'ENSTextResolverFacet', key: '0x153e8d37fcd8b283cb133570078b11503f8e93bb9437f0d6306f0e57443f9818' },
  { name: 'ENSPubKeyResolverFacet', key: '0x1c46b1cdbebdf5f3d15aae4a89c2a8fca0d9eff35f1f040b17caebc1726f8260' },
  
  // ERC20 facets
  { name: 'ERC20Facet', key: '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad' },
  { name: 'ERC20SnapshotFacet', key: '0xc4968fe952eba32a52cb112176a56b4e86a0fbaff835dc8336fa0e804a0af398' },
  { name: 'ERC20BurnableFacet', key: '0x81c694c8d5a595cfca0b2b486a8e2aff0a72d8063c636a02c1ca1cc12e55d471' },
  { name: 'ERC20CappedFacet', key: '0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b' },
  { name: 'ERC20ControllerFacet', key: '0xed76d446b6029b8a177fda4fc38162d9dc0dc29ab636541fd6e75ae60fe17151' },
  
  // ERC721 facets
  { name: 'ERC721Facet', key: '0x90e014dbbf0f1e8a714d05a5a0c9464d9ab25275f7dcdaf3297d1ccc80452413' },
  { name: 'ERC721BurnableFacet', key: '0x206b0e4238408e5768282093d791f76fa433862449b7d2f6bcfcf6334c68b731' },
  { name: 'ERC721EnumerableFacet', key: '0xedb7f9fdb1d3f5f42d41b01b9be5a65625ceb3729df0767c42252b0ba9d8ccd5' },
  { name: 'ERC721CappedFacet', key: '0x562609faca97c2599c7b5267f4c9852db8d80261577ecea4c9660ff46f48ac8c' },
  { name: 'ERC721ControllerFacet', key: '0x3151ba844095052447f78f5266df4cb3ce2c27fccb2dddb913b38ef0f5856367' },
  { name: 'ERC721SnapshotFacet', key: '0xf1a2b064b8a113b55cf2e7361db7c9361c635ec4d56c34424cf80a1d6478b51d' },
  { name: 'ERC721RoyaltyFacet', key: '0x93a54f9adbfdce1437a27b11fa135ad0c5624ec6bf9a2b133b77864668ddab76' },
  { name: 'ERC721ConsecutiveFacet', key: '0xcf4be1ff2685a826673d7398ca9747ab887769b9a9bbd181ec73d38a01329cd4' },
];

const FACTORY_ABI = [
  'function getBusinessLogicAddress(bytes32 resolver, uint256 version) external view returns (address)',
  'function getConfiguration(bytes32 configId, uint256 version) external view returns (bytes32[] memory)',
];

export class BusinessLogicChecker {
  private factoryContract: Contract;
  private provider: Provider;

  constructor(factoryContract: Contract, provider: Provider) {
    this.factoryContract = factoryContract;
    this.provider = provider;
  }

  /**
   * Check if a business logic is deployed and has code
   */
  async checkBusinessLogic(resolverKey: string, version: number = 1): Promise<BusinessLogicInfo | null> {
    try {
      // Call the contract method properly
      const address = await this.factoryContract.getBusinessLogicAddress(resolverKey, version);
      
      if (address === ethers.ZeroAddress || address === '0x0000000000000000000000000000000000000000') {
        const bl = BUSINESS_LOGICS.find(b => b.key === resolverKey);
        return {
          name: bl?.name || 'Unknown',
          resolverKey,
          address: ethers.ZeroAddress,
          isDeployed: false,
          hasCode: false,
        };
      }

      // Check if address has code
      const code = await this.provider.getCode(address);
      const hasCode = code !== '0x' && code !== '0x0';

      const bl = BUSINESS_LOGICS.find(b => b.key === resolverKey);
      
      return {
        name: bl?.name || 'Unknown',
        resolverKey,
        address,
        isDeployed: true,
        hasCode,
      };
    } catch (error) {
      const bl = BUSINESS_LOGICS.find(b => b.key === resolverKey);
      return {
        name: bl?.name || 'Unknown',
        resolverKey,
        address: ethers.ZeroAddress,
        isDeployed: false,
        hasCode: false,
      };
    }
  }

  /**
   * List all business logics and their deployment status
   */
  async listAllBusinessLogics(version: number = 1): Promise<BusinessLogicInfo[]> {
    const results: BusinessLogicInfo[] = [];

    for (const bl of BUSINESS_LOGICS) {
      const info = await this.checkBusinessLogic(bl.key, version);
      
      if (info) {
        results.push(info);
      }
    }

    return results;
  }

  /**
   * Get deployed business logics only
   */
  async getDeployedBusinessLogics(version: number = 1): Promise<BusinessLogicInfo[]> {
    const all = await this.listAllBusinessLogics(version);
    return all.filter(bl => bl.isDeployed && bl.hasCode);
  }

  /**
   * Get business logic address by name
   */
  async getBusinessLogicByName(name: string, version: number = 1): Promise<BusinessLogicInfo | null> {
    const bl = BUSINESS_LOGICS.find(b => b.name === name);
    if (!bl) {
      return null;
    }

    return await this.checkBusinessLogic(bl.key, version);
  }

  /**
   * Verify if a business logic is properly deployed
   */
  async verifyBusinessLogic(name: string, version: number = 1): Promise<boolean> {
    const info = await this.getBusinessLogicByName(name, version);
    return info !== null && info.isDeployed && info.hasCode;
  }

  /**
   * Get statistics about deployed business logics
   */
  async getStatistics(version: number = 1): Promise<{
    total: number;
    deployed: number;
    notDeployed: number;
    withoutCode: number;
  }> {
    const all = await this.listAllBusinessLogics(version);
    
    return {
      total: all.length,
      deployed: all.filter(bl => bl.isDeployed && bl.hasCode).length,
      notDeployed: all.filter(bl => !bl.isDeployed).length,
      withoutCode: all.filter(bl => bl.isDeployed && !bl.hasCode).length,
    };
  }
}
