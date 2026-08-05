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

import {ERC721Internal} from '../../ERC721Internal.sol';
import {
    _ERC721_ENUMERABLE_STORAGE_POSITION
} from '../../../../constants/storagePositions.sol';
import {IERC721Enumerable} from './IERC721Enumerable.sol';

/**
 * @title ERC721EnumerableInternal
 * @notice Internal logic for ERC721 enumerable extension.
 * @dev Tracks all token IDs and per-owner token lists for enumeration.
 *      Should be inherited by the main internal logic contract.
 */
abstract contract ERC721EnumerableInternal is ERC721Internal {
    struct EnumerableStorage {
        uint256[] allTokens;
        mapping(uint256 => uint256) allTokensIndex;
        mapping(address => uint256[]) ownedTokens;
        mapping(uint256 => uint256) ownedTokensIndex;
    }

    /**
     * @dev Hook that is called before any token transfer. Updates enumeration data structures.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        EnumerableStorage storage s = _erc721EnumerableStorage();

        if (from == address(0)) {
            s.allTokensIndex[tokenId] = s.allTokens.length;
            s.allTokens.push(tokenId);
        }

        if (from != address(0) && from != to) {
            uint256 lastTokenIndex = s.ownedTokens[from].length - 1;
            uint256 tokenIndex = s.ownedTokensIndex[tokenId];

            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = s.ownedTokens[from][lastTokenIndex];
                s.ownedTokens[from][tokenIndex] = lastTokenId;
                s.ownedTokensIndex[lastTokenId] = tokenIndex;
            }
            s.ownedTokens[from].pop();
            delete s.ownedTokensIndex[tokenId];
        }

        if (to == address(0)) {
            uint256 lastTokenIndex = s.allTokens.length - 1;
            uint256 tokenIndex = s.allTokensIndex[tokenId];

            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = s.allTokens[lastTokenIndex];
                s.allTokens[tokenIndex] = lastTokenId;
                s.allTokensIndex[lastTokenId] = tokenIndex;
            }
            s.allTokens.pop();
            delete s.allTokensIndex[tokenId];
        }

        if (to != address(0) && to != from) {
            s.ownedTokensIndex[tokenId] = s.ownedTokens[to].length;
            s.ownedTokens[to].push(tokenId);
        }
    }

    /**
     * @dev Returns the total amount of tokens stored by the contract.
     */
    function _totalSupplyEnumerable() internal view virtual returns (uint256) {
        return _erc721EnumerableStorage().allTokens.length;
    }

    /**
     * @dev Returns a token ID owned by `owner` at a given `index` of its token list.
     */
    function _tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) internal view virtual returns (uint256) {
        require(
            index < _balanceOf(owner),
            IERC721Enumerable.OwnerIndexOutOfBounds()
        );
        return _erc721EnumerableStorage().ownedTokens[owner][index];
    }

    /**
     * @dev Returns a token ID at a given `index` of all the tokens stored by the contract.
     */
    function _tokenByIndex(
        uint256 index
    ) internal view virtual returns (uint256) {
        require(
            index < _totalSupply(),
            IERC721Enumerable.GlobalIndexOutOfBounds()
        );
        return _erc721EnumerableStorage().allTokens[index];
    }

    function _erc721EnumerableStorage()
        private
        pure
        returns (EnumerableStorage storage s)
    {
        bytes32 position = _ERC721_ENUMERABLE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            s.slot := position
        }
        // slither-disable-end assembly
    }
}
