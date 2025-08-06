// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_DID_VRELATIONSHIPS_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {
    _AUTHENTICATION_RELATIONSHIP,
    _ASSERTION_RELATIONSHIP,
    _KEY_AGREEMENT_RELATIONSHIP,
    _CAPABILITY_INVOCATION_RELATIONSHIP,
    _CAPABILITY_DELEGATION_RELATIONSHIP
} from './constants.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {Common} from '../../core/Common.sol';

/**
 * @title Verification Relationships Internal Management
 * @notice Core internal logic for managing DID verification relationships with temporal
 *         validity periods and cryptographic method associations
 * @dev Abstract contract providing internal verification relationship management functionality
 *      including temporal validation, relationship type verification, and storage operations.
 *      Supports W3C DID specification relationship types with enhanced period management
 * @author ISBE Development Team
 */
abstract contract VRelationshipsInternal is Common {
    /**
     * @notice DID identifier with temporal validity period structure
     * @param did The unique DID identifier string
     * @param notBefore Timestamp when the DID relationship becomes valid
     * @param notAfter Timestamp when the DID relationship expires
     */
    struct DidWithPeriod {
        string did;
        uint256 notBefore;
        uint256 notAfter;
    }

    /**
     * @notice Storage structure for verification relationships organised by relationship ID
     * @param didsByVRelationship Mapping from relationship ID to array of temporal DIDs
     */
    struct VRelationshipsStorage {
        mapping(uint256 => DidWithPeriod[]) didsByVRelationship;
    }

    function _addVerificationRelationship(
        uint256 _vrId,
        string memory _did,
        uint256 _notBefore,
        uint256 _notAfter
    ) internal returns (uint256) {
        VRelationshipsStorage storage $ = _vRelationshipsStorage();
        uint256 indexDid = $.didsByVRelationship[_vrId].length;
        $.didsByVRelationship[_vrId].push(
            _buildDidWithPeriod(_did, _notBefore, _notAfter)
        );
        return indexDid;
    }

    //    function _updateVerificationRelationship(
    //        uint256 _vrId,
    //        uint256 _indexDid,
    //        uint256 _notAfter
    //    ) internal returns (bool) {
    //        _vRelationshipsStorage()
    //            .didsByVRelationship[_vrId][_indexDid]
    //            .notAfter = _notAfter;
    //        return true;
    //    }

    function _checkValidRelationshipName(string memory _method) internal pure {
        require(
            _isValidRelationshipName(_method),
            IDidDocumentDetailed.InvalidVerificationMethod(_method)
        );
    }

    function _buildVerificationRelationshipId(
        string memory _method,
        string memory _vMethodId
    ) internal pure returns (uint256 vrId_) {
        return
            vrId_ = uint256(keccak256(abi.encodePacked(_method, _vMethodId)));
    }

    function _buildDidWithPeriod(
        string memory _did,
        uint256 _notBefore,
        uint256 _notAfter
    ) private pure returns (DidWithPeriod memory didWithPeriod_) {
        didWithPeriod_ = DidWithPeriod({
            did: _did,
            notBefore: _notBefore,
            notAfter: _notAfter
        });
    }

    function _isValidRelationshipName(
        string memory _method
    ) private pure returns (bool) {
        return
            _equalStrings(_method, _AUTHENTICATION_RELATIONSHIP) ||
            _equalStrings(_method, _ASSERTION_RELATIONSHIP) ||
            _equalStrings(_method, _KEY_AGREEMENT_RELATIONSHIP) ||
            _equalStrings(_method, _CAPABILITY_INVOCATION_RELATIONSHIP) ||
            _equalStrings(_method, _CAPABILITY_DELEGATION_RELATIONSHIP);
    }

    function _vRelationshipsStorage()
        private
        pure
        returns (VRelationshipsStorage storage storage_)
    {
        bytes32 position = _DID_VRELATIONSHIPS_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
