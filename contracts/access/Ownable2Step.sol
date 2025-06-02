// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from './Ownable.sol';
import {IOwnable2Step} from './IOwnable2Step.sol';
import {Ownable2StepInternal} from './Ownable2StepInternal.sol';

/// @title Ownable2Step
/// @notice Implements ownership 2 step mechanisms
/// @dev Inherits from IOwnable2Step, Ownable and Ownable2StepInternal
abstract contract Ownable2Step is IOwnable2Step, Ownable, Ownable2StepInternal {
    function acceptOwnership() external onlyPendingOwner {
        _acceptOwnership();
        emit OwnershipAccepted(_msgSender());
    }

    function pendingOwner() external view returns (address) {
        return _pendingOwner();
    }

    function transferOwnership(
        address newOwner
    ) public override onlyOwner addressIsNotZero(newOwner) {
        _initiateTransferOwnership(newOwner);
        emit OwnershipTransferStarted(_msgSender(), newOwner);
    }
}
