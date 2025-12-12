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

/// @title IERC721Consecutive - ERC721 Consecutive Transfer Extension Interface
/// @dev See https://eips.ethereum.org/EIPS/eip-2309
interface IERC721Consecutive {
    /// @dev This event MUST be emitted when tokens are minted in a consecutive range.
    /// See EIP-2309 for details.
    event ConsecutiveTransfer(
        uint256 indexed fromTokenId,
        uint256 toTokenId,
        address indexed fromAddress,
        address indexed toAddress
    );

    /// @notice Mints a consecutive range of tokens to `to`.
    /// @param to The address to receive the minted tokens.
    /// @param quantity The number of tokens to mint.
    function mintConsecutive(address to, uint256 quantity) external;
}
