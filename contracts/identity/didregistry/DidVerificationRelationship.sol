// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidVerificationRelationship} from './interfaces/IDidVerificationRelationship.sol';
import {DidControllerInternal} from './DidControllerInternal.sol';

/**
 * @title DID Verification Relationship Management
 * @notice Abstract contract for managing verification relationships between decentralised
 *         identifiers and their cryptographic verification methods
 * @dev Provides external interface implementations for creating and querying verification
 *      relationships with temporal validity constraints. Integrates with controller
 *      management to ensure authorised operations and implements W3C DID specification
 *      relationship types for authentication and authorisation purposes
 * @author ISBE Development Team
 */
abstract contract DidVerificationRelationship is
    DidControllerInternal,
    IDidVerificationRelationship
{
    function addVerificationRelationship(
        bytes32 _did,
        string memory _name,
        bytes32 _vMethodId,
        uint256 _notBefore,
        uint256 _notAfter
    )
        external
        override
        bytes32IsNotZero(_did)
        emptyString(_name)
        bytes32IsNotZero(_vMethodId)
        emptyUint(_notBefore)
        emptyUint(_notAfter)
        onlyDidExists(_did)
        onlyVMethodIdExists(_did, _vMethodId)
        onlyControllerOrAuth(_did)
        returns (bool success)
    {
        {
            _checkValidRelationshipName(_name);
            _checkEmptyVerificationRelationship(_did, _name, _vMethodId);
            _checkValidDates(_notBefore, _notAfter);
        }
        emit VerificationRelationshipAdded(
            _did,
            _name,
            _vMethodId,
            _notBefore,
            _notAfter
        );
        return
            _addVerificationRelationshipToDocument(
                _did,
                _name,
                _vMethodId,
                _notBefore,
                _notAfter
            );
    }

    function getDidsByVerificationRelationship(
        bytes32 _vMethodId,
        string memory _name,
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        override
        returns (
            DidWithPeriod[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        return
            _getDidsByVerificationRelationship(
                _vMethodId,
                _name,
                _page,
                _pageSize
            );
    }
}
