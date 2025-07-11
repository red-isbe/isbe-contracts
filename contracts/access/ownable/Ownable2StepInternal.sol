// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {OwnableInternal} from './OwnableInternal.sol';
import {IOwnable2Step} from './IOwnable2Step.sol';
import {_OWNABLE2STEP_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/// @title Ownable2StepInternal
/// @notice Internal logic for 2 step owner control
abstract contract Ownable2StepInternal is OwnableInternal {
    /// @notice Struct storing the pending owner
    struct Ownable2StepStorage {
        address pendingOwner;
    }

    /// @notice Modifier to restrict function execution to the pending owner account
    /// @dev Reverts with `AccountIsNotPendingOwner` error if the account is not the pending owner
    modifier onlyPendingOwner() {
        _checkPendingOwner();
        _;
    }

    function _initiateTransferOwnership(address newOwner) internal virtual {
        _ownable2StepStorage().pendingOwner = newOwner;
    }

    function _acceptOwnership() internal virtual {
        Ownable2StepStorage
            storage ownable2StepStorage = _ownable2StepStorage();
        address newOwner = ownable2StepStorage.pendingOwner;
        delete ownable2StepStorage.pendingOwner;
        super._transferOwnership(newOwner);
    }

    function _pendingOwner() internal view virtual returns (address) {
        return _ownable2StepStorage().pendingOwner;
    }

    function _checkPendingOwner() internal view virtual {
        require(
            _pendingOwner() == _msgSender(),
            IOwnable2Step.AccountIsNotPendingOwner(_msgSender())
        );
    }

    function _ownable2StepStorage()
        internal
        pure
        returns (Ownable2StepStorage storage storage_)
    {
        bytes32 position = _OWNABLE2STEP_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
