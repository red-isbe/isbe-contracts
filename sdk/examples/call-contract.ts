#!/usr/bin/env ts-node
/**
 * Generic Contract Caller Script
 * 
 * Usage:
 *   ts-node call-contract.ts <address> <function> [params...] [--estimate-gas]
 * 
 * Examples:
 *   ts-node call-contract.ts 0x123... balanceOf 0xabc...
 *   ts-node call-contract.ts 0x123... mint 0xabc... 1000000000000000000
 *   ts-node call-contract.ts 0x123... mint 0xabc... 1000000000000000000 --estimate-gas
 *   ts-node call-contract.ts 0x123... name
 * 
 * Flags:
 *   --estimate-gas  Estimate gas before sending transaction (optional, only for write operations)
 * 
 * Environment variables:
 *   RPC_URL - RPC endpoint (default: http://localhost:8545)
 *   PRIVATE_KEY - Private key for transactions (required for write operations)
 *   CONTRACT_ABI - Path to ABI file or ABI string (optional, uses common functions if not provided)
 */

import { ethers } from 'ethers';
import { ContractConnector } from '../src/utils/ContractConnector';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: './sdk/.env' });

// Common ABIs for standard interfaces
const COMMON_ABIS = {
  // ERC20 functions
  'balanceOf': 'function balanceOf(address account) view returns (uint256)',
  'totalSupply': 'function totalSupply() view returns (uint256)',
  'transfer': 'function transfer(address to, uint256 amount) returns (bool)',
  'approve': 'function approve(address spender, uint256 amount) returns (bool)',
  'allowance': 'function allowance(address owner, address spender) view returns (uint256)',
  'mint': 'function mint(address to, uint256 amount) returns (bool)',
  'burn': 'function burn(uint256 amount) returns (bool)',
  'name': 'function name() view returns (string)',
  'symbol': 'function symbol() view returns (string)',
  'decimals': 'function decimals() view returns (uint8)',
  
  // ERC721 functions
  'ownerOf': 'function ownerOf(uint256 tokenId) view returns (address)',
  'tokenURI': 'function tokenURI(uint256 tokenId) view returns (string)',
  'safeMint': 'function safeMint(address to, uint256 tokenId)',
  
  // Access Control
  'hasRole': 'function hasRole(bytes32 role, address account) view returns (bool)',
  'grantRole': 'function grantRole(bytes32 role, address account)',
  'revokeRole': 'function revokeRole(bytes32 role, address account)',
  'MINTER_ROLE': 'function MINTER_ROLE() view returns (bytes32)',
  'DEFAULT_ADMIN_ROLE': 'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  
  // Common getters
  'owner': 'function owner() view returns (address)',
  'paused': 'function paused() view returns (bool)',
};

// View/pure function patterns (don't require transactions)
const VIEW_FUNCTIONS = [
  'balanceOf', 'totalSupply', 'allowance', 'name', 'symbol', 'decimals',
  'ownerOf', 'tokenURI', 'hasRole', 'owner', 'paused', 'MINTER_ROLE',
  'DEFAULT_ADMIN_ROLE'
];

function isViewFunction(functionName: string): boolean {
  return VIEW_FUNCTIONS.includes(functionName) || 
         functionName.startsWith('get') ||
         functionName.endsWith('Of');
}

function loadABI(contractAddress: string, functionName: string): string[] {
  // Check if ABI path provided
  const abiPath = process.env.CONTRACT_ABI;
  
  if (abiPath) {
    console.log(`📄 Loading ABI from: ${abiPath}`);
    
    try {
      const abiContent = fs.readFileSync(abiPath, 'utf-8');
      const abiJson = JSON.parse(abiContent);
      
      // Handle both array format and Hardhat artifact format
      if (Array.isArray(abiJson)) {
        return abiJson;
      } else if (abiJson.abi) {
        return abiJson.abi;
      } else {
        throw new Error('Invalid ABI format');
      }
    } catch (error: any) {
      console.warn(`⚠️  Could not load ABI from file: ${error.message}`);
    }
  }
  
  // Use common ABI if available
  if (COMMON_ABIS[functionName as keyof typeof COMMON_ABIS]) {
    console.log(`📄 Using common ABI for function: ${functionName}`);
    return [COMMON_ABIS[functionName as keyof typeof COMMON_ABIS]];
  }
  
  // Try to load from artifacts
  const artifactPaths = [
    path.join(process.cwd(), 'artifacts', 'contracts', '**', '*.json'),
    path.join(process.cwd(), 'sdk', 'abi', '**', '*.json'),
  ];
  
  console.warn(`⚠️  No ABI provided. Using minimal ABI for ${functionName}.`);
  console.warn(`   Set CONTRACT_ABI env variable to use custom ABI.`);
  
  return [COMMON_ABIS[functionName as keyof typeof COMMON_ABIS] || 
          `function ${functionName}(...) returns (...)`];
}

