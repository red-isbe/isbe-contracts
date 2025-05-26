// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {Context} from '@openzeppelin/contracts/utils/Context.sol';

abstract contract ISBEContext is Context {
    function _blockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
