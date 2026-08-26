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
    IDidDocumentDetailed
} from '../../didregistry/interfaces/IDidDocumentDetailed.sol';

/**
 * @title Service DID Registry Interface
 * @notice Interface for the delegated operational identity sub-namespace `did:isbe:svc`,
 *         allowing an organisation already registered with `did:isbe` to issue
 *         programmatic identities for services, pipelines and autonomous agents
 * @dev Every service identity is permanently bound to a controlling organisational DID.
 *      The chain of trust remains eIDAS to `did:isbe` (organisation) to `did:isbe:svc`
 *      (service), so no additional onboarding is required. Identifiers are deterministic
 *      and traceable to their controller, and their lifecycle (registration, key
 *      rotation, expiry and deactivation) is entirely programmatic.
 *
 *      A service identity does NOT resolve on-chain (decision D1): its key is never
 *      written to the organisational registry's address index, so `didOf` returns zero
 *      for it and it cannot satisfy `onlyKnownDid` nor hold DID-based roles. Service
 *      identities exist to sign payloads off-chain and are verified through the resolver.
 * @author ISBE Development Team
 */
interface IServiceDidRegistry {
    /**
     * @notice Complete on-chain record of a service decentralised identifier
     * @dev The signing key is held as the `x` and `y` coordinates of its public key
     *      rather than as a derived address, because the resolver must be able to emit
     *      a complete W3C verification method for both supported curves. An Ethereum
     *      address is a truncated hash of the public key and therefore cannot be
     *      inverted into the coordinates a `JsonWebKey2020` entry requires. Holding
     *      them as two fixed words rather than a dynamic array also removes the length
     *      slot and the memory copy that a `bytes` member would cost.
     *
     *      Layout occupies six storage slots:
     *        0  controllerDid
     *        1  labelHash
     *        2  pubKeyX
     *        3  pubKeyY
     *        4  expiresAt, ellipticType, nonce, deactivated, exists, registeredAt
     *        5  updatedAt
     * @param controllerDid The organisational decentralised identifier in control
     * @param labelHash Digest of the human-readable label, whose plain text is held
     *        off-chain by the portal to keep registration gas independent of its length
     * @param pubKeyX The `x` coordinate of the signing public key
     * @param pubKeyY The `y` coordinate of the signing public key
     * @param expiresAt Unix timestamp after which the service identity is no longer
     *        valid, or zero to indicate that it never expires
     * @param ellipticType Elliptic curve algorithm of the signing public key. Recorded
     *        per key rather than assumed from the network, so that a resolver, an
     *        indexer or a log consumer can build the verification method from the record
     *        alone. The curve is only required to be a supported one: unlike an
     *        organisational key, a service key never derives an address that transacts,
     *        so it need not match the curve the network operates on
     * @param nonce Monotonic counter of the controller at the time of registration,
     *        starting at one
     * @param deactivated Whether the controller has permanently deactivated the record
     * @param exists Whether the record has been registered in storage
     * @param registeredAt Timestamp of the registration
     * @param updatedAt Timestamp of the most recent lifecycle operation
     */
    struct ServiceDidRecord {
        bytes32 controllerDid;
        bytes32 labelHash;
        bytes32 pubKeyX;
        bytes32 pubKeyY;
        uint64 expiresAt;
        IDidDocumentDetailed.EllipticType ellipticType;
        uint64 nonce;
        bool deactivated;
        bool exists;
        uint64 registeredAt;
        uint64 updatedAt;
    }

    /**
     * @notice Emitted once when the service DID registry facet is initialised
     */
    event ServiceDidRegistryInitialized();

    /**
     * @notice Emitted when a new service decentralised identifier is registered
     * @dev Carries every field a consumer needs to build the W3C verification method
     *      from the log alone. Clients read `serviceDid` from here rather than
     *      anticipating it, because the nonce is consumed on-chain and two concurrent
     *      registrations by the same controller cannot both predict it (decision D10)
     * @param serviceDid The deterministic identifier assigned to the service
     * @param controllerDid The organisational identifier in control of the service
     * @param pubKeyX The `x` coordinate of the signing public key
     * @param pubKeyY The `y` coordinate of the signing public key
     * @param ellipticType Elliptic curve algorithm of the signing public key
     * @param labelHash Digest of the human-readable label of the service
     * @param expiresAt Unix timestamp of expiry, or zero when it never expires
     * @param nonce Monotonic counter of the controller used to derive the identifier
     */
    event ServiceDidRegistered(
        bytes32 indexed serviceDid,
        bytes32 indexed controllerDid,
        bytes32 pubKeyX,
        bytes32 pubKeyY,
        IDidDocumentDetailed.EllipticType ellipticType,
        bytes32 labelHash,
        uint256 expiresAt,
        uint64 nonce
    );

