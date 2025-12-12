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

import {GlobalIsbePauseInternal} from './GlobalIsbePauseInternal.sol';
import {IGlobalIsbePause} from './IGlobalIsbePause.sol';
import {ISBEPause} from '../../pause/ISBEPause.sol';
import {_ISBE_PAUSER_ROLE} from '../../constants/roles.sol';

/**
 * @title Global ISBE Pausable Contract
 * @author ISBE
 * @notice Provides the public implementation for the global pausing mechanism.
 * @dev This abstract contract implements the `IGlobalIsbePause` interface.
 *      It secures the pause and unpause functions with role-based access
 *      control, ensuring only authorised accounts (`_ISBE_PAUSER_ROLE`)
 *      can manage the state of registered proxies.
 */
abstract contract GlobalIsbePause is GlobalIsbePauseInternal, IGlobalIsbePause {
    function pauseIsbe(
        address _proxyAddress
    )
        external
        override
        onlyRole(_ISBE_PAUSER_ROLE)
        addressIsNotZero(_proxyAddress)
        onlyDeployedProxy(_proxyAddress)
    {
        ISBEPause(_proxyAddress).pause();
        emit IsbePaused(_proxyAddress, _msgSender());
    }

    function unpauseIsbe(
        address _proxyAddress
    )
        external
        override
        onlyRole(_ISBE_PAUSER_ROLE)
        addressIsNotZero(_proxyAddress)
        onlyDeployedProxy(_proxyAddress)
    {
        ISBEPause(_proxyAddress).unpause();
        emit IsbeUnpaused(_proxyAddress, _msgSender());
    }
}
