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

import {
    _HASH_TIMESTAMP_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {IHashTimestamp} from './IHashTimestamp.sol';
import {
    DidDocumentDetailedInternal
} from '../identity/didregistry/DidDocumentDetailedInternal.sol';

/// @title HashTimestampInternal
/// @notice Internal logic for hash timestamp
/// @dev Meant to be used only by contracts extending HashTimestamp
abstract contract HashTimestampInternal is DidDocumentDetailedInternal {
    /// @notice Struct storing timestamped hashes
    struct HashTimestampStorage {
        mapping(bytes32 => uint256) hashTimestamps;
    }

    /// @notice Modifier to validate that provided hash
    /// @param _hash The hash to check
    modifier onlyNonExistentHash(bytes32 _hash) {
        _checkHash(_hash);
        _;
    }

    function _timestampHash(bytes32 _hash) internal virtual {
        uint256 timestamp = _blockTimestamp();
        _hashTimestampStorage().hashTimestamps[_hash] = timestamp;
        emit IHashTimestamp.HashTimestamped(_hash, msg.sender, timestamp);
    }

    function _exists(bytes32 _hash) internal view virtual returns (bool) {
        return _getTimestamp(_hash) != 0;
    }

    function _getTimestamp(
        bytes32 _hash
    ) internal view virtual returns (uint256) {
        return _hashTimestampStorage().hashTimestamps[_hash];
    }

    function _checkHash(bytes32 _hash) internal view virtual {
        require(!_exists(_hash), IHashTimestamp.HashAlreadyExists(_hash));
    }

    /// @notice Returns the storage slot for hash timestamp
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The hash timestamp storage struct
    function _hashTimestampStorage()
        internal
        pure
        returns (HashTimestampStorage storage storage_)
    {
        bytes32 position = _HASH_TIMESTAMP_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
