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

import {ERC721Internal} from '../ERC721Internal.sol';
import {ERC721CappedInternal} from './cap/ERC721CappedInternal.sol';
import {ERC721SnapshotInternal} from './snapshot/ERC721SnapshotInternal.sol';
import {
    ERC721EnumerableInternal
} from './enumerable/ERC721EnumerableInternal.sol';
import {ERC721RoyaltyInternal} from './royalty/ERC721RoyaltyInternal.sol';
import {
    ERC721ConsecutiveInternal
} from './consecutive/ERC721ConsecutiveInternal.sol';

/// @title ERC721InternalCommon
/// @notice This abstract contract puts together all ERC721 internal logic (snapshot, cap, and base logic).
abstract contract ERC721InternalCommon is
    ERC721SnapshotInternal,
    ERC721CappedInternal,
    ERC721EnumerableInternal,
    ERC721RoyaltyInternal,
    ERC721ConsecutiveInternal
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
