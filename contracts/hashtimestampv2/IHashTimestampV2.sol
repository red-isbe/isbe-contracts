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

/**
 * @title IHashTimestampV2
 * @notice Evidence registry ("registro de evidencia", proof of existence) attributed to
 *         the DID of the registering entity
 * @dev Differences with the HashTimestamp template, per the functional specification:
 *      - Uniqueness per (hash, DID) instead of per hash, so several entities can register
 *        the same document and nobody can block a hash for others.
 *      - A duplicate of the same pair does not revert: it returns the existing record.
 *      - The signer must hold an active assertionMethod relationship on the entity DID,
 *        and the entity DID must hold HASH_TIMESTAMP_ROLE (granted per entity).
 *      The entity DID is passed explicitly instead of being derived from the signer:
 *      a key may appear in more than one DID document, so the address-to-DID index of
 *      the registry cannot be used to attribute evidence.
 */
interface IHashTimestampV2 {
    /**
     * @notice Evidence record of one (hash, DID) pair, packed in two storage slots
     * @param signer Address of the assertionMethod key that registered the evidence
     * @param blockNumber Block in which the evidence was registered
     * @param timestamp Block timestamp: the evidence date, never a local clock
     * @param parentHash Hash this record derives from (stamped from original), or zero
     */
    struct EvidenceRecord {
        address signer;
        uint48 blockNumber;
        uint48 timestamp;
        bytes32 parentHash;
    }

    /**
     * @notice Emitted once per (hash, DID) pair; never for duplicates, so the original
     *         transaction can be recovered unambiguously from the logs
     */
    event EvidenceRegistered(
        bytes32 indexed hash,
        bytes32 indexed did,
        address indexed signer,
        bytes32 parentHash,
        uint256 blockNumber,
        uint256 timestamp
    );

    /// @notice The entity DID does not hold HASH_TIMESTAMP_ROLE in this use case
    error EntityNotRegistered(bytes32 did);

    /// @notice The signer is not an active assertionMethod key of the entity DID
    error SignerNotAssertionMethod(bytes32 did, address signer);

    /// @notice The parent hash was not registered by the same entity
    error ParentNotRegistered(bytes32 parentHash, bytes32 did);

    /**
     * @notice Registers the evidence of a hash on behalf of an entity DID
     * @param hash SHA-256 of the document
     * @param parentHash Hash of the document this one derives from, or zero
     * @param did Entity DID the signer acts for
     * @return record The stored record (the existing one for a duplicate)
     * @return alreadyRegistered True when the pair was already registered
     */
    function timestampHash(
        bytes32 hash,
        bytes32 parentHash,
        bytes32 did
    ) external returns (EvidenceRecord memory record, bool alreadyRegistered);

    function exists(
        bytes32 hash,
        bytes32 did
    ) external view returns (bool exists_);

    /// @return record The record of the pair; blockNumber is zero when it does not exist
    function getTimestamp(
        bytes32 hash,
        bytes32 did
    ) external view returns (EvidenceRecord memory record);

    /// @return count Number of entities that registered this hash
    function getRecordsCount(
        bytes32 hash
    ) external view returns (uint256 count);

    /**
     * @notice Records of a hash from any entity, in registration order
     * @param pageIndex Zero-based page
     * @param pageLength Records per page
     */
    function getRecords(
        bytes32 hash,
        uint256 pageIndex,
        uint256 pageLength
    )
        external
        view
        returns (bytes32[] memory dids, EvidenceRecord[] memory records);
}
