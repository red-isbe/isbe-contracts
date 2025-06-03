// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Two-Step Ownable Interface
/// @notice Interface for contracts using a two-step ownership transfer pattern
interface IOwnable2Step {
    /// @notice Emitted when ownership transfer is initiated
    /// @param operator The current owner initiating the transfer
    /// @param newPendingOwner The address proposed to become the new owner
    event OwnershipTransferStarted(
        address indexed operator,
        address indexed newPendingOwner
    );

    /// @notice Emitted when the pending owner accepts and becomes the new owner
    /// @param operator The account that accepted ownership
    event OwnershipAccepted(address indexed operator);

    /// @notice Reverts when an account that is not the pending owner tries to accept ownership
    /// @param account The account that triggered the error
    error AccountIsNotPendingOwner(address account);

    /// @notice Accepts ownership of the contract
    /// @dev Callable only by the pending owner. Completes the two-step ownership transfer process.
    function acceptOwnership() external;

    /// @notice Returns the address of the pending owner
    /// @return The address that has been proposed to become the new owner
    function pendingOwner() external view returns (address);
}
