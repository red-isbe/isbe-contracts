/**
 * Test RoleManager with error-decoder
 * 
 * Este script prueba el RoleManager del SDK con manejo de errores decodificados
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { RoleManager } from '../../src/admin/RoleManager';

dotenv.config();

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 TESTING ROLE MANAGER WITH ERROR DECODER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Setup
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
  console.log(`🌐 Network: ${(await provider.getNetwork()).name}`);
  console.log(`⛓️  Chain ID: ${(await provider.getNetwork()).chainId}`);
  console.log(`👤 Signer: ${signerAddress}\n`);

  // Create RoleManager
  const roleManager = new RoleManager(TOKEN_ADDRESS, signer);

  // Test 1: List all roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: List all available roles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  roleManager.listKnownRoles();

  // Test 2: Check current roles
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Check current roles for signer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const rolesToCheck = ['DEFAULT_ADMIN_ROLE', 'MINTER_ROLE', 'SNAPSHOT_ROLE'] as const;
  
  for (const roleName of rolesToCheck) {
    const info = await roleManager.getRoleInfo(roleName, signerAddress);
    console.log(`${info.roleName}:`);
    console.log(`  Has Role: ${info.hasRole ? '✅' : '❌'}`);
    console.log(`  Admin: ${info.adminName}\n`);
  }

  // Test 3: Create a test account
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Create test account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testWallet = ethers.Wallet.createRandom();
  const testAddress = testWallet.address;
  console.log(`Test Account: ${testAddress}\n`);

  // Test 4: Grant MINTER_ROLE to test account
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Grant MINTER_ROLE to test account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const grantResult = await roleManager.grantRole('MINTER_ROLE', testAddress);
  
  if (grantResult.success) {
    console.log('✅ MINTER_ROLE granted successfully!');
    if (grantResult.txHash) {
      console.log(`   Transaction: ${grantResult.txHash}`);
    }
  } else {
    console.log('❌ Failed to grant role');
    console.log(`   Error: ${grantResult.error}`);
    if (grantResult.decodedError) {
      console.log(`   🔍 Decoded: ${grantResult.decodedError}`);
    }
  }

  // Test 5: Verify role was granted
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Verify role was granted');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const verifyInfo = await roleManager.getRoleInfo('MINTER_ROLE', testAddress);
  console.log(`Account: ${verifyInfo.account}`);
  console.log(`Role: ${verifyInfo.roleName}`);
  console.log(`Has Role: ${verifyInfo.hasRole ? '✅ YES' : '❌ NO'}`);

  // Test 6: Try to grant role again (should detect already has role)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Try to grant role again (should detect duplicate)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const duplicateResult = await roleManager.grantRole('MINTER_ROLE', testAddress);
  console.log(`Result: ${duplicateResult.error || 'Success'}`);

  // Test 7: Revoke the role
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Revoke MINTER_ROLE from test account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const revokeResult = await roleManager.revokeRole('MINTER_ROLE', testAddress);
  
  if (revokeResult.success) {
    console.log('✅ MINTER_ROLE revoked successfully!');
    if (revokeResult.txHash) {
      console.log(`   Transaction: ${revokeResult.txHash}`);
    }
  } else {
    console.log('❌ Failed to revoke role');
    console.log(`   Error: ${revokeResult.error}`);
    if (revokeResult.decodedError) {
      console.log(`   🔍 Decoded: ${revokeResult.decodedError}`);
    }
  }

  // Test 8: Verify role was revoked
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: Verify role was revoked');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const finalInfo = await roleManager.getRoleInfo('MINTER_ROLE', testAddress);
  console.log(`Account: ${finalInfo.account}`);
  console.log(`Role: ${finalInfo.roleName}`);
  console.log(`Has Role: ${finalInfo.hasRole ? '✅ YES' : '❌ NO'}`);

  // Test 9: Try to grant role without permission (this should fail and decode error)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 9: Try to use bytes32 role value directly');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const SNAPSHOT_ROLE_BYTES = '0x0ca5e23bde0d5e6112f10b9752afc92df6901f9218a43771a113f0ee5ab6bd49';
  const bytesResult = await roleManager.grantRole(SNAPSHOT_ROLE_BYTES, testAddress);
  
  if (bytesResult.success) {
    console.log('✅ Role granted using bytes32!');
    if (bytesResult.txHash) {
      console.log(`   Transaction: ${bytesResult.txHash}`);
    }
    
    // Clean up
    await roleManager.revokeRole(SNAPSHOT_ROLE_BYTES, testAddress);
  } else {
    console.log('❌ Failed (this might be expected if no admin role)');
    if (bytesResult.decodedError) {
      console.log(`   🔍 Decoded: ${bytesResult.decodedError}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL TESTS COMPLETED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
