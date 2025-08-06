// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {_DID_DOCUMENT_DETAILED_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {
    _AUTHENTICATION_RELATIONSHIP,
    _CAPABILITY_INVOCATION_RELATIONSHIP
} from './constants.sol';
import {VRelationshipsInternal} from './VRelationshipsInternal.sol';

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
        document.controllers.push(_did);
        document.controllerExist[_did] = true;
        document.vMethods[_vMethodId] = IDidDocumentDetailed.VMethod({
            publicKey: _publicKey,
            ellipticType: _ellipticType,
            revoked: false
        });

        //////
        uint256 indexDid;

        indexDid = _addVerificationRelationship(
            _CAPABILITY_INVOCATION_RELATIONSHIP,
            _vMethodId,
            _did,
            _notBefore,
            _notAfter
        );
        // insert getAddress in the did
        document.vMethodIdOfAddress[_getAddress(_publicKey)] = _vMethodId;
        document.capabilityInvocationMethodIdExist[_vMethodId] = true;
        document.capabilityInvocationMethodIdIndex[_vMethodId] = document
            .capabilityInvocations
            .length;
        document.capabilityInvocations.push(
            _buildVRelationShip(
                _CAPABILITY_INVOCATION_RELATIONSHIP,
                _vMethodId,
                _notBefore,
                _notAfter,
                indexDid
            )
        );

        indexDid = _addVerificationRelationship(
            _AUTHENTICATION_RELATIONSHIP,
            _vMethodId,
            _did,
            _notBefore,
            _notAfter
        );
        document.vRelationshipsIndexes[_vMethodId].push(
            document.vRelationships.length
        );
        document.vRelationshipsNameAndMethodIdTuple[
            _buildAuthenticationKey(_vMethodId)
        ] = true;
        document.vRelationships.push(
            _buildVRelationShip(
                _AUTHENTICATION_RELATIONSHIP,
                _vMethodId,
                _notBefore,
                _notAfter,
                indexDid
            )
        );

        $.dids.push(_did);
        return true;
    }

    function _addVerificationRelationship(
        string memory _method,
        string memory _vMethodId,
        string memory _did,
        uint256 _notBefore,
        uint256 _notAfter
    ) internal returns (uint256) {
        _checkValidRelationshipName(_method);

        return
            _addVerificationRelationship(
                _buildVerificationRelationshipId(_method, _vMethodId),
                _did,
                _notBefore,
                _notAfter
            );
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

    function _notExistDid(string memory _did) internal view returns (bool) {
        return !_didDocumentsStorage().didList[_did].exists;
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
        // Inicializar arrays auxiliares
        vMethodIdsAux_ = new string[](_maxLength);
        vMethodsAux_ = new IDidDocumentDetailed.VMethod[](_maxLength);
        vRelationshipsAux_ = new IDidDocumentDetailed.VRelationship[](
            _maxLength
        );

        // Procesar relaciones regulares
        (sizeVMethods_, sizeVRelationships_) = _processRegularRelationships(
            _timestamp,
            _document,
            vMethodIdsAux_,
            vMethodsAux_,
            vRelationshipsAux_
        );

        // Procesar capability invocations
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
    ) private view returns (uint256 newSize_) {
        bool vMethodAdded = false;

        for (uint256 j; j < _currentSize; ) {
            if (_equalStrings(_vMethodId, _vMethodIdsAux[j])) {
                vMethodAdded = true;
                break;
            }
            unchecked {
                ++j;
            }
        }

        if (!vMethodAdded) {
            _vMethodIdsAux[_currentSize] = _vMethodId;
            _vMethodsAux[_currentSize] = _document.vMethods[_vMethodId];
            unchecked {
                newSize_ = _currentSize + 1;
            }
        } else {
            newSize_ = _currentSize;
        }
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

        uint256 i = _sizeVMethods > _sizeVRelationships
            ? _sizeVMethods
            : _sizeVRelationships;

        for (; i > 0; ) {
            unchecked {
                --i;
            }
            if (i < _sizeVMethods) {
                vMethodIds_[i] = _vMethodIdsAux[i];
                vMethods_[i] = _vMethodsAux[i];
            }
            if (i < _sizeVRelationships) {
                vRelationships_[i] = _vRelationshipsAux[i];
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
        if (length == 64) {
            return _publicKey;
        }
        revert IDidDocumentDetailed.InvalidPubKeyLength();
    }

    function _buildAuthenticationKey(
        string memory _vMethodId
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(_AUTHENTICATION_RELATIONSHIP, _vMethodId));
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
