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

import {IHashTimestamp} from './IHashTimestamp.sol';
import {HashTimestampInternal} from './HashTimestampInternal.sol';
import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';

/// @title HashTimestamp
/// @notice Implements timestamp for hashes
/// @dev Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions
abstract contract HashTimestamp is IHashTimestamp, HashTimestampInternal {
    function timestampHash(
        bytes32 _hash
    )
        external
        override
        onlyNonExistentHash(_hash)
        whenNotPaused
        onlyRole(_HASH_TIMESTAMP_ROLE)
    {
        _timestampHash(_hash);
    }

    function exists(bytes32 _hash) external view override returns (bool) {
        return _exists(_hash);
    }

    function getTimestamp(
        bytes32 _hash
    ) external view override returns (uint256) {
        return _getTimestamp(_hash);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IHashTimestamp).interfaceId;
    }
}
