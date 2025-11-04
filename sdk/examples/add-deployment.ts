/**
 * Script to manually add the existing deployed token to client history
 */

import { ISBEClient } from '../src';

async function main() {
  console.log('=== Adding Existing Deployment to History ===\n');

  const client = ISBEClient.fromEnv('dev');
  const address = await client.getSignerAddress();
  
  console.log(`Client: ${address}`);

  // Add the existing deployment
  client.clientConfigManager.addDeployment(address!, {
    tokenAddress: '0xfD7d89F7F2b3D7e257425028C8094C0F460a1d76',
    configId: '0x0000000000000000000000000000000000000000000000000000000000002a20',
    configName: 'ERC20 Mintable with Cap',
    tokenName: 'My Mintable Token',
    tokenSymbol: 'MMT',
    deployedAt: new Date().toISOString(),
    transactionHash: '0x...',  // Replace with actual tx hash if you have it
    blockNumber: 237145,
    network: 'dev',
  });

  console.log('\n✅ Deployment added to history!');
  console.log('\nRun: npx ts-node sdk/examples/02-client-configurations.ts');
  console.log('to see your deployment history.\n');
}

main().catch(console.error);
