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
     *  this event is emitted when an investor successfully recovers his tokens
     *  the event is emitted by the recoveryAddress function
     *  `_lostWallet` is the address of the wallet that the investor
     *  lost access to
     *  `_newWallet` is the address of the wallet that the investor
     *  provided for the recovery
     *  `_investorOnchainID` is the address of the onchainID
     *  of the investor who asked for a recovery
     */
    event RecoverySuccess(
        address indexed _lostWallet,
        address indexed _newWallet,
        address indexed _investorOnchainID
    );

    /**
     *  this event is emitted when the recovery process fails
     *  the event is emitted by the recoveryAddress function
     *  `_lostWallet` is the address of the wallet that the investor lost access to
     *  `_newWallet` is the address of the wallet that the investor provided for the recovery
     *  `_investorOnchainID` is the address of the onchainID of the investor who asked for a recovery
     */
    event RecoveryFails(
        address indexed _lostWallet,
        address indexed _newWallet,
        address indexed _investorOnchainID
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
     * @notice Thrown when the investor onchain ID address is zero.
     */
    error InvalidInvestorOnchainID();

    /**
     * @notice Thrown when the lost wallet and new wallet are the same address.
     */
    error SameWalletAddress();

    /**
     * @notice Thrown when the lost wallet has no tokens to recover.
     */
    error NoTokensToRecover();

    /**
     *  @dev recovery function used to force transfer tokens from a
     *  lost wallet to a new wallet for an investor.
     *  @param _lostWallet the wallet that the investor lost
     *  @param _newWallet the newly provided wallet on which tokens have to be transferred
     *  @param _investorOnchainID the onchainID of the investor asking for a recovery
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `TokensUnfrozen` event if there is some frozen tokens on the lost wallet if the recov process success
     *  emits a `Transfer` event if the recovery process is successful
     *  emits a `RecoverySuccess` event if the recovery process is successful
     *  emits a `RecoveryFails` event if the recovery process fails
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) external returns (bool);
}
