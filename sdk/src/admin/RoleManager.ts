/**
 * RoleManager - Admin tool to manage roles on ISBE contracts
 * 
 * This tool allows administrators to grant and revoke roles on ISBE contracts
 * that implement AccessControl.
 */

import { ethers, Contract } from 'ethers';
import { decodeError, formatError } from '../utils/errorDecoder';

// All ISBE roles with their bytes32 values
export const ISBE_ROLES = {
  // Core Admin
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  
  // Factory & Deployment
  PAUSER_ROLE: '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
  BUSINESS_LOGIC_DEPLOYER_ROLE: '0xdc99c621188983b30fd7ff7b62ee13c081548c6b000e3c54b59686f091418069',
  PROXY_DEPLOYER_ROLE: '0xc6832bf28cac8042fe5597e3b605a7fa9af230954df24409efd82699171f3c26',
  
  // Governance
  GOVERNANCE_MANAGER_ROLE: '0x44c016b7c7762ceb1f7aab96b102f733139c944c581ee882670e2636bebbc4c5',
  GOVERNANCE_CONFIGURATION_MANAGER_ROLE: '0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb',
  CONFIGURATION_MANAGER_ROLE: '0xdc4b85a1ab8a3dbc4b47e1626cb620f2a5a5e4753d049a2d71f76e2cf26b1e0b',
  
  // ISBE System
  ISBE_PAUSER_ROLE: '0x643e67198985fdbcfc2807234f580aa2cab96bb7efe1ab3158da79255d493114',
  ISBE_ROLE: '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239',
  
  // Specialized
  ASSET_EVENT_TRACKER_ROLE: '0x46ffae7721ce7c213dfc98101d48d6a7f58e3c12f2945ae1fb4f2e2862a44ff1',
  HASH_TIMESTAMP_ROLE: '0x3bb8341caefb6dc4800c130d6d6d2789f8c4e534bc168ff9a7eda2e2831a721f',
  TIMESTAMPING_REGISTRY_ROLE: '0xde626b2d09629d2f22e508eb4635d61e0f8ab77b4ad08e0823135c887724bac8',
  
  // Token Management
  CONTROLLER_ROLE: '0x6bc432609a8af6e2d25fcffbe70872e0b3c63d88116a2b673c42dfbc130d9331',
  CAP_ROLE: '0xd2231b344d69ba7f64c324f071f0ef91a388e60c2a6b529339afc42cf411cb61',
  SNAPSHOT_ROLE: '0x0ca5e23bde0d5e6112f10b9752afc92df6901f9218a43771a113f0ee5ab6bd49',
  MINTER_ROLE: '0xd8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace',
  ROYALTY_ROLE: '0xe87ed15151829ed3753553fc34d39b49f60370ac439fddb4e9304af60bce3045',
  
  // Identity & ENS
  DID_REGISTRY_ROLE: '0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973',
  ENS_MANAGER_ROLE: '0x6e23e5e4b53b45e5b32b8b2e8e9a8c48b8a7c3b9c2b8a9a7b9a8c4b8b9a8c9b9',
  
  // Client
  CLIENT_FILTERING_ROLE: '0xcbb09df20dd6e5dbe10d3957a6ca4269c2c926a5334d2cbcd9ea39ab0593f79a',
} as const;

// Role name to bytes32 mapping
export type RoleName = keyof typeof ISBE_ROLES;

// Reverse mapping for display
const ROLE_NAMES: { [key: string]: string } = {};
for (const [name, value] of Object.entries(ISBE_ROLES)) {
  ROLE_NAMES[value] = name;
}

// AccessControl ABI
const ACCESS_CONTROL_ABI = [
  'function grantRole(bytes32 role, address account) external',
  'function revokeRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function getRoleAdmin(bytes32 role) external view returns (bytes32)',
  'function renounceRole(bytes32 role, address account) external',
];

export interface RoleInfo {
  role: string;
  roleName: string;
  account: string;
  hasRole: boolean;
  admin?: string;
  adminName?: string;
}

export interface GrantRoleResult {
  success: boolean;
  txHash?: string;
  error?: string;
  decodedError?: string;
}

/**
 * RoleManager - Manage roles on ISBE contracts
 */
export class RoleManager {
  private contract: Contract;

  constructor(contractAddress: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    this.contract = new ethers.Contract(contractAddress, ACCESS_CONTROL_ABI, signerOrProvider);
  }

  /**
   * Get role name from bytes32 value
   */
  getRoleName(roleBytes: string): string {
    return ROLE_NAMES[roleBytes] || 'UNKNOWN_ROLE';
  }

  /**
   * Get bytes32 value from role name
   */
  getRoleBytes(roleName: RoleName): string {
    return ISBE_ROLES[roleName];
  }

  /**
   * Check if an account has a specific role
   */
  async hasRole(roleNameOrBytes: RoleName | string, account: string): Promise<boolean> {
    try {
      const roleBytes = roleNameOrBytes.startsWith('0x') 
        ? roleNameOrBytes 
        : this.getRoleBytes(roleNameOrBytes as RoleName);
      
      return await this.contract.hasRole(roleBytes, account);
    } catch (error: any) {
      console.error('Error checking role:', error.message);
      return false;
    }
  }

