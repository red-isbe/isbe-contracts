// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';
import {IHashTimestamp} from './IHashTimestamp.sol';
import {HashTimestampInternal} from './HashTimestampInternal.sol';

/// @title HashTimestamp
/// @notice Implements timestamp for hashes
/// @dev Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions
contract HashTimestamp is IHashTimestamp, HashTimestampInternal {
    function exists(bytes32 hash) external view override returns (bool) {
        return _exists(hash);
    }

    function getTimestamp(
        bytes32 hash
    ) external view override returns (uint256) {
        return _getTimestamp(hash);
    }

    function timestampHash(
        bytes32 hash
    )
        public
        virtual
        override
        onlyNonExistentHash(hash)
        whenNotPaused
        onlyRole(_HASH_TIMESTAMP_ROLE)
    {
        _timestampHash(hash);
    }
}
