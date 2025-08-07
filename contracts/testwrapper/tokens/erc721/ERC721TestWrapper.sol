// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import {ERC721InternalCommon} from '../../../tokens/erc721/extensions/ERC721InternalCommon.sol';

/**
 * @title ERC721TestWrapper
 * @notice Test wrapper contract for ERC721, exposing internal functions for testing purposes.
 * @dev Allows direct calls to burn, transfer, setApprovalForAll, and baseURI.
 *      - Not intended for production use; only for test environments and coverage.
 */
abstract contract ERC721TestWrapper is ERC721InternalCommon {
    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }

    function transfer(address from, address to, uint256 tokenId) external {
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
