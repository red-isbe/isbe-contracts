// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Controller} from './IERC20Controller.sol';
import {_CONTROLLER_ROLE} from '../../../../constants/roles.sol';

/// @title ERC20Controller
/// @notice Implements force mechanism
/// @dev Inherits from IERC20Controller and ERC20InternalCommon
abstract contract ERC20Controller is IERC20Controller, ERC20InternalCommon {
    function forceTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        _transfer(_from, _to, _amount);
        emit ForceTransfer(_msgSender(), _from, _to, _amount);
    }

    function forceBurn(
        address _from,
        uint256 _amount
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        _burn(_from, _amount);
        emit ForceBurn(_msgSender(), _from, _amount);
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
        interfaces_[--interfacesLength] = type(IERC20Controller).interfaceId;
    }
}
