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

import {IERC721Consecutive} from './IERC721Consecutive.sol';
import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {_ERC721_CONSECUTIVE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {_MINTER_ROLE} from '../../../../constants/roles.sol';

/// @title ERC721Consecutive
/// @notice Implements consecutive minting for ERC721 tokens (EIP-2309)
/// @dev Inherits from IERC721Consecutive and ERC721ConsecutiveInternal
abstract contract ERC721Consecutive is
    IERC721Consecutive,
    ERC721InternalCommon
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
    )
        external
        override
        whenNotPaused
        onlyRole(_MINTER_ROLE)
        emptyUint(quantity)
        addressIsNotZero(to)
    {
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
