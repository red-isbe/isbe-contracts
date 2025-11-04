/**
 * ContractConnector - Generic utility to connect and interact with contracts
 * 
 * This utility provides a simple interface to connect to any smart contract,
 * call functions, and automatically decode errors using our ErrorDecoder.
 */

import { ethers, Contract, ContractRunner, InterfaceAbi } from 'ethers';
import { decodeError, formatError } from './errorDecoder';

export interface ContractCallOptions {
  /** Contract address */
  address: string;
  /** ABI of the contract or function */
  abi: InterfaceAbi;
  /** Function name to call */
  functionName: string;
  /** Function parameters (if any) */
  params?: any[];
  /** Optional value to send with transaction (for payable functions) */
  value?: bigint;
  /** Optional gas limit */
  gasLimit?: bigint;
}

export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    decoded?: ReturnType<typeof decodeError>;
    formatted?: string;
  };
  transaction?: ethers.ContractTransactionResponse;
}

/**
 * ContractConnector - Connect to contracts and call functions with error handling
 */
export class ContractConnector {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Connect to a contract
   */
  getContract(address: string, abi: InterfaceAbi): Contract {
    const runner: ContractRunner = this.signer || this.provider;
    return new ethers.Contract(address, abi, runner);
  }

  /**
   * Call a read-only function (view/pure)
   */
  async call<T = any>(options: ContractCallOptions): Promise<ContractCallResult<T>> {
    try {
      const contract = this.getContract(options.address, options.abi);
      
      // Check if function exists
      if (typeof contract[options.functionName] !== 'function') {
        return {
          success: false,
          error: {
            message: `Function '${options.functionName}' not found in contract ABI`,
          },
        };
      }

      // Call the function
      const params = options.params || [];
      const result = await contract[options.functionName](...params);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      const decoded = decodeError(error);
      const formatted = formatError(decoded);

      return {
        success: false,
        error: {
          message: error.message || 'Unknown error',
          decoded,
          formatted,
        },
      };
    }
  }

  /**
   * Send a transaction (state-changing function)
   */
  async send<T = any>(options: ContractCallOptions): Promise<ContractCallResult<T>> {
    if (!this.signer) {
      return {
        success: false,
        error: {
          message: 'Signer is required for sending transactions',
        },
      };
    }

    try {
      const contract = this.getContract(options.address, options.abi);

      // Check if function exists
      if (typeof contract[options.functionName] !== 'function') {
        return {
          success: false,
          error: {
            message: `Function '${options.functionName}' not found in contract ABI`,
          },
        };
      }

      // Prepare transaction options
      const txOptions: any = {};
      if (options.value !== undefined) {
        txOptions.value = options.value;
      }
      if (options.gasLimit !== undefined) {
        txOptions.gasLimit = options.gasLimit;
      }

      // Send the transaction
      const params = options.params || [];
      const tx = await contract[options.functionName](...params, txOptions);

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        data: receipt as T,
        transaction: tx,
      };
    } catch (error: any) {
      const decoded = decodeError(error);
      const formatted = formatError(decoded);

      return {
        success: false,
        error: {
          message: error.message || 'Unknown error',
          decoded,
          formatted,
        },
      };
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(options: ContractCallOptions): Promise<ContractCallResult<bigint>> {
    try {
      const contract = this.getContract(options.address, options.abi);

      // Check if function exists
      if (typeof contract[options.functionName] !== 'function') {
        return {
          success: false,
          error: {
            message: `Function '${options.functionName}' not found in contract ABI`,
          },
        };
      }

      // Prepare transaction options
      const txOptions: any = {};
      if (options.value !== undefined) {
        txOptions.value = options.value;
      }

      // Estimate gas
      const params = options.params || [];
      const gasEstimate = await contract[options.functionName].estimateGas(
        ...params,
        txOptions
      );

      return {
        success: true,
        data: gasEstimate,
      };
    } catch (error: any) {
      const decoded = decodeError(error);
      const formatted = formatError(decoded);

      return {
        success: false,
        error: {
          message: error.message || 'Unknown error',
          decoded,
          formatted,
        },
      };
    }
  }

  /**
   * Get contract events
   */
  async getEvents(
    address: string,
    abi: InterfaceAbi,
    eventName: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<ContractCallResult<ethers.EventLog[]>> {
    try {
      const contract = this.getContract(address, abi);

      // Get event filter
      const filter = contract.filters[eventName];
      if (!filter) {
        return {
          success: false,
          error: {
            message: `Event '${eventName}' not found in contract ABI`,
          },
        };
      }

      // Query events
      const events = await contract.queryFilter(
        filter(),
        fromBlock,
        toBlock
      );

      return {
        success: true,
        data: events as ethers.EventLog[],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Unknown error',
        },
      };
    }
  }
}

/**
 * Quick helper to create a ContractConnector
 */
export function createConnector(
  provider: ethers.Provider,
  signer?: ethers.Signer
): ContractConnector {
  return new ContractConnector(provider, signer);
}

/**
 * Quick helper to call a contract function
 */
export async function quickCall<T = any>(
  provider: ethers.Provider,
  options: ContractCallOptions
): Promise<ContractCallResult<T>> {
  const connector = new ContractConnector(provider);
  return connector.call<T>(options);
}

/**
 * Quick helper to send a contract transaction
 */
export async function quickSend<T = any>(
  provider: ethers.Provider,
  signer: ethers.Signer,
  options: ContractCallOptions
): Promise<ContractCallResult<T>> {
  const connector = new ContractConnector(provider, signer);
  return connector.send<T>(options);
}
