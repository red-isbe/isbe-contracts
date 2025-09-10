// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../ERC721Internal.sol';
import {ERC721CappedInternal} from './cap/ERC721CappedInternal.sol';
import {ERC721SnapshotInternal} from './snapshot/ERC721SnapshotInternal.sol';
import {ERC721EnumerableInternal} from './enumerable/ERC721EnumerableInternal.sol';
import {ERC721RoyaltyInternal} from './royalty/ERC721RoyaltyInternal.sol';

/// @title ERC721InternalCommon
/// @notice This abstract contract puts together all ERC721 internal logic (snapshot, cap, and base logic).
abstract contract ERC721InternalCommon is
    ERC721SnapshotInternal,
    ERC721CappedInternal,
    ERC721EnumerableInternal,
    ERC721RoyaltyInternal
{
    /**
     * @dev Override the _beforeTokenTransfer hook to combine logic from all inherited modules.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    )
        internal
        virtual
        override(
            ERC721Internal,
            ERC721SnapshotInternal,
            ERC721EnumerableInternal
        )
    {
        ERC721SnapshotInternal._beforeTokenTransfer(from, to, tokenId);
        ERC721EnumerableInternal._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Override the _mint function to combine logic from all inherited modules.
     */
    function _mint(
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721CappedInternal, ERC721Internal) {
        ERC721CappedInternal._mint(to, tokenId);
    }

    /**
     * @notice Returns the base URI for token metadata.
     * @dev Optional internal function to build tokenURI.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return '';
    }
}
