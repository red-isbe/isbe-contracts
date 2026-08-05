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
    _DID_VRELATIONSHIPS_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {
    _AUTHENTICATION_RELATIONSHIP,
    _ASSERTION_RELATIONSHIP,
    _KEY_AGREEMENT_RELATIONSHIP,
    _CAPABILITY_INVOCATION_RELATIONSHIP,
    _CAPABILITY_DELEGATION_RELATIONSHIP
} from './constants.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {IDidVerificationMethod} from './interfaces/IDidVerificationMethod.sol';
import {
    IDidVerificationRelationship
} from './interfaces/IDidVerificationRelationship.sol';
import {
    _DID_VRELATIONSHIPS_STORAGE_POSITION
} from '../../constants/storagePositions.sol';

/**
 * @title Verification Relationships Internal Management
 * @notice Core internal logic for managing DID verification relationships with temporal
 *         validity periods and cryptographic method associations
 * @dev Abstract contract providing internal verification relationship management functionality
 *      including temporal validation, relationship type verification, and storage operations.
 *      Supports W3C DID specification relationship types with enhanced period management
 * @author ISBE Development Team
 */
abstract contract VRelationshipsInternal is ISBEContext {
    /**
     * @notice Storage structure for verification relationships organised by relationship ID
     * @param didsByVRelationship Mapping from relationship ID to array of temporal DIDs
     */
    struct VRelationshipsStorage {
        // solhint-disable-next-line max-line-length
        mapping(uint256 vRelationshipId => IDidVerificationRelationship.DidWithPeriod[] didsWithPeriod) didsByVRelationship;
    }

    function _addVerificationRelationship(
        bytes32 _vMethodId,
        string memory _name,
        bytes32 _did,
        uint256 _notBefore,
        uint256 _notAfter
    ) internal returns (uint256) {
        uint256 _vrId = _buildVerificationRelationshipId(_name, _vMethodId);
        VRelationshipsStorage storage $ = _vRelationshipsStorage();
        uint256 indexDid = $.didsByVRelationship[_vrId].length;
        $.didsByVRelationship[_vrId].push(
            _buildDidWithPeriod(_did, _notBefore, _notAfter)
        );
        return indexDid;
    }

    function _updateVerificationRelationship(
        bytes32 _vMethodId,
        string memory _name,
        uint256 _indexDid,
        uint256 _notAfter
    ) internal {
        _vRelationshipsStorage()
        .didsByVRelationship[
            _buildVerificationRelationshipId(_name, _vMethodId)
        ][_indexDid].notAfter = _notAfter;
    }

    function _getDidsByVerificationRelationship(
        bytes32 _vMethodId,
        string memory _name,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            IDidVerificationRelationship.DidWithPeriod[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        IDidVerificationRelationship.DidWithPeriod[]
            storage didsWithPeriods = _vRelationshipsStorage()
                .didsByVRelationship[
                    _buildVerificationRelationshipId(_name, _vMethodId)
                ];
        total_ = didsWithPeriods.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            didsWithPeriods.length,
            _page,
            _pageSize
        );
        if (howMany_ == 0) return (items_, total_, howMany_, prev_, next_);
        items_ = new IDidVerificationRelationship.DidWithPeriod[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = didsWithPeriods[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _checkNotAfterRevocation(uint256 _notAfter) internal view {
        require(
            _notAfter <= _blockTimestamp(),
            IDidVerificationMethod.InvalidNotAfter()
        );
    }

    function _checkNotAfterExpiration(uint256 _notAfter) internal view {
        require(
            _notAfter > _blockTimestamp(),
            IDidVerificationMethod.InvalidNotAfter()
        );
    }

    function _checkValidRelationshipName(string memory _method) internal pure {
        require(
            _isValidRelationshipName(_method),
            IDidDocumentDetailed.InvalidVerificationMethodName(_method)
        );
    }

    function _buildVerificationRelationshipId(
        string memory _method,
        bytes32 _vMethodId
    ) internal pure returns (uint256 vrId_) {
        return
            vrId_ = uint256(keccak256(abi.encodePacked(_method, _vMethodId)));
    }

    function _buildDidWithPeriod(
        bytes32 _did,
        uint256 _notBefore,
        uint256 _notAfter
    )
        private
        pure
        returns (
            IDidVerificationRelationship.DidWithPeriod memory didWithPeriod_
        )
    {
        didWithPeriod_ = IDidVerificationRelationship.DidWithPeriod({
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
