// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Ownable Interface
/// @notice External interface for owner access control functionality
interface IOwnable {
    /// @notice Emitted when the owner is changed
    /// @param operator The account transfering the owner
    /// @param newOwner The new owner
    event OwnershipTransferred(
        address indexed operator,
        address indexed newOwner
    );

    /// @notice Emitted when ownership is renounced
    /// @param operator The account that renounced ownership
    event OwnershipRenounced(address indexed operator);

    /// @notice Reverts when a non-owner account attempts an owner-only operation
    /// @param account The account that triggered the error
    error AccountIsNotOwner(address account);

    /// @notice Renounces ownership of the contract
    /// @dev Leaves the contract without an owner. Functions restricted to the owner will be disabled.
    function renounceOwnership() external;

    /// @notice Transfers ownership of the contract to a new account
    /// @param newOwner The address of the new owner
    function transferOwnership(address newOwner) external;

    /// @notice Returns the current owner of the contract
    /// @return The address of the current owner
    function owner() external view returns (address);
}
