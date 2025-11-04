// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {OwnableBase} from './OwnableBase.sol';
import {IOwnable2Step} from './IOwnable2Step.sol';
import {Ownable2StepInternal} from './Ownable2StepInternal.sol';

/// @title Ownable2Step
/// @notice Implements ownership 2 step mechanisms
/// @dev Inherits from IOwnable2Step, Ownable and Ownable2StepInternal
abstract contract Ownable2Step is
    IOwnable2Step,
    OwnableBase,
    Ownable2StepInternal
{
    /// @notice Initiates ownership transfer to a new address
    /// @param _newOwner Address to transfer ownership to
    function transferOwnership(
        address _newOwner
    ) external override onlyOwner addressIsNotZero(_newOwner) whenNotPaused {
        _initiateTransferOwnership(_newOwner);
        emit OwnershipTransferStarted(_msgSender(), _newOwner);
    }

    /// @notice Completes the ownership transfer to the pending owner
    function acceptOwnership() external onlyPendingOwner whenNotPaused {
        _acceptOwnership();
        emit OwnershipAccepted(_msgSender());
    }

    /// @notice Returns the pending owner address
    /// @return The address of the pending owner
    function pendingOwner() external view returns (address) {
        return _pendingOwner();
    }

    /// @notice Returns the interfaces implemented by this contract
    /// @return interfaces_ Array of interface IDs
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        bytes4[][] memory interfaceGroups = new bytes4[][](1);
        interfaceGroups[0] = OwnableBase._implementedInterfaces();

        bytes4[] memory interfaceIds = new bytes4[](1);
        interfaceIds[0] = type(IOwnable2Step).interfaceId;

        return _aggregateInterfaces(interfaceGroups, interfaceIds);
    }
}
