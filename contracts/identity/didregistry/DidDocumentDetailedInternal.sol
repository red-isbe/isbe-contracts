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
    _AUTHENTICATION_RELATIONSHIP,
    _CAPABILITY_INVOCATION_RELATIONSHIP
} from './constants.sol';
import {
    _recoverSigner,
    InvalidSignature
} from '../../core/signatureVerification.sol';
import {Common} from '../../core/Common.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {IDidVerificationMethod} from './interfaces/IDidVerificationMethod.sol';
import {
    IDidVerificationRelationship
} from './interfaces/IDidVerificationRelationship.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {VRelationshipsInternal} from './VRelationshipsInternal.sol';
import {
    _DID_DOCUMENT_DETAILED_STORAGE_POSITION
} from '../../constants/storagePositions.sol';

/**
 * @title Decentralised Identity Document Internal Implementation
 * @notice Core internal logic for managing W3C-compliant DID documents with cryptographic
 *         verification methods and temporal validation periods
 * @dev Abstract contract providing internal DID document management functionality including
 *      storage operations, verification method handling, and relationship management.
 *      Implements temporal filtering and cryptographic key validation for enhanced security
 * @author ISBE Development Team
 */
abstract contract DidDocumentDetailedInternal is
    Common,
    VRelationshipsInternal
{
    /**
     * @notice Complete DID document structure with verification methods and relationships
     * @param baseDocument Base JSON document structure containing DID metadata
     * @param alsoKnownAs Alternative identifier for the entity (e.g., irn:orgs:inetum)
     * @param controllers Array of DID identifiers authorised to control this document
     * @param controllerExist Mapping to efficiently verify controller existence
     * @param vMethods Mapping of verification method identifiers to method details
     * @param vRelationships Array of verification relationships for authentication
     * @param capabilityInvocations Array of capability invocation relationships
     * @param vRelationshipsNameAndMethodIdTuple Mapping for relationship-method tuples
     * @param vRelationshipsIndexes Mapping from method ID to relationship array indices
     * @param capabilityInvocationMethodIdExist Mapping for capability method existence
     * @param capabilityInvocationMethodIdIndex Mapping from method ID to capability index
     * @param vMethodIdOfAddress Mapping from Ethereum address to verification method ID
     * @param exists Boolean flag indicating document existence in storage
     */
    struct DidDocument {
        string baseDocument;
        string[] alsoKnownAs;
        bytes32[] controllers;
        mapping(bytes32 controller => bool exists) controllerExist;
        mapping(bytes32 vMethodId => IDidDocumentDetailed.VMethod vMethod) vMethods;
        IDidDocumentDetailed.VRelationship[] vRelationships;
        IDidDocumentDetailed.VRelationship[] capabilityInvocations;
        mapping(bytes32 => bool) vRelationshipsNameAndMethodIdTuple;
        mapping(bytes32 vMethodId => uint256[] vRelationshipIndex) vRelationshipsIndexes;
        mapping(bytes32 vMethodId => bool exists) capabilityInvocationMethodIdExist;
        mapping(bytes32 vMethodId => uint256 capabilityInvocationIndex) capabilityInvocationMethodIdIndex;
        mapping(address capabilityInvocationAddress => bytes32 vMethodId) vMethodIdOfAddress;
        bool exists;
    }

    /**
     * @notice Global storage structure for all DID documents and network configuration
     * @param networkEllipticType Network-wide elliptic curve type for consistency
     * @param didList Mapping from DID string to complete document structure
     * @param dids Array of all registered DID identifiers for enumeration
     * @param invocationAddressToDid Mapping from address to controlling DID
     */
    struct DidDocumentsStorage {
        IDidDocumentDetailed.EllipticType networkEllipticType;
        // a collection of DID Documents
        mapping(bytes32 did => DidDocument document) didList;
        bytes32[] dids;
        mapping(address capabilityInvocationAddress => bytes32 did) invocationAddressToDid;
    }

    modifier onlyValidDid(bytes32 _did) {
        _checkValidDid(_did);
        _;
    }

    modifier onlyDidExists(bytes32 _did) {
        _checkDidExists(_did);
        _;
    }

    modifier onlyValidEllipticType(
        IDidDocumentDetailed.EllipticType _ellipticType
    ) {
        _checkEllipticType(_ellipticType);
        _;
    }

    modifier validateEllipticType(
        IDidDocumentDetailed.EllipticType _ellipticType
    ) {
        _checkNonEmptyEllipticType(_ellipticType);
        _;
    }

    modifier onlyEmptyVMethodAndPublicKey(
        bytes32 _did,
        bytes32 _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    ) {
        _checkEmptyVMethod(_did, _vMethodId);
        _checkPublicKeyNotAssigned(_did, _publicKey, _ellipticType);
        _;
    }

    modifier onlyVMethodIdExists(bytes32 _did, bytes32 _vMethodId) {
        _checkVMethodExists(_did, _vMethodId);
        _;
    }

    modifier validateRollArgs(IDidVerificationMethod.RollArgs memory _args) {
        _validateRollArgs(_args);
        _;
    }

    modifier onlyGoodRollArgs(IDidVerificationMethod.RollArgs memory _args) {
        _checkRollArgs(_args);
        _;
    }

    /**
     * @notice Validates that an address is registered in the DID registry with active capability invocation
     * @param _address The Ethereum address to validate
     */
    modifier onlyKnownDid(address _address) {
        _checkKnownDid(_address);
        _;
    }

    function _setEllipticType(
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal {
        _didDocumentsStorage().networkEllipticType = _ellipticType;
    }

    function _insertDidDocument(
        bytes32 _did,
        string memory _baseDocument,
        bytes32 _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType,
        uint256 _notBefore,
        uint256 _notAfter,
        string memory _alsoKnownAs
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];

        document.exists = true;
        document.baseDocument = _baseDocument;
        document.alsoKnownAs.push(_alsoKnownAs);
        _addVerificationMethod(_did, _vMethodId, _publicKey, _ellipticType);

        _addVerificationRelationshipToDocument(
            _did,
            _CAPABILITY_INVOCATION_RELATIONSHIP,
            _vMethodId,
            _notBefore,
            _notAfter
        );

        _addVerificationRelationshipToDocument(
            _did,
            _AUTHENTICATION_RELATIONSHIP,
            _vMethodId,
            _notBefore,
            _notAfter
        );

        $.dids.push(_did);
        return true;
    }

    function _addVerificationRelationshipToDocument(
        bytes32 _did,
        string memory _name,
        bytes32 _vMethodId,
        uint256 _notBefore,
        uint256 _notAfter
    ) internal returns (bool) {
        uint256 indexDid = _addVerificationRelationship(
            _vMethodId,
            _name,
            _did,
            _notBefore,
            _notAfter
        );
        if (_equalStrings(_name, _CAPABILITY_INVOCATION_RELATIONSHIP))
            return
                _addCapabilityInvocationRelationship(
                    _didDocumentsStorage().didList[_did],
                    _vMethodId,
                    _notBefore,
                    _notAfter,
                    indexDid
                );
        return
            _addOtherRelationship(
                _didDocumentsStorage().didList[_did],
                _name,
                _vMethodId,
                _notBefore,
                _notAfter,
                indexDid
            );
    }

    function _addVerificationMethod(
        bytes32 _did,
        bytes32 _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];
        if (_ellipticType == $.networkEllipticType) {
            address addr = _getAddress(_publicKey);
            document.vMethodIdOfAddress[addr] = _vMethodId;
            $.invocationAddressToDid[addr] = _did;
        }
        document.vMethods[_vMethodId] = IDidDocumentDetailed.VMethod({
            publicKey: _publicKey,
            ellipticType: _ellipticType,
            revoked: false
        });
        return true;
    }

    function _revokeVerificationMethod(
        bytes32 _did,
        bytes32 _vMethodId,
        uint256 _notAfter
    ) internal returns (bool) {
        _expireVerificationMethod(_did, _vMethodId, _notAfter);
        return
            _didDocumentsStorage()
                .didList[_did]
                .vMethods[_vMethodId]
                .revoked = true;
    }

    function _expireVerificationMethod(
        bytes32 _did,
        bytes32 _vMethodId,
        uint256 _notAfter
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];
        _revokeAllVerificationRelationships(document, _vMethodId, _notAfter);
        _revokeCapabilityInvocation(document, _vMethodId, _notAfter, $);
        return true;
    }

    function _addControllerToDocument(
        bytes32 _did,
        bytes32 _controller
    ) internal returns (bool) {
        DidDocument storage document = _didDocumentsStorage().didList[_did];
        document.controllers.push(_controller);
        document.controllerExist[_controller] = true;
        return true;
    }

    function _removeControllerToDocument(
        bytes32 _did,
        bytes32 _controller
    ) internal returns (bool) {
        DidDocument storage document = _didDocumentsStorage().didList[_did];
        bytes32[] memory controllers = document.controllers;
        uint256 length = controllers.length;
        uint256 index;
        unchecked {
            --length;
        }
        for (; index < length; ) {
            if (_controller == controllers[index]) {
                document.controllers[index] = document.controllers[length];
                break;
            }
            unchecked {
                ++index;
            }
        }
        document.controllers.pop();
        document.controllerExist[_controller] = false;
        return true;
    }

    function _rollVerificationMethod(
        IDidVerificationMethod.RollArgs memory _args
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_args.did];

        // Check if oldVMethodId has capabilityInvocation relationship
        // If so, new ellipticType must match network ellipticType
        if (document.capabilityInvocationMethodIdExist[_args.oldVMethodId]) {
            require(
                _args.ellipticType == $.networkEllipticType,
                IDidVerificationMethod.NewVMethodMustMatchNetworkEllipticType(
                    _args.vMethodId
                )
            );
        }

        _addVerificationMethod(
            _args.did,
            _args.vMethodId,
            _args.publicKey,
            _args.ellipticType
        );
        uint256 newNotAfter;
        unchecked {
            newNotAfter = _args.notBefore + _args.duration;
        }
        _rollExistingVerificationRelationships(document, _args, newNotAfter);
        _rollCapabilityInvocation(document, _args, newNotAfter);
        _cleanupAddressMappingIfNeeded(
            document,
            _args.oldVMethodId,
            $.networkEllipticType
        );

        return true;
    }

    function _rollExistingVerificationRelationships(
        DidDocument storage document,
        IDidVerificationMethod.RollArgs memory _args,
        uint256 newNotAfter
    ) internal {
        uint256 length = document
            .vRelationshipsIndexes[_args.oldVMethodId]
            .length;
        for (uint256 index; index < length; ) {
            uint256 vRelationshipIndex = document.vRelationshipsIndexes[
                _args.oldVMethodId
            ][index];
            string memory currentName = document
                .vRelationships[vRelationshipIndex]
                .name;
            _updateVerificationRelationship(
                _args.oldVMethodId,
                currentName,
                document.vRelationships[index].indexDid,
                newNotAfter
            );
            document.vRelationships[vRelationshipIndex].notAfter = newNotAfter;
            uint256 insertedVRelationShipIndex = _addVerificationRelationship(
                _args.vMethodId,
                currentName,
                _args.did,
                _args.notBefore,
                _args.notAfter
            );
            document.vRelationshipsIndexes[_args.vMethodId].push(
                document.vRelationships.length
            );
            document.vRelationshipsNameAndMethodIdTuple[
                _buildAuthenticationKey(currentName, _args.oldVMethodId)
            ] = true;
            document.vRelationships.push(
                _buildVRelationShip(
                    currentName,
                    _args.vMethodId,
                    _args.notBefore,
                    _args.notAfter,
                    insertedVRelationShipIndex
                )
            );
            unchecked {
                ++index;
            }
        }
    }

    function _rollCapabilityInvocation(
        DidDocument storage document,
        IDidVerificationMethod.RollArgs memory _args,
        uint256 newNotAfter
    ) internal {
        if (!document.capabilityInvocationMethodIdExist[_args.oldVMethodId])
            return;
        uint256 capabilityInvocationIndex = document
            .capabilityInvocationMethodIdIndex[_args.oldVMethodId];
        _updateVerificationRelationship(
            _args.oldVMethodId,
            _CAPABILITY_INVOCATION_RELATIONSHIP,
            document.capabilityInvocations[capabilityInvocationIndex].indexDid,
            newNotAfter
        );
        document
            .capabilityInvocations[capabilityInvocationIndex]
            .notAfter = newNotAfter;
        uint256 indexVRelationshipInserted = _addVerificationRelationship(
            _args.vMethodId,
            _CAPABILITY_INVOCATION_RELATIONSHIP,
            _args.did,
            _args.notBefore,
            _args.notAfter
        );
        _addCapabilityInvocationRelationship(
            document,
            _args.vMethodId,
            _args.notBefore,
            _args.notAfter,
            indexVRelationshipInserted
        );
    }

    function _updateBaseDocument(
        bytes32 _did,
        string memory baseDocument
    ) internal returns (bool) {
        _didDocumentsStorage().didList[_did].baseDocument = baseDocument;
        return true;
    }

    function _updateAlsoKnownAs(
        bytes32 _did,
        string memory _alsoKnownAs
    ) internal returns (bool) {
        _didDocumentsStorage().didList[_did].alsoKnownAs[0] = _alsoKnownAs;
        return true;
    }

    function _getDids(
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        bytes32[] storage dids = _didDocumentsStorage().dids;
        total_ = dids.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            dids.length,
            _page,
            _pageSize
        );
        if (howMany_ == 0) return (items_, total_, howMany_, prev_, next_);
        items_ = new bytes32[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = dids[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _getDidDocument(
        bytes32 _did
    )
        internal
        view
        returns (
            string memory baseDocument_,
            string[] memory alsoKnownAs_,
            bytes32[] memory controllers_,
            bytes32[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        return _getDidDocumentByTimestamp(_did, _blockTimestamp());
    }

    function _getDidDocumentByTimestamp(
        bytes32 _did,
        uint256 _timestamp
    )
        internal
        view
        returns (
            string memory baseDocument_,
            string[] memory alsoKnownAs_,
            bytes32[] memory controllers_,
            bytes32[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        DidDocument storage document = _didDocumentsStorage().didList[_did];
        baseDocument_ = document.baseDocument;
        alsoKnownAs_ = document.alsoKnownAs;
        controllers_ = document.controllers;
        (vMethodIds_, vMethods_, vRelationships_) = _getMethodsAndRelations(
            _timestamp,
            document
        );
    }

    function _checkEllipticType(
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal view {
        require(
            _didDocumentsStorage().networkEllipticType == _ellipticType,
            IDidDocumentDetailed.FirstPublicKeyMustBeTheSameThanTheNetwork(
                _ellipticType
            )
        );
    }

    function _checkValidDid(bytes32 _did) internal view {
        require(
            _notExistDid(_did),
            IDidDocumentDetailed.DidAlreadyExists(_did)
        );
    }

    function _checkDidExists(bytes32 _did) internal view {
        require(_existsDid(_did), IDidDocumentDetailed.DidNotExists(_did));
    }

    function _checkEmptyVMethod(
        bytes32 _did,
        bytes32 _vMethodId
    ) internal view {
        require(
            _notExistsVMethod(_did, _vMethodId),
            IDidVerificationMethod.VerificationMethodExists(_did, _vMethodId)
        );
    }

    function _checkVMethodExists(
        bytes32 _did,
        bytes32 _vMethodId
    ) internal view {
        require(
            _existsVMethod(_did, _vMethodId),
            IDidVerificationMethod.VerificationMethodNotExists(_did, _vMethodId)
        );
    }

    function _checkVMethodNotRevoked(
        bytes32 _did,
        bytes32 _vMethodId
    ) internal view {
        require(
            !_didDocumentsStorage().didList[_did].vMethods[_vMethodId].revoked,
            IDidVerificationRelationship.VerificationMethodIsRevoked(
                _did,
                _vMethodId
            )
        );
    }

    function _checkPublicKeyNotAssigned(
        bytes32 _did,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal view {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        if ($.networkEllipticType == _ellipticType)
            require(
                !_isNotEmptyBytes32(
                    $.didList[_did].vMethodIdOfAddress[_getAddress(_publicKey)]
                ),
                IDidVerificationMethod.PublicKeyAlreadyInUse(_publicKey)
            );
    }

    /**
     * @notice Validates that an address is known in the DID registry with active capability invocation
     * @param _address The address to validate
     */
    function _checkKnownDid(address _address) internal view {
        require(
            _isUseCase()
                ? _getIsbeFactory().isKnownDid(_address)
                : _isKnownDid(_address),
            IDidDocumentDetailed.AddressNotKnown(_address)
        );
    }

    function _notExistDid(bytes32 _did) internal view returns (bool) {
        return !_existsDid(_did);
    }

    function _existsDid(bytes32 _did) internal view returns (bool) {
        return _didDocumentsStorage().didList[_did].exists;
    }

    function _notExistsVMethod(
        bytes32 _did,
        bytes32 _vMethodId
    ) internal view returns (bool) {
        return !_existsVMethod(_did, _vMethodId);
    }

    function _existsVMethod(
        bytes32 _did,
        bytes32 _vMethodId
    ) internal view returns (bool) {
        return
            _didDocumentsStorage()
                .didList[_did]
                .vMethods[_vMethodId]
                .ellipticType != IDidDocumentDetailed.EllipticType.NONE;
    }

    function _isController(
        bytes32 _did,
        address controller
    ) internal view returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];

        uint256 controllersLength = document.controllers.length;
        if (controllersLength == 0) return false;

        unchecked {
            bytes32[] memory controllers = document.controllers;
            for (uint256 i; i < controllersLength; ++i) {
                if (
                    _hasActiveCapabilityInvocation(
                        $.didList[controllers[i]],
                        controller
                    )
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    function _getControllerCount(bytes32 did) internal view returns (uint256) {
        return _didDocumentsStorage().didList[did].controllers.length;
    }

    function _isController(
        bytes32 _did,
        bytes32 _controller
    ) internal view returns (bool) {
        return
            _didDocumentsStorage().didList[_did].controllerExist[_controller];
    }

    function _isNotController(
        bytes32 _did,
        bytes32 _controller
    ) internal view returns (bool) {
        return !_isController(_did, _controller);
    }

    /**
     * @notice Checks if an address is registered in the DID registry with active capability invocation
     * @dev Performs O(1) lookup and validates:
     *      - Address is mapped to a DID
     *      - Verification method exists and is not revoked
     *      - Capability invocation relationship exists and is temporally valid
     * @param _address The Ethereum address to check
     * @return bool True if address is known with active capability invocation, false otherwise
     */
    function _isKnownDid(address _address) internal view returns (bool) {
        return
            _hasActiveCapabilityInvocation(
                _didDocumentsStorage().didList[_getDidFromAddress(_address)],
                _address
            );
    }

    /**
     * @notice Gets the DID associated with an address
     * @param _address The address to lookup
     * @return bytes32 The DID associated with the address
     */
    function _getDidFromAddress(
        address _address
    ) internal view returns (bytes32) {
        return _didDocumentsStorage().invocationAddressToDid[_address];
    }

    /**
     * @notice Gets the alsoKnownAs field from a DID document
     * @param _did The DID to lookup
     * @return string memory The alsoKnownAs value
     */
    function _getAlsoKnownAs(
        bytes32 _did
    ) internal view returns (string memory) {
        return _didDocumentsStorage().didList[_did].alsoKnownAs[0];
    }

    function _didOf(address account) internal view returns (bytes32 did_) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        did_ = $.invocationAddressToDid[account];
        DidDocument storage didDocument = $.didList[did_];
        return
            _hasActiveCapabilityInvocation(didDocument, account)
                ? did_
                : bytes32(0);
    }

    /// @notice Override of AccessControlInternal._localDidOf for local DID resolution
    /// @param _account The address to resolve
    /// @return bytes32 The DID hash if found and active, otherwise bytes32(0)
    function _localDidOf(
        address _account
    ) internal view virtual override returns (bytes32) {
        return _didOf(_account);
    }

    function _checkEmptyVerificationRelationship(
        bytes32 _did,
        string memory _name,
        bytes32 _vMethodId
    ) internal view {
        require(
            !_isEmptyVerificationRelationship(
                _didDocumentsStorage().didList[_did],
                _name,
                _vMethodId
            ),
            IDidDocumentDetailed.VerificationRelationshipExists(
                _did,
                _name,
                _vMethodId
            )
        );
    }

    /**
     * @notice Validates cryptographic proof of ownership for a DID
     * @dev Validates that:
     *      1. The signature (proof) was created by the private key corresponding
     *         to the provided public key
     *      2. The DID has the correct structure: [13 zero bytes | 19 payload bytes]
     *         where the payload matches the last 19 bytes of the proof (signature)
     *      This prevents vanity DID attacks by ensuring the DID is cryptographically
     *      linked to the proof.
     *      Currently only supports secp256k1 (standard ECDSA).
     *      Elliptic curve type validation is performed by modifiers before this function.
     * @param _did The decentralised identifier to validate (must have 13 zero prefix + 19 payload)
     * @param _proof The signature proving ownership (65 bytes for ECDSA: r:32 + s:32 + v:1)
     * @param _publicKey The public key to validate against
     */
    function _validateProof(
        bytes32 _did,
        bytes memory _proof,
        bytes memory _publicKey
    ) internal pure {
        // First, validate the proof itself (length, signature recovery, control bytes)
        // This ensures proper error messages for malformed proofs
        // Recover signer address from signature
        address recoveredSigner = _recoverSigner(
            keccak256(abi.encodePacked(_publicKey)),
            _proof
        );

        // Validate that recovered signer matches the public key owner
        require(
            recoveredSigner == _getAddress(_publicKey),
            InvalidSignature(recoveredSigner)
        );

        // Validate DID structure using assembly:
        // - Bytes 0-12 (13 bytes) must be zeros
        // - Bytes 13-31 (19 bytes) must match last 19 bytes of proof
        bool isValid;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Check prefix: upper 13 bytes of DID must be zeros
            // shr(152, _did) isolates bytes [0..12]; must equal 0
            let didPrefixCheck := eq(shr(152, _did), 0)

            // Load last 32 bytes of proof (proof is 65 bytes in memory)
            // Memory layout: [length @ _proof] [data @ _proof+32 ... _proof+96]
            // mload(add(_proof, 65)) loads proof data bytes [33..64]
            // In this word, the lower 19 bytes = proof[46..64] = last 19 bytes of proof
            let proofWord := mload(add(_proof, 65))

            // Mask for lower 19 bytes: 0x00(x13) FF(x19)
            let mask := shr(104, not(0))

            // Compare lower 19 bytes of DID with lower 19 bytes of proofWord
            // DID lower 19 bytes   = DID[13..31]   = the payload
            // proofWord lower 19   = proof[46..64]  = last 19 bytes of proof
            let didPayloadCheck := eq(and(_did, mask), and(proofWord, mask))

            // Both checks must pass
            if and(didPrefixCheck, didPayloadCheck) {
                isValid := 1
            }
            // If condition fails, isValid stays 0 (default)
        }
        // slither-disable-end assembly
        require(isValid, IDidDocumentDetailed.DidNotDerivedFromProof(_did));
    }

    function _addCapabilityInvocationRelationship(
        DidDocument storage _document,
        bytes32 _vMethodId,
        uint256 _notBefore,
        uint256 _notAfter,
        uint256 _indexDid
    ) private returns (bool) {
        _document.capabilityInvocationMethodIdExist[_vMethodId] = true;
        _document.capabilityInvocationMethodIdIndex[_vMethodId] = _document
            .capabilityInvocations
            .length;
        _document.capabilityInvocations.push(
            _buildVRelationShip(
                _CAPABILITY_INVOCATION_RELATIONSHIP,
                _vMethodId,
                _notBefore,
                _notAfter,
                _indexDid
            )
        );
        return true;
    }

    function _addOtherRelationship(
        DidDocument storage _document,
        string memory _name,
        bytes32 _vMethodId,
        uint256 _notBefore,
        uint256 _notAfter,
        uint256 _indexDid
    ) private returns (bool) {
        _document.vRelationshipsIndexes[_vMethodId].push(
            _document.vRelationships.length
        );
        _document.vRelationshipsNameAndMethodIdTuple[
            _buildAuthenticationKey(_name, _vMethodId)
        ] = true;
        _document.vRelationships.push(
            _buildVRelationShip(
                _name,
                _vMethodId,
                _notBefore,
                _notAfter,
                _indexDid
            )
        );
        return true;
    }

    function _revokeAllVerificationRelationships(
        DidDocument storage document,
        bytes32 _vMethodId,
        uint256 _notAfter
    ) private {
        uint256[] storage relationshipIndexes = document.vRelationshipsIndexes[
            _vMethodId
        ];
        uint256 length = relationshipIndexes.length;
        while (length > 0) {
            unchecked {
                --length;
            }
            IDidDocumentDetailed.VRelationship storage vRelationship = document
                .vRelationships[relationshipIndexes[length]];
            _updateVerificationRelationship(
                _vMethodId,
                vRelationship.name,
                vRelationship.indexDid,
                _notAfter
            );
        }
    }

    function _revokeCapabilityInvocation(
        DidDocument storage document,
        bytes32 _vMethodId,
        uint256 _notAfter,
        DidDocumentsStorage storage $
    ) private {
        if (!document.capabilityInvocationMethodIdExist[_vMethodId]) return;
        IDidDocumentDetailed.VRelationship
            storage capabilityInvocation = document.capabilityInvocations[
                document.capabilityInvocationMethodIdIndex[_vMethodId]
            ];
        _cleanupAddressMappingIfNeeded(
            document,
            _vMethodId,
            $.networkEllipticType
        );
        _updateVerificationRelationship(
            _vMethodId,
            _CAPABILITY_INVOCATION_RELATIONSHIP,
            capabilityInvocation.indexDid,
            _notAfter
        );
    }

    function _cleanupAddressMappingIfNeeded(
        DidDocument storage document,
        bytes32 _vMethodId,
        IDidDocumentDetailed.EllipticType _networkEllipticType
    ) private {
        IDidDocumentDetailed.VMethod storage vMethod = document.vMethods[
            _vMethodId
        ];
        if (vMethod.ellipticType == _networkEllipticType) {
            address addr = _getAddress(vMethod.publicKey);
            delete document.vMethodIdOfAddress[addr];
            delete _didDocumentsStorage().invocationAddressToDid[addr];
        }
    }

    function _isEmptyVerificationRelationship(
        DidDocument storage _document,
        string memory _name,
        bytes32 _vMethodId
    ) private view returns (bool) {
        return
            _equalStrings(_name, _CAPABILITY_INVOCATION_RELATIONSHIP)
                ? _document.capabilityInvocationMethodIdExist[_vMethodId]
                : _document.vRelationshipsNameAndMethodIdTuple[
                    _buildAuthenticationKey(_name, _vMethodId)
                ];
    }

    /**
     * @notice Validates if an address has active and valid capability invocation on a DID document
     * @dev Checks capability invocation existence and temporal validity
     * @dev Note: Revocation check is not needed here because _cleanupAddressMappingIfNeeded
     *      removes the vMethodIdOfAddress mapping when a vMethod is revoked, making the
     *      first check (!_isNotEmptyBytes32) catch revoked vMethods automatically
     * @param _document The DID document to check against
     * @param _address The address to validate
     * @return bool True if address has active capability invocation, false otherwise
     */
    function _hasActiveCapabilityInvocation(
        DidDocument storage _document,
        address _address
    ) private view returns (bool) {
        if (!_document.exists) return false;
        bytes32 vMethodId = _document.vMethodIdOfAddress[_address];
        if (
            !_isNotEmptyBytes32(vMethodId) ||
            !_document.capabilityInvocationMethodIdExist[vMethodId]
        ) return false;
        uint256 capIndex = _document.capabilityInvocationMethodIdIndex[
            vMethodId
        ];
        IDidDocumentDetailed.VRelationship memory capInvocation = _document
            .capabilityInvocations[capIndex];
        uint256 blockTimestamp = _blockTimestamp();
        return
            blockTimestamp >= capInvocation.notBefore &&
            blockTimestamp < capInvocation.notAfter;
    }

    function _checkRollArgs(
        IDidVerificationMethod.RollArgs memory _args
    ) private view {
        _checkEmptyVMethod(_args.did, _args.vMethodId);
        _checkVMethodExists(_args.did, _args.oldVMethodId);
        _checkVMethodNotRevoked(_args.did, _args.oldVMethodId);
    }

    function _getMethodsAndRelations(
        uint256 _timestamp,
        DidDocument storage _document
    )
        private
        view
        returns (
            bytes32[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        uint256 maxLength;
        uint256 sizeVMethods;
        uint256 sizeVRelationships;
        unchecked {
            maxLength =
                _document.vRelationships.length +
                _document.capabilityInvocations.length;
        }

        (
            vMethodIds_,
            vMethods_,
            vRelationships_,
            sizeVMethods,
            sizeVRelationships
        ) = _processDocumentRelationships(_timestamp, _document, maxLength);

        (
            vMethodIds_,
            vMethods_,
            vRelationships_
        ) = _copyAuxiliaryArraysToResult(
            vMethodIds_,
            vMethods_,
            vRelationships_,
            sizeVMethods,
            sizeVRelationships
        );
    }

    function _processDocumentRelationships(
        uint256 _timestamp,
        DidDocument storage _document,
        uint256 _maxLength
    )
        private
        view
        returns (
            bytes32[] memory vMethodIdsAux_,
            IDidDocumentDetailed.VMethod[] memory vMethodsAux_,
            IDidDocumentDetailed.VRelationship[] memory vRelationshipsAux_,
            uint256 sizeVMethods_,
            uint256 sizeVRelationships_
        )
    {
        vMethodIdsAux_ = new bytes32[](_maxLength);
        vMethodsAux_ = new IDidDocumentDetailed.VMethod[](_maxLength);
        vRelationshipsAux_ = new IDidDocumentDetailed.VRelationship[](
            _maxLength
        );

        (sizeVMethods_, sizeVRelationships_) = _processRegularRelationships(
            _timestamp,
            _document,
            vMethodIdsAux_,
            vMethodsAux_,
            vRelationshipsAux_
        );

        (sizeVMethods_, sizeVRelationships_) = _processCapabilityInvocations(
            _timestamp,
            _document,
            vMethodIdsAux_,
            vMethodsAux_,
            vRelationshipsAux_,
            sizeVMethods_,
            sizeVRelationships_
        );
    }

    function _processRegularRelationships(
        uint256 _timestamp,
        DidDocument storage _document,
        bytes32[] memory _vMethodIdsAux,
        IDidDocumentDetailed.VMethod[] memory _vMethodsAux,
        IDidDocumentDetailed.VRelationship[] memory _vRelationshipsAux
    )
        private
        view
        returns (uint256 sizeVMethods_, uint256 sizeVRelationships_)
    {
        uint256 relationShipsLength = _document.vRelationships.length;

        for (uint256 i; i < relationShipsLength; ) {
            if (
                _isOutOfPeriod(
                    _timestamp,
                    _document.vRelationships[i].notBefore,
                    _document.vRelationships[i].notAfter
                )
            ) {
                unchecked {
                    ++i;
                }
                continue;
            }

            _vRelationshipsAux[sizeVRelationships_] = _document.vRelationships[
                i
            ];
            unchecked {
                ++sizeVRelationships_;
            }

            sizeVMethods_ = _addUniqueVMethod(
                _document.vRelationships[i].vMethodId,
                _document,
                _vMethodIdsAux,
                _vMethodsAux,
                sizeVMethods_
            );

            unchecked {
                ++i;
            }
        }
    }

    function _processCapabilityInvocations(
        uint256 _timestamp,
        DidDocument storage _document,
        bytes32[] memory _vMethodIdsAux,
        IDidDocumentDetailed.VMethod[] memory _vMethodsAux,
        IDidDocumentDetailed.VRelationship[] memory _vRelationshipsAux,
        uint256 _initialSizeVMethods,
        uint256 _initialSizeVRelationships
    )
        private
        view
        returns (uint256 sizeVMethods_, uint256 sizeVRelationships_)
    {
        sizeVMethods_ = _initialSizeVMethods;
        sizeVRelationships_ = _initialSizeVRelationships;
        uint256 capabilityInvocationsLength = _document
            .capabilityInvocations
            .length;

        for (uint256 i; i < capabilityInvocationsLength; ) {
            if (
                _isOutOfPeriod(
                    _timestamp,
                    _document.capabilityInvocations[i].notBefore,
                    _document.capabilityInvocations[i].notAfter
                )
            ) {
                unchecked {
                    ++i;
                }
                continue;
            }

            _vRelationshipsAux[sizeVRelationships_] = _document
                .capabilityInvocations[i];
            unchecked {
                ++sizeVRelationships_;
            }

            sizeVMethods_ = _addUniqueVMethod(
                _document.capabilityInvocations[i].vMethodId,
                _document,
                _vMethodIdsAux,
                _vMethodsAux,
                sizeVMethods_
            );

            unchecked {
                ++i;
            }
        }
    }

    function _addUniqueVMethod(
        bytes32 _vMethodId,
        DidDocument storage _document,
        bytes32[] memory _vMethodIdsAux,
        IDidDocumentDetailed.VMethod[] memory _vMethodsAux,
        uint256 _currentSize
    ) private view returns (uint256) {
        for (uint256 j; j < _currentSize; ) {
            if (_vMethodId == _vMethodIdsAux[j]) return _currentSize;
            unchecked {
                ++j;
            }
        }
        _vMethodIdsAux[_currentSize] = _vMethodId;
        _vMethodsAux[_currentSize] = _document.vMethods[_vMethodId];
        unchecked {
            return _currentSize + 1;
        }
    }

    function _validateRollArgs(
        IDidVerificationMethod.RollArgs memory _args
    ) private pure {
        _checkBytes32IsNotZero(_args.vMethodId);
        _checkEmptyBytes(_args.publicKey);
        _checkNonEmptyEllipticType(_args.ellipticType);
        _checkUintIsNotZero(_args.notBefore);
        _checkUintIsNotZero(_args.notAfter);
        _checkValidDates(_args.notBefore, _args.notAfter);
        _checkBytes32IsNotZero(_args.oldVMethodId);
        _checkUintIsNotZero(_args.duration);
    }

    function _copyAuxiliaryArraysToResult(
        bytes32[] memory _vMethodIdsAux,
        IDidDocumentDetailed.VMethod[] memory _vMethodsAux,
        IDidDocumentDetailed.VRelationship[] memory _vRelationshipsAux,
        uint256 _sizeVMethods,
        uint256 _sizeVRelationships
    )
        private
        pure
        returns (
            bytes32[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        vMethodIds_ = new bytes32[](_sizeVMethods);
        vMethods_ = new IDidDocumentDetailed.VMethod[](_sizeVMethods);
        vRelationships_ = new IDidDocumentDetailed.VRelationship[](
            _sizeVRelationships
        );

        for (uint256 index; index < _sizeVRelationships; ) {
            if (index < _sizeVMethods) {
                vMethodIds_[index] = _vMethodIdsAux[index];
                vMethods_[index] = _vMethodsAux[index];
            }
            vRelationships_[index] = _vRelationshipsAux[index];
            unchecked {
                ++index;
            }
        }
    }

    function _getAddress(
        bytes memory _publicKey
    ) private pure returns (address) {
        return
            address(
                uint160(uint256(keccak256(_sanitizePublicKey(_publicKey))))
            );
    }

    function _sanitizePublicKey(
        bytes memory _publicKey
    ) private pure returns (bytes memory) {
        uint256 length = _publicKey.length;
        if (length == 65) {
            require(
                _publicKey[0] == 0x04,
                IDidDocumentDetailed.InvalidControlBytes()
            );
            /**
             * step 1: EC public key prefix (04)
             * Note: We can not use the built-in array slices (like publicKey[1:])
             * because it is only for calldata arrays, not storage arrays.
             * Then we have to use a loop to make the slice
             */
            bytes memory publicKeyWithoutPrefix;
            unchecked {
                publicKeyWithoutPrefix = new bytes(length - 1);
                for (; length > 1; ) {
                    --length;
                    publicKeyWithoutPrefix[length - 1] = _publicKey[length];
                }
            }
            return publicKeyWithoutPrefix;
        }
        if (length == 64) return _publicKey;
        revert IDidDocumentDetailed.InvalidPubKeyLength();
    }

    function _buildAuthenticationKey(
        string memory _name,
        bytes32 _vMethodId
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(_name, _vMethodId));
    }

    function _buildVRelationShip(
        string memory _name,
        bytes32 _vMethodId,
        uint256 _notBefore,
        uint256 _notAfter,
        uint256 _indexDid
    )
        private
        pure
        returns (IDidDocumentDetailed.VRelationship memory vRelationship_)
    {
        vRelationship_ = IDidDocumentDetailed.VRelationship({
            name: _name,
            vMethodId: _vMethodId,
            notBefore: _notBefore,
            notAfter: _notAfter,
            indexDid: _indexDid
        });
    }

    function _isOutOfPeriod(
        uint256 _timestamp,
        uint256 _notBefore,
        uint256 _notAfter
    ) private pure returns (bool) {
        return _timestamp < _notBefore || _timestamp > _notAfter;
    }

    function _checkNonEmptyEllipticType(
        IDidDocumentDetailed.EllipticType _ellipticType
    ) private pure {
        require(
            _ellipticType != IDidDocumentDetailed.EllipticType.NONE,
            IDidDocumentDetailed.InvalidEllipticCurve()
        );
    }

    function _didDocumentsStorage()
        private
        pure
        returns (DidDocumentsStorage storage storage_)
    {
        bytes32 position = _DID_DOCUMENT_DETAILED_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