  /**
   * Get role information for an account
   */
  async getRoleInfo(roleNameOrBytes: RoleName | string, account: string): Promise<RoleInfo> {
    const roleBytes = roleNameOrBytes.startsWith('0x') 
      ? roleNameOrBytes 
      : this.getRoleBytes(roleNameOrBytes as RoleName);
    
    const roleName = this.getRoleName(roleBytes);
    const hasRole = await this.hasRole(roleBytes, account);
    const adminBytes = await this.contract.getRoleAdmin(roleBytes);
    const adminName = this.getRoleName(adminBytes);

    return {
      role: roleBytes,
      roleName,
      account,
      hasRole,
      admin: adminBytes,
      adminName,
    };
  }

  /**
   * Grant a role to an account
   * 
   * @param roleNameOrBytes - Role name (e.g., 'MINTER_ROLE') or bytes32 value
   * @param account - Address to grant the role to
   * @returns Result with transaction hash or decoded error
   */
  async grantRole(
    roleNameOrBytes: RoleName | string, 
    account: string
  ): Promise<GrantRoleResult> {
    try {
      // Convert role name to bytes32 if needed
      const roleBytes = roleNameOrBytes.startsWith('0x') 
        ? roleNameOrBytes 
        : this.getRoleBytes(roleNameOrBytes as RoleName);
      
      const roleName = this.getRoleName(roleBytes);
      
      console.log(`\n🔐 Granting role: ${roleName}`);
      console.log(`   Role: ${roleBytes}`);
      console.log(`   To: ${account}`);

      // Check if already has role
      const alreadyHas = await this.hasRole(roleBytes, account);
      if (alreadyHas) {
        console.log(`   ⚠️  Account already has this role`);
        return {
          success: true,
          error: 'Account already has role',
        };
      }

      // Send transaction
      const tx = await this.contract.grantRole(roleBytes, account);
      console.log(`   📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Role granted! (Block: ${receipt.blockNumber})`);

      return {
        success: true,
        txHash: tx.hash,
      };

    } catch (error: any) {
      console.error(`   ❌ Error granting role:`, error.message);

      // Try to decode the error
      let decodedError: string | undefined;
      if (error.data) {
        const decoded = decodeError(error.data);
        decodedError = formatError(decoded);
        console.error(`   🔍 Decoded error: ${decodedError}`);
      }

      return {
        success: false,
        error: error.message,
        decodedError,
      };
    }
  }

  /**
   * Revoke a role from an account
   * 
   * @param roleNameOrBytes - Role name (e.g., 'MINTER_ROLE') or bytes32 value
   * @param account - Address to revoke the role from
   * @returns Result with transaction hash or decoded error
   */
  async revokeRole(
    roleNameOrBytes: RoleName | string, 
    account: string
  ): Promise<GrantRoleResult> {
    try {
      const roleBytes = roleNameOrBytes.startsWith('0x') 
        ? roleNameOrBytes 
        : this.getRoleBytes(roleNameOrBytes as RoleName);
      
      const roleName = this.getRoleName(roleBytes);
      
      console.log(`\n🔓 Revoking role: ${roleName}`);
      console.log(`   Role: ${roleBytes}`);
      console.log(`   From: ${account}`);

      // Check if has role
      const hasRole = await this.hasRole(roleBytes, account);
      if (!hasRole) {
        console.log(`   ⚠️  Account doesn't have this role`);
        return {
          success: true,
          error: 'Account does not have role',
        };
      }

      // Send transaction
      const tx = await this.contract.revokeRole(roleBytes, account);
      console.log(`   📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Role revoked! (Block: ${receipt.blockNumber})`);

      return {
        success: true,
        txHash: tx.hash,
      };

    } catch (error: any) {
      console.error(`   ❌ Error revoking role:`, error.message);

      // Try to decode the error
      let decodedError: string | undefined;
      if (error.data) {
        const decoded = decodeError(error.data);
        decodedError = formatError(decoded);
        console.error(`   🔍 Decoded error: ${decodedError}`);
      }

      return {
        success: false,
        error: error.message,
        decodedError,
      };
    }
  }

  /**
   * List all known roles
   */
  listKnownRoles(): void {
    console.log('\n📋 Known ISBE Roles:\n');
    
    const categories = {
      'Core Admin': ['DEFAULT_ADMIN_ROLE'],
      'Factory & Deployment': ['PAUSER_ROLE', 'BUSINESS_LOGIC_DEPLOYER_ROLE', 'PROXY_DEPLOYER_ROLE'],
      'Governance': ['GOVERNANCE_MANAGER_ROLE', 'GOVERNANCE_CONFIGURATION_MANAGER_ROLE', 'CONFIGURATION_MANAGER_ROLE'],
      'ISBE System': ['ISBE_PAUSER_ROLE', 'ISBE_ROLE'],
      'Specialized': ['ASSET_EVENT_TRACKER_ROLE', 'HASH_TIMESTAMP_ROLE', 'TIMESTAMPING_REGISTRY_ROLE'],
      'Token Management': ['CONTROLLER_ROLE', 'CAP_ROLE', 'SNAPSHOT_ROLE', 'MINTER_ROLE', 'ROYALTY_ROLE'],
      'Identity & ENS': ['DID_REGISTRY_ROLE', 'ENS_MANAGER_ROLE'],
      'Client': ['CLIENT_FILTERING_ROLE'],
    };

    for (const [category, roles] of Object.entries(categories)) {
      console.log(`\n${category}:`);
      for (const roleName of roles) {
        const roleBytes = ISBE_ROLES[roleName as RoleName];
        console.log(`  • ${roleName}`);
        console.log(`    ${roleBytes}`);
      }
    }
  }
}

/**
 * Export for convenience
 */
export default RoleManager;
