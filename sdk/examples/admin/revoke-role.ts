/**
 * Example: Revoke Role
 * 
 * This example shows how to use RoleManager to revoke roles from accounts
 * on ISBE contracts.
 * 
 * Usage:
 *   npx ts-node sdk/examples/admin/revoke-role.ts <contract-address> <role-name> <account-address>
 * 
 * Example:
 *   npx ts-node sdk/examples/admin/revoke-role.ts 0x123... MINTER_ROLE 0x456...
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { RoleManager, ISBE_ROLES, type RoleName } from '../../src/admin/RoleManager';

// Load environment variables
dotenv.config();

async function main() {
  const args = process.argv.slice(2);

  // Handle --list-roles flag
  if (args.includes('--list-roles') || args.includes('-l')) {
    const tempManager = new RoleManager(
      ethers.ZeroAddress, 
      new ethers.JsonRpcProvider()
    );
    tempManager.listKnownRoles();
    return;
  }

  // Validate arguments
  if (args.length < 3) {
    console.error('❌ Usage: npx ts-node revoke-role.ts <contract> <role-name> <account>');
    console.error('');
    console.error('Examples:');
    console.error('  npx ts-node revoke-role.ts 0x123... MINTER_ROLE 0x456...');
    console.error('  npx ts-node revoke-role.ts 0x123... 0xd8e8... 0x456... (using role bytes)');
    console.error('');
    console.error('List available roles:');
    console.error('  npx ts-node revoke-role.ts --list-roles');
    process.exit(1);
  }

  const [contractAddress, roleInput, accountAddress] = args;

  // Setup provider and signer
  const rpcUrl = process.env.RPC_URL || 'https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/';
  const privateKey = process.env.ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('ACCOUNT_PRIVATE_KEY not found in environment');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 ISBE ROLE MANAGER - REVOKE ROLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📍 Contract: ${contractAddress}`);
  console.log(`🌐 Network: ${(await provider.getNetwork()).name}`);
  console.log(`⛓️  Chain ID: ${(await provider.getNetwork()).chainId}`);
  console.log(`👤 Signer: ${await signer.getAddress()}\n`);

  // Create RoleManager instance
  const roleManager = new RoleManager(contractAddress, signer);

  // Check if role input is a role name or bytes32
  const isRoleName = !roleInput.startsWith('0x') && roleInput in ISBE_ROLES;
  const roleToRevoke = isRoleName ? roleInput as RoleName : roleInput;

  // Display role information before revoking
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ROLE INFORMATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const roleInfo = await roleManager.getRoleInfo(roleToRevoke, accountAddress);
  console.log(`\nRole: ${roleInfo.roleName}`);
  console.log(`Bytes32: ${roleInfo.role}`);
  console.log(`Account: ${roleInfo.account}`);
  console.log(`Has Role: ${roleInfo.hasRole ? '✅' : '❌'}`);
  console.log(`Admin Role: ${roleInfo.adminName} (${roleInfo.admin})`);

  // Revoke the role
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 REVOKING ROLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await roleManager.revokeRole(roleToRevoke, accountAddress);

  // Display result
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RESULT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (result.success) {
    console.log('✅ Success!');
    if (result.txHash) {
      console.log(`   Transaction: ${result.txHash}`);
    }
    if (result.error) {
      console.log(`   Note: ${result.error}`);
    }
  } else {
    console.log('❌ Failed!');
    console.log(`   Error: ${result.error}`);
    if (result.decodedError) {
      console.log(`   Decoded: ${result.decodedError}`);
    }
  }

  // Verify role was revoked
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const verifyInfo = await roleManager.getRoleInfo(roleToRevoke, accountAddress);
  console.log(`Role: ${verifyInfo.roleName}`);
  console.log(`Account: ${verifyInfo.account}`);
  console.log(`Has Role: ${verifyInfo.hasRole ? '✅ YES' : '❌ NO'}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
