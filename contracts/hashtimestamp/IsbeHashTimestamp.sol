// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';
import {HashTimestamp} from './HashTimestamp.sol';

/// @title HashTimestamp
/// @notice Implements timestamp for hashes
/// @dev Inherits from HashTimestamp, providing external timestamp hashes functions
contract IsbeHashTimestamp is HashTimestamp {
    function timestampHash(
        bytes32 hash
    ) external override whenNotPaused onlyRole(_HASH_TIMESTAMP_ROLE) {
        _timestampHash(hash);
    }
}
