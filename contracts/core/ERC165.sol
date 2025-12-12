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

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {ERC165Internal} from './ERC165Internal.sol';

/**
 * @title ERC165
 * @author ISBE
 * @notice Implements the ERC-165 standard for interface detection.
 * @dev This abstract contract provides a standardised way to check if a smart contract
 * implements a given interface. It combines the `IERC165` interface with the internal
 * logic from `ERC165Internal` to deliver a complete implementation. The `supportsInterface`
 * function is the primary entry point, allowing external contracts and applications to
 * query the supported interfaces of a contract.
 */
abstract contract ERC165 is IERC165, ERC165Internal {
    function supportsInterface(
        bytes4 _interfaceId
    ) external pure returns (bool) {
        return
            _isERC165ForbiddenInterfaces(_interfaceId)
                ? false
                : (_supportsERC165Interface(_interfaceId) ||
                    _supportsInterface(_interfaceId, _implementedInterfaces()));
    }
}
