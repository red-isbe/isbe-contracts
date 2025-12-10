// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../ERC203643InternalCommon.sol';

/// @title ERC203643Controller
/// @notice Implements unified force mechanism for both ERC20 and ERC3643 tokens
/// @dev Inherits from IERC203643Controller and ERC203643InternalCommon
///      Behavior adapts automatically based on token type through internal logic
abstract contract ERC203643ControllerInternal is ERC203643InternalCommon {
    function _forceBurn(address _from, uint256 _amount) internal {
        _burn(_from, _amount);
    }

    function _forceTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal returns (bool success) {
        _transfer(_from, _to, _amount);
        return true;
    }
}
