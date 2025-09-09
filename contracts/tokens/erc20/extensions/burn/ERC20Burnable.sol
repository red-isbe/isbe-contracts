// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Burnable} from './IERC20Burnable.sol';

/// @title ERC20Burnable
/// @notice Implements burn mechanism
/// @dev Inherits from IERC20Burnable and ERC20InternalCommon
abstract contract ERC20Burnable is IERC20Burnable, ERC20InternalCommon {
    function burn(uint256 _amount) external override whenNotPaused {
        _burn(_msgSender(), _amount);
    }

    function burnFrom(
        address _account,
        uint256 _amount
    ) external override whenNotPaused {
        _spendAllowance(_account, _msgSender(), _amount);
        _burn(_account, _amount);
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
        interfaces_[--interfacesLength] = type(IERC20Burnable).interfaceId;
    }
}
