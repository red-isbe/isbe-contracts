// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {
    _ERC20_CAPPED_RESOLVER_KEY
} from '../../../../constants/resolverKeys.sol';
import {IERC20Capped} from './IERC20Capped.sol';
import {_CAP_ROLE, _MINTER_ROLE} from '../../../../constants/roles.sol';
import {ERC165} from '../../../../core/ERC165.sol';

/// @title ERC20Capped
/// @notice Implements capped mechanism
/// @dev Inherits from IERC20Capped and ERC20InternalCommon
abstract contract ERC20Capped is IERC20Capped, ERC165, ERC20InternalCommon {
    constructor() {
        _disableInitializers(_ERC20_CAPPED_RESOLVER_KEY);
    }

    function initializeCap(
        uint256 newCap
    ) external initializer(_ERC20_CAPPED_RESOLVER_KEY) checkNewCap(newCap) {
        _setCap(newCap);
        emit CapSet(_msgSender(), newCap);
    }

    function mint(
        address account,
        uint256 amount
    ) external checkCap(amount) whenNotPaused onlyRole(_MINTER_ROLE) {
        _mint(account, amount);
    }

    function setCap(
        uint256 newCap
    ) external checkNewCap(newCap) whenNotPaused onlyRole(_CAP_ROLE) {
        _setCap(newCap);
        emit CapSet(_msgSender(), newCap);
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
