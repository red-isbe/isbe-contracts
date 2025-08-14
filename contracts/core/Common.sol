// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControlInternal} from '../access/accessControl/AccessControlInternal.sol';
import {ERC165Internal} from './ERC165Internal.sol';
import {Initializable} from './Initializable.sol';
import {OwnableInternal} from '../access/ownable/OwnableInternal.sol';
import {PauseInternalCommon} from '../pause/PauseInternalCommon.sol';

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
     * @param _addr The address to check
     */
    modifier addressIsNotZero(address _addr) {
        _checkAddressIsNotZero(_addr);
        _;
    }

    modifier bytes32IsNotZero(bytes32 _hash) {
        _checkBytes32IsNotZero(_hash);
        _;
    }

    modifier emptyBytes(bytes memory _code) {
        _checkEmptyBytes(_code);
        _;
    }

    modifier emptyString(string memory _string) {
        _checkEmptyString(_string);
        _;
    }

    modifier emptyUint(uint256 _uint) {
        _checkUintIsNotZero(_uint);
        _;
    }

    modifier uintBetweenZeroAndEighteen(uint256 _uint) {
        _checkUintBetweenZeroAndEighteen(_uint);
        _;
    }
}
