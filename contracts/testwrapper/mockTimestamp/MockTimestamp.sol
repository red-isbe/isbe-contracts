// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IMockTimestamp} from './IMockTimestamp.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

contract MockTimestamp is IMockTimestamp, ISBEContext {
    uint256 private _mockedTimestamp;

    function setMockedTimestamp(uint256 _ts) external {
        _mockedTimestamp = _ts;
    }

    function _blockTimestamp()
        internal
        view
        virtual
        override
        returns (uint256)
    {
        return
            _mockedTimestamp == 0 ? super._blockTimestamp() : _mockedTimestamp;
    }
}
