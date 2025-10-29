// SPDX-License-Identifier: UNLICENSED
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
     * @notice Thrown when the lost wallet address is zero.
     */
    error InvalidLostWallet();

    /**
     * @notice Thrown when the new wallet address is zero.
     */
    error InvalidNewWallet();

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