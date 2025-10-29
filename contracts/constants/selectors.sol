// SPDX-License-Identifier: UNLICENSED
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
