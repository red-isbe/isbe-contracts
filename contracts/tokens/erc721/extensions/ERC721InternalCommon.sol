// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../ERC721Internal.sol';

/// @title ERC721InternalCommon
/// @notice This abstract contract puts together all ERC721 internal logic (snapshot, cap, and base logic).
abstract contract ERC721InternalCommon is ERC721Internal {
    /**
     * @dev Override the _beforeTokenTransfer hook to combine logic from all inherited modules.
     */
    // solhint-disable no-empty-blocks
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Internal) {}

    /**
     * @notice Returns the base URI for token metadata.
     * @dev Optional internal function to build tokenURI.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return '';
    }
}
