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
    ) external view override returns (bytes4) {
        return _selector;
    }
}