function parseArgument(arg: string): any {
  // Try to parse as number
  if (/^\d+$/.test(arg)) {
    return BigInt(arg);
  }
  
  // Try to parse as hex
  if (arg.startsWith('0x')) {
    return arg;
  }
  
  // Try to parse as boolean
  if (arg === 'true') return true;
  if (arg === 'false') return false;
  
  // Try to parse as JSON
  try {
    return JSON.parse(arg);
  } catch {
    // Return as string
    return arg;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: ts-node call-contract.ts <address> <function> [params...] [--estimate-gas]');
    console.error('');
    console.error('Examples:');
    console.error('  ts-node call-contract.ts 0x123... balanceOf 0xabc...');
    console.error('  ts-node call-contract.ts 0x123... mint 0xabc... 1000000000000000000');
    console.error('  ts-node call-contract.ts 0x123... mint 0xabc... 1000000000000000000 --estimate-gas');
    console.error('');
    console.error('Flags:');
    console.error('  --estimate-gas  Estimate gas before sending transaction (optional)');
    console.error('');
    console.error('Environment:');
    console.error('  RPC_URL - RPC endpoint (default: http://localhost:8545)');
    console.error('  PRIVATE_KEY - Private key for transactions');
    console.error('  CONTRACT_ABI - Path to ABI file (optional)');
    process.exit(1);
  }
  
  // Check for flags
  const shouldEstimateGas = args.includes('--estimate-gas');
  
  // Remove flags from args
  const cleanArgs = args.filter(arg => !arg.startsWith('--'));
  
  const [contractAddress, functionName, ...functionParams] = cleanArgs;
  
  console.log('🚀 Generic Contract Caller\n');
  console.log('📋 Configuration:');
  console.log(`  - Contract: ${contractAddress}`);
  console.log(`  - Function: ${functionName}`);
  console.log(`  - Params: ${functionParams.length > 0 ? functionParams.join(', ') : 'none'}\n`);
  
  // Setup provider
  const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  console.log(`🔗 Connected to: ${rpcUrl}`);
  
  // Load ABI
  const abi = loadABI(contractAddress, functionName);
  
  // Parse parameters
  const params = functionParams.map(parseArgument);
  console.log(`📦 Parsed params:`, params);
  console.log('');
  
  // Determine if this is a view or transaction
  const isView = isViewFunction(functionName);
  
  if (isView) {
    // ============================================================
    // VIEW/CALL
    // ============================================================
    console.log('👀 Calling view function (read-only)...\n');
    
    const connector = new ContractConnector(provider);
    const result = await connector.call({
      address: contractAddress,
      abi,
      functionName,
      params,
    });
    
    if (!result.success) {
      console.error('❌ Call failed:');
      console.error('   Message:', result.error?.message);
      console.error('   Formatted:', result.error?.formatted);
      console.error('   Decoded:', result.error?.decoded);
      process.exit(1);
    }
    
    console.log('✅ Result:', result.data);
    
    // Try to format if it's a BigInt
    if (typeof result.data === 'bigint') {
      console.log('   (as number):', result.data.toString());
      console.log('   (as ether):', ethers.formatEther(result.data));
    }
    
  } else {
    // ============================================================
    // TRANSACTION
    // ============================================================
    console.log('✍️  Sending transaction...\n');
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ PRIVATE_KEY environment variable is required for transactions');
      process.exit(1);
    }
    
    const signer = new ethers.Wallet(privateKey, provider);
    console.log(`🔑 Signer: ${signer.address}\n`);
    
    const connector = new ContractConnector(provider, signer);
    
    // Estimate gas (optional)
    let gasEstimate: bigint | undefined;
    
    if (shouldEstimateGas) {
      console.log('⛽ Estimating gas...');
      const gasResult = await connector.estimateGas({
        address: contractAddress,
        abi,
        functionName,
        params,
      });
      
      if (!gasResult.success) {
        console.error('❌ Gas estimation failed:');
        console.error('   Message:', gasResult.error?.message);
        console.error('   Formatted:', gasResult.error?.formatted);
        console.error('   Decoded:', gasResult.error?.decoded);
        console.log('\n⚠️  Transaction will likely fail. Stopping.');
        process.exit(1);
      }
      
      gasEstimate = gasResult.data!;
      console.log(`   Gas estimate: ${gasEstimate}\n`);
    } else {
      console.log('⛽ Gas estimation skipped (use --estimate-gas to enable)\n');
    }
    
    // Send transaction
    console.log('📤 Sending transaction...');
    
    const txOptions: any = {
      address: contractAddress,
      abi,
      functionName,
      params,
    };
    
    // Only add gasLimit if estimation was done
    if (gasEstimate) {
      txOptions.gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
      console.log(`   Using gas limit: ${txOptions.gasLimit} (estimate + 20%)`);
    }
    
    const result = await connector.send(txOptions);
    
    if (!result.success) {
      console.error('\n❌ Transaction failed:');
      console.error('   Message:', result.error?.message);
      console.error('   Formatted:', result.error?.formatted);
      console.error('   Decoded:', result.error?.decoded);
      process.exit(1);
    }
    
    console.log('\n✅ Transaction successful!');
    console.log(`   Hash: ${result.transaction?.hash}`);
    console.log(`   Block: ${result.data?.blockNumber}`);
    console.log(`   Gas used: ${result.data?.gasUsed}`);
  }
  
  console.log('\n🎉 Done!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Unhandled error:', error.message);
    process.exit(1);
  });
