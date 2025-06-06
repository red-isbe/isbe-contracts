// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Burnable} from './IERC20Burnable.sol';

/// @title ERC20Burnable
/// @notice Implements burn mechanism
/// @dev Inherits from IERC20Burnable and ERC20InternalCommon
contract ERC20Burnable is IERC20Burnable, ERC20InternalCommon {
    function burn(uint256 amount) external override whenNotPaused {
        _burn(_msgSender(), amount);
    }

    function burnFrom(
        address account,
        uint256 amount
    ) external override whenNotPaused {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
}
