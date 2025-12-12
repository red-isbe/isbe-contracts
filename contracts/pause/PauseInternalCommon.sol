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

import {IPause} from './IPause.sol';
import {_PAUSE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {ISBEContext} from '../utils/ISBEContext.sol';

/// @title PauseInternal
/// @notice Internal logic for pausing mechanism
abstract contract PauseInternalCommon is ISBEContext {
    /// @notice Structure for storing pause state and authority level
    struct PauseStorage {
        bool pause;
        uint256 authorityLevel;
    }

    /// @notice Modifier to allow function execution only when the contract is not paused
    /// @dev Reverts with `IsPaused` error if the contract is currently paused
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /// @notice Modifier to allow function execution only when the contract is paused
    /// @dev Reverts with `IsNotPaused` error if the contract is not currently paused
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    function _paused() internal view virtual returns (bool) {
        return _pauseStorage().pause;
    }

    function _requireNotPaused() internal view virtual {
        require(!_paused(), IPause.IsPaused());
    }

    function _requirePaused() internal view virtual {
        require(_paused(), IPause.IsNotPaused());
    }

    /// @notice Returns the storage slot for pause
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return pauseStorage_ The pause storage struct
    function _pauseStorage()
        internal
        pure
        returns (PauseStorage storage pauseStorage_)
    {
        bytes32 position = _PAUSE_STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            pauseStorage_.slot := position
        }
    }
}
