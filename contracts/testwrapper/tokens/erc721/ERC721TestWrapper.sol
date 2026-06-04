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

import {
    ERC721InternalCommon
} from '../../../tokens/erc721/extensions/ERC721InternalCommon.sol';

/**
 * @title ERC721TestWrapper
 * @notice Test wrapper contract for ERC721, exposing internal functions for testing purposes.
 * @dev Allows direct calls to burn, transfer, setApprovalForAll, and baseURI.
 *      - Not intended for production use; only for test environments and coverage.
 */
abstract contract ERC721TestWrapper is ERC721InternalCommon {
    function transfer(
        address from,
        address to,
        uint256 tokenId
    ) external onlyApprovedOrOwner(_msgSender(), from, tokenId) {
        _transfer(from, to, tokenId);
    }

    function callSetApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) external {
        _setApprovalForAll(owner, operator, approved);
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = 0xabcdef01;
    }
}
