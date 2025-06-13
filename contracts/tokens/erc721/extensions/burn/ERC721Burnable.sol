// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {IERC721Burnable} from './IERC721Burnable.sol';

/// @title ERC721Burnable
/// @notice Implements burn mechanism for ERC721 tokens
/// @dev Inherits from IERC721Burnable and ERC721InternalCommon
contract ERC721Burnable is IERC721Burnable, ERC721InternalCommon {
    /**
     * @notice Burns a specific token owned by the caller.
     * @dev The caller must own the token or be an approved operator.
     *      Emits a Transfer event to the zero address.
     * @param tokenId The identifier of the token to burn.
     */
    function burn(uint256 tokenId) external override whenNotPaused {
        address owner = _ownerOf(tokenId);
        if (
            msg.sender != owner &&
            _getApproved(tokenId) != msg.sender &&
            !_isApprovedForAll(owner, msg.sender)
        ) {
            revert IERC721Burnable.NotOwnerNorApproved();
        }
        _burn(tokenId);
    }

    /**
     * @notice Burns a specific token from another account, if the caller is approved or operator.
     * @dev The caller must be approved or operator for the token.
     *      Emits a Transfer event to the zero address.
     * @param owner The address of the token owner.
     * @param tokenId The identifier of the token to burn.
     */
    function burnFrom(
        address owner,
        uint256 tokenId
    ) external override whenNotPaused {
        if (
            msg.sender != owner &&
            _getApproved(tokenId) != msg.sender &&
            !_isApprovedForAll(owner, msg.sender)
        ) {
            revert IERC721Burnable.NotOwnerNorApproved();
        }
        _burn(tokenId);
    }
}
