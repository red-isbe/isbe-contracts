// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ReentrancyGuard} from '../../security/ReentrancyGuard.sol';

/// @title ReentrancyGuardTestWrapper
/// @notice Implements ReentrancyGuard (only for test)
/// @dev Inherits from ReentrancyGuard, simulates reentrant calls
contract ReentrancyGuardTestWrapper is ReentrancyGuard {
    bytes32 public usedKey;
    event ProtectedCalled(bytes32 key);

    function callProtected(bytes32 key) public nonReentrant(key) {
        usedKey = key;
        emit ProtectedCalled(key);
    }

    function forceReentrantFail(bytes32 key) public nonReentrant(key) {
        this.callProtected(key);
    }
}
