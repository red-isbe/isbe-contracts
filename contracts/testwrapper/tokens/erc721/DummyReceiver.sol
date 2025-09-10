// contracts/test/DummyERC721Receiver.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {IERC721Receiver} from '../../../tokens/erc721/IERC721Receiver.sol';
contract DummyERC721Receiver is IERC721Receiver {
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
