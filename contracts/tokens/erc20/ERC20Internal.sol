// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {IERC20Isbe} from './IERC20Isbe.sol';
import {_ERC20_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @notice Abstract contract providing internal functionality for ERC20 tokens.
 *         Contains common mechanisms for transferring, minting, burning, and managing allowances.
 *         This is not a deployable contract but serves as a helper for extending ERC20 logic.
 * @dev This contract defines internal functions that form the backbone of ERC20 token operations.
 *      It adheres to the ERC20 standard and provides reusable methods for advanced token management.
 */
abstract contract ERC20Internal is IERC20Isbe, Common {
    struct ERC20Storage {
        mapping(address account => uint256) balances;
        mapping(address account => mapping(address spender => uint256)) allowances;
        uint256 totalSupply;
        uint8 decimals;
        string name;
        string symbol;
    }

    function _initialize(
        string memory newName,
        string memory newSymbol,
        uint8 newDecimals
    ) internal {
        ERC20Storage storage $ = _erc20Storage();
        $.name = newName;
        $.symbol = newSymbol;
        $.decimals = newDecimals;
    }

    /**
     * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual addressIsNotZero(from) addressIsNotZero(to) {
        _beforeTokenTransfer(from, to, amount);
        ERC20Storage storage $ = _erc20Storage();
        uint256 fromBalance = $.balances[from];
        require(fromBalance >= amount, TransferAmountExceedsBalance());
        unchecked {
            $.balances[from] = fromBalance - amount;
            // Overflow not possible: the sum of all balances is capped by totalSupply, and the sum is preserved by
            // decrementing then incrementing.
            $.balances[to] += amount;
        }

        emit Transfer(from, to, amount);

        _afterTokenTransfer(from, to, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _mint(
        address account,
        uint256 amount
    ) internal virtual addressIsNotZero(account) {
        _beforeTokenTransfer(address(0), account, amount);

        ERC20Storage storage $ = _erc20Storage();
        $.totalSupply += amount;
        unchecked {
            // Overflow not possible: balance + amount is at most totalSupply + amount, which is checked above.
            $.balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);

        _afterTokenTransfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(
        address account,
        uint256 amount
    ) internal virtual addressIsNotZero(account) {
        _beforeTokenTransfer(account, address(0), amount);

        ERC20Storage storage $ = _erc20Storage();
        uint256 accountBalance = $.balances[account];
        require(accountBalance >= amount, BurnAmountExceedsBalance());
        unchecked {
            $.balances[account] = accountBalance - amount;
            // Overflow not possible: amount <= accountBalance <= totalSupply.
            $.totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual addressIsNotZero(owner) addressIsNotZero(spender) {
        _erc20Storage().allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `amount`.
     *
     * Does not update the allowance amount in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Might emit an {Approval} event.
     */
    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = _allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, InsufficientAllowance());
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    // solhint-disable no-empty-blocks
    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}
    // solhint-enable no-empty-blocks

    function _decimals() internal view returns (uint8) {
        return _erc20Storage().decimals;
    }

    function _symbol() internal view returns (string memory) {
        return _erc20Storage().symbol;
    }

    function _name() internal view returns (string memory) {
        return _erc20Storage().name;
    }

    function _totalSupply() internal view returns (uint256) {
        return _erc20Storage().totalSupply;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return _erc20Storage().balances[account];
    }

    function _allowance(
        address owner,
        address spender
    ) internal view returns (uint256) {
        return _erc20Storage().allowances[owner][spender];
    }

    function _erc20Storage()
        private
        pure
        returns (ERC20Storage storage storage_)
    {
        bytes32 position = _ERC20_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
