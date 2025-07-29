// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721Receiver} from '../../../tokens/erc721/IERC721Receiver.sol';

/**
 * @title ERC721ReceiverMock
 * @dev Permite testear safeTransferFrom con diferentes comportamientos:
 *  - Puede devolver el selector correcto (onERC721Received) o uno incorrecto.
 *  - Puede revertir si se indica.
 */
contract ERC721ReceiverMock is IERC721Receiver {
    bytes4 private _selector;

    function setSelector(bytes4 selector) external {
        _selector = selector;
    }

    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external override returns (bytes4) {
        return _selector;
    }
}
