// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from '../ERC20.sol';
import {IERC20Burnable} from './IERC20Burnable.sol';

/**
 * @title ERC20Burnable
 * @notice An extension of the ERC20 standard that adds functionality to burn tokens.
 *         Allows users to reduce the total supply of the token by burning their own tokens
 *         or tokens they have been approved to burn on behalf of another account.
 * @dev This contract provides two burning mechanisms:
 *      - `burn`: Allows an account to destroy its own tokens.
 *      - `burnFrom`: Allows an account to burn tokens from another account's balance, given sufficient allowance.
 *      Relies on the `_burn` and `_spendAllowance` functions inherited from the ERC20 contract.
 *      This contract must be inherited and is not deployable on its own.
 */
abstract contract ERC20Burnable is ERC20, IERC20Burnable {
    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public virtual override {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public virtual override {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
}
