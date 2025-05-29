// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _HASH_TIMESTAMP_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {IHashTimestamp} from './IHashTimestamp.sol';
import {Common} from '../core/Common.sol';

/// @title HashTimestampInternal
/// @notice Internal logic for hash timestamp
/// @dev Meant to be used only by contracts extending HashTimestamp
abstract contract HashTimestampInternal is Common {
    /// @notice Struct storing timestamped hashes
    struct HashTimestampStorage {
        mapping(bytes32 => uint256) hashTimestamps;
    }

    /// @notice Modifier to validate that provided hash
    /// @param hash The hash to check
    modifier onlyNonExistentHash(bytes32 hash) {
        _checkHash(hash);
        _;
    }

    function _timestampHash(bytes32 hash) internal virtual {
        uint256 timestamp = _blockTimestamp();
        _hashTimestampStorage().hashTimestamps[hash] = timestamp;
        emit IHashTimestamp.HashTimestamped(hash, msg.sender, timestamp);
    }

    function _exists(bytes32 hash) internal view virtual returns (bool) {
        return _getTimestamp(hash) != 0;
    }

    function _getTimestamp(
        bytes32 hash
    ) internal view virtual returns (uint256) {
        return _hashTimestampStorage().hashTimestamps[hash];
    }

    function _checkHash(bytes32 hash) internal view virtual {
        require(!_exists(hash), IHashTimestamp.HashAlreadyExists(hash));
    }

    /// @notice Returns the storage slot for hash timestamp
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return hashTimestampStorage_ The hash timestamp storage struct
    function _hashTimestampStorage()
        internal
        pure
        returns (HashTimestampStorage storage hashTimestampStorage_)
    {
        bytes32 position = _HASH_TIMESTAMP_STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            hashTimestampStorage_.slot := position
        }
    }
}
