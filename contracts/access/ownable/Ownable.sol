// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {OwnableBase} from './OwnableBase.sol';

/// @title Ownable
/// @notice Implements ownership mechanisms
/// @dev Inherits from IOwnable and OwnableInternal
contract Ownable is OwnableBase {
    function transferOwnership(
        address newOwner
    ) external override onlyOwner addressIsNotZero(newOwner) whenNotPaused {
        _transferOwnership(newOwner);
        emit OwnershipTransferred(_msgSender(), newOwner);
    }
}
