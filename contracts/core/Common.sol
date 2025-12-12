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

import {AccessControlInternal} from '../access/accessControl/AccessControlInternal.sol';
import {ERC165Internal} from './ERC165Internal.sol';
import {Initializable} from './Initializable.sol';
import {OwnableInternal} from '../access/ownable/OwnableInternal.sol';
import {PauseInternalCommon} from '../pause/PauseInternalCommon.sol';
import {BasicWhitelistInternal} from '../access/whitelist/basic/BasicWhitelistInternal.sol';

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
    OwnableInternal,
    BasicWhitelistInternal
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
}
