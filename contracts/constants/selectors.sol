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

// bytes4(keccak256("safeTransferFrom(address,address,uint256)"))
bytes4 constant _SAFE_TRANSFER_FROM_SELECTOR_1 = 0x42842e0e;

// bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"))
bytes4 constant _SAFE_TRANSFER_FROM_SELECTOR_2 = 0xb88d4fde;

// bytes4(keccak256("checkController(bytes32,address)"))
bytes4 constant _CHECK_CONTROLLER_SELECTOR_1 = 0x39fdc394;

// bytes4(keccak256("checkController(bytes,address)"))
bytes4 constant _CHECK_CONTROLLER_SELECTOR_2 = 0x04cd80b5;
