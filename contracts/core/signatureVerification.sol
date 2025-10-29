// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    _STAMP_TSR_TYPEHASH,
    _DOMAIN_TYPE_HASH,
    _SALT
} from '../constants/values.sol';

error InvalidSignature(address signer);
error WrongSignatureLength();
error WrongNonce(uint256 _nonce, address _account);
error ExpiredDeadline(uint256 _deadline);

function _getMessageHashStampTsr(
    bytes32 _originalHash,
    bytes32 _tsaHash,
    bytes32 _externalReferenceId,
    address _sender,
    uint256 _expirationTimestamp,
    uint256 _nonce
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _STAMP_TSR_TYPEHASH,
                _originalHash,
                _tsaHash,
                _externalReferenceId,
                _sender,
                _expirationTimestamp,
                _nonce
            )
        );
}

function _getDomainTypeHash(
    bytes32 _contractName,
    bytes32 _contractVersion,
    uint256 _chainId,
    address _verifyingContract
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _DOMAIN_TYPE_HASH,
                _contractName,
                _contractVersion,
                _chainId,
                _verifyingContract
            )
        );
}

function _checkNonceAndDeadline(
    uint256 _nonce,
    address _account,
    uint256 _currentNonce,
    uint256 _deadline,
    uint256 _blockTimestamp
) pure {
    require(
        _isValidDeadline(_deadline, _blockTimestamp),
        ExpiredDeadline(_deadline)
    );
    require(_isValidNonce(_nonce, _currentNonce), WrongNonce(_nonce, _account));
}

function _isValidDeadline(
    uint256 _deadline,
    uint256 _blockTimestamp
) pure returns (bool) {
    return _deadline >= _blockTimestamp;
}

function _isValidNonce(
    uint256 _nonce,
    uint256 _currentNonce
) pure returns (bool) {
    return _currentNonce < _nonce;
}

function _verifySignature(
    address _signer,
    bytes32 _functionHash,
    bytes memory _signature,
    bytes32 _contractName,
    bytes32 _contractVersion,
    uint256 _chainId,
    address _contractAddress
) pure returns (bool) {
    bytes32 domainHash = _getDomainTypeHash(
        _contractName,
        _contractVersion,
        _chainId,
        _contractAddress
    );
    bytes32 prefixedHash = keccak256(
        abi.encodePacked(_SALT, domainHash, _functionHash)
    );
    return (_recoverSigner(prefixedHash, _signature) == _signer);
}

function _recoverSigner(
    bytes32 _prefixedHash,
    bytes memory _signature
) pure returns (address) {
    (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
    return ecrecover(_prefixedHash, v, r, s);
}

function _splitSignature(
    bytes memory sig
) pure returns (bytes32 r, bytes32 s, uint8 v) {
    require(sig.length == 65, WrongSignatureLength());
    // solhint-disable-next-line no-inline-assembly
    assembly {
        // first 32 bytes, after the length prefix which are 32 bytes long too
        r := mload(add(sig, 32))
        // second 32 bytes
        s := mload(add(sig, 64))
        // final byte (first byte of the next 32 bytes)
        v := byte(0, mload(add(sig, 96)))
    }
    // implicitly return (r, s, v)
}