    /**
     * @notice Emitted when the signing key of a service identity is rotated
     * @dev The replacement is atomic and has no overlap period: signatures produced by
     *      the superseded key stop validating the moment this event is emitted
     * @param serviceDid The service identifier whose signing key has been replaced
     * @param oldPubKeyX The `x` coordinate of the superseded public key
     * @param oldPubKeyY The `y` coordinate of the superseded public key
     * @param newPubKeyX The `x` coordinate of the public key now in force
     * @param newPubKeyY The `y` coordinate of the public key now in force
     * @param ellipticType Elliptic curve algorithm of the new signing public key
     */
    event ServiceDidKeyRotated(
        bytes32 indexed serviceDid,
        bytes32 oldPubKeyX,
        bytes32 oldPubKeyY,
        bytes32 newPubKeyX,
        bytes32 newPubKeyY,
        IDidDocumentDetailed.EllipticType ellipticType
    );

    /**
     * @notice Emitted when the expiry timestamp of a service identity is changed
     * @param serviceDid The service identifier whose expiry has been changed
     * @param oldExpiresAt The expiry timestamp that has been superseded
     * @param newExpiresAt The expiry timestamp now in force
     */
    event ServiceDidExpiryUpdated(
        bytes32 indexed serviceDid,
        uint256 oldExpiresAt,
        uint256 newExpiresAt
    );

    /**
     * @notice Emitted when a service identity is permanently deactivated
     * @param serviceDid The service identifier that has been deactivated
     * @param controllerDid The organisational identifier that ordered the deactivation
     */
    event ServiceDidDeactivated(
        bytes32 indexed serviceDid,
        bytes32 indexed controllerDid
    );

    /**
     * @notice Raised when registering a service identifier that is already present
     * @dev Given that identifiers are derived from a monotonic counter this condition
     *      is unreachable through normal operation, and acts as a storage invariant
     * @param serviceDid The service identifier that already exists
     */
    error ServiceDidAlreadyExists(bytes32 serviceDid);

    /**
     * @notice Raised when operating on a service identifier that is not registered
     * @param serviceDid The service identifier that does not exist
     */
    error ServiceDidNotFound(bytes32 serviceDid);

    /**
     * @notice Raised when operating on a service identity that has been deactivated
     * @dev Deactivation is final, so no lifecycle operation may follow it
     * @param serviceDid The service identifier that has been deactivated
     */
    error ServiceDidIsDeactivated(bytes32 serviceDid);

    /**
     * @notice Raised when the signing key has already been claimed by a service
     * @dev Prevents two service identities from sharing cryptographic material, which
     *      would make signatures ambiguous as to their originating identity. The binding
     *      is permanent: a key that has been rotated away from, or that belonged to a
     *      service that was later deactivated, can never be claimed again
     * @param pubKeyX The `x` coordinate of the public key that is already claimed
     * @param pubKeyY The `y` coordinate of the public key that is already claimed
     */
    error SigningKeyAlreadyInUse(bytes32 pubKeyX, bytes32 pubKeyY);

    /**
     * @notice Raised when the signing key already belongs to an organisational identity
     * @dev The uniqueness index of this registry only spans service identities. Without
     *      this check a key that is an active capability invocation of a `did:isbe`
     *      could also be claimed as a service signing key, and a signature produced by
     *      it would be attributable both to the organisation and to the service — the
     *      very ambiguity the index exists to prevent, on the other side of the boundary
     * @param pubKeyX The `x` coordinate of the public key that is already bound
     * @param pubKeyY The `y` coordinate of the public key that is already bound
     * @param did The organisational identifier the key already belongs to
     */
    error SigningKeyBoundToDid(bytes32 pubKeyX, bytes32 pubKeyY, bytes32 did);

    /**
     * @notice Raised when the supplied expiry timestamp is not usable
     * @dev A valid expiry is either zero, meaning that the identity never expires, or a
     *      timestamp strictly greater than the current block timestamp and within the
     *      range the record stores. Note that this makes immediate expiry unreachable:
     *      bringing a service identity to an end requires `deactivateServiceDid`, which
     *      is irreversible
     * @param expiresAt The expiry timestamp that was supplied
     */
    error InvalidExpiry(uint256 expiresAt);

    /**
     * @notice Initialises the service DID registry facet
     * @dev Guarded by the versioned initialiser and restricted to the default admin
     *      role, because the facet is added to an already deployed diamond. It
     *      configures no state: its purpose is to stamp the facet version so that
     *      later migrations and version gates have a baseline
     */
    function initializeServiceDidRegistry() external;

    /**
     * @notice Registers a new service identity under an organisational identifier
     * @dev The caller must hold an active capability invocation on a controller of the
     *      organisational identifier. The identifier is derived on-chain from the
     *      controller and its next nonce, and is reported by the `ServiceDidRegistered`
     *      event; `computeServiceDid` reproduces the same derivation off-chain
     * @param controllerDid The organisational identifier that will control the service
     * @param publicKey The signing public key material, either 64 bytes of coordinates
     *        or 65 bytes prefixed by the uncompressed point control byte `0x04`. It is
     *        split into its `x` and `y` coordinates before being stored
     * @param ellipticType Elliptic curve algorithm of the signing public key, which
     *        must be a supported one
     * @param labelHash Digest of the human-readable label of the service
     * @param expiresAt Unix timestamp of expiry, or zero when it never expires
     * @return serviceDid The deterministic identifier assigned to the service
     */
    function registerServiceDid(
        bytes32 controllerDid,
        bytes memory publicKey,
        IDidDocumentDetailed.EllipticType ellipticType,
        bytes32 labelHash,
        uint256 expiresAt
    ) external returns (bytes32 serviceDid);

