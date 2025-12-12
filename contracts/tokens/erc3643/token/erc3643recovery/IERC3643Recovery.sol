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

/**
 * @title IERC3643Recovery
 * @notice Interface for recovery operations in ERC-3643 tokens.
 * @dev Defines recovery functionality for lost wallets,
 *      allowing authorized agents to transfer tokens from lost wallets to new ones.
 */
interface IERC3643Recovery {
    /**
     * @notice Emitted when an investor successfully recovers their tokens.
     * @dev Emitted by the recoveryAddress function.
     * @param _lostWallet The address of the wallet that was lost.
     * @param _newWallet The address of the wallet provided for recovery.
     */
    event RecoverySuccess(
        address indexed _lostWallet,
        address indexed _newWallet
    );

    /**
     * @notice Thrown when the lost wallet and new wallet are the same address.
     */
    error SameWalletAddress();

    /**
     * @notice Thrown when the lost wallet has no tokens to recover.
     */
    error NoTokensToRecover();

    /**
     * @notice Recovers tokens from a lost wallet to a new wallet.
     * @dev Can only be called by an authorized recovery agent.
     * Emits RecoverySuccess on success, RecoveryFails on failure.
     * @param _lostWallet The wallet that was lost.
     * @param _newWallet The new wallet to which tokens will be transferred.
     * @return success True if recovery was successful, false otherwise.
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet
    ) external returns (bool);
}
