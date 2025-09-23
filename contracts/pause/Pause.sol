// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import {PauseInternal} from './PauseInternal.sol';
import {IPause} from './IPause.sol';
import {_PAUSE_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {_PAUSE_VERSION} from '../constants/facetVersions.sol';

/// @title Pause
/// @notice Implements pausing mechanism
/// @dev Inherits from IPause and PauseInternal, providing external pause functions
abstract contract Pause is IPause, PauseInternal {
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(_PAUSE_RESOLVER_KEY, _PAUSE_VERSION);
    }

    function initializePause(
        bool _paused
    ) external initializer(_PAUSE_RESOLVER_KEY, _PAUSE_VERSION) {
        if (_paused) _pause();
        else _unpause();
    }

    function pause() external whenNotPaused {
        _checkPauserRoles();

        _pause();
        emit Paused(_msgSender());
    }

    function unpause() external whenPaused {
        _checkPauserRoles();
        _checkAuthorityLevel();

        _unpause();
        emit Unpaused(_msgSender());
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
