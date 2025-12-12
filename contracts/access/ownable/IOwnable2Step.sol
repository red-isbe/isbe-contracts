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
