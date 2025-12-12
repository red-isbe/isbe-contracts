// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {_OWNABLE_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IOwnable} from './IOwnable.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

/// @title OwnableInternal
/// @notice Internal logic for owner control
abstract contract OwnableInternal is ISBEContext {
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

    function _transferOwnership(address _newOwner) internal virtual {
        _ownableStorage().owner = _newOwner;
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
