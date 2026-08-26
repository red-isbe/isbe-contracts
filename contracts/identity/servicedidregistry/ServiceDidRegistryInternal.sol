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
    _SERVICE_DID_REGISTRY_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {DidControllerInternal} from '../didregistry/DidControllerInternal.sol';
import {IDidController} from '../didregistry/interfaces/IDidController.sol';
import {
    IDidDocumentDetailed
} from '../didregistry/interfaces/IDidDocumentDetailed.sol';
import {IServiceDidRegistry} from './interfaces/IServiceDidRegistry.sol';
import {LibCommon} from '../../core/LibCommon.sol';

/**
 * @title Service DID Registry Internal Implementation
 * @notice Core internal logic of the delegated operational identity sub-namespace,
 *         holding the namespaced storage layout, the deterministic derivation of
 *         service identifiers and the lifecycle primitives
 * @dev Extends `DidControllerInternal` so that authorisation reuses the controller
 *      semantics of the organisational registry without duplicating them. Storage lives
 *      in its own namespaced slot; no existing storage structure is written to.
 *
 *      Reads for the audit: through that inheritance this facet READS four foreign
 *      namespaced slots — the DID document store, the controllers store, the
 *      verification relationships store and the access control store. It writes to
 *      none of them.
 *
 *      EVENTS (decision D8): this layer emits nothing. Every lifecycle primitive
 *      returns the values the external layer needs, and `ServiceDidRegistry.sol`
 *      performs the emission, matching the convention of the organisational registry.
 * @author ISBE Development Team
 */
