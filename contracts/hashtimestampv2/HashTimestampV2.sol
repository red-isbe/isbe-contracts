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

import {IHashTimestampV2} from './IHashTimestampV2.sol';
import {HashTimestampV2Internal} from './HashTimestampV2Internal.sol';

/// @title HashTimestampV2
/// @notice Evidence registry attributed to entity DIDs (see IHashTimestampV2)
abstract contract HashTimestampV2 is IHashTimestampV2, HashTimestampV2Internal {
    function timestampHash(
        bytes32 _hash,
        bytes32 _parentHash,
        bytes32 _did
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_hash)
        bytes32IsNotZero(_did)
        returns (EvidenceRecord memory record_, bool alreadyRegistered_)
    {
        return _timestampHash(_hash, _parentHash, _did);
    }

    function exists(
        bytes32 _hash,
        bytes32 _did
    ) external view override returns (bool exists_) {
        return _exists(_hash, _did);
    }

    function getTimestamp(
        bytes32 _hash,
        bytes32 _did
    ) external view override returns (EvidenceRecord memory record_) {
        return _getTimestamp(_hash, _did);
    }

    function getRecordsCount(
        bytes32 _hash
    ) external view override returns (uint256 count_) {
        return _getRecordsCount(_hash);
    }

    function getRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        external
        view
        override
        returns (bytes32[] memory dids_, EvidenceRecord[] memory records_)
    {
        return _getRecords(_hash, _pageIndex, _pageLength);
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
        interfaces_[--interfacesLength] = type(IHashTimestampV2).interfaceId;
    }
}
