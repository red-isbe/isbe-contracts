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
-------------------------------------------------------------- */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    DidDocumentDetailedInternal
} from '../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {
    _ACCOUNT_ABSTRACTION_NONCE_MANAGER_STORAGE_POSITION
} from '../../../constants/storagePositions.sol';

/**
 * @title NonceManagerInternal
 * @notice Provides internal nonce management utilities for DID-based identity systems.
 * @dev Tracks and validates sequential nonces per address and key. Designed for
 *      integration with EntryPoint-style operation validation or other meta-tx systems.
 *      Each sender–key pair maintains an independent sequence counter to ensure
 *      replay protection across different operation contexts.
 * @author ISBE Development Team
 */
abstract contract NonceManagerInternal is DidDocumentDetailedInternal {
    struct NonceManagerStorage {
        /**
         * @notice Maps an address and key to its corresponding sequence number.
         * @dev Keyed by `address` and `uint192` identifier, enabling logical separation
         *      of nonce spaces per key domain (e.g., multiple wallets or sessions).
         *      Each `nonceSequenceNumber[sender][key]` tracks the current sequence index.
         */
        mapping(address => mapping(uint192 => uint256)) nonceSequenceNumber;
    }

    /**
     * @notice Increments the nonce for the message sender and specified key.
     * @dev Updates the internal mapping for the sender. The function assumes that
     *      the caller is the owner of the nonce sequence, ensuring consistent
     *      sequencing for operations using the same key.
     * @param key The 192-bit key identifying the nonce sequence to increment.
     */
    function _incrementNonce(uint192 key) internal {
        _nonceManagerStorage().nonceSequenceNumber[msg.sender][key]++;
    }

    /**
     * @notice Validates and increments a sender’s nonce in a single operation.
     * @dev Used during user operation validation to check that the nonce provided
     *      matches the expected sequence value. If valid, increments the sequence
     *      number to prevent replay. Returns `true` on success, `false` otherwise.
     * @param sender The address whose nonce is being verified.
     * @param nonce The full nonce value provided for validation.
     * @return bool True if the nonce matches and is successfully updated, false otherwise.
     */
    function _validateAndUpdateNonce(
        address sender,
        uint256 nonce
    ) internal returns (bool) {
        uint192 key = uint192(nonce >> 64);
        uint64 seq = uint64(nonce);
        return _nonceManagerStorage().nonceSequenceNumber[sender][key]++ == seq;
    }

    /**
     * @notice Retrieves the current full nonce for a given sender and key.
     * @dev Combines the key (upper 192 bits) and the current sequence number (lower 64 bits)
     *      into a single uint256. Used for constructing nonces compatible with operation
     *      validation schemes that encode metadata into nonce values.
     * @param sender The address whose nonce is being retrieved.
     * @param key The 192-bit key identifying a logical nonce sequence.
     * @return nonce The composite nonce value, combining key and sequence number.
     */
    function _getNonce(
        address sender,
        uint192 key
    ) internal view returns (uint256 nonce) {
        return
            _nonceManagerStorage().nonceSequenceNumber[sender][key] |
            (uint256(key) << 64);
    }

    /**
     * @notice Returns the storage slot for nonce manager
     * @dev Uses inline assembly to return storage struct at predefined slot
     * @return storage_ The nonce manager storage struct
     */
    function _nonceManagerStorage()
        private
        pure
        returns (NonceManagerStorage storage storage_)
    {
        bytes32 position = _ACCOUNT_ABSTRACTION_NONCE_MANAGER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
