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
 * @notice Evidence registry ("registro de evidencia", proof of existence). Every record
 *         belongs to exactly one identity, of one of two kinds that never mix:
 *         - an entity DID, when registered through one of its service DIDs
 *           (timestampHashV2), or
 *         - an account (EOA) holding HASH_TIMESTAMP_ROLE in this proxy, when registered
 *           with timestampHashWithRoleV2. The account needs no DID and the record is
 *           attributed to the account itself, never to an organisation.
 * @dev Differences with the HashTimestamp template, per the functional specification:
 *      - Uniqueness per (hash, identity) instead of per hash, so several identities can
 *        register the same document and nobody can block a hash for others.
 *      - A duplicate of the same pair does not revert: it returns the existing record.
 *      - DID flow: the service DID must be active in the Service DID Registry and its
 *        current signing key must derive the signer address. No role is required: the
 *        entity DID is the controller of the service DID, read from the Service DID
 *        Registry, so a signer can only ever register evidence for the organisation that
 *        issued its service identity. That organisation must still be operative, i.e.
 *        hold at least one capabilityInvocation in force in the DID Registry: once all
 *        of them are revoked or expired, its service DIDs stop registering evidence
 *        even if they are not deactivated or expired themselves.
 *      - Account flow: the signer must hold HASH_TIMESTAMP_ROLE granted to its address
 *        (grantRole) in the access control of this same proxy. A role granted to a DID,
 *        or in another proxy such as the HashTimestamp v1 one, does not count. Both
 *        memberships are independent: an address can be granted the role even when its
 *        DID already holds it, and revoking either one leaves the other in place.
 *      DID records and account records live in separate mappings and are read with
 *      separate functions, so an account is never reported as a DID nor vice versa.
 */
interface IHashTimestampV2 {
    /**
     * @notice Evidence record of one (hash, identity) pair, packed in two storage slots
     * @param signer Address that sent the registration: the service DID key (DID flow)
     *        or the authorised account itself (account flow)
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
        bytes32 serviceDid,
        bytes32 parentHash,
        uint256 blockNumber,
        uint256 timestamp
    );

    /**
     * @notice Emitted once per (hash, account) pair registered through HASH_TIMESTAMP_ROLE;
     *         never for duplicates. The account is both the owner and the signer.
     */
    event EvidenceRegisteredByAccount(
        bytes32 indexed hash,
        address indexed account,
        bytes32 parentHash,
        uint256 blockNumber,
        uint256 timestamp
    );

    /// @notice The service DID does not exist, has expired or has been deactivated
    error ServiceDidNotActive(bytes32 serviceDid);

    /// @notice The signer is not the current signing key of the service DID
    error SignerNotServiceKey(bytes32 serviceDid, address signer);

    /// @notice The entity DID that controls the service DID holds no capabilityInvocation
    ///         in force: all of them have been revoked or have expired
    error OrganisationNotOperative(bytes32 did);

    /// @notice The parent hash was not registered by the same entity
    error ParentNotRegistered(bytes32 parentHash, bytes32 did);

    /// @notice The parent hash was not registered by the same account
    error ParentNotRegisteredByAccount(bytes32 parentHash, address account);

    /**
     * @notice Registers the evidence of a hash on behalf of the entity that controls the
     *         signer's service DID
     * @param serviceDid Service DID whose current signing key is the signer
     * @param hash SHA-256 of the document
     * @param parentHash Hash of the document this one derives from, registered by the
     *        same entity, or zero
     * @return did Entity DID the evidence is attributed to: the service DID controller
     * @return record The stored record (the existing one for a duplicate)
     * @return alreadyRegistered True when the pair was already registered
     */
    function timestampHashV2(
        bytes32 serviceDid,
        bytes32 hash,
        bytes32 parentHash
    )
        external
        returns (
            bytes32 did,
            EvidenceRecord memory record,
            bool alreadyRegistered
        );

    /**
     * @notice Registers the evidence of a hash on behalf of the sender, which must hold
     *         HASH_TIMESTAMP_ROLE as an account in this proxy. No DID is involved.
     * @param hash SHA-256 of the document
     * @param parentHash Hash of the document this one derives from, registered by the
     *        same account, or zero
     * @return record The stored record (the existing one for a duplicate)
     * @return alreadyRegistered True when the pair was already registered
     */
    function timestampHashWithRoleV2(
        bytes32 hash,
        bytes32 parentHash
    ) external returns (EvidenceRecord memory record, bool alreadyRegistered);

    /// @return exists_ True when the entity DID registered the hash
    function existsV2(
        bytes32 hash,
        bytes32 did
    ) external view returns (bool exists_);

    /// @return record The record of the (hash, DID) pair; blockNumber is zero when absent
    function getTimestampV2(
        bytes32 hash,
        bytes32 did
    ) external view returns (EvidenceRecord memory record);

    /// @return count Number of entity DIDs that registered this hash (accounts excluded)
    function getRecordsCountV2(
        bytes32 hash
    ) external view returns (uint256 count);

    /**
     * @notice Records of a hash from any entity DID, in registration order (accounts
     *         excluded: see getAccountRecordsV2)
     * @param pageIndex Zero-based page
     * @param pageLength Records per page
     */
    function getRecordsV2(
        bytes32 hash,
        uint256 pageIndex,
        uint256 pageLength
    )
        external
        view
        returns (bytes32[] memory dids, EvidenceRecord[] memory records);

    /// @return exists_ True when the account registered the hash through its role
    function existsByAccountV2(
        bytes32 hash,
        address account
    ) external view returns (bool exists_);

    /// @return record The record of the (hash, account) pair; blockNumber is zero when absent
    function getTimestampByAccountV2(
        bytes32 hash,
        address account
    ) external view returns (EvidenceRecord memory record);

    /// @return count Number of accounts that registered this hash through their role
    function getAccountRecordsCountV2(
        bytes32 hash
    ) external view returns (uint256 count);

    /**
     * @notice Records of a hash from any account (role flow), in registration order
     * @param pageIndex Zero-based page
     * @param pageLength Records per page
     */
    function getAccountRecordsV2(
        bytes32 hash,
        uint256 pageIndex,
        uint256 pageLength
    )
        external
        view
        returns (address[] memory accounts, EvidenceRecord[] memory records);
}
