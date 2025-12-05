// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ERC20 Burnable Signed Interface
 * @notice Defines the interface for burning tokens with cryptographic signatures
 * @dev Provides methods for signed burns to enable off-chain approvals and decentralised token destruction
 */
interface IERC20BurnableSigned {
    /**
     * @notice Event emitted when a burn is executed using a signature
     * @param account Address whose tokens are being burned (indexed)
     * @param amount Amount of tokens burned
     * @param deadline Timestamp after which the signature is invalid
     * @param nonce Unique identifier for this specific burn operation
     * @param signature Cryptographic signature authorising the burn
     */
    event WithSignatureBurned(
        address indexed account,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes signature
    );

    /**
     * @notice Event emitted when a burnFrom is executed using a signature
     * @param sender Original signer who authorised the transaction (indexed)
     * @param account Address whose tokens are being burned (indexed)
     * @param amount Amount of tokens burned
     * @param deadline Timestamp after which the signature is invalid
     * @param nonce Unique identifier for this specific burn operation
     * @param signature Cryptographic signature authorising the burn
     */
    event WithSignatureBurnedFrom(
        address indexed sender,
        address indexed account,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes signature
    );

    /**
     * @notice Burns tokens from the caller's account using a cryptographic signature
     * @dev Allows off-chain signing for decentralised token burning without prior allowance
     * @param _account Address whose tokens are being burned
     * @param _amount Amount to burn
     * @param _deadline Timestamp after which signature becomes invalid
     * @param _nonce Unique identifier for this specific burn operation
     * @param _signature Cryptographic signature authorising the burn
     */
    function burnWithSignature(
        address _account,
        uint256 _amount,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external;

    /**
     * @notice Burns tokens from a specific account using a cryptographic signature (pull payment)
     * @dev Allows off-chain signing for decentralised token burning without prior allowance
     *      Similar to burnWithSignature but with explicit account specification
     * @param _sender Original signer who authorised the transaction
     * @param _account Address whose tokens are being burned
     * @param _amount Amount to burn
     * @param _deadline Timestamp after which signature becomes invalid
     * @param _nonce Unique identifier for this specific burn operation
     * @param _signature Cryptographic signature authorising the burn
     */
    function burnFromWithSignature(
        address _sender,
        address _account,
        uint256 _amount,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external;
}