abstract contract ServiceDidRegistryInternal is DidControllerInternal {
    /**
     * @notice Storage structure of the service DID registry
     * @param records Mapping from service identifier to its complete record
     * @param serviceDidsByController Mapping from organisational identifier to the
     *        service identifiers it has registered, in registration order
     * @param nonceByController Monotonic counter of registrations per controller. It is
     *        pre-incremented, so the first service identity of a controller carries
     *        nonce one and the counter always equals the last nonce consumed
     * @param serviceDidByPublicKeyHash Reverse index from the digest of the signing
     *        public key coordinates to the service identifier that claimed it. Entries
     *        are never removed, so key material is permanently bound to the first
     *        service identity that used it and can never be adopted by another one
     */
    struct ServiceDidRegistryStorage {
        // solhint-disable-next-line max-line-length
        mapping(bytes32 serviceDid => IServiceDidRegistry.ServiceDidRecord record) records;
        // solhint-disable-next-line max-line-length
        mapping(bytes32 controllerDid => bytes32[] serviceDids) serviceDidsByController;
        mapping(bytes32 controllerDid => uint64 nonce) nonceByController;
        // solhint-disable-next-line max-line-length
        mapping(bytes32 publicKeyHash => bytes32 serviceDid) serviceDidByPublicKeyHash;
    }

    /**
     * @notice Coordinates of a signing key before and after a rotation
     * @dev Internal to the facet, so it never reaches the ABI. Returned as a single
     *      memory pointer rather than four separate words because the external layer
     *      cannot hold four coordinates, three parameters and a named return on stack
     *      at once and still assemble the rotation event
     * @param oldPubKeyX The `x` coordinate of the superseded public key
     * @param oldPubKeyY The `y` coordinate of the superseded public key
     * @param newPubKeyX The `x` coordinate of the public key now in force
     * @param newPubKeyY The `y` coordinate of the public key now in force
     */
    struct KeyRotation {
        bytes32 oldPubKeyX;
        bytes32 oldPubKeyY;
        bytes32 newPubKeyX;
        bytes32 newPubKeyY;
    }

    /**
     * @notice Validates that the service identifier is registered
     * @param _serviceDid The service identifier to validate
     */
    modifier onlyServiceDidExists(bytes32 _serviceDid) {
        _checkServiceDidExists(_serviceDid);
        _;
    }

    /**
     * @notice Validates that the service identity has not been deactivated
     * @param _serviceDid The service identifier to validate
     */
    modifier onlyServiceDidNotDeactivated(bytes32 _serviceDid) {
        _checkServiceDidNotDeactivated(_serviceDid);
        _;
    }

    /**
     * @notice Validates that the caller controls the organisational identifier that
     *         owns the service identity
     * @param _serviceDid The service identifier whose controller is to be validated
     */
    modifier onlyServiceDidController(bytes32 _serviceDid) {
        _checkServiceDidController(_serviceDid);
        _;
    }

    function _registerServiceDid(
        bytes32 _controllerDid,
        bytes32 _pubKeyX,
        bytes32 _pubKeyY,
        IDidDocumentDetailed.EllipticType _ellipticType,
        bytes32 _labelHash,
        uint256 _expiresAt
    )
        internal
        returns (
            bytes32 serviceDid_,
            IServiceDidRegistry.ServiceDidRecord memory record_
        )
    {
        uint64 nonce = ++_serviceDidRegistryStorage().nonceByController[
            _controllerDid
        ];
        serviceDid_ = _computeServiceDid(_controllerDid, nonce);
        require(
            !_serviceDidRegistryStorage().records[serviceDid_].exists,
            IServiceDidRegistry.ServiceDidAlreadyExists(serviceDid_)
        );

        // Los campos se asignan uno a uno en lugar de con un literal de struct: un
        // literal exige que los once valores esten simultaneamente alcanzables en
        // pila, y con seis parametros vivos eso agota los dieciseis slots. Asignando
        // por campo, cada sentencia solo necesita el puntero y un valor.
        record_.controllerDid = _controllerDid;
        record_.labelHash = _labelHash;
        record_.pubKeyX = _pubKeyX;
        record_.pubKeyY = _pubKeyY;
        record_.expiresAt = uint64(_expiresAt);
        record_.ellipticType = _ellipticType;
        record_.nonce = nonce;
        record_.exists = true;
        record_.registeredAt = uint64(_blockTimestamp());
        record_.updatedAt = record_.registeredAt;

        _serviceDidRegistryStorage().records[serviceDid_] = record_;
        _serviceDidRegistryStorage()
            .serviceDidsByController[_controllerDid]
            .push(serviceDid_);
        _serviceDidRegistryStorage().serviceDidByPublicKeyHash[
            _publicKeyHash(_pubKeyX, _pubKeyY)
        ] = serviceDid_;
    }

    /**
     * @notice Replaces the signing key of a service identity
     * @dev Splits and validates the key material here rather than in the external
     *      layer, unlike registration, purely because of stack pressure: the rotation
     *      event carries four coordinates and the external frame cannot also hold them
     *      as locals. Both paths perform the same checks in the same order
     * @param _serviceDid The service identifier whose key is replaced
     * @param _newPublicKey The new signing public key material, 64 or 65 bytes
     * @param _newEllipticType Elliptic curve algorithm of the new signing public key
     * @return rotation_ The coordinates before and after the replacement
     */
    function _rotateSigningKey(
        bytes32 _serviceDid,
        bytes memory _newPublicKey,
        IDidDocumentDetailed.EllipticType _newEllipticType
    ) internal returns (KeyRotation memory rotation_) {
        (rotation_.newPubKeyX, rotation_.newPubKeyY) = _splitPublicKey(
            _newPublicKey
        );
        _checkSigningKeyIsFree(rotation_.newPubKeyX, rotation_.newPubKeyY);

        IServiceDidRegistry.ServiceDidRecord
            storage record = _serviceDidRegistryStorage().records[_serviceDid];
        rotation_.oldPubKeyX = record.pubKeyX;
        rotation_.oldPubKeyY = record.pubKeyY;

        _serviceDidRegistryStorage().serviceDidByPublicKeyHash[
            _publicKeyHash(rotation_.newPubKeyX, rotation_.newPubKeyY)
        ] = _serviceDid;
        record.pubKeyX = rotation_.newPubKeyX;
        record.pubKeyY = rotation_.newPubKeyY;
        record.ellipticType = _newEllipticType;
        record.updatedAt = uint64(_blockTimestamp());
    }

    function _updateExpiry(
        bytes32 _serviceDid,
        uint256 _newExpiresAt
    ) internal returns (uint256 oldExpiresAt_) {
        IServiceDidRegistry.ServiceDidRecord
            storage record = _serviceDidRegistryStorage().records[_serviceDid];
        oldExpiresAt_ = record.expiresAt;
        record.expiresAt = uint64(_newExpiresAt);
        record.updatedAt = uint64(_blockTimestamp());
    }

    function _deactivateServiceDid(
        bytes32 _serviceDid
    ) internal returns (bytes32 controllerDid_) {
        IServiceDidRegistry.ServiceDidRecord
            storage record = _serviceDidRegistryStorage().records[_serviceDid];
        record.deactivated = true;
        record.updatedAt = uint64(_blockTimestamp());
        controllerDid_ = record.controllerDid;
    }

    function _getServiceDid(
        bytes32 _serviceDid
    )
        internal
        view
        returns (IServiceDidRegistry.ServiceDidRecord memory record_)
    {
        return _serviceDidRegistryStorage().records[_serviceDid];
    }

    function _getServiceDidsByController(
        bytes32 _controllerDid,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            IServiceDidRegistry.ServiceDidRecord[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        ServiceDidRegistryStorage storage $ = _serviceDidRegistryStorage();
        bytes32[] storage serviceDids = $.serviceDidsByController[
            _controllerDid
        ];
        total_ = serviceDids.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            total_,
            _page,
            _pageSize
        );
        if (howMany_ == 0) return (items_, total_, howMany_, prev_, next_);
        items_ = new IServiceDidRegistry.ServiceDidRecord[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = $.records[serviceDids[cursor]];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /**
     * @notice Determines whether a service identity is currently usable
     * @dev An identity is active when it exists, has not been deactivated and either
     *      never expires or has not yet reached its expiry timestamp. The cascade of
     *      the organisational controller is deliberately not evaluated here and is
     *      resolved by the library resolver
     * @param _serviceDid The service identifier to evaluate
     * @return bool True when the service identity is currently usable
     */
    function _isActiveServiceDid(
        bytes32 _serviceDid
    ) internal view returns (bool) {
        IServiceDidRegistry.ServiceDidRecord
            storage record = _serviceDidRegistryStorage().records[_serviceDid];
        if (!record.exists || record.deactivated) return false;
        return record.expiresAt == 0 || _blockTimestamp() < record.expiresAt;
    }

    /**
     * @notice Derives the address of the signing key of a service identity
     * @dev Derived on read rather than stored: the address is a function of the
     *      coordinates, so keeping a copy would only create a second source of truth
     *      that a faulty rotation could leave disagreeing with the key itself. It would
     *      also cost a seventh storage slot, since neither packed slot has room for
     *      another 160 bits
     * @param _serviceDid The service identifier to look up
     * @return address The address derived from the stored coordinates
     */
    function _signingKeyAddressOf(
        bytes32 _serviceDid
    ) internal view returns (address) {
        IServiceDidRegistry.ServiceDidRecord
            storage record = _serviceDidRegistryStorage().records[_serviceDid];
        return _signingKeyAddress(record.pubKeyX, record.pubKeyY);
    }

    function _checkServiceDidExists(bytes32 _serviceDid) internal view {
        require(
            _serviceDidRegistryStorage().records[_serviceDid].exists,
            IServiceDidRegistry.ServiceDidNotFound(_serviceDid)
        );
    }

    function _checkServiceDidNotDeactivated(bytes32 _serviceDid) internal view {
        require(
            !_serviceDidRegistryStorage().records[_serviceDid].deactivated,
            IServiceDidRegistry.ServiceDidIsDeactivated(_serviceDid)
        );
    }

    /**
     * @notice Validates that the caller controls the organisational identifier owning
     *         the service identity
     * @dev Delegates to the controller semantics of the organisational registry, so the
     *      caller must hold an active capability invocation, within its validity window,
     *      on one of the controllers of the organisational identifier. A revoked
     *      organisational key therefore loses the ability to operate on its services.
     *
     *      Assumes the record exists: every call site applies `onlyServiceDidExists`
     *      first. Standalone, an unknown identifier would resolve `controllerDid` to
     *      zero and revert with a misleading `ControllerNotAuthorized(0x0, sender)`.
     * @param _serviceDid The service identifier whose controller is to be validated
     */
    function _checkServiceDidController(bytes32 _serviceDid) internal view {
        bytes32 controllerDid = _serviceDidRegistryStorage()
            .records[_serviceDid]
            .controllerDid;
        address sender = _msgSender();
        require(
            _isController(controllerDid, sender),
            IDidController.ControllerNotAuthorized(controllerDid, sender)
        );
    }

    /**
     * @notice Validates that the expiry timestamp is usable and storable
     * @dev Zero means no expiration. Any other value must be in the future and within
     *      the range the record stores, so that narrowing to `uint64` cannot silently
     *      turn a far-future timestamp into zero, which would read as "never expires"
     * @param _expiresAt The expiry timestamp to validate
     */
    function _checkValidExpiry(uint256 _expiresAt) internal view {
        require(
            _expiresAt == 0 ||
                (_expiresAt > _blockTimestamp() &&
                    _expiresAt <= type(uint64).max),
            IServiceDidRegistry.InvalidExpiry(_expiresAt)
        );
    }

    /**
     * @notice Validates that the signing key is free of any prior binding
     * @dev Two bindings are checked. The first is within this registry: a key claimed by
     *      any service identity, including one it has since rotated away from or one
     *      belonging to a deactivated service, can never be claimed again, which keeps
     *      historical signatures unambiguously attributable.
     *
     *      The second crosses into the organisational registry: a key that is an active
     *      capability invocation of a `did:isbe` cannot become a service signing key,
     *      because a signature produced by it would be attributable both to the
     *      organisation and to the service. `_didOf` is fed the address derived exactly
     *      as the organisational registry derives it, the keccak of the same 64
     *      coordinate bytes. That index only ever holds keys on the network curve, so a
     *      service key on any other curve simply never matches — which is correct,
     *      since such a key could not be a capability invocation in the first place
     * @param _pubKeyX The `x` coordinate of the signing public key
     * @param _pubKeyY The `y` coordinate of the signing public key
     */
    function _checkSigningKeyIsFree(
        bytes32 _pubKeyX,
        bytes32 _pubKeyY
    ) internal view {
        bytes32 claimedBy = _serviceDidRegistryStorage()
            .serviceDidByPublicKeyHash[_publicKeyHash(_pubKeyX, _pubKeyY)];
        require(
            !_isNotEmptyBytes32(claimedBy),
            IServiceDidRegistry.SigningKeyAlreadyInUse(_pubKeyX, _pubKeyY)
        );

        address signer = _signingKeyAddress(_pubKeyX, _pubKeyY);
        bytes32 organisationalDid = _didOf(signer);
        require(
            !_isNotEmptyBytes32(organisationalDid),
            IServiceDidRegistry.SigningKeyBoundToDid(
                _pubKeyX,
                _pubKeyY,
                organisationalDid
            )
        );
    }

    /**
     * @notice Derives the deterministic identifier of a service identity
     * @dev Uses `abi.encode` rather than `abi.encodePacked` so that the pre-image is
     *      unambiguous and trivially reproducible off-chain by the library
     * @param _controllerDid The organisational identifier in control of the service
     * @param _nonce The monotonic counter of the controller, starting at one
     * @return bytes32 The deterministic service identifier
     */
    function _computeServiceDid(
        bytes32 _controllerDid,
        uint64 _nonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_controllerDid, _nonce));
    }

    /**
     * @notice Splits public key material into its `x` and `y` coordinates
     * @dev Accepts the two encodings the organisational registry accepts: 65 bytes
     *      prefixed by the uncompressed point control byte `0x04`, or the 64 bytes of
     *      the coordinates on their own. Reducing both to the same pair of words means
     *      the same key cannot be presented under two encodings to obtain two distinct
     *      digests and thereby bypass the uniqueness index
     * @param _publicKey The signing public key material to split
     * @return pubKeyX_ The `x` coordinate
     * @return pubKeyY_ The `y` coordinate
     */
    function _splitPublicKey(
        bytes memory _publicKey
    ) internal pure returns (bytes32 pubKeyX_, bytes32 pubKeyY_) {
        uint256 length = _publicKey.length;
        uint256 offset;
        if (length == 65) {
            require(
                _publicKey[0] == 0x04,
                IDidDocumentDetailed.InvalidControlBytes()
            );
            offset = 1;
        } else {
            require(length == 64, IDidDocumentDetailed.InvalidPubKeyLength());
        }
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let dataPointer := add(_publicKey, add(0x20, offset))
            pubKeyX_ := mload(dataPointer)
            pubKeyY_ := mload(add(dataPointer, 0x20))
        }
        // slither-disable-end assembly
    }

    /**
     * @notice Derives the address the organisational registry would assign to a key
     * @dev `abi.encodePacked` of the two coordinates reproduces the 64-byte canonical
     *      encoding the organisational registry hashes, so both registries agree on the
     *      address of a given key
     * @param _pubKeyX The `x` coordinate of the public key
     * @param _pubKeyY The `y` coordinate of the public key
     * @return address The derived address
     */
    function _signingKeyAddress(
        bytes32 _pubKeyX,
        bytes32 _pubKeyY
    ) internal pure returns (address) {
        return
            address(
                uint160(
                    uint256(keccak256(abi.encodePacked(_pubKeyX, _pubKeyY)))
                )
            );
    }

    function _publicKeyHash(
        bytes32 _pubKeyX,
        bytes32 _pubKeyY
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_pubKeyX, _pubKeyY));
    }

    /**
     * @notice Returns the storage slot of the service DID registry
     * @dev Uses inline assembly to bind the storage struct to its namespaced slot.
     *      Declared internal so that test wrappers may reach the namespaced slot in
     *      order to exercise storage invariants that are unreachable through the
     *      external surface
     * @return storage_ The service DID registry storage struct
     */
    function _serviceDidRegistryStorage()
        internal
        pure
        returns (ServiceDidRegistryStorage storage storage_)
    {
        bytes32 position = _SERVICE_DID_REGISTRY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
