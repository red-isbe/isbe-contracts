// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidDocumentDetailedInternal} from './DidDocumentDetailedInternal.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {_DID_DOCUMENT_DETAILED_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

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
    DidDocumentDetailedInternal,
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

    function getDidDocument(
        string memory _did
    )
        external
        view
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
}
