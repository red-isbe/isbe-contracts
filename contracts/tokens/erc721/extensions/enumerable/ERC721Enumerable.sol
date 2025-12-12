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
import {IERC721Enumerable} from './IERC721Enumerable.sol';

/**
 * @title ERC721Enumerable
 * @notice Implements enumerable extension for ERC721 tokens.
 * @dev Inherits from IERC721Enumerable and ERC721InternalCommon.
 */
abstract contract ERC721Enumerable is IERC721Enumerable, ERC721InternalCommon {
    /**
     * @notice Returns the total amount of tokens stored by the contract.
     */
    function totalSupplyEnumerable() external view override returns (uint256) {
        return _totalSupplyEnumerable();
    }

    /**
     * @notice Returns a token ID owned by `owner` at a given `index` of its token list.
     */
    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) external view override returns (uint256) {
        return _tokenOfOwnerByIndex(owner, index);
    }

    /**
     * @notice Returns a token ID at a given `index` of all the tokens stored by the contract.
     */
    function tokenByIndex(
        uint256 index
    ) external view override returns (uint256) {
        return _tokenByIndex(index);
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
        interfaces_[--interfacesLength] = type(IERC721Enumerable).interfaceId;
    }
}
