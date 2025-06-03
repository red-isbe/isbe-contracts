// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './ERC20InternalCommon.sol';
import {_ERC20_CAPPED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IERC20Capped} from './IERC20Capped.sol';

/// @title ERC20Capped
/// @notice Implements capped mechanism
/// @dev Inherits from IERC20Capped and ERC20InternalCommon
abstract contract ERC20Capped is IERC20Capped, ERC20InternalCommon {
    constructor() {
        _disableInitializers(_ERC20_CAPPED_RESOLVER_KEY);
    }

    function initializeCap(
        uint256 newCap
    ) external initializer(_ERC20_CAPPED_RESOLVER_KEY) {
        _setCap(newCap);
        emit CapSet(_msgSender(), newCap);
    }

    function setCap(uint256 newCap) public virtual {
        _setCap(newCap);
        emit CapSet(_msgSender(), newCap);
    }

    function cap() public view virtual returns (uint256) {
        return _cap();
    }
}
