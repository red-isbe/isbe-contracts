// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {OwnableBase} from './OwnableBase.sol';

/// @title Ownable
/// @notice Implements ownership mechanisms
/// @dev Inherits from IOwnable and OwnableInternal
abstract contract Ownable is OwnableBase {
    function transferOwnership(
        address _newOwner
    ) external override onlyOwner addressIsNotZero(_newOwner) whenNotPaused {
        _transferOwnership(_newOwner);
        emit OwnershipTransferred(_msgSender(), _newOwner);
    }
}
