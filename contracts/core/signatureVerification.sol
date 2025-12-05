// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    _STAMP_TSR_TYPEHASH,
    _ERC203643_TRANSFER_TYPEHASH,
    _ERC203643_TRANSFER_FROM_TYPEHASH,
    _ERC203543_MINT_TYPEHASH,
    _ERC20_BURN_TYPEHASH,
    _ERC20_BURN_FROM_TYPEHASH,
    _DOMAIN_TYPE_HASH,
    _SALT
} from '../constants/values.sol';

/**
 * @notice Thrown when a signature does not match the expected signer
 * @param signer The address that was recovered from the signature
 */
error InvalidSignature(address signer);

/**
 * @notice Thrown when a signature does not have the expected length of 65 bytes
 */
error WrongSignatureLength();

/**
 * @notice Thrown when a provided nonce is not greater than the account's current nonce
 * @param _nonce The invalid nonce provided
 * @param _account The account for which the nonce was invalid
 */
error WrongNonce(uint256 _nonce, address _account);

/**
 * @notice Thrown when a signature's deadline has expired
 * @param _deadline The expired deadline timestamp
 */
error ExpiredDeadline(uint256 _deadline);

/**
 * @notice Computes the EIP-712 typed data hash for a stamp TSR message
 * @dev Encodes the message using the `_STAMP_TSR_TYPEHASH` and the provided parameters
 * @param _originalHash The hash of the original data being stamped
 * @param _tsaHash The hash identifying the timestamp authority
 * @param _externalReferenceId A unique identifier for external reference
 * @param _sender The address of the message sender
 * @param _expirationTimestamp The timestamp after which the message is invalid
 * @param _nonce A unique number to prevent replay attacks
 * @return The computed message hash
 */
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

/**
 * @notice Computes the EIP-712 typed data hash for an ERC-20 transfer message
 * @dev Encodes the message using the `_ERC203643_TRANSFER_TYPEHASH` and the provided parameters
 * @param _to The recipient address of the transfer
 * @param _amount The amount of tokens to transfer
 * @param _sender The address initiating the transfer
 * @param _expirationTimestamp The timestamp after which the message is invalid
 * @param _nonce A unique number to prevent replay attacks
 * @return The computed message hash
 */
function _getMessageHashTransfer(
    address _to,
    uint256 _amount,
    address _sender,
    uint256 _expirationTimestamp,
    uint256 _nonce
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _ERC203643_TRANSFER_TYPEHASH,
                _to,
                _amount,
                _sender,
                _expirationTimestamp,
                _nonce
            )
        );
}

/**
 * @notice Computes the EIP-712 typed data hash for an ERC-20 transferFrom message
 * @dev Encodes the message using the `_ERC203643_TRANSFER_FROM_TYPEHASH` and the provided parameters
 * @param _from The address from which tokens are transferred
 * @param _to The recipient address of the transfer
 * @param _amount The amount of tokens to transfer
 * @param _sender The address initiating the transfer
 * @param _expirationTimestamp The timestamp after which the message is invalid
 * @param _nonce A unique number to prevent replay attacks
 * @return The computed message hash
 */
function _getMessageHashTransferFrom(
    address _from,
    address _to,
    uint256 _amount,
    address _sender,
    uint256 _expirationTimestamp,
    uint256 _nonce
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _ERC203643_TRANSFER_FROM_TYPEHASH,
                _from,
                _to,
                _amount,
                _sender,
                _expirationTimestamp,
                _nonce
            )
        );
}

/**
 * @notice Computes the EIP-712 typed data hash for an ERC-20 mint message
 * @dev Encodes the message using the `_ERC203543_MINT_TYPEHASH` and the provided parameters
 * @param _to The recipient address of the mint
 * @param _amount The amount of tokens to mint
 * @param _sender The address initiating the mint
 * @param _expirationTimestamp The timestamp after which the message is invalid
 * @param _nonce A unique number to prevent replay attacks
 * @return The computed message hash
 */
function _getMessageHashMint(
    address _to,
    uint256 _amount,
    address _sender,
    uint256 _expirationTimestamp,
    uint256 _nonce
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _ERC203543_MINT_TYPEHASH,
                _to,
                _amount,
                _sender,
                _expirationTimestamp,
                _nonce
            )
        );
}

/**
 * @notice Computes the EIP-712 typed data hash for an ERC-20 burn message
 * @dev Encodes the message using the `_ERC20_BURN_TYPEHASH` and the provided parameters
 * @param _account The address of the account whose tokens are being burned
 * @param _amount The amount of tokens to burn
 * @param _expirationTimestamp The timestamp after which the message is invalid
 * @param _nonce A unique number to prevent replay attacks
 * @return The computed message hash
 */
function _getMessageHashBurn(
    address _account,
    uint256 _amount,
    uint256 _expirationTimestamp,
    uint256 _nonce
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _ERC20_BURN_TYPEHASH,
                _account,
                _amount,
                _expirationTimestamp,
                _nonce
            )
        );
}

