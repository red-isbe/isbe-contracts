// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './extensions/ERC20InternalCommon.sol';
import {IERC20Isbe} from './IERC20Isbe.sol';
import {_ERC20_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IERC20Metadata} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';

/**
 * @title ERC20 Token Contract
 * @notice This contract implements the standard ERC20 token functionality, including initialization,
 *         token transfers, allowances, and balance queries.
 * @dev This contract extends from `ERC20Internal` and adheres to the ERC20 standard defined in the
 *      OpenZeppelin interfaces. It includes additional helper functions such as `increaseAllowance` and
 *      `decreaseAllowance` for more granular control over token allowances.
 */
abstract contract ERC20 is IERC20Isbe, ERC20InternalCommon {
    /// @notice Constructor that assigns the deployer as the default admin
    constructor() {
        _disableInitializers(_ERC20_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the ERC20 token with the given name, symbol, and decimals.
     * @param _newName The name of the ERC20 token to be initialized.
     * @param _newSymbol The symbol of the ERC20 token to be initialized.
     * @param _newDecimals The number of decimal places for the ERC20 token.
     */
    function initializeErc20(
        string memory _newName,
        string memory _newSymbol,
        uint8 _newDecimals
    ) external override initializer(_ERC20_RESOLVER_KEY) {
        _initialize(_newName, _newSymbol, _newDecimals);
        emit Erc20Initialized(_newName, _newSymbol, _newDecimals);
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
        address _to,
        uint256 _amount
    ) external override whenNotPaused returns (bool) {
        _transfer(_msgSender(), _to, _amount);
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
        address _spender,
        uint256 _amount
    ) external override whenNotPaused returns (bool) {
        _approve(_msgSender(), _spender, _amount);
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
        address _from,
        address _to,
        uint256 _amount
    ) external override whenNotPaused returns (bool) {
        _spendAllowance(_from, _msgSender(), _amount);
        _transfer(_from, _to, _amount);
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
        address _spender,
        uint256 _addedValue
    ) external whenNotPaused returns (bool) {
        address owner = _msgSender();
        _approve(owner, _spender, _allowance(owner, _spender) + _addedValue);
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
        address _spender,
        uint256 _subtractedValue
    ) external whenNotPaused returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = _allowance(owner, _spender);
        require(
            currentAllowance >= _subtractedValue,
            IERC20Isbe.DecreasedAllowanceBellowZero()
        );
        unchecked {
            _approve(owner, _spender, currentAllowance - _subtractedValue);
        }

        return true;
    }

    function allowance(
        address _owner,
        address _spender
    ) external view override returns (uint256) {
        return _allowance(_owner, _spender);
    }

    function decimals() external view override returns (uint8) {
        return _decimals();
    }

    function symbol() external view override returns (string memory) {
        return _symbol();
    }

    function name() external view override returns (string memory) {
        return _name();
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply();
    }

    function balanceOf(
        address _account
    ) external view override returns (uint256) {
        return _balanceOf(_account);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 3;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20Isbe).interfaceId;
        interfaces_[--interfacesLength] = type(IERC20).interfaceId;
        interfaces_[--interfacesLength] = type(IERC20Metadata).interfaceId;
    }
}
