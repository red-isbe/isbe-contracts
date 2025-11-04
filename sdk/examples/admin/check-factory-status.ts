/**
 * Admin Example: Check Factory Status
 * 
 * This script checks the status of the Factory Diamond and all deployed business logics.
 * 
 * Run: npx ts-node examples/admin/check-factory-status.ts
 */

import { ISBEClient, BusinessLogicChecker } from '../../src';

async function main() {
  console.log('=== ISBE Admin - Factory Status Check ===\n');

  // Connect as admin
  const client = ISBEClient.fromEnv('dev');
  const adminAddress = await client.getSignerAddress();
  console.log(` Admin: ${adminAddress}\n`);

  // Create business logic checker
  const checker = new BusinessLogicChecker(
    client.getFactoryContract(),
    client.getProvider()
  );

  // Get statistics
  console.log(' Business Logic Statistics:\n');
  const stats = await checker.getStatistics();
  console.log(`   Total known business logics: ${stats.total}`);
  console.log(`   ✅ Deployed and working: ${stats.deployed}`);
  console.log(`   ❌ Not deployed: ${stats.notDeployed}`);
  console.log(`   ⚠️  Deployed but no code: ${stats.withoutCode}\n`);

  // List all business logics
  console.log(' All Business Logics:\n');
  const allLogics = await checker.listAllBusinessLogics();

  // Group by ISBE token standards
  const categories: { [key: string]: typeof allLogics } = {
    'Base (Core & Access Control)': [],
    'ERC20 Standard': [],
    'ERC721 Standard': [],
    'ERC3643 Standard (Future)': [],
  };

  allLogics.forEach(bl => {
    if (bl.name.includes('Isbe') || bl.name.includes('AccessControl') || bl.name.includes('Pause')) {
      categories['Base (Core & Access Control)'].push(bl);
    } else if (bl.name.includes('ERC20')) {
      categories['ERC20 Standard'].push(bl);
    } else if (bl.name.includes('ERC721')) {
      categories['ERC721 Standard'].push(bl);
    } else if (bl.name.includes('ERC3643') || bl.name.includes('3643')) {
      categories['ERC3643 Standard (Future)'].push(bl);
    }
  });

  for (const [category, logics] of Object.entries(categories)) {
    if (logics.length === 0) continue; // Skip empty categories
    
    console.log(`\n  ${category}:`);
    logics.forEach(bl => {
      const status = bl.isDeployed && bl.hasCode ? '✅' : '❌';
      console.log(`   ${status} ${bl.name.padEnd(30)} ${bl.address !== '0x0000000000000000000000000000000000000000' ? bl.address : 'NOT DEPLOYED'}`);
    });
  }

  // Check specific important business logics
  console.log('\n\n Checking Critical Business Logics:\n');
  
  const criticalLogics = [
    'ERC20Facet',
    'ERC20CappedFacet',
    'ERC721Facet',
    'AccessControlFacet',
    'IsbeCutFacet',
  ];

  for (const name of criticalLogics) {
    const isValid = await checker.verifyBusinessLogic(name);
    console.log(`   ${isValid ? '✅' : '❌'} ${name}`);
  }

  // List deployed only
  console.log('\n\n Ready-to-Use Business Logics:\n');
  const deployed = await checker.getDeployedBusinessLogics();
  console.log(`   ${deployed.length} business logics are deployed and ready\n`);
}

main()
  .then(() => {
    console.log('\n✅ Factory status check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
