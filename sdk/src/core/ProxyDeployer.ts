/**
 * ProxyDeployer - Handles proxy token deployment through Factory Diamond
 * 
 * This class encapsulates the logic for deploying token proxies using
 * the Factory Diamond's deployUseCase function.
 */

import { ethers, Contract, Signer } from 'ethers';
import { RoleAssignment } from '../types';

export interface DeploymentParams {
  configId: string;
  initializeData: string[];
  roles: RoleAssignment[];
  signer: Signer;
}

export interface DeploymentResult {
  proxyAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

export class ProxyDeployer {
  private factoryContract: Contract;

  constructor(factoryContract: Contract) {
    this.factoryContract = factoryContract;
  }

  /**
   * Deploy a new token proxy using the Factory Diamond
   * 
   * @param params Deployment parameters including config, init data, and roles
   * @returns Deployment result with proxy address and transaction details
   */
  async deployProxy(params: DeploymentParams): Promise<DeploymentResult> {
    const { configId, initializeData, roles, signer } = params;

    // Connect the factory contract with the signer
    const factoryWithSigner = this.factoryContract.connect(signer);

    // Format roles as [roleHash, account] pairs
    const formattedRoles = roles.map((role) => [role.role, role.account]);

    console.log('🚀 Deploying proxy with configuration:', configId);
    console.log('📝 Initialize data entries:', initializeData.length);
    console.log('🔐 Roles to assign:', roles.length);

    // Call deployUseCase on the Factory Diamond
    const tx = await (factoryWithSigner as any).deployUseCase(
      configId,
      initializeData,
      formattedRoles
    );

    console.log('⏳ Transaction submitted:', tx.hash);
    console.log('⏳ Waiting for confirmation...');

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Extract the proxy address from the ProxyDeployed event
    const proxyAddress = await this.extractProxyAddressFromReceipt(receipt);

    console.log('✅ Proxy deployed successfully!');
    console.log('📍 Proxy address:', proxyAddress);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());

    return {
      proxyAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /**
   * Extract proxy address from deployment transaction receipt
   * 
   * @param receipt Transaction receipt
   * @returns Deployed proxy address
   */
  private async extractProxyAddressFromReceipt(receipt: any): Promise<string> {
    // Look for ProxyDeployed event
    const proxyDeployedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = this.factoryContract.interface.parseLog(log);
        return parsed?.name === 'ProxyDeployed';
      } catch {
        return false;
      }
    });

    if (proxyDeployedEvent) {
      const parsed = this.factoryContract.interface.parseLog(proxyDeployedEvent);
      return parsed?.args.proxy || parsed?.args[0];
    }

    // Fallback: extract from contract interaction
    // If no event found, try to get the latest deployed proxy
    throw new Error('Could not extract proxy address from transaction receipt');
  }

  /**
   * Estimate gas for proxy deployment
   * 
   * @param params Deployment parameters
   * @returns Estimated gas amount
   */
  async estimateGas(params: DeploymentParams): Promise<bigint> {
    const { configId, initializeData, roles, signer } = params;

    const factoryWithSigner = this.factoryContract.connect(signer);
    const formattedRoles = roles.map((role) => [role.role, role.account]);

    const gasEstimate = await (factoryWithSigner as any).deployUseCase.estimateGas(
      configId,
      initializeData,
      formattedRoles
    );

    return gasEstimate;
  }

  /**
   * Validate deployment parameters before execution
   * 
   * @param params Deployment parameters
   * @returns Validation result
   */
  validateParams(params: DeploymentParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check config ID format (should be bytes32)
    if (!/^0x[0-9a-fA-F]{64}$/.test(params.configId)) {
      errors.push('Invalid configId format. Must be a bytes32 hex string.');
    }

    // Check roles format
    for (const role of params.roles) {
      if (!/^0x[0-9a-fA-F]{64}$/.test(role.role)) {
        errors.push(`Invalid role hash format: ${role.role}`);
      }
      if (!/^0x[0-9a-fA-F]{40}$/.test(role.account)) {
        errors.push(`Invalid account address format: ${role.account}`);
      }
    }

    // Check signer
    if (!params.signer) {
      errors.push('Signer is required for deployment.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
