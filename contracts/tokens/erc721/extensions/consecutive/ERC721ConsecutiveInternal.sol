// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721Consecutive} from './IERC721Consecutive.sol';
import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {_ERC721_CONSECUTIVE_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/// @title ERC721ConsecutiveInternal
/// @dev Internal logic for ERC721 Consecutive extension (EIP-2309)
abstract contract ERC721ConsecutiveInternal is
    IERC721Consecutive,
    ERC721InternalCommon
{
    struct ERC721ConsecutiveStorage {
        uint256 _currentConsecutiveTokenId;
    }

    /// @dev Internal mint function for consecutive tokens
    function _mintConsecutive(
        address to,
        uint256 quantity
    ) internal emptyUint(quantity) addressIsNotZero(to) {
        ERC721ConsecutiveStorage storage s = _consecutiveStorage();
        uint256 fromTokenId = s._currentConsecutiveTokenId + 1;
        uint256 toTokenId = fromTokenId + quantity - 1;

        for (uint256 tokenId = fromTokenId; tokenId <= toTokenId; ++tokenId) {
            _mint(to, tokenId);
        }

        s._currentConsecutiveTokenId = toTokenId;

        emit ConsecutiveTransfer(fromTokenId, toTokenId, address(0), to);
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
