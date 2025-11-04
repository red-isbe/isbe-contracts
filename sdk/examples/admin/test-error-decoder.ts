/**
 * Test Error Decoder with RoleManager
 * 
 * Este script prueba específicamente el error-decoder intentando 
 * operaciones que fallarán (sin permisos de admin)
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { RoleManager } from '../../src/admin/RoleManager';

dotenv.config();

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 TESTING ERROR DECODER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const TOKEN_ADDRESS = '0x2D9351F72a78b0D7eec8ee0C2e55E34C7426429d';
  const rpcUrl = process.env.RPC_URL || 'https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/';
  const privateKey = process.env.ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('ACCOUNT_PRIVATE_KEY not found in environment');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const signerAddress = await signer.getAddress();

  console.log(`📍 Token: ${TOKEN_ADDRESS}`);
  console.log(`👤 Admin Account: ${signerAddress}\n`);

  // Create a wallet WITHOUT admin permissions
  const unauthorizedWallet = ethers.Wallet.createRandom().connect(provider);
  const unauthorizedAddress = unauthorizedWallet.address;
  
  console.log(`❌ Unauthorized Account: ${unauthorizedAddress}`);
  console.log(`   (This wallet has NO admin role)\n`);

  // Create RoleManager with UNAUTHORIZED wallet
  const unauthorizedRoleManager = new RoleManager(TOKEN_ADDRESS, unauthorizedWallet);

  // Test 1: Try to grant role WITHOUT permissions (should fail with decoded error)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST: Grant role without admin permissions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const testAccount = ethers.Wallet.createRandom().address;
  console.log(`Attempting to grant MINTER_ROLE to: ${testAccount}`);
  console.log(`Using unauthorized account: ${unauthorizedAddress}\n`);

  const result = await unauthorizedRoleManager.grantRole('MINTER_ROLE', testAccount);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RESULT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!result.success) {
    console.log('❌ Transaction failed (as expected!)');
    console.log(`\n📄 Raw Error:\n   ${result.error}\n`);
    
    if (result.decodedError) {
      console.log(`🔍 Decoded Error:\n   ${result.decodedError}`);
      console.log('\n✅ Error decoder is working correctly!');
    } else {
      console.log('⚠️  No decoded error available');
    }
  } else {
    console.log('⚠️  Unexpected: Transaction succeeded (should have failed)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
