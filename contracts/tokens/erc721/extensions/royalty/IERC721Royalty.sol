// SPDX-License-Identifier: UNLICENSED
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
