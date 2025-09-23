// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../core/Common.sol';

// keccak256('isbe.contracts.mock.counter.resolver.key');
bytes32 constant _RESOLVER_KEY = 0x1d2001a5725b4c2a6cf5885d8aaad52e63d5efcab82525e12cda1a1a27550182;

uint256 constant _RESOLVER_VERSION = 1;

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
