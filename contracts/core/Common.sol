// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from './Initializable.sol';
import {ISBEContext} from '../utils/ISBEContext.sol';

import {ICommon} from './ICommon.sol';

abstract contract Common is ICommon, Initializable, ISBEContext {
    /**
     * @dev Checks if an address equals to zero address
     *
     * @param addr The address to check
     */
    modifier addressIsNotZero(address addr) {
        _addressIsNotZero(addr);
        _;
    }

    /**
     * @dev Checks if an address equals to zero address
     *
     * @param addr The address to check
     */
    function _addressIsNotZero(address addr) internal pure {
        if (addr == address(0)) revert AddressZero(addr);
    }
}
