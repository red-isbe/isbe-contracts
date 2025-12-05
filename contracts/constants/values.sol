// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
// solhint-disable max-line-length

//keccak256(
//    'stampWithSignature(bytes32 originalHash,bytes32 tsaHash,bytes32 externalReferenceId,'
//    'address sender,uint256 expirationTimestamp,uint256 nonce)'
//);
bytes32 constant _STAMP_TSR_TYPEHASH = 0x5568a3b11632018ad8bdf7c1affa1403b813581482afea19362d11975f1158f3;

// keccak256(
//      'TransferWithSignature(address to,uint256 amount,address sender,uint256 expirationTimestamp,uint256 nonce)'
// )
bytes32 constant _ERC203643_TRANSFER_TYPEHASH = 0xf656fca2f2d4da7bb53d2153fe0dbd625d5e9cd8e01d30bbff7acb616cfdac4b;

// keccak256(
//      'TransferFromWithSignature(address from,address to,uint256 amount,address sender,uint256 expirationTimestamp,uint256 nonce)'
// )
bytes32 constant _ERC203643_TRANSFER_FROM_TYPEHASH = 0xe08ef31ba363a647fb8145e2f2db7db706821d7b1ca032ec36d9eccdc0b88c1f;

// keccak256(
//      'MintWithSignature(address to,uint256 amount,address sender,uint256 expirationTimestamp,uint256 nonce)'
// )
bytes32 constant _ERC203543_MINT_TYPEHASH = 0xadbd6f7fcae05e1d9fec93d0c5db4759cbb8b2c938e05782af452ceb985441c5;

// keccak256(
//      'BurnWithSignature(address account,uint256 amount,uint256 expirationTimestamp,uint256 nonce)'
// )
bytes32 constant _ERC20_BURN_TYPEHASH = 0xef684104905e7a755205f81cd0630aef6efe0ca59b0cacf7a9859961e706b306;

// keccak256(
//      'BurnFromWithSignature(address sender,address account,uint256 amount,uint256 expirationTimestamp,uint256 nonce)'
// )
bytes32 constant _ERC20_BURN_FROM_TYPEHASH = 0xa5442022a3f156b146f90bc10477f3519b7bdc018f0ef79f7075ca308e48d085;

//keccak256(
//    'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
//);
bytes32 constant _DOMAIN_TYPE_HASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
string constant _SALT = '\x19\x01';

// keccak256('TimeStampingRegistry')
bytes32 constant _CONTRACT_NAME_TIME_STAMPING_REGISTRY = 0x9904ac63bf17aeae68be5b8d50aca4f9523e283be9641f54a32d7827e6936e1e;
// keccak256('1.0.0') - reuse same version
bytes32 constant _CONTRACT_VERSION_TIME_STAMPING_REGISTRY = 0x06c015bd22b4c69690933c1058878ebdfef31f9aaae40bbe86d8a09fe1b2972c;

// keccak256('ERC203643')
bytes32 constant _CONTRACT_NAME_ERC203643 = 0xda02ff69611b97bad26647c4e0cc317b8554996359d072688dda247b4993f64c;
// keccak256('1.0.0') - reuse same version
bytes32 constant _CONTRACT_VERSION_ERC203643 = 0x06c015bd22b4c69690933c1058878ebdfef31f9aaae40bbe86d8a09fe1b2972c;

// Compliance feature flags for mappings in ERC3643ComplianceStorage
bytes32 constant _FLAG_MAX_BALANCE = 0x0f75e3deba2182a18fd89dc0501b9db2a644d5ec6b4d47b33f9a5d1d10e7e52e;
bytes32 constant _FLAG_DAILY_MONTH = 0x0f47955f9e52e4974cb889d851d8d56240a3a5d58d129b0bb6d4f6038802036b;
// solhint-enable max-line-length
