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

import {IEvidenceRegistry} from './IEvidenceRegistry.sol';
import {EvidenceRegistryInternal} from './EvidenceRegistryInternal.sol';

/// @title EvidenceRegistry
/// @notice Evidence registry attributed to entity DIDs or authorised accounts
///         (see IEvidenceRegistry)
abstract contract EvidenceRegistry is
    IEvidenceRegistry,
    EvidenceRegistryInternal
{
    function registerEvidence(
        bytes32 _serviceDid,
        bytes32 _hash,
        bytes32 _parentHash
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_hash)
        returns (
            bytes32 did_,
            EvidenceRecord memory record_,
            bool alreadyRegistered_
        )
    {
        return _registerEvidence(_serviceDid, _hash, _parentHash);
    }

    function registerEvidenceWithRole(
        bytes32 _hash,
        bytes32 _parentHash
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_hash)
        returns (EvidenceRecord memory record_, bool alreadyRegistered_)
    {
        return _registerEvidenceWithRole(_hash, _parentHash);
    }

    function existsEvidence(
        bytes32 _hash,
        bytes32 _did
    ) external view override returns (bool exists_) {
        return _existsEvidence(_hash, _did);
    }

    function getEvidenceRecord(
        bytes32 _hash,
        bytes32 _did
    ) external view override returns (EvidenceRecord memory record_) {
        return _getEvidenceRecord(_hash, _did);
    }

    function getEvidenceRecordsCount(
        bytes32 _hash
    ) external view override returns (uint256 count_) {
        return _getEvidenceRecordsCount(_hash);
    }

    function getEvidenceRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        external
        view
        override
        returns (bytes32[] memory dids_, EvidenceRecord[] memory records_)
    {
        return _getEvidenceRecords(_hash, _pageIndex, _pageLength);
    }

    function existsEvidenceByAccount(
        bytes32 _hash,
        address _account
    ) external view override returns (bool exists_) {
        return _existsEvidenceByAccount(_hash, _account);
    }

    function getEvidenceRecordByAccount(
        bytes32 _hash,
        address _account
    ) external view override returns (EvidenceRecord memory record_) {
        return _getEvidenceRecordByAccount(_hash, _account);
    }

    function getAccountEvidenceRecordsCount(
        bytes32 _hash
    ) external view override returns (uint256 count_) {
        return _getAccountEvidenceRecordsCount(_hash);
    }

    function getAccountEvidenceRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        external
        view
        override
        returns (address[] memory accounts_, EvidenceRecord[] memory records_)
    {
        return _getAccountEvidenceRecords(_hash, _pageIndex, _pageLength);
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
        interfaces_[--interfacesLength] = type(IEvidenceRegistry).interfaceId;
    }
}
