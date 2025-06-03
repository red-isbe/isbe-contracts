// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './ERC20InternalCommon.sol';
import {IERC20Burnable} from './IERC20Burnable.sol';

/// @title ERC20Burnable
/// @notice Implements burn mechanism
/// @dev Inherits from IERC20Burnable and ERC20InternalCommon
abstract contract ERC20Burnable is IERC20Burnable, ERC20InternalCommon {
    function burn(uint256 amount) public virtual override {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual override {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
}
