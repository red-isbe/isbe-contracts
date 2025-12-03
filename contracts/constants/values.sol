// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//keccak256(
//    'stampWithSignature(bytes32 originalHash,bytes32 tsaHash,bytes32 externalReferenceId,'
//    'address sender,uint256 expirationTimestamp,uint256 nonce)'
//);
bytes32 constant _STAMP_TSR_TYPEHASH = 0x5568a3b11632018ad8bdf7c1affa1403b813581482afea19362d11975f1158f3;

//keccak256(
//    'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
//);
bytes32 constant _DOMAIN_TYPE_HASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
string constant _SALT = '\x19\x01';

// keccak256('TimeStampingRegistry')
// solhint-disable-next-line max-line-length
bytes32 constant _CONTRACT_NAME_TIME_STAMPING_REGISTRY = 0x9904ac63bf17aeae68be5b8d50aca4f9523e283be9641f54a32d7827e6936e1e;
// keccak256('1.0.0') - reuse same version
// solhint-disable-next-line max-line-length
bytes32 constant _CONTRACT_VERSION_TIME_STAMPING_REGISTRY = 0x06c015bd22b4c69690933c1058878ebdfef31f9aaae40bbe86d8a09fe1b2972c;

// Compliance feature flags for mappings in ERC3643ComplianceStorage
bytes32 constant _FLAG_MAX_BALANCE = 0x0f75e3deba2182a18fd89dc0501b9db2a644d5ec6b4d47b33f9a5d1d10e7e52e;
bytes32 constant _FLAG_DAILY_MONTH = 0x0f47955f9e52e4974cb889d851d8d56240a3a5d58d129b0bb6d4f6038802036b;

// EIP-712 TypeHashes for ERC712
// keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
bytes32 constant _ERC712_TYPE_HASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;

// keccak256('Transfer(address from,address to,uint256 value,uint256 nonce,uint256 deadline)')
bytes32 constant _ERC712_TRANSFER_TYPEHASH = 0xeadc949c56da225ec46b6a046692f3e0896dd71c42a65e1d1998818a944086b3;

// keccak256('Mint(address to,uint256 value,uint256 nonce,uint256 deadline)')
bytes32 constant _ERC712_MINT_TYPEHASH = 0x799bf62ebbe703fbbdc2da0b2a42746153347d6396ae5c29fdaa1224fc32abda;

// keccak256('Burn(address from,uint256 value,uint256 nonce,uint256 deadline)')
bytes32 constant _ERC712_BURN_TYPEHASH = 0x897f667f5409d7c551cd2e1f25be8df1820aed12a4fb1d24d530a59ba5205fb6;

// EIP-5267: Bitmap indicating which fields are used in eip712Domain()
// 0x0f = 0b00001111 = name | version | chainId | verifyingContract
bytes1 constant _ERC712_FIELDS_BITMAP = 0x0f;
