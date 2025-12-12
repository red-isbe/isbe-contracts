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
