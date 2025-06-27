// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from './Initializable.sol';
import {
    AccessControlInternal
} from '../access/accessControl/AccessControlInternal.sol';
import {PauseInternalCommon} from '../pause/PauseInternalCommon.sol';
import {OwnableInternal} from '../access/ownable/OwnableInternal.sol';
import {ERC165Internal} from './ERC165Internal.sol';

/**
 * @title Common
 * @author ISBE
 * @notice A foundational abstract contract that bundles common functionalities and utility modifiers.
 * @dev This contract serves as a base layer for other contracts, inheriting from `Initializable`,
 * `ERC165Internal`, `AccessControlInternal`, `PauseInternalCommon`, and `OwnableInternal`.
 * It aggregates essential features like access control, pausable behaviour, and ownership,
 * and provides convenient modifiers for common validation checks to reduce boilerplate code.
 */
abstract contract Common is
    Initializable,
    ERC165Internal,
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
