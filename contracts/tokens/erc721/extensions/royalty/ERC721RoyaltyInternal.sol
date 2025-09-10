// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../../ERC721Internal.sol';
import {IERC721Royalty} from './IERC721Royalty.sol';
import {_ERC721_ROYALTY_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/**
 * @title ERC721RoyaltyInternal
 * @notice Internal implementation of EIP-2981 royalty logic for ERC721 tokens.
 * @dev Manages royalty info per token and default royalty, for use in diamond/facet architectures.
 */
abstract contract ERC721RoyaltyInternal is ERC721Internal {
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction;
    }

    struct ERC721RoyaltyStorage {
        RoyaltyInfo defaultRoyalty;
        mapping(uint256 => RoyaltyInfo) tokenRoyalty;
        uint96 feeDenominator;
    }

    /**
     * @dev Sets default royalty info.
     * @param receiver Address to receive royalties.
     * @param feeNumerator Royalty fraction (e.g. 1000 for 10%).
     */
    function _setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) internal addressIsNotZero(receiver) {
        require(
            feeNumerator <= _erc721RoyaltyStorage().feeDenominator,
            IERC721Royalty.FeeExceedsDenominator()
        );
        _erc721RoyaltyStorage().defaultRoyalty = RoyaltyInfo(
            receiver,
            feeNumerator
        );
    }

    /**
     * @dev Removes default royalty info.
     */
    function _deleteDefaultRoyalty() internal {
        delete _erc721RoyaltyStorage().defaultRoyalty;
    }

    /**
     * @dev Sets royalty info for a specific token.
     * @param tokenId Token id.
     * @param receiver Address to receive royalties.
     * @param feeNumerator Royalty fraction.
     */
    function _setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) internal addressIsNotZero(receiver) {
        require(
            feeNumerator <= _erc721RoyaltyStorage().feeDenominator,
            IERC721Royalty.FeeExceedsDenominator()
        );
        _erc721RoyaltyStorage().tokenRoyalty[tokenId] = RoyaltyInfo(
            receiver,
            feeNumerator
        );
    }

    /**
     * @dev Removes royalty info for a specific token.
     * @param tokenId Token id.
     */
    function _resetTokenRoyalty(uint256 tokenId) internal {
        delete _erc721RoyaltyStorage().tokenRoyalty[tokenId];
    }

    /**
     * @dev Sets the fee denominator for royalty calculations.
     * @param newDenominator The new denominator value (must be > 0).
     */
    function _setFeeDenominator(
        uint96 newDenominator
    ) internal emptyUint(newDenominator) {
        _erc721RoyaltyStorage().feeDenominator = newDenominator;
    }

    /**
     * @dev Returns royalty info for a token and sale price.
     * @param tokenId Token id.
     * @param salePrice Sale price.
     * @return receiver Royalty receiver.
     * @return royaltyAmount Royalty amount.
     */
    function _royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) internal view returns (address receiver, uint256 royaltyAmount) {
        RoyaltyInfo memory royalty = _erc721RoyaltyStorage().tokenRoyalty[
            tokenId
        ];

        if (royalty.receiver == address(0)) {
            royalty = _erc721RoyaltyStorage().defaultRoyalty;
        }

        receiver = royalty.receiver;
        royaltyAmount =
            (salePrice * royalty.royaltyFraction) /
            _erc721RoyaltyStorage().feeDenominator;
    }

    /**
     * @dev Returns the fee denominator (default 10000).
     */
    function _feeDenominator() internal view returns (uint96) {
        return
            _erc721RoyaltyStorage().feeDenominator == 0
                ? 10000
                : _erc721RoyaltyStorage().feeDenominator;
    }

    function _erc721RoyaltyStorage()
        private
        pure
        returns (ERC721RoyaltyStorage storage s)
    {
        bytes32 position = _ERC721_ROYALTY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            s.slot := position
        }
        // slither-disable-end assembly
    }
}
