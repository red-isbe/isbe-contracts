/**
 * Example: Client Configuration Management
 * 
 * ============================================================
 * QUÉ HACE ESTE EJEMPLO:
 * ============================================================
 * 
 * 1. Conecta con signer desde .env
 * 2. Guarda configuraciones favoritas del cliente
 * 3. Lista las configuraciones guardadas
 * 4. Muestra el historial de deployments del cliente
 * 5. Filtra deployments por red
 * 
 * ============================================================
 * PARA QUÉ SIRVE:
 * ============================================================
 * 
 * - Cada cliente tiene su propio JSON con sus configs favoritas
 * - Se guarda el historial de tokens desplegados
 * - Permite filtrar por red (dev/main)
 * - Persistencia de preferencias del usuario
 * 
 * ============================================================
 */

import { ISBEClient } from '../src';

async function main() {
  console.log('=== ISBE SDK - Client Configuration Management ===\n');

  // Connect with signer from .env
  console.log(' Connecting client from .env...');
  const client = ISBEClient.fromEnv('dev');
  const signerAddress = await client.getSignerAddress();
  console.log(`✅ Connected as: ${signerAddress}\n`);

  // Check if client has saved configurations
  const hasSaved = await client.hasSavedConfigurations();
  console.log(` Has saved configurations: ${hasSaved ? 'Yes' : 'No'}`);

  if (!hasSaved) {
    console.log('\n� Available Configurations from Factory (created by admin):\n');
    
    // Get all available configurations from Factory
    const availableConfigs = client.listConfigurations();
    availableConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name}`);
      console.log(`   Config ID: ${config.configId}`);
      console.log(`   Features: ${config.features.join(', ')}`);
      console.log(`   Description: ${config.description}\n`);
    });

    console.log(' Saving first 2 configurations as favorites (as example)...\n');
    
    // Dynamically save the first 2 configurations
    if (availableConfigs.length > 0) {
      await client.saveConfiguration(availableConfigs[0].configId);
    }
    
    if (availableConfigs.length > 1) {
      await client.saveConfiguration(availableConfigs[1].configId);
    }
  }

  // Load and display saved configurations
  console.log('\n My Saved Configurations:');
  const savedConfigs = await client.loadSavedConfigurations();
  savedConfigs.forEach((config, index) => {
    console.log(`\n${index + 1}. ${config.name}`);
    console.log(`   Config ID: ${config.configId}`);
    console.log(`   Standard: ${config.standard}`);
    console.log(`   Features: ${config.features.join(', ')}`);
  });

  // Display deployment history
  console.log('\n\n🚀 My Token Deployments:');
  const deployments = await client.listDeployments();
  
  if (deployments.length === 0) {
    console.log('   No deployments yet.');
    console.log('   Use the deployment example to create your first token!');
  } else {
    deployments.forEach((deployment, index) => {
      console.log(`\n${index + 1}. ${deployment.tokenName} (${deployment.tokenSymbol})`);
      console.log(`   Address: ${deployment.tokenAddress}`);
      console.log(`   Configuration: ${deployment.configName}`);
      console.log(`   Network: ${deployment.network}`);
      console.log(`   Deployed: ${new Date(deployment.deployedAt).toLocaleString()}`);
      console.log(`   Tx: ${deployment.transactionHash}`);
    });
  }

  // Filter by network
  console.log('\n\n🌐 Deployments on dev network:');
  const devDeployments = await client.getDeploymentsByNetwork('dev');
  console.log(`   Total: ${devDeployments.length} deployment(s)`);

  console.log('\n💡 Tip: Run the deployment example (02-deploy-token.ts) to create tokens!');
}

// Run the example
main()
  .then(() => {
    console.log('\n✅ Example completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
