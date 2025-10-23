// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {_DID_DOCUMENT_DETAILED_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {DidControllerInternal} from './DidControllerInternal.sol';
import {_DID_REGISTRY_ROLE} from '../../constants/roles.sol';

/**
 * @title Decentralised Identity Document Management System
 * @notice Provides comprehensive management of W3C-compliant DID documents with cryptographic
 *         verification methods and temporal validity periods
 * @dev Implements the complete DID specification including document creation, verification
 *      method management, and cryptographic controller relationships. Supports multiple
 *      elliptic curve types for enhanced cryptographic flexibility and interoperability
 * @author ISBE Development Team
 */
abstract contract DidDocumentDetailed is
    DidControllerInternal,
    IDidDocumentDetailed
{
    function initializeDiDRegistry(
        EllipticType _ellipticType
    )
        external
        initializer(_DID_DOCUMENT_DETAILED_RESOLVER_KEY)
        validateEllipticType(_ellipticType)
    {
        _setEllipticType(_ellipticType);
        emit DiDRegistryInitialized(_ellipticType);
    }

    function insertFirstDidDocument(
        bytes32 _did,
        string memory _baseDocument,
        bytes32 _vMethodId,
        bytes memory _proof,
        bytes memory _publicKey,
        EllipticType _ellipticType,
        uint256 _notBefore,
        uint256 _notAfter,
        string memory _alsoKnownAs
    )
        external
        override
        validateEllipticType(_ellipticType)
        onlyValidEllipticType(_ellipticType)
        onlyValidDid(_did)
        onlyRole(_DID_REGISTRY_ROLE)
        returns (bool)
    {
        {
            _checkBytes32IsNotZero(_did);
            _checkEmptyString(_baseDocument);
            _checkBytes32IsNotZero(_vMethodId);
            _checkUintIsNotZero(_notBefore);
            _checkUintIsNotZero(_notAfter);
            _checkValidDates(_notBefore, _notAfter);
            _validateProof(_proof, _publicKey);
        }
        emit FirstDidDocumentInserted(
            _did,
            _baseDocument,
            _vMethodId,
            _publicKey,
            _ellipticType,
            _notBefore,
            _notAfter,
            _alsoKnownAs
        );
        return
            _insertDidDocument(
                _did,
                _baseDocument,
                _vMethodId,
                _publicKey,
                _ellipticType,
                _notBefore,
                _notAfter,
                _alsoKnownAs
            ) && _linkDidToController(_did, _did);
    }

    function insertDidDocument(
        bytes32 _did,
        string memory _baseDocument,
        bytes32 _vMethodId,
        bytes memory _publicKey,
        EllipticType _ellipticType,
        uint256 _notBefore,
        uint256 _notAfter
    )
        external
        override
        emptyBytes(_publicKey)
        validateEllipticType(_ellipticType)
        onlyValidEllipticType(_ellipticType)
        onlyValidDid(_did)
        onlyKnownDid(_msgSender())
        returns (bool)
    {
        {
            _checkBytes32IsNotZero(_did);
            _checkEmptyString(_baseDocument);
            _checkBytes32IsNotZero(_vMethodId);
            _checkUintIsNotZero(_notBefore);
            _checkUintIsNotZero(_notAfter);
            _checkValidDates(_notBefore, _notAfter);
        }

        emit DidDocumentInserted(
            _did,
            _baseDocument,
            _vMethodId,
            _publicKey,
            _ellipticType,
            _notBefore,
            _notAfter
        );
        return
            _insertDidDocument(
                _did,
                _baseDocument,
                _vMethodId,
                _publicKey,
                _ellipticType,
                _notBefore,
                _notAfter,
                _getAlsoKnownAs(_getDidFromAddress(_msgSender()))
            ) && _linkDidToController(_did, _did);
    }

    function updateBaseDocument(
        bytes32 did,
        string memory baseDocument
    )
        external
        override
        bytes32IsNotZero(did)
        emptyString(baseDocument)
        onlyDidExists(did)
        onlyControllerOrAuth(did)
        returns (bool)
    {
        emit BaseDocumentUpdated(did, baseDocument);
        return _updateBaseDocument(did, baseDocument);
    }

    function updateAlsoKnownAs(
        bytes32 _did,
        string memory _alsoKnownAs
    )
        external
        override
        bytes32IsNotZero(_did)
        onlyDidExists(_did)
        onlyRole(_DID_REGISTRY_ROLE)
        returns (bool)
    {
        emit AlsoKnownAsUpdated(_did, _alsoKnownAs);
        return _updateAlsoKnownAs(_did, _alsoKnownAs);
    }

    function getDids(
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        return _getDids(_page, _pageSize);
    }

    function getDidDocument(
        bytes32 _did
    )
        external
        view
        override
        returns (
            string memory baseDocument_,
            string memory alsoKnownAs_,
            bytes32[] memory controllers_,
            bytes32[] memory vMethodIds_,
            VMethod[] memory vMethods_,
            VRelationship[] memory vRelationships_
        )
    {
        return _getDidDocument(_did);
    }

    function getDidDocumentByTimestamp(
        bytes32 _did,
        uint256 _timestamp
    )
        external
        view
        override
        returns (
            string memory baseDocument_,
            string memory alsoKnownAs_,
            bytes32[] memory controllers_,
            bytes32[] memory vMethodIds_,
            VMethod[] memory vMethods_,
            VRelationship[] memory vRelationships_
        )
    {
        return _getDidDocumentByTimestamp(_did, _timestamp);
    }
}
