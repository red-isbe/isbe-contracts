// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721Consecutive} from './IERC721Consecutive.sol';
import {ERC721ConsecutiveInternal} from './ERC721ConsecutiveInternal.sol';
import {_ERC721_CONSECUTIVE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {_MINTER_ROLE} from '../../../../constants/roles.sol';

/// @title ERC721Consecutive
/// @notice Implements consecutive minting for ERC721 tokens (EIP-2309)
/// @dev Inherits from IERC721Consecutive and ERC721ConsecutiveInternal
abstract contract ERC721Consecutive is
    IERC721Consecutive,
    ERC721ConsecutiveInternal
{
    constructor() {
        _disableInitializers(_ERC721_CONSECUTIVE_RESOLVER_KEY);
    }

    /// @notice Mints a consecutive range of tokens to `to`
    /// @dev Only callable by accounts with the minter role
    /// @param to The address to receive the minted tokens
    /// @param quantity The number of tokens to mint
    function mintConsecutive(
        address to,
        uint256 quantity
    ) external override whenNotPaused onlyRole(_MINTER_ROLE) {
        _mintConsecutive(to, quantity);
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
        interfaces_[--interfacesLength] = type(IERC721Consecutive).interfaceId;
    }
}
