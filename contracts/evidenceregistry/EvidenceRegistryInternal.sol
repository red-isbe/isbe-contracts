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
    _EVIDENCE_REGISTRY_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {_HASH_TIMESTAMP_ROLE} from '../constants/roles.sol';
import {IEvidenceRegistry} from './IEvidenceRegistry.sol';
import {IAccessControlEoa} from '../access/accessControl/IAccessControlEoa.sol';
import {
    IServiceDidRegistry
} from '../identity/servicedidregistry/interfaces/IServiceDidRegistry.sol';
import {
    ServiceDidRegistryInternal
} from '../identity/servicedidregistry/ServiceDidRegistryInternal.sol';

abstract contract EvidenceRegistryInternal is ServiceDidRegistryInternal {
    /**
     * @dev DID records and account records are kept in separate mappings, so the two
     *      identity kinds share no key space and cannot collide. The account fields are
     *      appended after the original ones, keeping the existing layout.
     */
    struct EvidenceRegistryStorage {
        mapping(bytes32 hash => mapping(bytes32 did => IEvidenceRegistry.EvidenceRecord)) records;
        mapping(bytes32 hash => bytes32[] dids) didsByHash;
        mapping(bytes32 hash => mapping(address account => IEvidenceRegistry.EvidenceRecord)) accountRecords;
        mapping(bytes32 hash => address[] accounts) accountsByHash;
    }

    /**
     * @dev Authorization runs before the duplicate check, so only an authorized signer of
     *      the entity learns through a transaction that the pair already exists.
     */
    function _registerEvidence(
        bytes32 _serviceDid,
        bytes32 _hash,
        bytes32 _parentHash
    )
        internal
        returns (
            bytes32 did_,
            IEvidenceRegistry.EvidenceRecord memory record_,
            bool alreadyRegistered_
        )
    {
        address signer = _msgSender();
        did_ = _entityDidOf(_serviceDid, signer);

        EvidenceRegistryStorage storage $ = _evidenceRegistryStorage();
        IEvidenceRegistry.EvidenceRecord storage slot = $.records[_hash][did_];
        if (_isRegistered(slot)) return (did_, slot, true);
        require(
            !_isNotEmptyBytes32(_parentHash) ||
                _isRegistered($.records[_parentHash][did_]),
            IEvidenceRegistry.ParentNotRegistered(_parentHash, did_)
        );

        record_ = _storeRecord(slot, signer, _parentHash);
        $.didsByHash[_hash].push(did_);

        emit IEvidenceRegistry.EvidenceRegistered(
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
    function _registerEvidenceWithRole(
        bytes32 _hash,
        bytes32 _parentHash
    )
        internal
        returns (
            IEvidenceRegistry.EvidenceRecord memory record_,
            bool alreadyRegistered_
        )
    {
        address account = _msgSender();
        require(
            _hasEoaRole(_HASH_TIMESTAMP_ROLE, account),
            IAccessControlEoa.AccountHasNoRole(account, _HASH_TIMESTAMP_ROLE)
        );

        EvidenceRegistryStorage storage $ = _evidenceRegistryStorage();
        IEvidenceRegistry.EvidenceRecord storage slot = $.accountRecords[_hash][
            account
        ];
        if (_isRegistered(slot)) return (slot, true);
        require(
            !_isNotEmptyBytes32(_parentHash) ||
                _isRegistered($.accountRecords[_parentHash][account]),
            IEvidenceRegistry.ParentNotRegisteredByAccount(_parentHash, account)
        );

        record_ = _storeRecord(slot, account, _parentHash);
        $.accountsByHash[_hash].push(account);

        emit IEvidenceRegistry.EvidenceRegisteredByAccount(
            _hash,
            account,
            _parentHash,
            record_.blockNumber,
            record_.timestamp
        );
    }

    function _existsEvidence(
        bytes32 _hash,
        bytes32 _did
    ) internal view returns (bool) {
        return _isRegistered(_evidenceRegistryStorage().records[_hash][_did]);
    }

    function _existsEvidenceByAccount(
        bytes32 _hash,
        address _account
    ) internal view returns (bool) {
        return
            _isRegistered(
                _evidenceRegistryStorage().accountRecords[_hash][_account]
            );
    }

    function _getEvidenceRecord(
        bytes32 _hash,
        bytes32 _did
    ) internal view returns (IEvidenceRegistry.EvidenceRecord memory) {
        return _evidenceRegistryStorage().records[_hash][_did];
    }

    function _getEvidenceRecordByAccount(
        bytes32 _hash,
        address _account
    ) internal view returns (IEvidenceRegistry.EvidenceRecord memory) {
        return _evidenceRegistryStorage().accountRecords[_hash][_account];
    }

    function _getEvidenceRecordsCount(
        bytes32 _hash
    ) internal view returns (uint256) {
        return _evidenceRegistryStorage().didsByHash[_hash].length;
    }

    function _getAccountEvidenceRecordsCount(
        bytes32 _hash
    ) internal view returns (uint256) {
        return _evidenceRegistryStorage().accountsByHash[_hash].length;
    }

    function _getEvidenceRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        internal
        view
        returns (
            bytes32[] memory dids_,
            IEvidenceRegistry.EvidenceRecord[] memory records_
        )
    {
        EvidenceRegistryStorage storage $ = _evidenceRegistryStorage();
        bytes32[] storage all = $.didsByHash[_hash];
        (uint256 start, uint256 size) = _page(
            all.length,
            _pageIndex,
            _pageLength
        );

        dids_ = new bytes32[](size);
        records_ = new IEvidenceRegistry.EvidenceRecord[](size);
        for (uint256 index; index < size; ) {
            bytes32 did = all[start + index];
            dids_[index] = did;
            records_[index] = $.records[_hash][did];
            unchecked {
                ++index;
            }
        }
    }

    function _getAccountEvidenceRecords(
        bytes32 _hash,
        uint256 _pageIndex,
        uint256 _pageLength
    )
        internal
        view
        returns (
            address[] memory accounts_,
            IEvidenceRegistry.EvidenceRecord[] memory records_
        )
    {
        EvidenceRegistryStorage storage $ = _evidenceRegistryStorage();
        address[] storage all = $.accountsByHash[_hash];
        (uint256 start, uint256 size) = _page(
            all.length,
            _pageIndex,
            _pageLength
        );

        accounts_ = new address[](size);
        records_ = new IEvidenceRegistry.EvidenceRecord[](size);
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
     *
     *      `isServiceDidActive` does not evaluate the controlling organisation, so it is
     *      checked here as well:
     *      - Use case: through `serviceDidOf(signer)`, which applies the organisation
     *        cascade in the governance diamond and saves reading the whole DID document
     *        from here. Every service DID indexed under one address shares a controller
     *        (a key stays bound to the organisation that first claimed it), and the given
     *        service DID is active and indexed under the signer, so a non-zero result
     *        proves that its controller is operative. The result may be another service
     *        DID of the same organisation sharing the wallet, so it is not compared with
     *        the given one. Relies on the address index being backfilled: a service DID
     *        missing from it is rejected as not operative.
     *      - Governance diamond: `_isOrganisationOperative` on the controller, read from
     *        local storage, which is cheaper than walking the address index.
     */
    function _entityDidOf(
        bytes32 _serviceDid,
        address _signer
    ) internal view returns (bytes32 did_) {
        IServiceDidRegistry.ServiceDidRecord memory record;
        bool useCase = _isUseCase();
        if (useCase) {
            IServiceDidRegistry serviceDidRegistry = IServiceDidRegistry(
                address(_getIsbeFactory())
            );
            require(
                serviceDidRegistry.isServiceDidActive(_serviceDid),
                IEvidenceRegistry.ServiceDidNotActive(_serviceDid)
            );
            record = serviceDidRegistry.getServiceDid(_serviceDid);
        } else {
            require(
                _isActiveServiceDid(_serviceDid),
                IEvidenceRegistry.ServiceDidNotActive(_serviceDid)
            );
            record = _getServiceDid(_serviceDid);
        }
        require(
            _signingKeyAddress(record.pubKeyX, record.pubKeyY) == _signer,
            IEvidenceRegistry.SignerNotServiceKey(_serviceDid, _signer)
        );
        did_ = record.controllerDid;
        require(
            useCase
                ? _isNotEmptyBytes32(
                    IServiceDidRegistry(address(_getIsbeFactory()))
                        .serviceDidOf(_signer)
                )
                : _isOrganisationOperative(did_),
            IEvidenceRegistry.OrganisationNotOperative(did_)
        );
    }

    function _evidenceRegistryStorage()
        internal
        pure
        returns (EvidenceRegistryStorage storage storage_)
    {
        bytes32 position = _EVIDENCE_REGISTRY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

    /// @dev Shared by both flows: the record content never depends on the identity kind.
    function _storeRecord(
        IEvidenceRegistry.EvidenceRecord storage _slot,
        address _signer,
        bytes32 _parentHash
    ) private returns (IEvidenceRegistry.EvidenceRecord memory record_) {
        record_ = IEvidenceRegistry.EvidenceRecord({
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
        IEvidenceRegistry.EvidenceRecord storage _record
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
