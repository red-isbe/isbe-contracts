// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {IERC721Royalty} from './IERC721Royalty.sol';
import {_ROYALTY_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC721Royalty
 * @notice Implements EIP-2981 royalty mechanism for ERC721 tokens.
 * @dev Inherits from IERC721Royalty and ERC721RoyaltyInternal.
 */
abstract contract ERC721Royalty is IERC721Royalty, ERC721InternalCommon {
    /**
     * @notice Sets the default royalty information.
     * @dev Only callable by authorized roles (add access control in production).
     * @param receiver Address to receive royalties.
     * @param feeNumerator Royalty fraction.
     */
    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(_ROYALTY_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @notice Removes the default royalty information.
     * @dev Only callable by authorized roles (add access control in production).
     */
    function deleteDefaultRoyalty() external onlyRole(_ROYALTY_ROLE) {
        _deleteDefaultRoyalty();
    }

    /**
     * @notice Sets royalty information for a specific token.
     * @dev Only callable by authorized roles (add access control in production).
     * @param tokenId Token id.
     * @param receiver Address to receive royalties.
     * @param feeNumerator Royalty fraction.
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(_ROYALTY_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @notice Removes royalty information for a specific token.
     * @dev Only callable by authorized roles (add access control in production).
     * @param tokenId Token id.
     */
    function resetTokenRoyalty(
        uint256 tokenId
    ) external onlyRole(_ROYALTY_ROLE) {
        _resetTokenRoyalty(tokenId);
    }

    /**
     * @notice Sets the royalty fee denominator.
     * @dev Only callable by accounts with the ROYALTY_ROLE.
     * @param newDenominator The new denominator value (must be > 0).
     */
    function setFeeDenominator(
        uint96 newDenominator
    ) external onlyRole(_ROYALTY_ROLE) {
        _setFeeDenominator(newDenominator);
    }

    /**
     * @notice Returns royalty information for a given token and sale price.
     * @dev Implements EIP-2981. Returns receiver and royalty amount for the sale.
     * @param tokenId The identifier of the NFT being sold.
     * @param salePrice The sale price of the NFT.
     * @return receiver The address to receive the royalty payment.
     * @return royaltyAmount The royalty payment amount for the sale price.
     */
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        (receiver, royaltyAmount) = _royaltyInfo(tokenId, salePrice);
    }

    /**
     * @notice Returns the royalty fee denominator (default 10000).
     * @dev Exposes the denominator used for royalty calculations.
     * @return denominator The denominator value.
     */
    function feeDenominator() external view returns (uint96 denominator) {
        denominator = _feeDenominator();
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC721Royalty).interfaceId;
    }
}
