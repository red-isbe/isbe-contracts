/**
 * Example: Deploy ERC20 Token with Builder
 * 
 * This example demonstrates how to use the ERC20Builder to create
 * a mintable and burnable ERC20 token.
 * 
 * Token: Prueba SDK 2 (PSDK2)
 * Features: Burnable + Capped (Capped provides mint functionality)
 * Initial Supply: 0 tokens
 * Actions: Mint 200k, then burn 100k
 * 
 * Usage:
 *   npx ts-node sdk/examples/03-deploy-erc20-token.ts
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { ERC20Builder } from '../src/core/ERC20Builder';
import { RoleManager, ISBE_ROLES } from '../src/admin/RoleManager';
import { decodeError, formatError } from '../src/utils/errorDecoder';

dotenv.config();

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏗️  ERC20 TOKEN BUILDER - MINTABLE & BURNABLE TOKEN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Setup
  const rpcUrl = process.env.RPC_URL || 'https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/';
  const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
  const factoryAddress = process.env.FACTORY_ADDRESS || '0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de';

  if (!privateKey) {
    throw new Error('ACCOUNT_PRIVATE_KEY not found in environment');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const signerAddress = await signer.getAddress();

  console.log(`📍 Factory: ${factoryAddress}`);
  console.log(`🌐 Network: ${(await provider.getNetwork()).name}`);
  console.log(`⛓️  Chain ID: ${(await provider.getNetwork()).chainId}`);
  console.log(`👤 Deployer: ${signerAddress}\n`);

  // Step 1: Build the token configuration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Configure Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const builder = new ERC20Builder(factoryAddress, signer);

  // Configure token with burnable and capped (for mint capability)
  // We set a very high cap so it's effectively unlimited
  builder
    .setTokenInfo('Prueba SDK 2', 'PSDK2', 18)
    .addBurnable()    // Allow burning tokens
    .addCapped(ethers.parseEther('1000000000000')); // Very high cap (1 trillion tokens) for mint capability

  // Display configuration summary
  builder.displaySummary();

  // Step 2: Find matching configuration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Find Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const config = builder.getConfiguration();
  
  if (!config) {
    console.error('❌ No configuration found for selected features');
    process.exit(1);
  }

  console.log(`✅ Found configuration: ${config.name}`);
  console.log(`   Config ID: ${config.configId}`);
  console.log(`   Features: ${config.features.join(', ')}`);
  console.log(`   Facets: ${config.facetCount}\n`);

  // Step 3: Check required roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: Verify Roles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const requiredRoles = builder.getRequiredRoles();
  console.log('Required roles for this configuration:');
  requiredRoles.forEach(role => {
    console.log(`  • ${role}`);
  });
  console.log('');

  // Step 4: Deploy the token
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: Deploy Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const deployResult = await builder.deploy();

  if (!deployResult.success) {
    console.error(`\n❌ Deployment failed: ${deployResult.error}`);
    process.exit(1);
  }

  const TOKEN_ADDRESS = deployResult.tokenAddress!;

  // Step 5: Grant required roles via RoleManager
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 5: Grant Required Roles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Note: Roles must be granted by an admin after deployment');
  console.log('Required roles for this token:');
  requiredRoles.forEach(role => {
    console.log(`  • ${role}`);
  });
  console.log('');

  const roleManager = new RoleManager(TOKEN_ADDRESS, signer);
  
  // Grant DEFAULT_ADMIN_ROLE
  console.log('Granting DEFAULT_ADMIN_ROLE to deployer...');
  let adminResult = await roleManager.grantRole('DEFAULT_ADMIN_ROLE', signerAddress);
  if (!adminResult.success && !adminResult.error?.includes('already has')) {
    console.error(`❌ Failed: ${adminResult.error}`);
    if (adminResult.decodedError) {
      console.error(`   🔍 Decoded: ${adminResult.decodedError}`);
    }
    process.exit(1);
  }
  console.log('✅ DEFAULT_ADMIN_ROLE granted!');

  // Grant MINTER_ROLE for minting tokens
  console.log('Granting MINTER_ROLE to deployer...');
  let minterResult = await roleManager.grantRole('MINTER_ROLE', signerAddress);
  if (!minterResult.success && !minterResult.error?.includes('already has')) {
    console.error(`❌ Failed: ${minterResult.error}`);
    if (minterResult.decodedError) {
      console.error(`   🔍 Decoded: ${minterResult.decodedError}`);
    }
    process.exit(1);
  }
  console.log('✅ MINTER_ROLE granted!\n');

  // Step 6: Mint 200,000 tokens
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 6: Mint 200,000 Tokens');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const ERC20_ABI = [
    'function mint(address to, uint256 amount) external',
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
    'function burn(uint256 amount) external',
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    'function decimals() external view returns (uint8)',
  ];

  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);

  try {
    // Check initial balance
    const initialSupply = await token.totalSupply();
    console.log(`Initial Total Supply: ${ethers.formatEther(initialSupply)} tokens`);

    const initialBalance = await token.balanceOf(signerAddress);
    console.log(`Initial Balance: ${ethers.formatEther(initialBalance)} tokens\n`);

    // Mint 200,000 tokens
    console.log('Minting 200,000 PSDK tokens...');
    const mintAmount = ethers.parseEther('200000');
    const mintTx = await token.mint(signerAddress, mintAmount);
    console.log(`   📤 Transaction sent: ${mintTx.hash}`);
    
    const mintReceipt = await mintTx.wait();
    console.log(`   ✅ Minted! (Block: ${mintReceipt.blockNumber})\n`);

    // Check balance after mint
    const balanceAfterMint = await token.balanceOf(signerAddress);
    const supplyAfterMint = await token.totalSupply();
    console.log(`Balance after mint: ${ethers.formatEther(balanceAfterMint)} tokens`);
    console.log(`Total Supply after mint: ${ethers.formatEther(supplyAfterMint)} tokens\n`);

  } catch (error: any) {
    console.error('❌ Error minting tokens:');
    const decodedError = decodeError(error);
    console.error(formatError(decodedError));
    process.exit(1);
  }

  // Step 7: Burn 100,000 tokens
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 7: Burn 100,000 Tokens');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Burn 100,000 tokens
    console.log('Burning 100,000 PSDK tokens...');
    const burnAmount = ethers.parseEther('100000');
    const burnTx = await token.burn(burnAmount);
    console.log(`   📤 Transaction sent: ${burnTx.hash}`);
    
    const burnReceipt = await burnTx.wait();
    console.log(`   ✅ Burned! (Block: ${burnReceipt.blockNumber})\n`);

    // Check final balance
    const finalBalance = await token.balanceOf(signerAddress);
    const finalSupply = await token.totalSupply();
    console.log(`Final Balance: ${ethers.formatEther(finalBalance)} tokens`);
    console.log(`Final Total Supply: ${ethers.formatEther(finalSupply)} tokens\n`);

  } catch (error: any) {
    console.error('❌ Error burning tokens:');
    const decodedError = decodeError(error);
    console.error(formatError(decodedError));
    process.exit(1);
  }

  // Step 8: Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const tokenDecimals = await token.decimals();
  const finalSupply = await token.totalSupply();
  const finalBalance = await token.balanceOf(signerAddress);

  console.log('Token Information:');
  console.log(`  Name: ${tokenName}`);
  console.log(`  Symbol: ${tokenSymbol}`);
  console.log(`  Decimals: ${tokenDecimals}`);
  console.log(`  Address: ${TOKEN_ADDRESS}`);
  console.log('');
  console.log('Operations Completed:');
  console.log(`  ✅ Minted: 200,000 ${tokenSymbol}`);
  console.log(`  ✅ Burned: 100,000 ${tokenSymbol}`);
  console.log('');
  console.log('Final State:');
  console.log(`  Your Balance: ${ethers.formatEther(finalBalance)} ${tokenSymbol}`);
  console.log(`  Total Supply: ${ethers.formatEther(finalSupply)} ${tokenSymbol}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL OPERATIONS COMPLETED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal Error:');
    const decodedError = decodeError(error);
    console.error(formatError(decodedError));
    process.exit(1);
  });
