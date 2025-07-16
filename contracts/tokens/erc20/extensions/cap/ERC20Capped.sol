// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {_ERC20_CAPPED_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {IERC20Capped} from './IERC20Capped.sol';
import {_CAP_ROLE, _MINTER_ROLE} from '../../../../constants/roles.sol';

/// @title ERC20Capped
/// @notice Implements capped mechanism
/// @dev Inherits from IERC20Capped and ERC20InternalCommon
abstract contract ERC20Capped is IERC20Capped, ERC20InternalCommon {
    constructor() {
        _disableInitializers(_ERC20_CAPPED_RESOLVER_KEY);
    }

    function initializeCap(
        uint256 _newCap
    ) external initializer(_ERC20_CAPPED_RESOLVER_KEY) checkNewCap(_newCap) {
        _setCap(_newCap);
        emit CapSet(_msgSender(), _newCap);
    }

    function mint(
        address _account,
        uint256 _amount
    ) external checkCap(_amount) whenNotPaused onlyRole(_MINTER_ROLE) {
        _mint(_account, _amount);
    }

    function setCap(
        uint256 _newCap
    ) external checkNewCap(_newCap) whenNotPaused onlyRole(_CAP_ROLE) {
        _setCap(_newCap);
        emit CapSet(_msgSender(), _newCap);
    }

    function cap() external view returns (uint256) {
        return _cap();
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20Capped).interfaceId;
    }
}
