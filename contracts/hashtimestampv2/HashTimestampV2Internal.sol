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

import {
    _HASH_TIMESTAMP_V2_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';
import {_ASSERTION_RELATIONSHIP} from '../identity/didregistry/constants.sol';
import {IHashTimestampV2} from './IHashTimestampV2.sol';
import {
    DidDocumentDetailedInternal
} from '../identity/didregistry/DidDocumentDetailedInternal.sol';

abstract contract HashTimestampV2Internal is DidDocumentDetailedInternal {
    struct HashTimestampV2Storage {
        mapping(bytes32 hash => mapping(bytes32 did => IHashTimestampV2.EvidenceRecord)) records;
        mapping(bytes32 hash => bytes32[] dids) didsByHash;
    }

    /**
     * @dev Authorization runs before the duplicate check, so only an authorized signer of
     *      the entity learns through a transaction that the pair already exists.
     */
    function _timestampHash(
        bytes32 _hash,
        bytes32 _parentHash,
        bytes32 _did
    )
        internal
        returns (
            IHashTimestampV2.EvidenceRecord memory record_,
            bool alreadyRegistered_
        )
    {
        address signer = _msgSender();
        _checkEntityRegistered(_did);
        _checkSignerIsAssertionMethod(_did, signer);

        HashTimestampV2Storage storage $ = _hashTimestampV2Storage();
        record_ = $.records[_hash][_did];
        if (record_.blockNumber != 0) return (record_, true);

        if (_isNotEmptyBytes32(_parentHash)) {
            require(
                $.records[_parentHash][_did].blockNumber != 0,
                IHashTimestampV2.ParentNotRegistered(_parentHash, _did)
            );
        }

        uint256 timestamp = _blockTimestamp();
        record_ = IHashTimestampV2.EvidenceRecord({
            signer: signer,
            blockNumber: uint48(block.number),
            timestamp: uint48(timestamp),
            parentHash: _parentHash
        });
        $.records[_hash][_did] = record_;
        $.didsByHash[_hash].push(_did);

        emit IHashTimestampV2.EvidenceRegistered(
            _hash,
            _did,
            signer,
            _parentHash,
            block.number,
            timestamp
        );
    }

    function _exists(bytes32 _hash, bytes32 _did) internal view returns (bool) {
        return _hashTimestampV2Storage().records[_hash][_did].blockNumber != 0;
    }

    function _getTimestamp(
        bytes32 _hash,
        bytes32 _did
    ) internal view returns (IHashTimestampV2.EvidenceRecord memory) {
        return _hashTimestampV2Storage().records[_hash][_did];
    }

    function _getRecordsCount(bytes32 _hash) internal view returns (uint256) {
        return _hashTimestampV2Storage().didsByHash[_hash].length;
    }

    function _getRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        internal
        view
        returns (
            bytes32[] memory dids_,
            IHashTimestampV2.EvidenceRecord[] memory records_
        )
    {
        HashTimestampV2Storage storage $ = _hashTimestampV2Storage();
        bytes32[] storage all = $.didsByHash[_hash];
        uint256 start = _pageIndex * _pageLength;
        uint256 end = start + _pageLength;
        if (end > all.length) end = all.length;
        uint256 size = start < end ? end - start : 0;

        dids_ = new bytes32[](size);
        records_ = new IHashTimestampV2.EvidenceRecord[](size);
        for (uint256 index; index < size; ) {
            bytes32 did = all[start + index];
            dids_[index] = did;
            records_[index] = $.records[_hash][did];
            unchecked {
                ++index;
            }
        }
    }

    /// @dev Entity onboarding is per DID (spec H1/H2), never per key.
    function _checkEntityRegistered(bytes32 _did) internal view {
        require(
            _hasDidRole(_HASH_TIMESTAMP_ROLE, _did),
            IHashTimestampV2.EntityNotRegistered(_did)
        );
    }

    /**
     * @dev Checked at registration time: the record existing in block N proves the key
     *      was an active assertionMethod of the DID in block N, whatever happens later.
     */
    function _checkSignerIsAssertionMethod(
        bytes32 _did,
        address _signer
    ) internal view {
        bool active = _isUseCase()
            ? _getIsbeFactory().hasActiveRelationship(
                _did,
                _ASSERTION_RELATIONSHIP,
                _signer
            )
            : _hasActiveRelationship(_did, _ASSERTION_RELATIONSHIP, _signer);
        require(
            active,
            IHashTimestampV2.SignerNotAssertionMethod(_did, _signer)
        );
    }

    function _hashTimestampV2Storage()
        internal
        pure
        returns (HashTimestampV2Storage storage storage_)
    {
        bytes32 position = _HASH_TIMESTAMP_V2_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
