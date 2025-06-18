// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Controller} from './IERC20Controller.sol';
import {_CONTROLLER_ROLE} from '../../../../constants/roles.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

/// @title ERC20Controller
/// @notice Implements force mechanism
/// @dev Inherits from IERC20Controller and ERC20InternalCommon
contract ERC20Controller is IERC20Controller, IERC165, ERC20InternalCommon {
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

    function supportsInterface(
        bytes4 interfaceId
    ) external view virtual override returns (bool) {
        return
            _supportsERC165Interface(interfaceId) ||
            _supportsInterface(interfaceId, _erc20ControllerInterfaces());
    }

    function _erc20ControllerInterfaces()
        internal
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20Controller).interfaceId;
    }
}
