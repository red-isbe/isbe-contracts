// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {IERC721Controller} from './IERC721Controller.sol';
import {_CONTROLLER_ROLE} from '../../../../constants/roles.sol';

/// @title ERC721Controller
/// @notice Implements force mechanism for ERC721 tokens (force transfer and burn)
/// @dev Inherits from IERC721Controller and ERC721Internal
contract ERC721Controller is IERC721Controller, ERC721InternalCommon {
    /**
     * @notice Transfers a token from one account to another without requiring approval.
     * @dev Only callable by accounts with the controller role.
     *      Emits a ForceTransfer event.
     */
    function forceTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        _transfer(from, to, tokenId);
        emit ForceTransfer(_msgSender(), from, to, tokenId);
    }

    /**
     * @notice Burns a token from an account without requiring approval.
     * @dev Only callable by accounts with the controller role.
     *      Emits a ForceBurn event.
     */
    function forceBurn(
        address from,
        uint256 tokenId
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        require(_ownerOf(tokenId) == from, ForceBurnNotTokenOwner());
        _burn(tokenId);
        emit ForceBurn(_msgSender(), from, tokenId);
    }
}
