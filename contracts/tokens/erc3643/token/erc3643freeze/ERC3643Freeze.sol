// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../ERC203643InternalCommon.sol';
import {IERC3643Freeze} from './IERC3643Freeze.sol';
import {_TOKEN_AGENT_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643Freeze
 * @notice External contract implementing ERC-3643 freeze functionality.
 * @dev Provides public methods to freeze/unfreeze addresses and token amounts.
 *      Applies access control, validation, and emits events.
 */
abstract contract ERC3643Freeze is IERC3643Freeze, ERC203643InternalCommon {
    function setAddressFrozen(
        address _userAddress,
        bool _freeze
    ) external override onlyRole(_TOKEN_AGENT_ROLE) whenNotPaused {
        _setAddressFrozen(_userAddress, _freeze);
        emit AddressFrozen(_userAddress, _freeze, msg.sender);
    }

    function freezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external override onlyRole(_TOKEN_AGENT_ROLE) whenNotPaused {
        _freezePartialTokens(_userAddress, _amount);
        emit TokensFrozen(_userAddress, _amount);
    }

    function unfreezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external override onlyRole(_TOKEN_AGENT_ROLE) whenNotPaused {
        _unfreezePartialTokens(_userAddress, _amount);
        emit TokensUnfrozen(_userAddress, _amount);
    }

    function isFrozen(
        address _userAddress
    ) external view override returns (bool) {
        return _isFrozen(_userAddress);
    }

    function getFrozenTokens(
        address _userAddress
    ) external view override returns (uint256) {
        return _getFrozenTokens(_userAddress);
    }

    // --- supported interfaces ---
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
