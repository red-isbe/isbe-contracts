// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidDocumentDetailedInternal} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {IERC20Isbe} from './IERC20Isbe.sol';
import {_ERC20_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
 * @notice Abstract contract providing internal functionality for ERC20 tokens.
 *         Contains common mechanisms for transferring, minting, burning, and managing allowances.
 *         This is not a deployable contract but serves as a helper for extending ERC20 logic.
 * @dev This contract defines internal functions that form the backbone of ERC20 token operations.
 *      It adheres to the ERC20 standard and provides reusable methods for advanced token management.
 */
abstract contract ERC20Internal is DidDocumentDetailedInternal {
    struct ERC20Storage {
        mapping(address account => uint256) balances;
        mapping(address account => mapping(address spender => uint256)) allowances;
        uint256 totalSupply;
        uint8 decimals;
        string name;
        string symbol;
    }

    function _initialize(
        string memory _newName,
        string memory _newSymbol,
        uint8 _newDecimals
    ) internal {
        ERC20Storage storage $ = _erc20Storage();
        $.name = _newName;
        $.symbol = _newSymbol;
        $.decimals = _newDecimals;
    }

    /**
     * @dev Internal function to update the token name in storage.
     * Applies the {emptyString} modifier to ensure the input is not an empty string.
     * @param _newName The new name to assign to the token.
     */
    function _setName(string memory _newName) internal {
        _erc20Storage().name = _newName;
    }

    /**
     * @dev Internal function to update the token symbol in storage.
     * Applies the {emptyString} modifier to ensure the input is not an empty string.
     * @param _newSymbol The new symbol to assign to the token.
     */
    function _setSymbol(string memory _newSymbol) internal {
        _erc20Storage().symbol = _newSymbol;
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
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual addressIsNotZero(_from) addressIsNotZero(_to) {
        _beforeTokenTransfer(_from, _to, _amount);
        unchecked {
            ERC20Storage storage $ = _erc20Storage();
            $.balances[_from] -= _amount;
            // Overflow not possible: the sum of all balances is capped by totalSupply, and the sum is preserved by
            // decrementing then incrementing.
            $.balances[_to] += _amount;
        }

        emit IERC20.Transfer(_from, _to, _amount);

        _afterTokenTransfer(_from, _to, _amount);
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
        address _account,
        uint256 _amount
    ) internal virtual addressIsNotZero(_account) {
        _beforeTokenTransfer(address(0), _account, _amount);

        ERC20Storage storage $ = _erc20Storage();
        $.totalSupply += _amount;
        unchecked {
            // Overflow not possible: balance + amount is at most totalSupply + amount, which is checked above.
            $.balances[_account] += _amount;
        }
        emit IERC20.Transfer(address(0), _account, _amount);

        _afterTokenTransfer(address(0), _account, _amount);
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
        address _account,
        uint256 _amount
    ) internal virtual addressIsNotZero(_account) {
        _beforeTokenTransfer(_account, address(0), _amount);

        unchecked {
            ERC20Storage storage $ = _erc20Storage();
            $.balances[_account] -= _amount;
            // Overflow not possible: amount <= accountBalance <= totalSupply.
            $.totalSupply -= _amount;
        }

        emit IERC20.Transfer(_account, address(0), _amount);

        _afterTokenTransfer(_account, address(0), _amount);
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
        address _owner,
        address _spender,
        uint256 _amount
    ) internal virtual addressIsNotZero(_owner) addressIsNotZero(_spender) {
        _erc20Storage().allowances[_owner][_spender] = _amount;
        emit IERC20.Approval(_owner, _spender, _amount);
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
        address _owner,
        address _spender,
        uint256 _amount
    ) internal virtual {
        uint256 currentAllowance = _allowance(_owner, _spender);
        if (currentAllowance == type(uint256).max) return;
        require(
            currentAllowance >= _amount,
            IERC20Isbe.InsufficientAllowance()
        );
        uint256 amount;
        unchecked {
            amount = currentAllowance - _amount;
        }
        _approve(_owner, _spender, amount);
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
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual;

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
        address _from,
        address _to,
        uint256 _amount
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

    /**
     * @dev Calculates the total of all entries in `_amounts`.
     * @param _amounts Array of amounts to sum.
     * @return totalAmount_ The total sum of `_amounts`.
     */
    function _calculateTotalAmount(
        uint256[] calldata _amounts
    ) internal pure returns (uint256 totalAmount_) {
        // Calculate total amount for balance validation
        uint256 amountsLength = _amounts.length;
        for (uint256 i; i < amountsLength; ) {
            // preventing overflow issues
            totalAmount_ += _amounts[i];
            unchecked {
                ++i;
            }
        }
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
