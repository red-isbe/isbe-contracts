// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IOwnable} from './IOwnable.sol';
import {Common} from '../../core/Common.sol';
import {_OWNABLE_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

/// @title Ownable
/// @notice Implements ownership mechanisms
/// @dev Inherits from IOwnable and OwnableInternal
abstract contract OwnableBase is IOwnable, Common {
    /// @notice Constructor that disables the initializer

    constructor() {
        _disableInitializers(_OWNABLE_RESOLVER_KEY);
    }

    function initializeOwnable(
        address admin
    ) external initializer(_OWNABLE_RESOLVER_KEY) addressIsNotZero(admin) {
        _transferOwnership(admin);
        emit OwnershipTransferred(_msgSender(), admin);
    }

    function renounceOwnership() external override onlyOwner whenNotPaused {
        _transferOwnership(address(0));
        emit OwnershipRenounced(_msgSender());
    }

    function owner() external view override returns (address) {
        return _owner();
    }
}
