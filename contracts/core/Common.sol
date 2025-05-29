// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from './Initializable.sol';
import {AccessControlInternal} from '../access/AccessControlInternal.sol';
import {PauseInternalCommon} from '../pause/PauseInternalCommon.sol';

abstract contract Common is
    Initializable,
    AccessControlInternal,
    PauseInternalCommon
{
    /**
     * @dev Emitted when the provided `addr` is 0
     *
     * @param addr The address to check
     */
    error AddressZero(address addr);

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
        require(addr != address(0), AddressZero(addr));
    }
}
