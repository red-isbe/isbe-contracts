// SPDX-License-Identifier: UNLICENSED
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
