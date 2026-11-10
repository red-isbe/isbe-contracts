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
import {IHashTimestampV2} from './IHashTimestampV2.sol';
import {IAccessControlEoa} from '../access/accessControl/IAccessControlEoa.sol';
import {
    IServiceDidRegistry
} from '../identity/servicedidregistry/interfaces/IServiceDidRegistry.sol';
import {
    ServiceDidRegistryInternal
} from '../identity/servicedidregistry/ServiceDidRegistryInternal.sol';

abstract contract HashTimestampV2Internal is ServiceDidRegistryInternal {
    /**
     * @dev DID records and account records are kept in separate mappings, so the two
     *      identity kinds share no key space and cannot collide. The account fields are
     *      appended after the original ones, keeping the existing layout.
     */
    struct HashTimestampV2Storage {
        mapping(bytes32 hash => mapping(bytes32 did => IHashTimestampV2.EvidenceRecord)) records;
        mapping(bytes32 hash => bytes32[] dids) didsByHash;
        mapping(bytes32 hash => mapping(address account => IHashTimestampV2.EvidenceRecord)) accountRecords;
        mapping(bytes32 hash => address[] accounts) accountsByHash;
    }

    /**
     * @dev Authorization runs before the duplicate check, so only an authorized signer of
     *      the entity learns through a transaction that the pair already exists.
     */
    function _timestampHash(
        bytes32 _serviceDid,
        bytes32 _hash,
        bytes32 _parentHash
    )
        internal
        returns (
            bytes32 did_,
            IHashTimestampV2.EvidenceRecord memory record_,
            bool alreadyRegistered_
        )
    {
        address signer = _msgSender();
        did_ = _entityDidOf(_serviceDid, signer);

        HashTimestampV2Storage storage $ = _hashTimestampV2Storage();
        IHashTimestampV2.EvidenceRecord storage slot = $.records[_hash][did_];
        if (_isRegistered(slot)) return (did_, slot, true);
        require(
            !_isNotEmptyBytes32(_parentHash) ||
                _isRegistered($.records[_parentHash][did_]),
            IHashTimestampV2.ParentNotRegistered(_parentHash, did_)
        );

        record_ = _storeRecord(slot, signer, _parentHash);
        $.didsByHash[_hash].push(did_);

        emit IHashTimestampV2.EvidenceRegistered(
            _hash,
            did_,
            signer,
            _serviceDid,
            _parentHash,
            record_.blockNumber,
            record_.timestamp
        );
    }

    /**
     * @dev The role must be granted to the sender address itself in this proxy
     *      (_hasEoaRole): the record is attributed to that account, so a role inherited
     *      from a DID the address resolves to does not authorise it. Entities use the
     *      service DID flow instead.
     */
    function _timestampHashWithRole(
        bytes32 _hash,
        bytes32 _parentHash
    )
        internal
        returns (
            IHashTimestampV2.EvidenceRecord memory record_,
            bool alreadyRegistered_
        )
    {
        address account = _msgSender();
        require(
            _hasEoaRole(_HASH_TIMESTAMP_ROLE, account),
            IAccessControlEoa.AccountHasNoRole(account, _HASH_TIMESTAMP_ROLE)
        );

        HashTimestampV2Storage storage $ = _hashTimestampV2Storage();
        IHashTimestampV2.EvidenceRecord storage slot = $.accountRecords[_hash][
            account
        ];
        if (_isRegistered(slot)) return (slot, true);
        require(
            !_isNotEmptyBytes32(_parentHash) ||
                _isRegistered($.accountRecords[_parentHash][account]),
            IHashTimestampV2.ParentNotRegisteredByAccount(_parentHash, account)
        );

        record_ = _storeRecord(slot, account, _parentHash);
        $.accountsByHash[_hash].push(account);

        emit IHashTimestampV2.EvidenceRegisteredByAccount(
            _hash,
            account,
            _parentHash,
            record_.blockNumber,
            record_.timestamp
        );
    }

    function _exists(bytes32 _hash, bytes32 _did) internal view returns (bool) {
        return _isRegistered(_hashTimestampV2Storage().records[_hash][_did]);
    }

    function _existsByAccount(
        bytes32 _hash,
        address _account
    ) internal view returns (bool) {
        return
            _isRegistered(
                _hashTimestampV2Storage().accountRecords[_hash][_account]
            );
    }

    function _getTimestamp(
        bytes32 _hash,
        bytes32 _did
    ) internal view returns (IHashTimestampV2.EvidenceRecord memory) {
        return _hashTimestampV2Storage().records[_hash][_did];
    }

    function _getTimestampByAccount(
        bytes32 _hash,
        address _account
    ) internal view returns (IHashTimestampV2.EvidenceRecord memory) {
        return _hashTimestampV2Storage().accountRecords[_hash][_account];
    }

    function _getRecordsCount(bytes32 _hash) internal view returns (uint256) {
        return _hashTimestampV2Storage().didsByHash[_hash].length;
    }

    function _getAccountRecordsCount(
        bytes32 _hash
    ) internal view returns (uint256) {
        return _hashTimestampV2Storage().accountsByHash[_hash].length;
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
        (uint256 start, uint256 size) = _page(
            all.length,
            _pageIndex,
            _pageLength
        );

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

    function _getAccountRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        internal
        view
        returns (
            address[] memory accounts_,
            IHashTimestampV2.EvidenceRecord[] memory records_
        )
    {
        HashTimestampV2Storage storage $ = _hashTimestampV2Storage();
        address[] storage all = $.accountsByHash[_hash];
        (uint256 start, uint256 size) = _page(
            all.length,
            _pageIndex,
            _pageLength
        );

        accounts_ = new address[](size);
        records_ = new IHashTimestampV2.EvidenceRecord[](size);
        for (uint256 index; index < size; ) {
            address account = all[start + index];
            accounts_[index] = account;
            records_[index] = $.accountRecords[_hash][account];
            unchecked {
                ++index;
            }
        }
    }

    /**
     * @dev Resolved at registration time: the record existing in block N proves the
     *      signer held the current key of an active service DID of the entity in block N,
     *      whatever happens later (rotation, expiry or deactivation).
     *
     *      Comparing the derived address with the sender is enough to bind the key: the
     *      address only matches when the sender holds the private key of those
     *      coordinates on the curve the network operates on.
     */
    function _entityDidOf(
        bytes32 _serviceDid,
        address _signer
    ) internal view returns (bytes32 did_) {
        IServiceDidRegistry.ServiceDidRecord memory record;
        if (_isUseCase()) {
            IServiceDidRegistry serviceDidRegistry = IServiceDidRegistry(
                address(_getIsbeFactory())
            );
            require(
                serviceDidRegistry.isServiceDidActive(_serviceDid),
                IHashTimestampV2.ServiceDidNotActive(_serviceDid)
            );
            record = serviceDidRegistry.getServiceDid(_serviceDid);
        } else {
            require(
                _isActiveServiceDid(_serviceDid),
                IHashTimestampV2.ServiceDidNotActive(_serviceDid)
            );
            record = _getServiceDid(_serviceDid);
        }
        require(
            _signingKeyAddress(record.pubKeyX, record.pubKeyY) == _signer,
            IHashTimestampV2.SignerNotServiceKey(_serviceDid, _signer)
        );
        did_ = record.controllerDid;
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

    /// @dev Shared by both flows: the record content never depends on the identity kind.
    function _storeRecord(
        IHashTimestampV2.EvidenceRecord storage _slot,
        address _signer,
        bytes32 _parentHash
    ) private returns (IHashTimestampV2.EvidenceRecord memory record_) {
        record_ = IHashTimestampV2.EvidenceRecord({
            signer: _signer,
            blockNumber: uint48(block.number),
            timestamp: uint48(_blockTimestamp()),
            parentHash: _parentHash
        });
        _slot.signer = record_.signer;
        _slot.blockNumber = record_.blockNumber;
        _slot.timestamp = record_.timestamp;
        _slot.parentHash = record_.parentHash;
    }

    function _isRegistered(
        IHashTimestampV2.EvidenceRecord storage _record
    ) private view returns (bool) {
        return _record.blockNumber != 0;
    }

    function _page(
        uint256 _total,
        uint256 _pageIndex,
        uint256 _pageLength
    ) private pure returns (uint256 start_, uint256 size_) {
        start_ = _pageIndex * _pageLength;
        uint256 end = start_ + _pageLength;
        if (end > _total) end = _total;
        size_ = start_ < end ? end - start_ : 0;
    }
}
