/**
 * ErrorDecoder - Utility to decode smart contract errors
 * 
 * This utility helps decode error data from failed transactions
 * to provide meaningful error messages.
 */

import { ethers } from 'ethers';

// Known error signatures and their selectors
export const KNOWN_ERRORS: { [selector: string]: string } = {};

// Common ISBE contract errors
const ERROR_SIGNATURES = [
  'AccountHasNoRole(address,bytes32)',
  'NotInitialized(address,bytes32)',
  'IsNotInitialized(address,bytes32)',
  'FacetNotInitialized(address,bytes32)',
  'ERC20NotInitialized(address,bytes32)',
  'MintNotInitialized(address,bytes32)',
  'CappedNotInitialized(address,bytes32)',
  'CapNotInitialized(address,bytes32)',
  'CapExceeded(uint256,uint256)',
  'CapExceeded()',
  'NewCapIsLessThanTotalSupply(uint256,uint256)',
  'ZeroAddress()',
  'InvalidConfiguration(bytes32)',
  'InvalidConfiguration(bytes32,uint256)',
  'ConfigurationNotFound(bytes32)',
  'BusinessLogicNotFound(bytes32)',
  'FacetNotFound(bytes32)',
  'FacetNotFound(address,bytes32)',
  'AccessDenied(address)',
  'Paused()',
  'NotPaused()',
  'InvalidRole(bytes32)',
  'InvalidAmount(uint256)',
];

// Build selector lookup table
for (const signature of ERROR_SIGNATURES) {
  const selector = ethers.id(signature).slice(0, 10);
  KNOWN_ERRORS[selector] = signature;
}

export interface DecodedError {
  selector: string;
  signature: string | null;
  data: string;
  args?: any[];
}

/**
 * Decode error data from a transaction
 */
export function decodeError(errorData: string | any): DecodedError {
  // Handle ethers error objects
  if (typeof errorData === 'object' && errorData !== null) {
    // Try to extract error data from ethers error
    const data = errorData.data || errorData.error?.data?.data || errorData.error?.data;
    
    if (data && typeof data === 'string') {
      return decodeError(data);
    }
    
    // If no data field, return basic error info
    return {
      selector: '0x',
      signature: errorData.code || 'Unknown Error',
      data: errorData.message || JSON.stringify(errorData)
    };
  }

  if (!errorData || errorData === '0x') {
    return {
      selector: '0x',
      signature: null,
      data: errorData,
    };
  }

  // Extract selector (first 4 bytes)
  const selector = errorData.slice(0, 10);
  const signature = KNOWN_ERRORS[selector] || null;

  const result: DecodedError = {
    selector,
    signature,
    data: errorData,
  };

  // Try to decode arguments if we know the signature
  if (signature) {
    try {
      const errorInterface = new ethers.Interface([`error ${signature}`]);
      const decoded = errorInterface.parseError(errorData);
      result.args = decoded?.args ? Array.from(decoded.args) : [];
    } catch (e) {
      // Failed to decode, that's ok
    }
  }

  return result;
}

/**
 * Get error selector from signature
 */
export function getErrorSelector(signature: string): string {
  return ethers.id(signature).slice(0, 10);
}

/**
 * Find matching error signature from selector
 */
export function findErrorSignature(selector: string): string | null {
  return KNOWN_ERRORS[selector] || null;
}

/**
 * Format decoded error for display
 */
export function formatError(decoded: DecodedError): string {
  if (!decoded.signature) {
    return `Unknown error: ${decoded.selector}`;
  }

  if (!decoded.args || decoded.args.length === 0) {
    return decoded.signature;
  }

  // Format arguments
  const formattedArgs = decoded.args.map((arg: any) => {
    if (typeof arg === 'bigint') {
      return arg.toString();
    }
    if (typeof arg === 'string' && arg.startsWith('0x')) {
      return arg;
    }
    return JSON.stringify(arg);
  }).join(', ');

  return `${decoded.signature.split('(')[0]}(${formattedArgs})`;
}

/**
 * Decode and format error in one call
 */
export function decodeAndFormat(errorData: string): string {
  const decoded = decodeError(errorData);
  return formatError(decoded);
}

/**
 * Extract error from ethers error object
 */
export function extractErrorData(error: any): string | null {
  // Try common locations where error data might be
  if (error.data) {
    return error.data;
  }
  
  if (error.error?.data) {
    return error.error.data;
  }
  
  if (error.error?.error?.data) {
    return error.error.error.data;
  }

  // Look in transaction data
  if (error.transaction?.data) {
    return error.transaction.data;
  }

  return null;
}

/**
 * Decode error from ethers error object
 */
export function decodeEthersError(error: any): DecodedError | null {
  const errorData = extractErrorData(error);
  
  if (!errorData) {
    return null;
  }

  return decodeError(errorData);
}

/**
 * User-friendly error message
 */
export function getUserFriendlyError(errorData: string): string {
  const decoded = decodeError(errorData);
  
  if (!decoded.signature) {
    return 'Transaction failed with unknown error';
  }

  // Provide user-friendly messages for known errors
  if (decoded.signature.startsWith('AccountHasNoRole')) {
    const [account, role] = decoded.args || [];
    return `Account ${account} does not have the required role (${role})`;
  }

  if (decoded.signature.startsWith('CapExceeded')) {
    const [requested, cap] = decoded.args || [];
    return `Cannot mint ${requested} tokens. Would exceed cap of ${cap}`;
  }

  if (decoded.signature === 'ZeroAddress()') {
    return 'Invalid address: cannot use zero address';
  }

  if (decoded.signature === 'Paused()') {
    return 'Token is currently paused';
  }

  if (decoded.signature.includes('NotInitialized')) {
    return 'Token facet has not been properly initialized';
  }

  // Default: return formatted error
  return formatError(decoded);
}
