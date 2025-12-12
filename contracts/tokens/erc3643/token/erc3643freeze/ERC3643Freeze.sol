// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
        _setAndEmitAddressFrozen(_msgSender(), _userAddress, _freeze);
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
        _freezeAndEmitPartialTokens(_userAddress, _amount);
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
        _unfreezeAndEmmitPartialTokens(_userAddress, _amount);
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
     * - {BatchAddressFrozen} event aggregating the changes
     */
    function batchSetAddressFrozen(
        address[] calldata _userAddresses,
        bool[] calldata _freeze
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        uint256 userAddressesLength = _userAddresses.length;
        _checkSameLength(userAddressesLength, _freeze.length);
        address sender = _msgSender();
        for (uint256 i; i < userAddressesLength; ) {
            _setAndEmitAddressFrozen(sender, _userAddresses[i], _freeze[i]);
            unchecked {
                ++i;
            }
        }
        emit BatchAddressFrozen(sender, _userAddresses, _freeze);
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
     * - {BatchTokensFrozen} event aggregating the changes
     */
    function batchFreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        uint256 userAddressesLength = _userAddresses.length;
        _checkSameLength(userAddressesLength, _amounts.length);
        for (uint256 i; i < userAddressesLength; ) {
            _freezeAndEmitPartialTokens(_userAddresses[i], _amounts[i]);
            unchecked {
                ++i;
            }
        }
        emit BatchTokensFrozen(_msgSender(), _userAddresses, _amounts);
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
     * - {BatchTokensUnfrozen} event aggregating the changes
     */
    function batchUnfreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external override onlyRole(_FREEZE_ROLE) whenNotPaused {
        uint256 userAddressesLength = _userAddresses.length;
        _checkSameLength(userAddressesLength, _amounts.length);
        for (uint256 i; i < userAddressesLength; ) {
            _unfreezeAndEmmitPartialTokens(_userAddresses[i], _amounts[i]);
            unchecked {
                ++i;
            }
        }
        emit BatchTokensUnfrozen(_msgSender(), _userAddresses, _amounts);
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

    function _setAndEmitAddressFrozen(
        address _sender,
        address _userAddress,
        bool _freeze
    ) private {
        _setAddressFrozen(_userAddress, _freeze);
        emit AddressFrozen(_userAddress, _freeze, _sender);
    }

    function _freezeAndEmitPartialTokens(
        address _userAddress,
        uint256 _amount
    ) private {
        _freezePartialTokens(_userAddress, _amount);
        emit TokensFrozen(_userAddress, _amount);
    }

    function _unfreezeAndEmmitPartialTokens(
        address _userAddress,
        uint256 _amount
    ) private {
        _unfreezePartialTokens(_userAddress, _amount);
        emit TokensUnfrozen(_userAddress, _amount);
    }
}
