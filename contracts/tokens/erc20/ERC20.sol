// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Internal} from './ERC20Internal.sol';
import {_ERC20_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

contract ERC20 is ERC20Internal {
    /// @notice Constructor that assigns the deployer as the default admin
    constructor() {
        _disableInitializers(_ERC20_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the ERC20 token with the given name, symbol, and decimals.
     * @param newName The name of the ERC20 token to be initialized.
     * @param newSymbol The symbol of the ERC20 token to be initialized.
     * @param newDecimals The number of decimal places for the ERC20 token.
     */
    function initializeErc20(
        string memory newName,
        string memory newSymbol,
        uint8 newDecimals
    ) public virtual override initializer(_ERC20_RESOLVER_KEY) {
        ERC20Storage storage $ = _erc20Storage();
        $.name = newName;
        $.symbol = newSymbol;
        $.decimals = newDecimals;
        emit Erc20Initialized(newName, newSymbol, newDecimals);
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(
        address spender,
        uint256 amount
    ) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(
            currentAllowance >= subtractedValue,
            DecreasedAllowanceBellowZero()
        );
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    // TODO: Only for testing purposes. Remove when implement 4626 and burnable
    /// **********************************************************
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
    /// **********************************************************

    function decimals() public view virtual override returns (uint8) {
        return _erc20Storage().decimals;
    }

    function symbol() public view virtual override returns (string memory) {
        return _erc20Storage().symbol;
    }

    function name() public view virtual override returns (string memory) {
        return _erc20Storage().name;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _erc20Storage().totalSupply;
    }

    function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        return _erc20Storage().balances[account];
    }
}
