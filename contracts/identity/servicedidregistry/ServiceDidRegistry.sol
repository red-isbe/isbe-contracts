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
    _SERVICE_DID_REGISTRY_FACET_VERSION
} from '../../constants/facetVersions.sol';
import {
    _SERVICE_DID_REGISTRY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../constants/roles.sol';
import {
    IDidDocumentDetailed
} from '../didregistry/interfaces/IDidDocumentDetailed.sol';
import {IServiceDidRegistry} from './interfaces/IServiceDidRegistry.sol';
import {ServiceDidRegistryInternal} from './ServiceDidRegistryInternal.sol';

/**
 * @title Service DID Registry
 * @notice Delegated operational identities for services, processes and autonomous
 *         agents, issued under the `did:isbe:svc` sub-namespace by an organisation
 *         already registered with `did:isbe`
 * @dev External surface of the facet. Every state-changing operation is authorised
 *      against the controller semantics of the organisational registry, so only the
 *      organisation that owns a service identity may operate on it. The chain of trust
 *      remains eIDAS to organisation to service, and no new governance is introduced.
 *
 *      EVENTS (decision D8): every event is emitted here, never in the internal layer,
 *      matching the convention of the organisational registry. Emission follows the
 *      internal call rather than preceding it, because each event carries values the
 *      internal layer computes. Whether it precedes or follows makes no observable
 *      difference: a revert in the internal call discards the log either way.
 *
 *      VALIDATION LAYOUT: modifiers are reserved for pause, authorisation and record
 *      state. Value validations live in a scoped block at the top of each body, the
 *      same shape `DidDocumentDetailed.insertFirstDidDocument` uses. This is not
 *      cosmetic: modifiers keep their temporaries alive for the whole frame, and with
 *      five parameters plus an eight-field event the function otherwise exhausts the
 *      sixteen reachable stack slots. The scoped block frees them at its closing brace.
 *
 *      PAUSABLE (decision D2): the four write operations carry `whenNotPaused`. Note
 *      that pause state lives in a single Diamond-wide slot, so pausing to contain an
 *      incident on this facet also halts every other pausable write of the Diamond.
 *      RFC-002 §4.6 needs rewording: pausing a single facet is not achievable with the
 *      current mechanism.
 * @author ISBE Development Team
 */
abstract contract ServiceDidRegistry is
    ServiceDidRegistryInternal,
    IServiceDidRegistry
{
    /// @notice Constructor that disables the initialiser
    constructor() {
        _disableInitializers(_SERVICE_DID_REGISTRY_RESOLVER_KEY);
    }

    /**
     * @dev Kept although it configures no state (decision D6): the versioned
     *      initialiser stamps the facet version in the Initializable slot, which is
     *      what later enables `reinitializer` migrations and the `onlyAfterVersion` /
     *      `onlyBeforeVersion` gates. Without it the stored version stays at zero and
     *      any future version gating would revert for every caller.
     */
    function initializeServiceDidRegistry()
        external
        override
        initializer(
            _SERVICE_DID_REGISTRY_RESOLVER_KEY,
            _SERVICE_DID_REGISTRY_FACET_VERSION
        )
        onlyRole(_DEFAULT_ADMIN_ROLE)
    {
        emit ServiceDidRegistryInitialized();
    }

    function registerServiceDid(
        bytes32 _controllerDid,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType,
        bytes32 _labelHash,
        uint256 _expiresAt
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_controllerDid)
        emptyBytes(_publicKey)
        validateEllipticType(_ellipticType)
        onlyDidExists(_controllerDid)
        onlyControllerOrAuth(_controllerDid)
        returns (bytes32 serviceDid)
    {
        ServiceDidRecord memory record;
        {
            _checkValidExpiry(_expiresAt);
            (bytes32 pubKeyX, bytes32 pubKeyY) = _splitPublicKey(_publicKey);
            _checkSigningKeyIsFree(pubKeyX, pubKeyY);
            (serviceDid, record) = _registerServiceDid(
                _controllerDid,
                pubKeyX,
                pubKeyY,
                _ellipticType,
                _labelHash,
                _expiresAt
            );
        }

        emit ServiceDidRegistered(
            serviceDid,
            record.controllerDid,
            record.pubKeyX,
            record.pubKeyY,
            record.ellipticType,
            record.labelHash,
            record.expiresAt,
            record.nonce
        );
    }

    function rotateSigningKey(
        bytes32 _serviceDid,
        bytes memory _newPublicKey,
        IDidDocumentDetailed.EllipticType _newEllipticType
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_serviceDid)
        emptyBytes(_newPublicKey)
        validateEllipticType(_newEllipticType)
        onlyServiceDidExists(_serviceDid)
        onlyServiceDidNotDeactivated(_serviceDid)
        onlyServiceDidController(_serviceDid)
        returns (bool success)
    {
        KeyRotation memory rotation = _rotateSigningKey(
            _serviceDid,
            _newPublicKey,
            _newEllipticType
        );

        emit ServiceDidKeyRotated(
            _serviceDid,
            rotation.oldPubKeyX,
            rotation.oldPubKeyY,
            rotation.newPubKeyX,
            rotation.newPubKeyY,
            _newEllipticType
        );
        return true;
    }

    function updateExpiry(
        bytes32 _serviceDid,
        uint256 _newExpiresAt
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_serviceDid)
        onlyServiceDidExists(_serviceDid)
        onlyServiceDidNotDeactivated(_serviceDid)
        onlyServiceDidController(_serviceDid)
        returns (bool success)
    {
        {
            _checkValidExpiry(_newExpiresAt);
        }

        emit ServiceDidExpiryUpdated(
            _serviceDid,
            _updateExpiry(_serviceDid, _newExpiresAt),
            _newExpiresAt
        );
        return true;
    }

    function deactivateServiceDid(
        bytes32 _serviceDid
    )
        external
        override
        whenNotPaused
        bytes32IsNotZero(_serviceDid)
        onlyServiceDidExists(_serviceDid)
        onlyServiceDidNotDeactivated(_serviceDid)
        onlyServiceDidController(_serviceDid)
        returns (bool success)
    {
        emit ServiceDidDeactivated(
            _serviceDid,
            _deactivateServiceDid(_serviceDid)
        );
        return true;
    }

    function getServiceDid(
        bytes32 _serviceDid
    )
        external
        view
        override
        onlyServiceDidExists(_serviceDid)
        returns (ServiceDidRecord memory record)
    {
        return _getServiceDid(_serviceDid);
    }

    function getServiceDidsByController(
        bytes32 _controllerDid,
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            ServiceDidRecord[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        return _getServiceDidsByController(_controllerDid, _page, _pageSize);
    }

    function isServiceDidActive(
        bytes32 _serviceDid
    ) external view override returns (bool active) {
        return _isActiveServiceDid(_serviceDid);
    }

    function signingKeyAddressOf(
        bytes32 _serviceDid
    )
        external
        view
        override
        onlyServiceDidExists(_serviceDid)
        returns (address signingKeyAddress)
    {
        return _signingKeyAddressOf(_serviceDid);
    }

    function computeServiceDid(
        bytes32 _controllerDid,
        uint64 _nonce
    ) external pure override returns (bytes32 serviceDid) {
        return _computeServiceDid(_controllerDid, _nonce);
    }
}
