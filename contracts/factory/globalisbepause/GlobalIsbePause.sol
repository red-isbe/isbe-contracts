// SPDX-License-Identifier: UNLICENSED
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
        emit IsbePaused(_proxyAddress);
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
        emit IsbeUnpaused(_proxyAddress);
    }
}
