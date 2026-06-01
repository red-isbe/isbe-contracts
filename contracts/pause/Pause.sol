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

import {PauseInternal} from './PauseInternal.sol';
import {IPause} from './IPause.sol';
import {_PAUSE_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {_PAUSE_FACET_VERSION} from '../constants/facetVersions.sol';

/// @title Pause
/// @notice Implements pausing mechanism
/// @dev Inherits from IPause and PauseInternal, providing external pause functions
abstract contract Pause is IPause, PauseInternal {
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(_PAUSE_RESOLVER_KEY);
    }

    function initializePause(
        bool _paused
    ) external initializer(_PAUSE_RESOLVER_KEY, _PAUSE_FACET_VERSION) {
        if (_paused) _pause();
    }

    function pause() external whenNotPaused onlyPauserRole {
        _pause();
        emit IPause.Paused(_msgSender());
    }

    function unpause()
        external
        whenPaused
        onlyPauserRole
        onlySufficientAuthorityLevel
    {
        _unpause();
        emit IPause.Unpaused(_msgSender());
    }

    function paused() external view returns (bool) {
        return _paused();
    }

    function authorityLevel() external view returns (uint256) {
        return _authorityLevel();
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IPause).interfaceId;
    }
}