    /**
     * @notice Replaces the signing key of an existing service identity
     * @dev One service identity holds exactly one signing key at a time, so the
     *      previous key ceases to be valid as soon as this operation completes
     * @param serviceDid The service identifier whose signing key is to be replaced
     * @param newPublicKey The new signing public key material, 64 or 65 bytes
     * @param newEllipticType Elliptic curve algorithm of the new signing public key
     * @return success Boolean indicating whether the operation completed successfully
     */
    function rotateSigningKey(
        bytes32 serviceDid,
        bytes memory newPublicKey,
        IDidDocumentDetailed.EllipticType newEllipticType
    ) external returns (bool success);

    /**
     * @notice Changes the expiry timestamp of an existing service identity
     * @param serviceDid The service identifier whose expiry is to be changed
     * @param newExpiresAt Unix timestamp of expiry, or zero when it never expires
     * @return success Boolean indicating whether the operation completed successfully
     */
    function updateExpiry(
        bytes32 serviceDid,
        uint256 newExpiresAt
    ) external returns (bool success);

    /**
     * @notice Permanently deactivates a service identity
     * @dev Only the organisational controller may deactivate its own service
     *      identities. The operation is final and cannot be reversed
     * @param serviceDid The service identifier to deactivate
     * @return success Boolean indicating whether the operation completed successfully
     */
    function deactivateServiceDid(
        bytes32 serviceDid
    ) external returns (bool success);

    /**
     * @notice Retrieves the complete record of a service identity
     * @dev Reverts with `ServiceDidNotFound` for unregistered identifiers (decision
     *      D11); callers that need to probe without reverting should use
     *      `isServiceDidActive`. Registered records are returned verbatim, including
     *      expired and deactivated ones, so that callers may apply their own validity
     *      policy. Temporal and cascade filtering is the responsibility of the resolver.
     *
     *      Resolver note: because `isServiceDidActive` reports false both for unknown
     *      and for deactivated or expired identities, and W3C resolution distinguishes
     *      `notFound` from `deactivated`, the library must call this getter inside a
     *      try/catch and inspect the record when it succeeds
     * @param serviceDid The service identifier to retrieve
     * @return record The complete stored record of the service identity
     */
    function getServiceDid(
        bytes32 serviceDid
    ) external view returns (ServiceDidRecord memory record);

    /**
     * @notice Retrieves a paginated list of the service identities of a controller
     * @dev Pages are one-based, matching the remaining paginated getters of the
     *      registry. `pageSize` must be greater than zero. Records are returned
     *      verbatim, without validity filtering. `total` is returned alongside the page,
     *      which is why this registry exposes no separate count getter
     * @param controllerDid The organisational identifier to query for
     * @param page The page number to retrieve, starting from one
     * @param pageSize The maximum number of items per page
     * @return items Array of service identity records for the requested page
     * @return total Total number of service identities of this controller
     * @return howMany Number of items returned in the current page
     * @return prev Previous page number
     * @return next Next page number
     */
    function getServiceDidsByController(
        bytes32 controllerDid,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            ServiceDidRecord[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Reports whether a service identity is currently usable
     * @dev True when the identity exists, has not been deactivated and either never
     *      expires or has not yet reached its expiry timestamp. Unknown identifiers
     *      report false rather than reverting, so that callers may probe freely. The
     *      cascade of the organisational controller is deliberately not evaluated here
     *      and remains the responsibility of the resolver
     * @param serviceDid The service identifier to evaluate
     * @return active True when the service identity is currently usable
     */
    function isServiceDidActive(
        bytes32 serviceDid
    ) external view returns (bool active);

    /**
     * @notice Derives the identifier that a controller and nonce produce
     * @dev Exposed so that libraries and clients can reproduce a known identifier
     *      off-chain. Nonces start at one. The derivation is
     *      `keccak256(abi.encode(controllerDid, nonce))`.
     *
     *      This is a reproduction helper, not a prediction one: the nonce a pending
     *      registration will consume cannot be known in advance, because two concurrent
     *      registrations by the same controller read the same counter and only one of
     *      them gets it. Clients read the assigned identifier from the
     *      `ServiceDidRegistered` event (decision D10)
     * @param controllerDid The organisational identifier in control of the service
     * @param nonce The monotonic counter of the controller
     * @return serviceDid The deterministic service identifier
     */
    function computeServiceDid(
        bytes32 controllerDid,
        uint64 nonce
    ) external pure returns (bytes32 serviceDid);
}
