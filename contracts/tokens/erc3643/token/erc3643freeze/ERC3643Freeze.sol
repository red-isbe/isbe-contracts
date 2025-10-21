// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Freeze} from './IERC3643Freeze.sol';
import {_FREEZE_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643Freeze
 * @notice External contract implementing ERC-3643 freeze functionality.
 * @dev Provides public methods to freeze/unfreeze addresses and token amounts.
 *      Applies access control, validation, and emits events.
 *      Uses granular FREEZE_ROLE instead of broad TOKEN_AGENT_ROLE for better permission management.
 */
abstract contract ERC3643Freeze is IERC3643Freeze, ERC203643InternalCommon {
    /**
     * @dev Sets the freeze status of a wallet
     * @param _userAddress The address for which to update frozen status
     * @param _freeze Freeze status of the address
     *
     * Requirements:
     * - Caller must have FREEZE_ROLE
     * - Contract must not be paused
     *
     * Emits:
     * - {AddressFrozen} event
     */
    function setAddressFrozen(
        address _userAddress,
        bool _freeze
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        _setAddressFrozen(_userAddress, _freeze);
        emit AddressFrozen(_userAddress, _freeze, msg.sender);
    }

    /**
     * @dev Freezes a specified amount of tokens for a given address
     * @param _userAddress The address for which to freeze tokens
     * @param _amount Amount of tokens to freeze
     *
     * Requirements:
     * - Caller must have FREEZE_ROLE
     * - Contract must not be paused
     * - Amount must not exceed user's free token balance
     *
     * Emits:
     * - {TokensFrozen} event
     */
    function freezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        _freezePartialTokens(_userAddress, _amount);
        emit TokensFrozen(_userAddress, _amount);
    }

    /**
     * @dev Unfreezes a specified amount of tokens for a given address
     * @param _userAddress The address for which to unfreeze tokens
     * @param _amount Amount of tokens to unfreeze
     *
     * Requirements:
     * - Caller must have FREEZE_ROLE
     * - Contract must not be paused
     * - Amount must not exceed user's frozen token balance
     *
     * Emits:
     * - {TokensUnfrozen} event
     */
    function unfreezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        _unfreezePartialTokens(_userAddress, _amount);
        emit TokensUnfrozen(_userAddress, _amount);
    }

    /**
     * @dev Batch sets the freeze status for multiple wallets
     * @param _userAddresses Array of addresses to update
     * @param _freeze Array of freeze statuses (true/false)
     *
     * Requirements:
     * - Caller must have FREEZE_ROLE
     * - Contract must not be paused
     * - Arrays must have the same length
     *
     * Emits:
     * - {AddressFrozen} event for each address
     */
    function batchSetAddressFrozen(
        address[] calldata _userAddresses,
        bool[] calldata _freeze
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        uint256 userAddressesLength = _userAddresses.length;
        uint256 freezeLength = _freeze.length;
        require(
            userAddressesLength == freezeLength,
            NotSameLengthArray(userAddressesLength, freezeLength)
        );

        for (uint256 i = 0; i < _userAddresses.length; ++i) {
            _setAddressFrozen(_userAddresses[i], _freeze[i]);
            emit AddressFrozen(_userAddresses[i], _freeze[i], msg.sender);
        }
    }

    /**
     * @dev Batch freezes specified amounts of tokens for multiple addresses
     * @param _userAddresses Array of addresses to freeze tokens for
     * @param _amounts Array of amounts to freeze
     *
     * Requirements:
     * - Caller must have FREEZE_ROLE
     * - Contract must not be paused
     * - Arrays must have the same length
     *
     * Emits:
     * - {TokensFrozen} event for each address
     */
    function batchFreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        uint256 userAddressesLength = _userAddresses.length;
        uint256 amountsLength = _amounts.length;
        require(
            userAddressesLength == amountsLength,
            NotSameLengthArray(userAddressesLength, amountsLength)
        );

        for (uint256 i = 0; i < _userAddresses.length; ++i) {
            _freezePartialTokens(_userAddresses[i], _amounts[i]);
            emit TokensFrozen(_userAddresses[i], _amounts[i]);
        }
    }

    /**
     * @dev Batch unfreezes specified amounts of tokens for multiple addresses
     * @param _userAddresses Array of addresses to unfreeze tokens for
     * @param _amounts Array of amounts to unfreeze
     *
     * Requirements:
     * - Caller must have FREEZE_ROLE
     * - Contract must not be paused
     * - Arrays must have the same length
     *
     * Emits:
     * - {TokensUnfrozen} event for each address
     */
    function batchUnfreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        uint256 userAddressesLength = _userAddresses.length;
        uint256 amountsLength = _amounts.length;
        require(
            userAddressesLength == amountsLength,
            NotSameLengthArray(userAddressesLength, amountsLength)
        );

        for (uint256 i = 0; i < _userAddresses.length; ++i) {
            _unfreezePartialTokens(_userAddresses[i], _amounts[i]);
            emit TokensUnfrozen(_userAddresses[i], _amounts[i]);
        }
    }

    /**
     * @dev Returns the freeze status of a wallet
     * @param _userAddress The address to check freeze status for
     * @return bool True if the address is completely frozen, false otherwise
     *
     * Note: This returns the complete freeze status. An address can still have
     * partially frozen tokens even if this returns false.
     */
    function isFrozen(
        address _userAddress
    ) external view override returns (bool) {
        return _isFrozen(_userAddress);
    }

    /**
     * @dev Returns the amount of partially frozen tokens for a given address
     * @param _userAddress The address to check frozen tokens for
     * @return uint256 The amount of tokens that are partially frozen
     *
     * Note: This only returns partially frozen tokens. If the address is
     * completely frozen (isFrozen = true), all tokens are effectively frozen
     * regardless of this value.
     */
    function getFrozenTokens(
        address _userAddress
    ) external view override returns (uint256) {
        return _getFrozenTokens(_userAddress);
    }

    /**
     * @dev Returns the interfaces implemented by this contract
     * @return interfaces_ Array of interface identifiers
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC3643Freeze).interfaceId;
    }
}
