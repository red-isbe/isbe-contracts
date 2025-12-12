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

import {IDidController} from './interfaces/IDidController.sol';
import {DidControllerInternal} from './DidControllerInternal.sol';

/**
 * @title Decentralised Identity Controller Management System
 * @notice Provides comprehensive management of W3C-compliant DID controllers with cryptographic
 *         verification methods and temporal validity periods
 * @dev Implements the complete DID specification including cryptographic controller relationships.
 * @author ISBE Development Team
 */
abstract contract DidController is DidControllerInternal, IDidController {
    function addController(
        bytes32 did,
        bytes32 controller
    )
        external
        override
        bytes32IsNotZero(did)
        bytes32IsNotZero(controller)
        onlyDidExists(did)
        onlyDidExists(controller)
        onlyNotController(did, controller)
        returns (bool)
    {
        emit ControllerAdded(did, controller);
        return _linkDidToController(did, controller);
    }

    function revokeController(
        bytes32 did,
        bytes32 controller
    )
        external
        override
        bytes32IsNotZero(did)
        bytes32IsNotZero(controller)
        onlyDidExists(did)
        onlyDidExists(controller)
        onlyController(did, controller)
        onlyNotLastController(did, controller)
        returns (bool success)
    {
        emit ControllerRevoked(did, controller);
        return _unlinkDidFromController(did, controller);
    }

    function getDidsByController(
        bytes32 controller,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        override
        returns (
            bytes32[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        return _getDidsByController(controller, page, pageSize);
    }

    function checkController(
        bytes32 did,
        address controller
    ) external view override returns (bool isController) {
        return _isController(did, controller);
    }

    function checkController(
        bytes memory did,
        address controller
    ) external view override returns (bool isController) {
        return _isController(bytes32(did), controller);
    }
}
