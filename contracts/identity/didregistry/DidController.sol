// SPDX-License-Identifier: UNLICENSED
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
        string memory did,
        string memory controller
    )
        external
        override
        emptyString(did)
        emptyString(controller)
        onlyDidExists(did)
        onlyDidExists(controller)
        onlyNotController(did, controller)
        returns (bool)
    {
        emit ControllerAdded(did, controller);
        return _linkDidToController(did, controller);
    }

    function revokeController(
        string memory did,
        string memory controller
    )
        external
        override
        emptyString(did)
        emptyString(controller)
        onlyDidExists(did)
        onlyDidExists(controller)
        onlyController(did, controller)
        returns (bool success)
    {
        emit ControllerRevoked(did, controller);
        return _unlinkDidFromController(did, controller);
    }

    function getDidsByController(
        string memory controller,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        override
        returns (
            string[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        return _getDidsByController(controller, page, pageSize);
    }

    function checkController(
        string memory did,
        address controller
    ) external view override returns (bool isController) {
        return _isController(did, controller);
    }

    function checkController(
        bytes memory did,
        address controller
    ) external view override returns (bool isController) {
        return _isController(string(did), controller);
    }
}
