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

string constant _AUTHENTICATION_RELATIONSHIP = 'authentication';
string constant _ASSERTION_RELATIONSHIP = 'assertionMethod';
string constant _KEY_AGREEMENT_RELATIONSHIP = 'keyAgreement';
string constant _CAPABILITY_INVOCATION_RELATIONSHIP = 'capabilityInvocation';
string constant _CAPABILITY_DELEGATION_RELATIONSHIP = 'capabilityDelegation';
uint256 constant _MAX_CONTROLLERS = 10;

// keccak256('KeyOwnershipProof(bytes32 did,bytes32 vMethodId,bytes publicKey)')
// solhint-disable-next-line max-line-length
bytes32 constant _KEY_OWNERSHIP_PROOF_TYPEHASH = 0x00626fe3a73aed3e3139e058917974065f2db29bca7a510d6b9ecd5b089812dd;
