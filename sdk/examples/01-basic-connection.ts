/**
 * Example: Basic SDK usage - connecting to the network
 * 
 * ============================================================
 * QUÉ HACE ESTE EJEMPLO:
 * ============================================================
 * 
 * 1. CLIENTE READ-ONLY (Sin signer):
 *    - Conecta al Factory Diamond en la red 'dev'
 *    - Verifica que la conexión funciona correctamente
 *    - Obtiene información del estado de la red (block number, chain ID)
 *    - Lista todas las configuraciones disponibles de tokens
 * 
 * 
 * ============================================================
 * REQUISITOS:
 * ============================================================
 * 
 * - Archivo .env en la raíz del proyecto con:
 *   ACCOUNT_PRIVATE_KEY=tu_clave_privada_aqui
 * 
 * - Red 'dev' corriendo en:
 *   https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/
 * 
 * - Factory Diamond desplegado en:
 *   0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de
 * 
 * ============================================================
 * CÓMO EJECUTAR:
 * ============================================================
 * 
 * npm run example:connection
 * 
 * o directamente:
 * 
 * npx ts-node examples/01-basic-connection.ts
 * 
 * ============================================================
 */

import { ISBEClient } from '../src';

async function main() {
  console.log('=== ISBE SDK - Basic Connection Example ===\n');

  // Read-only client (no signer required)
  console.log('📖 Creating read-only client...');
  const readOnlyClient = ISBEClient.readOnly('dev');
  
  // Verify connection
  const isConnected = await readOnlyClient.verifyConnection();
  console.log(`Connection status: ${isConnected ? '✅' : '❌'}\n`);

  // Get network status
  const status = await readOnlyClient.getNetworkStatus();
  console.log('📊 Network Status:');
  console.log(`  - Block Number: ${status.blockNumber}`);
  console.log(`  - Chain ID: ${status.chainId}`);
  console.log(`  - Factory Address: ${status.factoryAddress}`);
  console.log(`  - Signer: ${status.signerAddress || 'None (read-only)'}\n`);

  // List all available configurations from Factory
  console.log('📋 Available Configurations from Factory:');
  const configs = readOnlyClient.listConfigurations();
  configs.forEach((config, index) => {
    console.log(`\n${index + 1}. ${config.name}`);
    console.log(`   Standard: ${config.standard}`);
    console.log(`   Config ID: ${config.configId}`);
    console.log(`   Features: ${config.features.join(', ')}`);
    console.log(`   Description: ${config.description}`);
  });
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
