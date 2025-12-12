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

/// @title Interface Hash Timestamp
/// @notice Interface for a contract that timestamps hashes
interface IHashTimestamp {
    /// @notice Emitted when a hash is timestamped
    /// @param hash The hash that was timestamped
    /// @param sender The address that submitted the hash to timestamp
    /// @param timestamp The block timestamp when the hash was recorded
    event HashTimestamped(
        bytes32 indexed hash,
        address indexed sender,
        uint256 timestamp
    );

    error HashAlreadyExists(bytes32 hash);

    /// @notice Timestamps a given hash
    /// @param _hash The hash to be timestamped
    function timestampHash(bytes32 _hash) external;

    /// @notice Checks whether a hash has been timestamped
    /// @param _hash The hash to check
    /// @return exists_ True if the hash has been recorded, false in other case
    function exists(bytes32 _hash) external view returns (bool exists_);

    /// @notice Returns the timestamp when a hash was recorded
    /// @param _hash The hash to query
    /// @return timestamp_ The timestamp when the hash was recorded
    function getTimestamp(
        bytes32 _hash
    ) external view returns (uint256 timestamp_);
}
