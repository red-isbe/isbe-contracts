// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../erc203643/ERC203643InternalCommon.sol';
import {IERC20Isbe} from './IERC20Isbe.sol';
import {_ERC20_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IERC20Metadata} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import {_ERC20_FACET_VERSION} from '../../constants/facetVersions.sol';

/**
 * @title ERC20 Token Contract
 * @notice This contract implements the standard ERC20 token functionality, including initialization,
 *         token transfers, allowances, and balance queries.
 * @dev This contract extends from `ERC20Internal` and adheres to the ERC20 standard defined in the
 *      OpenZeppelin interfaces. It includes additional helper functions such as `increaseAllowance` and
 *      `decreaseAllowance` for more granular control over token allowances.
 */
abstract contract ERC20 is IERC20Isbe, ERC203643InternalCommon {
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
    )
        external
        override
        initializer(_ERC20_RESOLVER_KEY, _ERC20_FACET_VERSION)
        emptyString(_newName)
        emptyString(_newSymbol)
    {
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
    )
        external
        override
        whenNotPaused
        onlyWhitelisted(_msgSender())
        onlyWhitelisted(_to)
        returns (bool)
    {
        _transfer(_msgSender(), _to, _amount);
        return true;
    }

    /**
     * @notice Transfer tokens to multiple addresses in a single transaction (batch operation)
     * @dev Transfers tokens from the caller's account to multiple recipients.
     *
     *      **ERC20 Mode:** Simple batch transfers without additional validations
     *      **ERC3643 Mode:** Requires all recipients to be verified and sender/recipients not frozen
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _toList The addresses of the receivers (all must be verified for ERC3643)
     * @param _amounts The number of tokens to transfer to each corresponding receiver
     *
     * Requirements:
     * - Caller must have sufficient balance for the total amount
     * - Arrays must have the same length
     * - For ERC3643: all addresses in `_toList` must be verified in Identity Registry
     * - For ERC3643: caller and all recipients must not be frozen
     *
     * Emits:
     * - {Transfer} event for each transfer via internal transfer mechanism
     *
     * Reverts:
     * - {TransferAmountExceedsBalance} if caller has insufficient balance
     */
    function batchTransfer(
        address[] calldata _toList,
        uint256[] calldata _amounts
    )
        external
        override
        whenNotPaused
        onlyWhitelisted(_msgSender())
        batchOnlyWhitelisted(_toList)
    {
        uint256 toListLength = _toList.length;
        uint256 amountsLength = _amounts.length;
        _checkSameLength(toListLength, amountsLength);
        address from = _msgSender();

        // Fail-fast: check total balance upfront before loop
        _checkTransferAmount(_balanceOf(from), _calculateTotalAmount(_amounts));

        // Perform individual transfers
        for (uint256 i; i < toListLength; ) {
            _transfer(from, _toList[i], _amounts[i]);
            unchecked {
                ++i;
            }
        }

        emit BatchTransferExecuted(from, _toList, _amounts);
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
    )
        external
        override
        whenNotPaused
        onlyWhitelisted(_msgSender())
        onlyWhitelisted(_spender)
        returns (bool)
    {
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
    )
        external
        override
        whenNotPaused
        onlyWhitelisted(_from)
        onlyWhitelisted(_to)
        returns (bool)
    {
        _spendAllowance(_from, _msgSender(), _amount);
        _transfer(_from, _to, _amount);
        emit TransferFromExecuted(_msgSender(), _from, _to, _amount);
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
    )
        external
        whenNotPaused
        onlyWhitelisted(_msgSender())
        onlyWhitelisted(_spender)
        returns (bool)
    {
        address owner = _msgSender();
        uint256 amount;
        unchecked {
            amount = _allowance(owner, _spender) + _addedValue;
        }
        _approve(owner, _spender, amount);
        emit AllowanceIncreased(owner, _spender, _addedValue, amount);
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
    )
        external
        whenNotPaused
        onlyWhitelisted(_msgSender())
        onlyWhitelisted(_spender)
        returns (bool)
    {
        address owner = _msgSender();
        uint256 currentAllowance = _allowance(owner, _spender);
        require(
            currentAllowance >= _subtractedValue,
            IERC20Isbe.DecreasedAllowanceBellowZero()
        );
        uint256 amount;
        unchecked {
            amount = currentAllowance - _subtractedValue;
        }
        _approve(owner, _spender, amount);
        emit AllowanceDecreased(owner, _spender, _subtractedValue, amount);

        return true;
    }

    /// @notice Get the amount of tokens that an owner allowed a spender to manage
    /// @param _owner The address which owns the funds
    /// @param _spender The address which can spend the funds
    /// @return The allowance amount
    function allowance(
        address _owner,
        address _spender
    ) external view override returns (uint256) {
        return _allowance(_owner, _spender);
    }

    /// @notice Returns the number of decimals used for token amounts
    /// @return The token decimals
    function decimals() external view override returns (uint8) {
        return _decimals();
    }

    /// @notice Returns the token symbol
    /// @return The symbol of the token
    function symbol() external view override returns (string memory) {
        return _symbol();
    }

    /// @notice Returns the token name
    /// @return The name of the token
    function name() external view override returns (string memory) {
        return _name();
    }

    /// @notice Returns the total supply of tokens
    /// @return The total token supply
    function totalSupply() external view override returns (uint256) {
        return _totalSupply();
    }

    /// @notice Returns the token balance of an account
    /// @param _account Address of the account to query
    /// @return The account's token balance
    function balanceOf(
        address _account
    ) external view override returns (uint256) {
        return _balanceOf(_account);
    }

    /// @notice Returns the list of interfaces implemented by this contract
    /// @return interfaces_ Array of interface IDs
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
