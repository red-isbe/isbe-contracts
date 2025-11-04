/**
 * Example: Error Decoder Usage
 * 
 * This example demonstrates how to use the error decoder utility
 * to decode and understand smart contract errors.
 */

import { decodeError, decodeAndFormat, getUserFriendlyError, getErrorSelector } from '../src';

async function main() {
  console.log('=== ISBE SDK - Error Decoder Example ===\n');

  // Example 1: AccountHasNoRole error (the one we encountered before)
  console.log('1️  Example: AccountHasNoRole Error\n');
  
  const errorData1 = '0xa1180aad00000000000000000000000086df4b738d592c31f4a9a657d6c8d6d05dc1d462d8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace';
  
  const decoded1 = decodeError(errorData1);
  console.log(`   Selector: ${decoded1.selector}`);
  console.log(`   Signature: ${decoded1.signature}`);
  console.log(`   Formatted: ${decodeAndFormat(errorData1)}`);
  console.log(`   User-Friendly: ${getUserFriendlyError(errorData1)}\n`);

  // Example 2: Get selector for a known error
  console.log('2️⃣  Get Error Selector\n');
  
  const selector = getErrorSelector('CapExceeded(uint256,uint256)');
  console.log(`   CapExceeded selector: ${selector}\n`);

  // Example 3: Unknown error
  console.log('3️⃣  Unknown Error\n');
  
  const unknownError = '0x12345678';
  const decoded3 = decodeError(unknownError);
  console.log(`   Selector: ${decoded3.selector}`);
  console.log(`   Signature: ${decoded3.signature || 'Unknown'}`);
  console.log(`   User-Friendly: ${getUserFriendlyError(unknownError)}\n`);

  // Example 4: How to use in a try-catch
  console.log('4️⃣  Usage in Try-Catch Block\n');
  
  console.log('   Example code:');
  console.log(`
   try {
     await token.mint(address, amount);
   } catch (error: any) {
     const decoded = decodeEthersError(error);
     if (decoded) {
       console.error('Error:', getUserFriendlyError(decoded.data));
     } else {
       console.error('Unknown error:', error.message);
     }
   }
  `);

  // Example 5: All known errors
  console.log('5️⃣  All Known Error Signatures\n');
  
  const knownErrors = [
    'AccountHasNoRole(address,bytes32)',
    'NotInitialized(address,bytes32)',
    'CapExceeded(uint256,uint256)',
    'ZeroAddress()',
    'Paused()',
    'AccessDenied(address)',
    'InvalidConfiguration(bytes32)',
  ];

  knownErrors.forEach(sig => {
    const sel = getErrorSelector(sig);
    console.log(`   ${sel} - ${sig}`);
  });
}

main()
  .then(() => {
    console.log('\n✅ Example completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
