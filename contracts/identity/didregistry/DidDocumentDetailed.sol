// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {_DID_DOCUMENT_DETAILED_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {DidControllerInternal} from './DidControllerInternal.sol';
import {_DID_DOCUMENT_DETAILED_VERSION} from '../../constants/facetVersions.sol';

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
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(
            _DID_DOCUMENT_DETAILED_RESOLVER_KEY,
            _DID_DOCUMENT_DETAILED_VERSION
        );
    }

    function initializeDiDRegistry(
        EllipticType _ellipticType
    )
        external
        initializer(
            _DID_DOCUMENT_DETAILED_RESOLVER_KEY,
            _DID_DOCUMENT_DETAILED_VERSION
        )
        validateEllipticType(_ellipticType)
    {
        _setEllipticType(_ellipticType);
        emit DiDRegistryInitialized(_ellipticType);
    }

    function insertDidDocument(
        string memory _did,
        string memory _baseDocument,
        string memory _vMethodId,
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
        returns (bool)
    {
        {
            _checkEmptyString(_did);
            _checkEmptyString(_baseDocument);
            _checkEmptyString(_vMethodId);
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
                _notAfter
            ) && _linkDidToController(_did, _did);
    }

    function updateBaseDocument(
        string memory did,
        string memory baseDocument
    )
        external
        override
        emptyString(did)
        emptyString(baseDocument)
        onlyDidExists(did)
        onlyControllerOrAuth(did)
        returns (bool)
    {
        emit BaseDocumentUpdated(did, baseDocument);
        return _updateBaseDocument(did, baseDocument);
    }

    function getDids(
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            string[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        return _getDids(_page, _pageSize);
    }

    function getDidDocument(
        string memory _did
    )
        external
        view
        override
        returns (
            string memory baseDocument_,
            string[] memory controllers_,
            string[] memory vMethodIds_,
            VMethod[] memory vMethods_,
            VRelationship[] memory vRelationships_
        )
    {
        return _getDidDocument(_did);
    }

    function getDidDocumentByTimestamp(
        string memory _did,
        uint256 _timestamp
    )
        external
        view
        override
        returns (
            string memory baseDocument_,
            string[] memory controllers_,
            string[] memory vMethodIds_,
            VMethod[] memory vMethods_,
            VRelationship[] memory vRelationships_
        )
    {
        return _getDidDocumentByTimestamp(_did, _timestamp);
    }
}
