// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {OwnableBase} from './OwnableBase.sol';
import {IOwnable2Step} from './IOwnable2Step.sol';
import {Ownable2StepInternal} from './Ownable2StepInternal.sol';

/// @title Ownable2Step
/// @notice Implements ownership 2 step mechanisms
/// @dev Inherits from IOwnable2Step, Ownable and Ownable2StepInternal
contract Ownable2Step is IOwnable2Step, OwnableBase, Ownable2StepInternal {
    function transferOwnership(
        address newOwner
    ) external override onlyOwner addressIsNotZero(newOwner) whenNotPaused {
        _initiateTransferOwnership(newOwner);
        emit OwnershipTransferStarted(_msgSender(), newOwner);
    }

    function acceptOwnership() external onlyPendingOwner whenNotPaused {
        _acceptOwnership();
        emit OwnershipAccepted(_msgSender());
    }

    function pendingOwner() external view returns (address) {
        return _pendingOwner();
    }
}
