// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _AUTHENTICATION_RELATIONSHIP,
    _CAPABILITY_INVOCATION_RELATIONSHIP
} from './constants.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {IDidVerificationMethod} from './interfaces/IDidVerificationMethod.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {VRelationshipsInternal} from './VRelationshipsInternal.sol';
import {_DID_DOCUMENT_DETAILED_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {_DID_DOCUMENT_DETAILED_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @title Decentralised Identity Document Internal Implementation
 * @notice Core internal logic for managing W3C-compliant DID documents with cryptographic
 *         verification methods and temporal validation periods
 * @dev Abstract contract providing internal DID document management functionality including
 *      storage operations, verification method handling, and relationship management.
 *      Implements temporal filtering and cryptographic key validation for enhanced security
 * @author ISBE Development Team
 */
abstract contract DidDocumentDetailedInternal is VRelationshipsInternal {
    /**
     * @notice Complete DID document structure with verification methods and relationships
     * @param baseDocument Base JSON document structure containing DID metadata
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
        string[] controllers;
        mapping(string => bool) controllerExist;
        mapping(string => IDidDocumentDetailed.VMethod) vMethods;
        IDidDocumentDetailed.VRelationship[] vRelationships;
        IDidDocumentDetailed.VRelationship[] capabilityInvocations;
        mapping(bytes32 => bool) vRelationshipsNameAndMethodIdTuple;
        mapping(string => uint256[]) vRelationshipsIndexes;
        mapping(string => bool) capabilityInvocationMethodIdExist;
        mapping(string => uint256) capabilityInvocationMethodIdIndex;
        mapping(address => string) vMethodIdOfAddress;
        bool exists;
    }

    /**
     * @notice Global storage structure for all DID documents and network configuration
     * @param networkEllipticType Network-wide elliptic curve type for consistency
     * @param didList Mapping from DID string to complete document structure
     * @param dids Array of all registered DID identifiers for enumeration
     * @param invocationAddressToDidResolver Mapping from address to controlling DID
     */
    struct DidDocumentsStorage {
        IDidDocumentDetailed.EllipticType networkEllipticType;
        // a collection of DID Documents
        mapping(string => DidDocument) didList;
        string[] dids;
        mapping(address => string) invocationAddressToDidResolver;
    }

    modifier onlyValidDid(string memory _did) {
        _checkValidDid(_did);
        _;
    }

    modifier onlyDidExists(string memory _did) {
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
        string memory _did,
        string memory _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    ) {
        _checkEmptyVMethod(_did, _vMethodId);
        _checkPublicKeyNotAssigned(_did, _publicKey, _ellipticType);
        _;
    }

    modifier onlyVMethodIdExists(string memory _did, string memory _vMethodId) {
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

    function _setEllipticType(
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal {
        _didDocumentsStorage().networkEllipticType = _ellipticType;
    }

    function _insertDidDocument(
        string memory _did,
        string memory _baseDocument,
        string memory _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType,
        uint256 _notBefore,
        uint256 _notAfter
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];

        document.exists = true;
        document.baseDocument = _baseDocument;
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
        string memory _did,
        string memory _name,
        string memory _vMethodId,
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
        string memory _did,
        string memory _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];
        if (_ellipticType == $.networkEllipticType) {
            document.vMethodIdOfAddress[_getAddress(_publicKey)] = _vMethodId;
        }
        document.vMethods[_vMethodId] = IDidDocumentDetailed.VMethod({
            publicKey: _publicKey,
            ellipticType: _ellipticType,
            revoked: false
        });
        return true;
    }

    function _revokeVerificationMethod(
        string memory _did,
        string memory _vMethodId,
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
        string memory _did,
        string memory _vMethodId,
        uint256 _notAfter
    ) internal returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[_did];
        _revokeAllVerificationRelationships(document, _vMethodId, _notAfter);
        _revokeCapabilityInvocation(document, _vMethodId, _notAfter, $);
        return true;
    }

    function _addControllerToDocument(
        string memory _did,
        string memory _controller
    ) internal returns (bool) {
        DidDocument storage document = _didDocumentsStorage().didList[_did];
        document.controllers.push(_controller);
        document.controllerExist[_controller] = true;
        return true;
    }

    function _removeControllerToDocument(
        string memory _did,
        string memory _controller
    ) internal returns (bool) {
        DidDocument storage document = _didDocumentsStorage().didList[_did];
        string[] memory controllers = document.controllers;
        uint256 length = controllers.length;
        uint256 index;
        unchecked {
            --length;
        }
        for (; index < length; ) {
            if (_equalStrings(_controller, controllers[index])) {
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
        string memory did,
        string memory baseDocument
    ) internal returns (bool) {
        _didDocumentsStorage().didList[did].baseDocument = baseDocument;
        return true;
    }

    function _getDids(
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            string[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        string[] storage dids = _didDocumentsStorage().dids;
        total_ = dids.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            dids.length,
            _page,
            _pageSize
        );
        if (howMany_ == 0) return (items_, total_, howMany_, prev_, next_);
        items_ = new string[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = dids[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _getDidDocument(
        string memory _did
    )
        internal
        view
        returns (
            string memory baseDocument_,
            string[] memory controllers_,
            string[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        return _getDidDocumentByTimestamp(_did, _blockTimestamp());
    }

    function _getDidDocumentByTimestamp(
        string memory _did,
        uint256 _timestamp
    )
        internal
        view
        returns (
            string memory baseDocument_,
            string[] memory controllers_,
            string[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        DidDocument storage document = _didDocumentsStorage().didList[_did];
        baseDocument_ = document.baseDocument;
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

    function _checkValidDid(string memory _did) internal view {
        require(
            _notExistDid(_did),
            IDidDocumentDetailed.DidAlreadyExists(_did)
        );
    }

    function _checkDidExists(string memory _did) internal view {
        require(_existsDid(_did), IDidDocumentDetailed.DidNotExists(_did));
    }

    function _checkEmptyVMethod(
        string memory _did,
        string memory _vMethodId
    ) internal view {
        require(
            _notExistsVMethod(_did, _vMethodId),
            IDidVerificationMethod.VerificationMethodExists(_did, _vMethodId)
        );
    }

    function _checkVMethodExists(
        string memory _did,
        string memory _vMethodId
    ) internal view {
        require(
            _existsVMethod(_did, _vMethodId),
            IDidVerificationMethod.VerificationMethodNotExists(_did, _vMethodId)
        );
    }

    function _checkPublicKeyNotAssigned(
        string memory _did,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    ) internal view {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        if ($.networkEllipticType == _ellipticType)
            require(
                _isEmptyString(
                    $.didList[_did].vMethodIdOfAddress[_getAddress(_publicKey)]
                ),
                IDidVerificationMethod.PublicKeyAlreadyInUse(_publicKey)
            );
    }

    function _notExistDid(string memory _did) internal view returns (bool) {
        return !_existsDid(_did);
    }

    function _existsDid(string memory _did) internal view returns (bool) {
        return _didDocumentsStorage().didList[_did].exists;
    }

    function _notExistsVMethod(
        string memory _did,
        string memory _vMethod
    ) internal view returns (bool) {
        return !_existsVMethod(_did, _vMethod);
    }

    function _existsVMethod(
        string memory _did,
        string memory _vMethod
    ) internal view returns (bool) {
        return
            _didDocumentsStorage()
                .didList[_did]
                .vMethods[_vMethod]
                .ellipticType != IDidDocumentDetailed.EllipticType.NONE;
    }

    function _isController(
        string memory did,
        address controller
    ) internal view returns (bool) {
        DidDocumentsStorage storage $ = _didDocumentsStorage();
        DidDocument storage document = $.didList[did];

        uint256 controllersLength = document.controllers.length;
        if (controllersLength == 0) return false;
        uint256 blockTimestamp = _blockTimestamp();
        unchecked {
            string[] memory controllers = document.controllers;
            for (uint256 i; i < controllersLength; ++i) {
                DidDocument storage docController = $.didList[controllers[i]];
                string memory vMethodId = docController.vMethodIdOfAddress[
                    controller
                ];

                if (
                    _isEmptyString(vMethodId) ||
                    !docController.capabilityInvocationMethodIdExist[vMethodId]
                ) continue;

                uint256 methodIndex = docController
                    .capabilityInvocationMethodIdIndex[vMethodId];
                IDidDocumentDetailed.VRelationship memory vRel = docController
                    .capabilityInvocations[methodIndex];
                if (
                    blockTimestamp > vRel.notBefore &&
                    vRel.notAfter > blockTimestamp
                ) return true;
            }
        }
        return false;
    }

    function _isController(
        string memory did,
        string memory controller
    ) internal view returns (bool) {
        return _didDocumentsStorage().didList[did].controllerExist[controller];
    }

    function _isNotController(
        string memory did,
        string memory controller
    ) internal view returns (bool) {
        return !_isController(did, controller);
    }

    function _checkEmptyVerificationRelationship(
        string memory _did,
        string memory _name,
        string memory _vMethodId
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

    function _addCapabilityInvocationRelationship(
        DidDocument storage _document,
        string memory _vMethodId,
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
        string memory _vMethodId,
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
        string memory _vMethodId,
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
        string memory _vMethodId,
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
        string memory _vMethodId,
        IDidDocumentDetailed.EllipticType _networkEllipticType
    ) private {
        IDidDocumentDetailed.VMethod storage vMethod = document.vMethods[
            _vMethodId
        ];
        if (vMethod.ellipticType == _networkEllipticType)
            delete document.vMethodIdOfAddress[_getAddress(vMethod.publicKey)];
    }

    function _isEmptyVerificationRelationship(
        DidDocument storage _document,
        string memory _name,
        string memory _vMethodId
    ) private view returns (bool) {
        return
            _equalStrings(_name, _CAPABILITY_INVOCATION_RELATIONSHIP)
                ? _document.capabilityInvocationMethodIdExist[_vMethodId]
                : _document.vRelationshipsNameAndMethodIdTuple[
                    _buildAuthenticationKey(_name, _vMethodId)
                ];
    }

    function _checkRollArgs(
        IDidVerificationMethod.RollArgs memory _args
    ) private view {
        _checkEmptyVMethod(_args.did, _args.vMethodId);
        _checkVMethodExists(_args.did, _args.oldVMethodId);
    }

    function _getMethodsAndRelations(
        uint256 _timestamp,
        DidDocument storage _document
    )
        private
        view
        returns (
            string[] memory vMethodIds_,
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
            string[] memory vMethodIdsAux_,
            IDidDocumentDetailed.VMethod[] memory vMethodsAux_,
            IDidDocumentDetailed.VRelationship[] memory vRelationshipsAux_,
            uint256 sizeVMethods_,
            uint256 sizeVRelationships_
        )
    {
        vMethodIdsAux_ = new string[](_maxLength);
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
        string[] memory _vMethodIdsAux,
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
        string[] memory _vMethodIdsAux,
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
        string memory _vMethodId,
        DidDocument storage _document,
        string[] memory _vMethodIdsAux,
        IDidDocumentDetailed.VMethod[] memory _vMethodsAux,
        uint256 _currentSize
    ) private view returns (uint256) {
        for (uint256 j; j < _currentSize; ) {
            if (_equalStrings(_vMethodId, _vMethodIdsAux[j]))
                return _currentSize;
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
        _checkEmptyString(_args.vMethodId);
        _checkEmptyBytes(_args.publicKey);
        _checkNonEmptyEllipticType(_args.ellipticType);
        _checkUintIsNotZero(_args.notBefore);
        _checkUintIsNotZero(_args.notAfter);
        _checkValidDates(_args.notBefore, _args.notAfter);
        _checkEmptyString(_args.oldVMethodId);
        _checkUintIsNotZero(_args.duration);
    }

    function _copyAuxiliaryArraysToResult(
        string[] memory _vMethodIdsAux,
        IDidDocumentDetailed.VMethod[] memory _vMethodsAux,
        IDidDocumentDetailed.VRelationship[] memory _vRelationshipsAux,
        uint256 _sizeVMethods,
        uint256 _sizeVRelationships
    )
        private
        pure
        returns (
            string[] memory vMethodIds_,
            IDidDocumentDetailed.VMethod[] memory vMethods_,
            IDidDocumentDetailed.VRelationship[] memory vRelationships_
        )
    {
        vMethodIds_ = new string[](_sizeVMethods);
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
        string memory _vMethodId
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(_name, _vMethodId));
    }

    function _buildVRelationShip(
        string memory _name,
        string memory _vMethodId,
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
