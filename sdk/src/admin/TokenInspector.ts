/**
 * TokenInspector - Admin tool to inspect deployed tokens
 * 
 * This tool allows administrators and users to inspect token contracts
 * to see installed facets, roles, and permissions.
 */

import { ethers, Contract, Provider } from 'ethers';
import { ROLES } from '../types';

export interface FacetInfo {
  facetAddress: string;
  functionSelectors: string[];
  functionCount: number;
}

export interface RoleInfo {
  role: string;
  roleName: string;
  hasRole: boolean;
}

const LOUPE_ABI = [
  'function facets() external view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])',
  'function facetFunctionSelectors(address facet) external view returns (bytes4[])',
  'function facetAddresses() external view returns (address[])',
];

const ACCESS_CONTROL_ABI = [
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function getRoleMemberCount(bytes32 role) external view returns (uint256)',
  'function getRoleMember(bytes32 role, uint256 index) external view returns (address)',
  'function grantRole(bytes32 role, address account) external',
  'function revokeRole(bytes32 role, address account) external',
];

const PAUSE_ABI = [
  'function paused() external view returns (bool)',
];

const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
];

export class TokenInspector {
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  /**
   * Get all facets installed in a token
   */
  async getTokenFacets(tokenAddress: string): Promise<FacetInfo[]> {
    const loupe = new ethers.Contract(tokenAddress, LOUPE_ABI, this.provider);
    
    try {
      const facets = await loupe.facets();
      
      return facets.map((facet: any) => ({
        facetAddress: facet.facetAddress,
        functionSelectors: facet.functionSelectors,
        functionCount: facet.functionSelectors.length,
      }));
    } catch (error) {
      throw new Error(`Failed to get facets: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a token has a specific function
   */
  async hasFunction(tokenAddress: string, functionSignature: string): Promise<{
    found: boolean;
    facetAddress?: string;
    selector: string;
  }> {
    const selector = ethers.id(functionSignature).slice(0, 10);
    const facets = await this.getTokenFacets(tokenAddress);
    
    for (const facet of facets) {
      if (facet.functionSelectors.includes(selector)) {
        return {
          found: true,
          facetAddress: facet.facetAddress,
          selector,
        };
      }
    }
    
    return {
      found: false,
      selector,
    };
  }

  /**
   * Check roles for an address
   */
  async checkRoles(tokenAddress: string, account: string): Promise<RoleInfo[]> {
    const accessControl = new ethers.Contract(tokenAddress, ACCESS_CONTROL_ABI, this.provider);
    
    const roleNames: { [key: string]: string } = {
      [ROLES.DEFAULT_ADMIN_ROLE]: 'DEFAULT_ADMIN_ROLE',
      [ROLES.PAUSER_ROLE]: 'PAUSER_ROLE',
      [ROLES.MINTER_ROLE]: 'MINTER_ROLE',
      [ROLES.BURNER_ROLE]: 'BURNER_ROLE',
      [ROLES.GOVERNANCE_ROLE]: 'GOVERNANCE_ROLE',
      [ROLES.UPGRADER_ROLE]: 'UPGRADER_ROLE',
      [ROLES.CONTROLLER_ROLE]: 'CONTROLLER_ROLE',
    };
    
    const results: RoleInfo[] = [];
    
    for (const [role, name] of Object.entries(roleNames)) {
      try {
        const hasRole = await accessControl.hasRole(role, account);
        results.push({
          role,
          roleName: name,
          hasRole,
        });
      } catch (error) {
        // Role might not be supported by this token
        results.push({
          role,
          roleName: name,
          hasRole: false,
        });
      }
    }
    
    return results;
  }

  /**
   * Check if token is paused
   */
  async isPaused(tokenAddress: string): Promise<boolean> {
    const pause = new ethers.Contract(tokenAddress, PAUSE_ABI, this.provider);
    
    try {
      return await pause.paused();
    } catch (error) {
      // Token might not have pause functionality
      return false;
    }
  }

  /**
   * Get token basic information (ERC20)
   */
  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  } | null> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ]);
      
      return { name, symbol, decimals, totalSupply };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all members of a specific role
   */
  async getRoleMembers(tokenAddress: string, role: string): Promise<string[]> {
    const accessControl = new ethers.Contract(tokenAddress, ACCESS_CONTROL_ABI, this.provider);
    
    try {
      const count = await accessControl.getRoleMemberCount(role);
      const members: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const member = await accessControl.getRoleMember(role, i);
        members.push(member);
      }
      
      return members;
    } catch (error) {
      return [];
    }
  }

  /**
   * Complete diagnosis of a token
   */
  async diagnose(tokenAddress: string, account?: string): Promise<{
    info: any;
    facets: FacetInfo[];
    isPaused: boolean;
    roles?: RoleInfo[];
    hasMintFunction: boolean;
    hasBurnFunction: boolean;
  }> {
    const info = await this.getTokenInfo(tokenAddress);
    const facets = await this.getTokenFacets(tokenAddress);
    const isPaused = await this.isPaused(tokenAddress);
    const hasMint = await this.hasFunction(tokenAddress, 'mint(address,uint256)');
    const hasBurn = await this.hasFunction(tokenAddress, 'burn(uint256)');
    
    let roles: RoleInfo[] | undefined;
    if (account) {
      roles = await this.checkRoles(tokenAddress, account);
    }
    
    return {
      info,
      facets,
      isPaused,
      roles,
      hasMintFunction: hasMint.found,
      hasBurnFunction: hasBurn.found,
    };
  }
}
