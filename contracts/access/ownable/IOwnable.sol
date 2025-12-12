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
    /// @param _newOwner The address of the new owner
    function transferOwnership(address _newOwner) external;

    /// @notice Returns the current owner of the contract
    /// @return The address of the current owner
    function owner() external view returns (address);
}
