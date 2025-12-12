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

/// @title IERC721Controller
/// @notice Interface for administrative control over ERC-721 tokens, allowing forced transfers and burns
/// @dev Intended for use in regulated environments or asset-backed NFTs where such functionality is required
interface IERC721Controller {
    /// @notice Emitted when a token is forcefully transferred from one account to another
    /// @param operator The address performing the forced transfer
    /// @param from The address the token is taken from
    /// @param to The address the token is sent to
    /// @param tokenId The identifier of the token transferred
    event ForceTransfer(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    /// @notice Emitted when a token is forcefully burned from an account
    /// @param operator The address performing the forced burn
    /// @param from The address the token is burned from
    /// @param tokenId The identifier of the token burned
    event ForceBurn(
        address indexed operator,
        address indexed from,
        uint256 tokenId
    );

    /// @notice Error thrown when attempting to force burn a token not owned by the specified address
    error ForceBurnNotTokenOwner();

    /// @notice Transfers a token from one account to another without requiring approval
    /// @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract)
    /// @param from The address to transfer the token from
    /// @param to The address to transfer the token to
    /// @param tokenId The identifier of the token to transfer
    function forceTransfer(address from, address to, uint256 tokenId) external;

    /// @notice Burns a token from an account without requiring approval
    /// @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract)
    /// @param from The address to burn the token from
    /// @param tokenId The identifier of the token to burn
    function forceBurn(address from, uint256 tokenId) external;
}
