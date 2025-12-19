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

/**
 * @title Nonce manager interface
 * @notice Defines the interface for managing per-account, per-key nonce
 *         sequences used in account abstraction flows.
 * @dev Provides accessors and mutators for composite nonces combining a
 *      192-bit key and a 64-bit sequence value. Implementations must
 *      guarantee monotonic increments and ensure replay protection across
 *      logically separated nonce namespaces. Intended for integration with
 *      ERC-4337 style validation pipelines where nonce metadata is encoded
 *      directly into the value.
 * @author ISBE Development Team
 */
interface INonceManager {
    /**
     * @notice Increments the nonce for the message sender and specified key.
     * @dev Updates the internal mapping for the sender. The function assumes that
     *      the caller is the owner of the nonce sequence, ensuring consistent
     *      sequencing for operations using the same key.
     * @param key The 192-bit key identifying the nonce sequence to increment.
     */
    function incrementNonce(uint192 key) external;

    /**
     * @notice Retrieves the current full nonce for a given sender and key.
     * @dev Combines the key (upper 192 bits) and the current sequence number (lower 64 bits)
     *      into a single uint256. Used for constructing nonces compatible with operation
     *      validation schemes that encode metadata into nonce values.
     * @param sender The address whose nonce is being retrieved.
     * @param key The 192-bit key identifying a logical nonce sequence.
     * @return nonce The composite nonce value, combining key and sequence number.
     */
    function getNonce(
        address sender,
        uint192 key
    ) external view returns (uint256 nonce);
}
