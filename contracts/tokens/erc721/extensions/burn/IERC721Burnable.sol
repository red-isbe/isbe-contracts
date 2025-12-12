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

/**
 * @title IERC721Burnable
 * @notice Interface for ERC721 tokens that support token burning.
 *         Allows users or approved accounts to destroy NFTs, reducing the total supply.
 * @dev This interface defines two methods:
 *      - `burn`: Burns a specific token owned by the caller.
 *      - `burnFrom`: Burns a specific token from another account, if the caller is approved or operator.
 *      Implementing contracts are expected to handle the necessary checks and emit the `Transfer` event
 *      with the recipient set to the zero address to reflect the burn.
 */
interface IERC721Burnable {
    /**
     * @notice Burns a specific token owned by the caller.
     * @dev Destroys the `tokenId` token, reducing the total supply.
     *      The caller must own the token or be an approved operator.
     *      Implementations should emit a `Transfer` event to the zero address.
     * @param tokenId The identifier of the token to burn.
     */
    function burn(uint256 tokenId) external;

    /**
     * @notice Burns a specific token from another account, if the caller is approved or operator.
     * @dev Destroys the `tokenId` token owned by `owner`, reducing the total supply.
     *      The caller must be approved or operator for the token.
     *      Implementations should emit a `Transfer` event to the zero address.
     * @param owner The address of the token owner.
     * @param tokenId The identifier of the token to burn.
     */
    function burnFrom(address owner, uint256 tokenId) external;
}
