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
 * @title IERC721Royalty
 * @notice Interface for ERC721 tokens supporting royalty payments (EIP-2981).
 *         Allows querying royalty information for a given token and sale price.
 * @dev Contracts implementing this interface can signal royalty info for marketplaces and platforms.
 */
interface IERC721Royalty {
    /// @notice Error thrown when the royalty fee numerator exceeds the allowed denominator.
    /// @dev Ensures that the royalty fraction does not surpass the maximum allowed value (e.g., 10000 for 100%).
    error FeeExceedsDenominator();

    /**
     * @notice Returns royalty information for a given token and sale price.
     * @dev Should return the address to receive the royalty and the royalty amount owed for a sale.
     * @param tokenId The identifier of the NFT being sold.
     * @param salePrice The sale price of the NFT.
     * @return receiver The address to receive the royalty payment.
     * @return royaltyAmount The royalty payment amount for the sale price.
     */
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (address receiver, uint256 royaltyAmount);
}
