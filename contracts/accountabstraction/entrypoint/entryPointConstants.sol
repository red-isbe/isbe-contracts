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
-------------------------------------------------------------- */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Constant gas overhead reserved for internal execution
// Used for safety margin calculations during validation and execution
uint256 constant INNER_GAS_OVERHEAD = 10000;

// Revert code used when internal call runs out of gas
// Used as a sentinel value to identify gas exhaustion
bytes32 constant INNER_OUT_OF_GAS = hex'deaddead';

// Revert code when prefund is insufficient
// Indicates the prefunded gas amount was below required minimum
bytes32 constant INNER_REVERT_LOW_PREFUND = hex'deadaa51';

// Maximum revert reason length to record
// Truncates long revert strings to preserve gas efficiency
uint256 constant REVERT_REASON_MAX_LEN = 2048;

uint256 constant ADDRESS_LENGTH = 20;

// EIP-712 domain name
// Used for structur signature validation
string constant DOMAIN_NAME = 'ERC4337';

// EIP-712 domain version
// Ensures typed data hash consistency across upgrades
string constant DOMAIN_VERSION = '1';

// keccak256('AA98 invalid paymaster')
bytes32 constant INVALID_PAYMASTER = 0xf9536df38dadd0adc0dd82ff451fa98fdb25dd85d5d1444e7831058b8468ec43; //AA98

// keccak256('AA99 initCode too small')
bytes32 constant INIT_CODE_TOO_SMALL = 0x28e973e4f59123b2e26282e4ce8ce43dd0fffb47025ffcde1e8f727ff051ea37; //AA99

// keccak256('AA13 initCode failed or OOG')
bytes32 constant INIT_CODE_FAILED_OR_OOG = 0xa46d515f685002bbb631614d07729b129ca01335d4ee63cf10853491e47dee73; // AA13

// keccak256('AA14 initCode must return sender')
bytes32 constant INIT_CODE_MUST_RETURN_SENDER = 0xcf8e5f91822a9ca4de44f9559ff5db3083e7cb35e25710632c57dc900da04602; //AA14

// keccak256('AA15 initCode must create sender')
bytes32 constant INIT_CODE_MUST_CREATE_SENDER = 0xbb1e067ee25aabe05bbdddb7ea9a4490fa96ed7d10c6207acd0a3c723a9b7ed6; //AA15

// keccak256('AA10 sender already constructed')
bytes32 constant SENDER_ALREADY_CONSTRUCTED = 0x267485e0b239ff7726cfbcfb111a14e388e8253ef89a57c2a12abc410bbc1a79; // AA10

// keccak256('AA20 account not deployed')
bytes32 constant ACCOUNT_NOT_DEPLOYED = 0x71b8c59e134d62690a752e786c07dbe8b7f35be51e386ddf501ff1ee93b9f00e; //AA20

// keccak256('AA22 expired or not due')
bytes32 constant SIGNATURE_EXPIRED_OR_NOT_DUE = 0x4f6af422606d6fab6224761f4f503b9674de8994d20a0052616d3524b670e766; //AA22

// keccak256('AA23 reverted')
bytes32 constant VALIDATION_REVERTED = 0xf272bf03d6e7cfb67a72dd0c4aee94925483c9b766e02beaec86cf4f0a3b9477; //AA23

// keccak256('AA24 signature error')
bytes32 constant SIGNATURE_ERROR = 0x230fad9992163f7c7bca82563472469d2ae8f1696105d00fd8b1abf9e366de4e; //AA24

// keccak256('AA25 invalid account nonce)
bytes32 constant INVALID_ACCOUNT_NONCE = 0x1a6d2773a48550bbfcfd396dd79645bef61ab18efc53f13933af43bfa63cc5b5; //AA25

// keccak256('AA26 over verificationGasLimit')
bytes32 constant OVER_VERIFICATION_GAS_LIMIT = 0x0959e90f1dbec1bb0766cfc7e4a6f91da34d207dfa787b59651acf3926686974; //AA26

// keccak256('AA31 paymaster deposit too low')
bytes32 constant PAYMASTER_DEPOSIT_TOO_LOW = 0x423a165b7dbbda2ae3873c5d3fae3c0ad56dda63b0eb4d372683317213e4df0f; //AA31

// keccak256('AA93 invalid paymasterAndData')
bytes32 constant INVALID_PAYMASTER_AND_DATA = 0xbed5bf2586bcf71963468f5a6e4def651dfab48dcb520989dbad3d1cd3cd8bdd; //AA93

// keccak256('AA94 gas values overflow')
bytes32 constant GAS_VALUES_OVERFLOW = 0x2454d602dd1245dd701375973b2bac347a9e27dc7542cb5ffbdc114cb2232f69; //AA94

// keccak256('AA95 out of gas')
bytes32 constant OUT_OF_GAS = 0xeb8aae105b33b8e3029845f6a1359760a9480648cd982f4e1c37f01a5ceaf980; //AA95
