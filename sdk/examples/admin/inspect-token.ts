/**
 * Admin Example: Inspect Token
 * 
 * This script inspects a deployed token to see its facets, roles, and status.
 * 
 * Run: npx ts-node examples/admin/inspect-token.ts <TOKEN_ADDRESS>
 */

import { ISBEClient, TokenInspector } from '../../src';
import { ethers } from 'ethers';

async function main() {
  console.log('=== ISBE Admin - Token Inspector ===\n');

  // Get token address from command line or use default
  const tokenAddress = process.argv[2] || '0xfD7d89F7F2b3D7e257425028C8094C0F460a1d76';
  
  console.log(`🔍 Inspecting token: ${tokenAddress}\n`);

  // Connect client
  const client = ISBEClient.fromEnv('dev');
  const adminAddress = await client.getSignerAddress();

  // Create token inspector
  const inspector = new TokenInspector(client.getProvider());

  // Get basic token info
  console.log('📊 Token Information:\n');
  const info = await inspector.getTokenInfo(tokenAddress);
  
  if (info) {
    console.log(`   Name: ${info.name}`);
    console.log(`   Symbol: ${info.symbol}`);
    console.log(`   Decimals: ${info.decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(info.totalSupply, info.decimals)}\n`);
  } else {
    console.log('   ⚠️  Could not retrieve token info (might not be ERC20)\n');
  }

  // Check if paused
  const isPaused = await inspector.isPaused(tokenAddress);
  console.log(`⏸️  Paused: ${isPaused ? '❌ YES (token is paused!)' : '✅ NO'}\n`);

  // Get all facets
  console.log('🔧 Installed Facets:\n');
  const facets = await inspector.getTokenFacets(tokenAddress);
  
  facets.forEach((facet, index) => {
    console.log(`   ${index + 1}. ${facet.facetAddress}`);
    console.log(`      Functions: ${facet.functionCount}`);
    console.log(`      Selectors: ${facet.functionSelectors.slice(0, 3).join(', ')}${facet.functionCount > 3 ? '...' : ''}\n`);
  });

  // Check important functions
  console.log('🔎 Function Availability:\n');
  
  const mintCheck = await inspector.hasFunction(tokenAddress, 'mint(address,uint256)');
  console.log(`   ${mintCheck.found ? '✅' : '❌'} mint(address,uint256)${mintCheck.found ? ` - in ${mintCheck.facetAddress}` : ''}`);
  
  const burnCheck = await inspector.hasFunction(tokenAddress, 'burn(uint256)');
  console.log(`   ${burnCheck.found ? '✅' : '❌'} burn(uint256)${burnCheck.found ? ` - in ${burnCheck.facetAddress}` : ''}`);
  
  const pauseCheck = await inspector.hasFunction(tokenAddress, 'pause()');
  console.log(`   ${pauseCheck.found ? '✅' : '❌'} pause()${pauseCheck.found ? ` - in ${pauseCheck.facetAddress}` : ''}\n`);

  // Check roles for admin
  console.log(`👤 Roles for ${adminAddress}:\n`);
  const roles = await inspector.checkRoles(tokenAddress, adminAddress!);
  
  roles.forEach(role => {
    console.log(`   ${role.hasRole ? '✅' : '❌'} ${role.roleName}`);
  });

  // Get members of MINTER_ROLE
  console.log('\n👥 MINTER_ROLE Members:\n');
  const MINTER_ROLE = '0xd8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace';
  const minters = await inspector.getRoleMembers(tokenAddress, MINTER_ROLE);
  
  if (minters.length === 0) {
    console.log('   (No addresses have MINTER_ROLE)');
  } else {
    minters.forEach((minter, index) => {
      console.log(`   ${index + 1}. ${minter}`);
    });
  }

  // Full diagnosis
  console.log('\n\n🩺 Complete Diagnosis:\n');
  const diagnosis = await inspector.diagnose(tokenAddress, adminAddress!);
  
  console.log(`   Token Type: ${diagnosis.info ? 'ERC20' : 'Unknown'}`);
  console.log(`   Facets Installed: ${diagnosis.facets.length}`);
  console.log(`   Is Paused: ${diagnosis.isPaused ? 'Yes ⚠️' : 'No'}`);
  console.log(`   Has Mint Function: ${diagnosis.hasMintFunction ? 'Yes' : 'No'}`);
  console.log(`   Has Burn Function: ${diagnosis.hasBurnFunction ? 'Yes' : 'No'}`);
  
  if (diagnosis.roles) {
    const hasRoles = diagnosis.roles.filter(r => r.hasRole);
    console.log(`   Your Roles: ${hasRoles.length > 0 ? hasRoles.map(r => r.roleName).join(', ') : 'None'}`);
  }
}

main()
  .then(() => {
    console.log('\n✅ Token inspection completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
