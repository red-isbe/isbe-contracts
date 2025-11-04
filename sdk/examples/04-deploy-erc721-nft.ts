/**
 * Example: Deploy ERC721 NFT with Builder
 * 
 * This example demonstrates how to use the ERC721Builder to create
 * a basic ERC721 NFT collection.
 * 
 * Collection: NFT SDK
 * Symbol: NFTSDK
 * Features: Base only (simplest configuration)
 * Action: Mint 1 NFT
 * 
 * Usage:
 *   npx ts-node sdk/examples/04-deploy-erc721-nft.ts
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { ERC721Builder } from '../src/core/ERC721Builder';
import { RoleManager, ISBE_ROLES } from '../src/admin/RoleManager';
import { decodeError, formatError } from '../src/utils/errorDecoder';

// Load environment variables
dotenv.config();

// Configuration
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de';
const RPC_URL = process.env.RPC_URL || 'https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/';
const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY || process.env.PRIVATE_KEY || '';

let NFT_ADDRESS = '';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ERC721 NFT BUILDER - BASIC NFT COLLECTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const signerAddress = await signer.getAddress();

  const network = await provider.getNetwork();
  console.log(` Factory: ${FACTORY_ADDRESS}`);
  console.log(` Network: ${network.name}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(` Deployer: ${signerAddress}\n`);

  // Step 1: Configure NFT Collection
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Configure NFT Collection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const builder = new ERC721Builder(provider, signer, FACTORY_ADDRESS);
  
  builder
    .setToken('NFT SDK', 'NFTSDK')
    .addCapped(); // Need capped feature to have mint() function

  // Show configuration summary
  const summary = builder.getSummary();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' ERC721 NFT CONFIGURATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Collection Parameters:');
  console.log(`  Name: ${summary.params.name}`);
  console.log(`  Symbol: ${summary.params.symbol}`);
  console.log(`  Base URI: ${summary.params.baseURI}\n`);

  console.log('Selected Features:');
  summary.features.forEach(feature => {
    console.log(`  ✓ ${feature}`);
  });
  console.log('');

  if (summary.configuration) {
    console.log('Configuration:');
    console.log(`  Name: ${summary.configuration.name}`);
    console.log(`  Config ID: ${summary.configuration.configId}`);
    console.log(`  Facets: ${summary.configuration.facetCount}`);
    console.log(`  Description: ${summary.configuration.description}\n`);
  }

  console.log('Required Roles:');
  summary.requiredRoles.forEach(role => {
    console.log(`  • ${role.name}`);
    console.log(`    ${role.hash}`);
  });

  console.log(`\nValidation: ${summary.isValid ? '✅ Valid' : '❌ Invalid'}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 2: Find Configuration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Find Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (summary.configuration) {
    console.log(`✅ Found configuration: ${summary.configuration.name}`);
    console.log(`   Config ID: ${summary.configuration.configId}`);
    console.log(`   Features: ${summary.features.join(', ')}`);
    console.log(`   Facets: ${summary.configuration.facetCount}\n`);
  }

  // Step 3: Verify Roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: Verify Roles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Required roles for this configuration:');
  summary.requiredRoles.forEach(role => {
    console.log(`  • ${role.name}`);
  });
  console.log('');

  // Step 4: Deploy NFT Collection
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: Deploy NFT Collection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const result = await builder.deploy();

  if (!result.success) {
    console.error(`❌ Deployment failed: ${result.error}`);
    process.exit(1);
  }

  NFT_ADDRESS = result.tokenAddress!;
  console.log(` Deployment saved to client-configurations/${signerAddress.toLowerCase()}.json\n`);

  // Step 5: Grant Required Roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 5: Grant Required Roles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Note: Roles must be granted by an admin after deployment');
  console.log('Required roles for this NFT:');
  summary.requiredRoles.forEach(role => {
    console.log(`  • ${role.name}`);
  });
  console.log('');

  const roleManager = new RoleManager(NFT_ADDRESS, signer);

  // Grant DEFAULT_ADMIN_ROLE
  console.log('Granting DEFAULT_ADMIN_ROLE to deployer...\n');
  try {
    await roleManager.grantRole(
      ISBE_ROLES.DEFAULT_ADMIN_ROLE,
      signerAddress
    );
    console.log('✅ DEFAULT_ADMIN_ROLE granted!');
  } catch (error: any) {
    const decodedError = decodeError(error);
    console.error('⚠️  Note:', formatError(decodedError));
  }

  // Grant MINTER_ROLE
  console.log('Granting MINTER_ROLE to deployer...\n');
  try {
    await roleManager.grantRole(
      ISBE_ROLES.MINTER_ROLE,
      signerAddress
    );
    console.log('✅ MINTER_ROLE granted!\n');
  } catch (error: any) {
    const decodedError = decodeError(error);
    console.error('Error:', formatError(decodedError));
    process.exit(1);
  }

  // Step 6: Mint 1 NFT
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 6: Initialize Cap & Mint 1 NFT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get NFT contract with ERC721CappedFacet ABI (combined ERC721 + Capped)
    const ERC721CappedFacetArtifact = require('../abi/ERC721CappedFacet.json');
    const nft = new ethers.Contract(NFT_ADDRESS, ERC721CappedFacetArtifact.abi, signer);

    // Initialize cap to 1000 NFTs
    console.log('Initializing cap to 1000 NFTs...');
    const capTx = await nft.initializeCap(1000);
    console.log(`  Transaction sent: ${capTx.hash}`);
    await capTx.wait();
    console.log(`   ✅ Cap initialized!\n`);

    // Check initial balance
    const initialBalance = await nft.balanceOf(signerAddress);
    console.log(`Initial NFT Balance: ${initialBalance.toString()} NFTs\n`);

    // Mint NFT #1
    console.log('Minting NFT #1...');
    const tokenId = 1;
    const mintTx = await nft.mint(signerAddress, tokenId);
    console.log(`  Transaction sent: ${mintTx.hash}`);
    
    const mintReceipt = await mintTx.wait();
    console.log(`   ✅ Minted! (Block: ${mintReceipt.blockNumber})\n`);

    // Check final balance
    const finalBalance = await nft.balanceOf(signerAddress);
    const owner = await nft.ownerOf(tokenId);
    console.log(`Final NFT Balance: ${finalBalance.toString()} NFT`);
    console.log(`Token #${tokenId} Owner: ${owner}\n`);

  } catch (error: any) {
    console.error('❌ Error minting NFT:');
    console.error('Raw error:', error);
    const decodedError = decodeError(error);
    console.error(formatError(decodedError));
    process.exit(1);
  }

  // Step 7: Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const ERC721CappedFacetArtifact = require('../abi/ERC721CappedFacet.json');
  const nft = new ethers.Contract(NFT_ADDRESS, ERC721CappedFacetArtifact.abi, signer);

  const nftName = await nft.name();
  const nftSymbol = await nft.symbol();
  const finalBalance = await nft.balanceOf(signerAddress);

  console.log('NFT Collection Information:');
  console.log(`  Name: ${nftName}`);
  console.log(`  Symbol: ${nftSymbol}`);
  console.log(`  Address: ${NFT_ADDRESS}`);
  console.log('');
  console.log('Operations Completed:');
  console.log(`  ✅ Minted: 1 ${nftSymbol}`);
  console.log('');
  console.log('Final State:');
  console.log(`  Your Balance: ${finalBalance.toString()} ${nftSymbol}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL OPERATIONS COMPLETED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal Error:');
    console.error(error);
    process.exit(1);
  });
