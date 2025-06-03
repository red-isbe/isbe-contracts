// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IOwnable} from './IOwnable.sol';
import {OwnableInternal} from './OwnableInternal.sol';
import {_OWNABLE_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {ISBEPause} from '../pause/ISBEPause.sol';

/// @title Ownable
/// @notice Implements ownership mechanisms
/// @dev Inherits from IOwnable and OwnableInternal
contract Ownable is IOwnable, OwnableInternal, ISBEPause {
    /// @notice Constructor that disables the initializer

    constructor() {
        _disableInitializers(_OWNABLE_RESOLVER_KEY);
    }

    function initializeOwnable(
        address admin
    )
        public
        virtual
        initializer(_OWNABLE_RESOLVER_KEY)
        addressIsNotZero(admin)
    {
        _transferOwnership(admin);
        emit OwnershipTransferred(_msgSender(), admin);
    }

    function transferOwnership(
        address newOwner
    )
        public
        virtual
        override
        onlyOwner
        addressIsNotZero(newOwner)
        whenNotPaused
    {
        _transferOwnership(newOwner);
        emit OwnershipTransferred(_msgSender(), newOwner);
    }

    function renounceOwnership() public virtual onlyOwner whenNotPaused {
        _transferOwnership(address(0));
        emit OwnershipRenounced(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner();
    }
}
