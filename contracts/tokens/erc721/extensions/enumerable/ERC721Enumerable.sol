// SPDX-License-Identifier: UNLICENSED
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
