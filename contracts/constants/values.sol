// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;
// solhint-disable max-line-length

//keccak256(
//    'StampWithSignature(bytes32 originalHash,bytes32 tsaHash,bytes32 externalReferenceId,'
//    'address sender,uint256 deadline,uint256 nonce)'
//);
bytes32 constant _STAMP_TSR_TYPEHASH = 0xec3fc8db67fe8ccbe139653ad15c1a6ccc8a18666a77944779e69cc8f13dd231;

// keccak256(
//      'TransferWithSignature(address to,uint256 amount,address sender,uint256 deadline,uint256 nonce)'
// )
bytes32 constant _ERC203643_TRANSFER_TYPEHASH = 0xf2dac9ff2837b49b81c130e144160b34c76de8324ece7ee6982f0f3af4d8cccf;

// keccak256(
//      'TransferFromWithSignature(address from,address to,uint256 amount,address sender,uint256 deadline,uint256 nonce)'
// )
bytes32 constant _ERC203643_TRANSFER_FROM_TYPEHASH = 0x848ade827470b991b0f62e2b1b13153f4c0771d5db947de2fee03b15014b0b01;

// keccak256(
//      'MintWithSignature(address to,uint256 amount,address sender,uint256 deadline,uint256 nonce)'
// )
bytes32 constant _ERC203543_MINT_TYPEHASH = 0x08ee62ae9727c347a5b4e3f4ba566b4b6902a181927b289e63f5fd2df83060fa;

// keccak256(
//      'BurnWithSignature(address account,uint256 amount,uint256 deadline,uint256 nonce)'
// )
bytes32 constant _ERC20_BURN_TYPEHASH = 0xca6632130d1fb2a3965afa2be9baecb494b75e2d6f881601daa200dbef807d60;

// keccak256(
//      'BurnFromWithSignature(address sender,address account,uint256 amount,uint256 deadline,uint256 nonce)'
// )
bytes32 constant _ERC20_BURN_FROM_TYPEHASH = 0x288d8663467de3b5129e89b68d6afd4913b3084930be40f280e2e7fa4f4d2e2a;

//keccak256(
//    'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
//);
bytes32 constant _DOMAIN_TYPE_HASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
string constant _SALT = '\x19\x01';

// keccak256('0x15BE')
bytes32 constant _CONTRACT_NAME_ISBE = 0x8acf0f81a6ff0a1ee0a0311485e6d33aa405339e4a9a3dce9a09ad4bb3ea42b1;
// keccak256('1') - reuse same version
bytes32 constant _CONTRACT_VERSION_ISBE = 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6;

// keccak256('ERC203643')
bytes32 constant _CONTRACT_NAME_ERC203643 = 0xda02ff69611b97bad26647c4e0cc317b8554996359d072688dda247b4993f64c;
// keccak256('1') - reuse same version
bytes32 constant _CONTRACT_VERSION_ERC203643 = 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6;

// Compliance feature flags for mappings in ERC3643ComplianceStorage
bytes32 constant _FLAG_MAX_BALANCE = 0x0f75e3deba2182a18fd89dc0501b9db2a644d5ec6b4d47b33f9a5d1d10e7e52e;
bytes32 constant _FLAG_DAILY_MONTH = 0x0f47955f9e52e4974cb889d851d8d56240a3a5d58d129b0bb6d4f6038802036b;
// solhint-enable max-line-length
