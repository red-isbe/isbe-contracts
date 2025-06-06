// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from './Ownable.sol';
import {IOwnable2Step} from './IOwnable2Step.sol';
import {Ownable2StepInternal} from './Ownable2StepInternal.sol';

/// @title Ownable2Step
/// @notice Implements ownership 2 step mechanisms
/// @dev Inherits from IOwnable2Step, Ownable and Ownable2StepInternal
contract Ownable2Step is IOwnable2Step, Ownable, Ownable2StepInternal {
    function selectorsIntrospection()
        external
        pure
        virtual // TODO: Revove when refactor
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeOwnable.selector;
        selectors_[--selectorsLength] = this.transferOwnership.selector;
        selectors_[--selectorsLength] = this.acceptOwnership.selector;
        selectors_[--selectorsLength] = this.renounceOwnership.selector;
        selectors_[--selectorsLength] = this.owner.selector;
        selectors_[--selectorsLength] = this.pendingOwner.selector;
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
        _initiateTransferOwnership(newOwner);
        emit OwnershipTransferStarted(_msgSender(), newOwner);
    }

    function acceptOwnership() public virtual onlyPendingOwner whenNotPaused {
        _acceptOwnership();
        emit OwnershipAccepted(_msgSender());
    }

    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner();
    }
}
