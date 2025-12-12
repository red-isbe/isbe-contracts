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

import {Common} from '../../../core/Common.sol';

// keccak256('isbe.contracts.mock.counter.resolver.key');
bytes32 constant _RESOLVER_KEY = 0x1d2001a5725b4c2a6cf5885d8aaad52e63d5efcab82525e12cda1a1a27550182;

// keccak256('isbe.contracts.counter.test.wrapper.storage');
bytes32 constant _STORAGE_POSITION = 0x3a79faacf1a0c9de5b1b6757af212b3d2990c5bf4a921a578c1bdab4cecda749;

abstract contract CounterFacetInternal is Common {
    struct CounterStorage {
        uint256 counter;
    }

    /// @notice Returns the storage slot for counter
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The counter storage struct
    function _counterStorage()
        internal
        pure
        returns (CounterStorage storage storage_)
    {
        bytes32 position = _STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
