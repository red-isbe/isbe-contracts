// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IHashTimestamp} from './IHashTimestamp.sol';
import {HashTimestampInternal} from './HashTimestampInternal.sol';

/// @title HashTimestamp
/// @notice Implements timestamp for hashes
/// @dev Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions
contract HashTimestamp is IHashTimestamp, HashTimestampInternal {
    function timestampHash(
        bytes32 hash
    ) external override onlyNonExistentHash(hash) {
        _timestampHash(hash);
    }

    function exists(bytes32 hash) external view override returns (bool) {
        return _exists(hash);
    }

    function getTimestamp(
        bytes32 hash
    ) external view override returns (uint256) {
        return _getTimestamp(hash);
    }
}
