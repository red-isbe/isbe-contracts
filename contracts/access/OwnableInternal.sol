// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../core/Common.sol';
import {_OWNABLE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {IOwnable} from './IOwnable.sol';

/// @title OwnableInternal
/// @notice Internal logic for owner control
abstract contract OwnableInternal is Common {
    /// @notice Struct storing the owner
    struct OwnableStorage {
        address owner;
    }

    /// @notice Modifier to restrict function execution to the owner account
    /// @dev Reverts with `AccountIsNotOwner` error if the account is not the owner
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _transferOwnership(address newOwner) internal virtual {
        _ownableStorage().owner = newOwner;
    }

    function _owner() internal view virtual returns (address) {
        return _ownableStorage().owner;
    }

    function _checkOwner() internal view virtual {
        require(
            _owner() == _msgSender(),
            IOwnable.AccountIsNotOwner(_msgSender())
        );
    }

    function _ownableStorage()
        internal
        pure
        returns (OwnableStorage storage storage_)
    {
        bytes32 position = _OWNABLE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
