// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ERC203643 Capped Signed Interface
 * @notice Defines the interface for minting capped tokens with cryptographic signatures
 * @dev Provides methods for signed minting to enable off-chain approvals and decentralised minting within cap limits
 */
interface IERC203643CappedSigned {
    /**
     * @notice Event emitted when tokens are minted using a signature
     * @param to Recipient address (indexed)
     * @param amount Amount of tokens minted
     * @param sender Original signer who authorised the minting (indexed)
     * @param expirationTimestamp Timestamp after which the signature is invalid
     * @param nonce Unique identifier for this specific minting operation
     * @param signature Cryptographic signature authorising the minting
     */
    event WithSignatureMinted(
        address indexed to,
        uint256 amount,
        address indexed sender,
        uint256 expirationTimestamp,
        uint256 nonce,
        bytes signature
    );

    /**
     * @notice Mints new tokens using a cryptographic signature instead of direct access control
     * @dev Allows off-chain signing for decentralised minting without direct role requirements
     * @param _to Recipient address
     * @param _amount Amount to mint
     * @param _sender Original signer who authorised the minting
     * @param _expirationTimestamp Timestamp after which signature becomes invalid
     * @param _nonce Unique identifier for this specific minting operation
     * @param _signature Cryptographic signature authorising the minting
     */
    function mintWithSignature(
        address _to,
        uint256 _amount,
        address _sender,
        uint256 _expirationTimestamp,
        uint256 _nonce,
        bytes calldata _signature
    ) external;
}
