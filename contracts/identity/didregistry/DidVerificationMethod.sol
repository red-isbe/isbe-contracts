// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidVerificationMethod} from './interfaces/IDidVerificationMethod.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {DidControllerInternal} from './DidControllerInternal.sol';

/**
 * @title DID Verification Method Management
 * @notice Abstract contract for managing cryptographic verification methods within DID documents
 * @dev Provides external interface implementations for adding, revoking, expiring, and rolling
 *      verification methods with comprehensive access control and temporal validation. Integrates
 *      with controller management to ensure authorised operations on DID documents
 * @author ISBE Development Team
 */
abstract contract DidVerificationMethod is
    DidControllerInternal,
    IDidVerificationMethod
{
    function addVerificationMethod(
        bytes32 _did,
        bytes32 _vMethodId,
        bytes memory _publicKey,
        IDidDocumentDetailed.EllipticType _ellipticType
    )
        external
        override
        bytes32IsNotZero(_did)
        bytes32IsNotZero(_vMethodId)
        emptyBytes(_publicKey)
        validateEllipticType(_ellipticType)
        onlyDidExists(_did)
        onlyEmptyVMethodAndPublicKey(
            _did,
            _vMethodId,
            _publicKey,
            _ellipticType
        )
        onlyControllerOrAuth(_did)
        returns (bool success)
    {
        emit VerificationMethodAdded(
            _did,
            _vMethodId,
            _publicKey,
            _ellipticType
        );
        return
            _addVerificationMethod(_did, _vMethodId, _publicKey, _ellipticType);
    }

    function revokeVerificationMethod(
        bytes32 _did,
        bytes32 _vMethodId,
        uint256 _notAfter
    )
        external
        override
        bytes32IsNotZero(_did)
        bytes32IsNotZero(_vMethodId)
        onlyDidExists(_did)
        onlyVMethodIdExists(_did, _vMethodId)
        returns (bool success)
    {
        {
            _checkUintIsNotZero(_notAfter);
            _checkNotAfterRevocation(_notAfter);
        }
        emit VerificationMethodRevoked(_did, _vMethodId, _notAfter);
        return _revokeVerificationMethod(_did, _vMethodId, _notAfter);
    }

    function expireVerificationMethod(
        bytes32 _did,
        bytes32 _vMethodId,
        uint256 _notAfter
    )
        external
        override
        bytes32IsNotZero(_did)
        bytes32IsNotZero(_vMethodId)
        onlyDidExists(_did)
        onlyVMethodIdExists(_did, _vMethodId)
        returns (bool success)
    {
        {
            _checkUintIsNotZero(_notAfter);
            _checkNotAfterExpiration(_notAfter);
        }
        emit VerificationMethodExpired(_did, _vMethodId, _notAfter);
        return _expireVerificationMethod(_did, _vMethodId, _notAfter);
    }

    function rollVerificationMethod(
        RollArgs memory args
    )
        external
        override
        onlyControllerOrAuth(args.did)
        validateRollArgs(args)
        onlyGoodRollArgs(args)
        returns (bool success)
    {
        {
            emit VerificationMethodRolled(
                args.did,
                args.vMethodId,
                args.publicKey,
                args.ellipticType,
                args.notBefore,
                args.notAfter,
                args.oldVMethodId,
                args.duration
            );
        }
        return _rollVerificationMethod(args);
    }
}
