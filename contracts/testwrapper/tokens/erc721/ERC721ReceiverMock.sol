// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721Receiver} from '../../../tokens/erc721/IERC721Receiver.sol';

contract ERC721ReceiverMock is IERC721Receiver {
    event Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes data,
        uint256 gas
    );

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        emit Received(operator, from, tokenId, data, gasleft());
        return this.onERC721Received.selector;
    }
}
