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
    _checkSignature,
    _checkNonceAndDeadline
} from './signatureVerification.sol';
import {_NONCES_STORAGE_POSITION} from '../constants/storagePositions.sol';

/**
 * @title ERC712 Internal
 * @notice Provides internal utilities for verifying signed transactions using EIP-712
 * @dev This abstract contract enables secure transaction validation with nonce and signature checks
 * @author OpenZeppelin
 */
abstract contract ERC712Internal {
    /**
     * @notice Stores nonces for each sender address
     * @dev Used to prevent replay attacks by ensuring each transaction is unique
     */
    struct NonceStorage {
        mapping(address sender => uint256 nonce) nonces;
    }
    /**
     * @notice Validates a signed transaction and updates the sender's nonce
     * @dev Performs nonce and deadline checks, verifies signature, and increments nonce
     * @param _sender Address of the transaction sender
     * @param _expirationTimestamp Deadline timestamp for the transaction
     * @param _nonce Transaction nonce to prevent replay attacks
     * @param _functionHash Hash of the function call data
     * @param _signature Signature provided by the sender
     * @param _contractName Name of the contract for EIP-712 domain separation
     * @param _contractVersion Version of the contract for EIP-712 domain separation
     * @param _chainId Identifier of the network
     */
    function _checkSignedTransaction(
        address _sender,
        uint256 _expirationTimestamp,
        uint256 _nonce,
        bytes32 _functionHash,
        bytes calldata _signature,
        bytes32 _contractName,
        bytes32 _contractVersion,
        uint256 _chainId
    ) internal {
        _checkNonceAndDeadline(
            _nonce,
            _sender,
            _noncesStorage().nonces[_sender],
            _expirationTimestamp,
            _chainId
        );
        _checkSignature(
            _sender,
            _functionHash,
            _signature,
            _contractName,
            _contractVersion,
            _chainId,
            address(this)
        );
        _noncesStorage().nonces[_sender] = _nonce;
    }

    /**
     * @notice Retrieves the nonce storage location
     * @dev Returns a reference to the storage location for nonces
     * @return storage_ Reference to the nonce storage
     */
    function _noncesStorage()
        internal
        pure
        returns (NonceStorage storage storage_)
    {
        bytes32 position = _NONCES_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
