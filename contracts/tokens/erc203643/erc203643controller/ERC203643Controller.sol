// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../ERC203643InternalCommon.sol';
import {IERC203643Controller} from './IERC203643Controller.sol';
import {_CONTROLLER_ROLE} from '../../../constants/roles.sol';

/// @title ERC203643Controller
/// @notice Implements unified force mechanism for both ERC20 and ERC3643 tokens
/// @dev Inherits from IERC203643Controller and ERC203643InternalCommon
///      Behavior adapts automatically based on token type through internal logic
abstract contract ERC203643Controller is
    IERC203643Controller,
    ERC203643InternalCommon
{
    /**
     * @notice Forces a transfer of tokens between two addresses
     * @dev Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
     *      For ERC3643: If `_from` lacks enough free (unfrozen) balance but has sufficient total
     *      balance, it automatically unfreezes the missing portion to complete the transfer.
     *
     *      Emits a {ForceTransfer} event.
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
        returns (bool success)
    {
        _transfer(_from, _to, _amount);
        emit ForceTransfer(_msgSender(), _from, _to, _amount);
        return true;
    }

    /**
     * @notice Forces a burn of tokens from an address
     * @dev Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
     *      For ERC3643: If `_from` lacks enough free (unfrozen) balance but has sufficient total
     *      balance, it automatically unfreezes the missing portion to complete the burn.
     *
     *      Emits a {ForceBurn} event.
     *      Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from` (ERC3643 only).
     *      Emits a {Transfer} event to 0x0 via {_burn}.
     *
     * @param _from The address to burn tokens from
     * @param _amount The number of tokens to burn
     */
    function forceBurn(
        address _from,
        uint256 _amount
    ) external override whenNotPaused onlyRole(_CONTROLLER_ROLE) {
        _burn(_from, _amount);
        emit ForceBurn(_msgSender(), _from, _amount);
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
