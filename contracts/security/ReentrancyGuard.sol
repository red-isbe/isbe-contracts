// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {_REENTRANCY_GUARD_POSITION} from '../constants/storagePositions.sol';

abstract contract ReentrancyGuard {
    struct ReentrancyGuardStorage {
        mapping(bytes32 => uint256) status;
    }

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    error ReentrantNotAllowed(bytes32 reentrantKey);

    modifier nonReentrant(bytes32 _reentrantKey) {
        _nonReentrantBefore(_reentrantKey);
        _;
        _nonReentrantAfter(_reentrantKey);
    }

    function _nonReentrantBefore(bytes32 _reentrantKey) internal {
        if (_reentrancyGuardStorage().status[_reentrantKey] == _ENTERED) {
            revert ReentrantNotAllowed(_reentrantKey);
        }

        _reentrancyGuardStorage().status[_reentrantKey] = _ENTERED;
    }

    function _nonReentrantAfter(bytes32 _reentrantKey) internal {
        _reentrancyGuardStorage().status[_reentrantKey] = _NOT_ENTERED;
    }

    function _reentrancyGuardStorage()
        private
        pure
        returns (ReentrancyGuardStorage storage storage_)
    {
        bytes32 position = _REENTRANCY_GUARD_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
