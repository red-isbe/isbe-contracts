// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ReentrancyGuard} from '../../security/ReentrancyGuard.sol';

/// @title ReentrancyGuardTestWrapper
/// @notice Implements ReentrancyGuard (only for test)
/// @dev Inherits from ReentrancyGuard, simulates reentrant calls
contract ReentrancyGuardTestWrapper is ReentrancyGuard {
    bytes32 public usedKey;
    event ProtectedCalled(bytes32 key);

    function callProtected(bytes32 _key) public nonReentrant(_key) {
        usedKey = _key;
        emit ProtectedCalled(_key);
    }

    function forceReentrantFail(bytes32 _key) public nonReentrant(_key) {
        this.callProtected(_key);
    }
}
