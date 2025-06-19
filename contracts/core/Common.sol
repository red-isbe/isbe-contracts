// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from './Initializable.sol';
import {
    AccessControlInternal
} from '../access/accessControl/AccessControlInternal.sol';
import {PauseInternalCommon} from '../pause/PauseInternalCommon.sol';
import {OwnableInternal} from '../access/ownable/OwnableInternal.sol';

abstract contract Common is
    Initializable,
    AccessControlInternal,
    PauseInternalCommon,
    OwnableInternal
{
    /**
     * @dev Checks if an address equals to zero address
     *
     * @param addr The address to check
     */
    modifier addressIsNotZero(address addr) {
        _addressIsNotZero(addr);
        _;
    }

    modifier bytes32IsNotZero(bytes32 hash) {
        _bytes32IsNotZero(hash);
        _;
    }

    modifier emptyCode(bytes memory code) {
        _emptyBytes(code);
        _;
    }
}
