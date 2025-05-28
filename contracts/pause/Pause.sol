// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {PauseInternal} from './PauseInternal.sol';
import {IPause} from './IPause.sol';
import {_PAUSE_RESOLVER_KEY} from '../constants/resolverKeys.sol';

contract Pause is IPause, PauseInternal {
    constructor() {
        _disableInitializers(_PAUSE_RESOLVER_KEY);
    }

    function initialize() external initializer(_PAUSE_RESOLVER_KEY) {
        _unpause();
    }

    function pause() external virtual whenNotPaused {
        _pause();
        emit Paused(_msgSender());
    }

    function unpause() external virtual whenPaused checkAuthorityLevel {
        _unpause();
        emit Unpaused(_msgSender());
    }

    function paused() external view virtual returns (bool) {
        return _paused();
    }
}
