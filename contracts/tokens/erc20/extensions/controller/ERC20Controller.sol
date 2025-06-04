// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Controller} from './IERC20Controller.sol';
import {_CONTROLLER_ROLE} from '../../../../constants/roles.sol';

/// @title ERC20Controller
/// @notice Implements force mechanism
/// @dev Inherits from IERC20Controller and ERC20InternalCommon
contract ERC20Controller is IERC20Controller, ERC20InternalCommon {
    function forceTransfer(
        address from,
        address to,
        uint256 amount
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        _transfer(from, to, amount);
        emit ForceTransfer(_msgSender(), from, to, amount);
    }

    function forceBurn(
        address from,
        uint256 amount
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        _burn(from, amount);
        emit ForceBurn(_msgSender(), from, amount);
    }
}
