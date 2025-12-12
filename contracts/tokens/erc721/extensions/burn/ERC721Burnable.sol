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

import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {IERC721Burnable} from './IERC721Burnable.sol';

/// @title ERC721Burnable
/// @notice Implements burn mechanism for ERC721 tokens
/// @dev Inherits from IERC721Burnable and ERC721InternalCommon
abstract contract ERC721Burnable is IERC721Burnable, ERC721InternalCommon {
    /**
     * @notice Burns a specific token owned by the caller.
     * @dev The caller must own the token or be an approved operator.
     *      Emits a Transfer event to the zero address.
     * @param tokenId The identifier of the token to burn.
     */
    function burn(
        uint256 tokenId
    )
        external
        override
        whenNotPaused
        onlyApprovedOrOwner(msg.sender, _ownerOf(tokenId), tokenId)
    {
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
    )
        external
        override
        whenNotPaused
        onlyApprovedOrOwner(msg.sender, owner, tokenId)
    {
        _burn(tokenId);
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
        interfaces_[--interfacesLength] = type(IERC721Burnable).interfaceId;
    }
}
