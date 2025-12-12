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

import {IERC203643Controller} from './IERC203643Controller.sol';
import {ERC203643ControllerInternal} from './ERC203643ControllerInternal.sol';
import {_CONTROLLER_ROLE} from '../../../constants/roles.sol';

/// @title ERC203643Controller
/// @notice Implements unified force mechanism for both ERC20 and ERC3643 tokens
/// @dev Inherits from IERC203643Controller and ERC203643InternalCommon
///      Behavior adapts automatically based on token type through internal logic
abstract contract ERC203643Controller is
    ERC203643ControllerInternal,
    IERC203643Controller
{
    /**
     * @notice Forces a transfer of tokens between two addresses
     * @dev Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
     *      For ERC3643: If `_from` lacks enough free (unfrozen) balance but has sufficient total
     *      balance, it automatically unfreezes the missing portion to complete the transfer.
     *
     *      Emits a {ForcedTransfer} event.
     *      Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from` (ERC3643 only).
     *      Emits a {Transfer} event via {_transfer}.
     *
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to (must be verified for ERC3643)
     * @param _amount The number of tokens to transfer
     * @return success Always returns true (reverts on failure)
     */
    function forceTransfer(
        address _from,
        address _to,
        uint256 _amount
    )
        external
        override
        whenNotPaused
        onlyRole(_CONTROLLER_ROLE)
        onlyWhitelisted(_from)
        onlyWhitelisted(_to)
        returns (bool success)
    {
        success = _forceTransfer(_from, _to, _amount);
        emit ForcedTransfer(_msgSender(), _from, _to, _amount);
    }

    /**
     * @notice Forces a burn of tokens from an address
     * @dev Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
     *      For ERC3643: If `_from` lacks enough free (unfrozen) balance but has sufficient total
     *      balance, it automatically unfreezes the missing portion to complete the burn.
     *
     *      Emits a {ForcedBurn} event.
     *      Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from` (ERC3643 only).
     *      Emits a {Transfer} event to 0x0 via {_burn}.
     *
     * @param _from The address to burn tokens from
     * @param _amount The number of tokens to burn
     */
    function forceBurn(
        address _from,
        uint256 _amount
    )
        external
        override
        whenNotPaused
        onlyRole(_CONTROLLER_ROLE)
        onlyWhitelisted(_from)
    {
        _forceBurn(_from, _amount);
        emit ForcedBurn(_msgSender(), _from, _amount);
    }

    /**
     * @notice Burns tokens from multiple accounts by an authorized controller (batch operation)
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holders.
     *
     *      For ERC3643 tokens: tokens may be unfrozen if needed.
     *      In case any `_userAddresses[i]` has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amounts[i]`
     *      the tokens will be unfrozen to complete the burn.
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _userAddresses The addresses to burn tokens from
     * @param _amounts The number of tokens to burn from each corresponding address
     *
     * Emits a `ForcedBurn` event for each burn
     * Emits a `TokensUnfrozen` event if `_amounts[i]`
     * is higher than the free balance of `_userAddresses[i]` (ERC3643 only)
     * Emits a `Transfer` event to address(0) for each burn
     */
    function batchForceBurn(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    )
        external
        override
        whenNotPaused
        onlyRole(_CONTROLLER_ROLE)
        batchOnlyWhitelisted(_userAddresses)
    {
        uint256 userAddressesLength = _userAddresses.length;
        _checkSameLength(userAddressesLength, _amounts.length);
        for (uint256 i; i < userAddressesLength; ) {
            _forceBurn(_userAddresses[i], _amounts[i]);
            unchecked {
                ++i;
            }
        }
        emit BatchForcedBurn(_msgSender(), _userAddresses, _amounts);
    }

    /**
     * @notice Transfers tokens from multiple accounts to multiple recipients
     * by an authorized controller (batch operation)
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holders.
     *
     *      For ERC3643 tokens: recipients must be verified and tokens may be unfrozen if needed.
     *      In case any `_fromList[i]` address has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amounts[i]`
     *      the tokens will be unfrozen to complete the transfer.
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_fromList.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _fromList The addresses to transfer tokens from
     * @param _toList The addresses to transfer tokens to
     * @param _amounts The number of tokens to transfer for each corresponding pair
     *
     * Emits a `ForcedTransfer` event for each transfer
     * Emits a `TokensUnfrozen` event if `_amounts[i]` is higher than the free balance of `_fromList[i]` (ERC3643 only)
     * Emits a `Transfer` event for each transfer
     */
    function batchForceTransfer(
        address[] calldata _fromList,
        address[] calldata _toList,
        uint256[] calldata _amounts
    )
        external
        override
        whenNotPaused
        onlyRole(_CONTROLLER_ROLE)
        batchOnlyWhitelisted(_fromList)
        batchOnlyWhitelisted(_toList)
    {
        uint256 fromListLength = _fromList.length;
        _checkSameLength(fromListLength, _toList.length);
        _checkSameLength(fromListLength, _amounts.length);
        for (uint256 i; i < fromListLength; ) {
            _forceTransfer(_fromList[i], _toList[i], _amounts[i]);
            unchecked {
                ++i;
            }
        }
        emit BatchForcedTransfer(_msgSender(), _fromList, _toList, _amounts);
    }

    /**
     * @dev Declares the interfaces implemented by this facet.
     * @return interfaces_ Array of supported interface identifiers.
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
        interfaces_[--interfacesLength] = type(IERC203643Controller)
            .interfaceId;
    }
}
