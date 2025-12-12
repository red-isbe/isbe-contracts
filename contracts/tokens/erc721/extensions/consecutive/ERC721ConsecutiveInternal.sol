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
import {ERC721Internal} from '../../ERC721Internal.sol';
import {_ERC721_CONSECUTIVE_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/// @title ERC721ConsecutiveInternal
/// @dev Internal logic for ERC721 Consecutive extension (EIP-2309)
abstract contract ERC721ConsecutiveInternal is ERC721Internal {
    struct ERC721ConsecutiveStorage {
        uint256 _currentConsecutiveTokenId;
    }

    /// @dev Internal mint function for consecutive tokens
    function _mintConsecutive(address to, uint256 quantity) internal {
        ERC721ConsecutiveStorage storage $ = _consecutiveStorage();

        uint256 fromTokenId;
        uint256 toTokenId;
        unchecked {
            fromTokenId = $._currentConsecutiveTokenId + 1;
            toTokenId = fromTokenId + quantity - 1;
        }

        $._currentConsecutiveTokenId = toTokenId;

        for (uint256 tokenId = fromTokenId; tokenId <= toTokenId; ) {
            _mint(to, tokenId);
            unchecked {
                ++tokenId;
            }
        }

        emit IERC721Consecutive.ConsecutiveTransfer(
            fromTokenId,
            toTokenId,
            address(0),
            to
        );
    }

    function _consecutiveStorage()
        private
        pure
        returns (ERC721ConsecutiveStorage storage s)
    {
        bytes32 position = _ERC721_CONSECUTIVE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            s.slot := position
        }
        // slither-disable-end assembly
    }
}