/**
 * @notice Computes the EIP-712 typed data hash for an ERC-20 burnFrom message
 * @dev Encodes the message using the `_ERC20_BURN_FROM_TYPEHASH` and the provided parameters
 * @param _sender The address initiating the burn
 * @param _account The address of the account whose tokens are being burned
 * @param _amount The amount of tokens to burn
 * @param _expirationTimestamp The timestamp after which the message is invalid
 * @param _nonce A unique number to prevent replay attacks
 * @return The computed message hash
 */
function _getMessageHashBurnFrom(
    address _sender,
    address _account,
    uint256 _amount,
    uint256 _expirationTimestamp,
    uint256 _nonce
) pure returns (bytes32) {
    return
        keccak256(
            abi.encode(
                _ERC20_BURN_FROM_TYPEHASH,
                _sender,
                _account,
                _amount,
                _expirationTimestamp,
                _nonce
            )
        );
}

/**
 * @notice Computes the EIP-712 domain separator hash
 * @dev Encodes the domain data using the `_DOMAIN_TYPE_HASH` and the provided parameters
 * @param _contractName The name of the contract
 * @param _contractVersion The version of the contract
 * @param _chainId The chain ID of the network
 * @param _verifyingContract The address of the verifying contract
 * @return The computed domain separator hash
 */
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

/**
 * @notice Validates the nonce and deadline for a signature
 * @dev Reverts with `ExpiredDeadline` if the deadline has passed or `WrongNonce` if the nonce is invalid
 * @param _nonce The nonce provided by the user
 * @param _account The account associated with the nonce
 * @param _currentNonce The current nonce for the account
 * @param _deadline The timestamp by which the signature must be submitted
 * @param _blockTimestamp The current block timestamp
 */
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

/**
 * @notice Checks if the provided deadline is still valid
 * @dev Compares the deadline against the current block timestamp
 * @param _deadline The deadline timestamp to check
 * @param _blockTimestamp The current block timestamp
 * @return True if the deadline is valid, false otherwise
 */
function _isValidDeadline(
    uint256 _deadline,
    uint256 _blockTimestamp
) pure returns (bool) {
    return _deadline >= _blockTimestamp;
}

/**
 * @notice Checks if the provided nonce is valid for the account
 * @dev A nonce is valid if it is strictly greater than the account's current nonce
 * @param _nonce The nonce to validate
 * @param _currentNonce The account's current nonce
 * @return True if the nonce is valid, false otherwise
 */
function _isValidNonce(
    uint256 _nonce,
    uint256 _currentNonce
) pure returns (bool) {
    return _currentNonce < _nonce;
}

/**
 * @notice Verifies a signature against the expected signer
 * @dev Reverts with `InvalidSignature` if the recovered signer does not match the expected one
 * @param _signer The expected signer address
 * @param _functionHash The hash of the function-specific data
 * @param _signature The signature to verify
 * @param _contractName The name of the contract
 * @param _contractVersion The version of the contract
 * @param _chainId The chain ID of the network
 * @param _contractAddress The address of the verifying contract
 */
function _checkSignature(
    address _signer,
    bytes32 _functionHash,
    bytes memory _signature,
    bytes32 _contractName,
    bytes32 _contractVersion,
    uint256 _chainId,
    address _contractAddress
) pure {
    require(
        _verifySignature(
            _signer,
            _functionHash,
            _signature,
            _contractName,
            _contractVersion,
            _chainId,
            _contractAddress
        ),
        InvalidSignature(_signer)
    );
}

/**
 * @notice Recovers the signer from a signature and verifies it against the expected address
 * @dev Computes the domain separator and prefixed hash, then recovers the signer using ecrecover
 * @param _signer The expected signer address
 * @param _functionHash The hash of the function-specific data
 * @param _signature The signature to verify
 * @param _contractName The name of the contract
 * @param _contractVersion The version of the contract
 * @param _chainId The chain ID of the network
 * @param _contractAddress The address of the verifying contract
 * @return True if the recovered signer matches the expected address, false otherwise
 */
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

/**
 * @notice Recovers the signer's address from a prefixed hash and signature
 * @dev Uses ecrecover to extract the signer's address
 * @param _prefixedHash The prefixed hash of the message
 * @param _signature The signature to recover the signer from
 * @return The recovered signer's address
 */
function _recoverSigner(
    bytes32 _prefixedHash,
    bytes memory _signature
) pure returns (address) {
    (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
    return ecrecover(_prefixedHash, v, r, s);
}

/**
 * @notice Splits a 65-byte signature into its r, s, and v components
 * @dev Reverts with `WrongSignatureLength` if the signature is not 65 bytes long
 * @param sig The 65-byte signature to split
 * @return r The r component of the signature
 * @return s The s component of the signature
 * @return v The v component of the signature
 */
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
