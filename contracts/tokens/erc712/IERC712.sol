// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC712
 * @dev Interface for EIP-712 typed structured data hashing and signing.
 * Enables meta-transactions where a sponsor can execute operations on behalf of a signer.
 */
interface IERC712 {
    /**
     * @dev Emitted when a transfer is executed by a sponsor on behalf of the signer
     * @param from Address of the token sender
     * @param to Address of the token recipient
     * @param value Amount of tokens transferred (ERC20/ERC3643) or token ID (ERC721)
     * @param sponsor Address that executed the sponsored transaction
     * @param signer Address that signed the operation
     */
    event TransferBySponsor(
        address indexed from,
        address indexed to,
        uint256 value,
        address indexed sponsor,
        address signer
    );

    /**
     * @dev Emitted when a mint is executed by a sponsor on behalf of the signer
     * @param to Address receiving the minted tokens
     * @param value Amount of tokens minted (ERC20/ERC3643) or token ID (ERC721)
     * @param sponsor Address that executed the sponsored transaction
     * @param signer Address that signed the operation
     */
    event MintBySponsor(address indexed to, uint256 value, address indexed sponsor, address signer);

    /**
     * @dev Emitted when a burn is executed by a sponsor on behalf of the signer
     * @param from Address whose tokens are burned
     * @param value Amount of tokens burned (ERC20/ERC3643) or token ID (ERC721)
     * @param sponsor Address that executed the sponsored transaction
     * @param signer Address that signed the operation
     */
    event BurnBySponsor(
        address indexed from,
        uint256 value,
        address indexed sponsor,
        address signer
    );

     /**
     * @dev Emitted when ERC712 domain is initialized
     * @param name The user-readable name of signing domain
     * @param version The current major version of the signing domain
     */
    event Erc712Initialized(string name, string version);

    /**
     * @dev Invalid signature error
     */
    error InvalidSignature();

    /**
     * @dev Expired deadline error
     */
    error ExpiredDeadline();

    /**
     * @dev Invalid nonce error
     */
    error InvalidNonce();

    /**
     * @dev Returns the domain separator used in the encoding of the signature for permits, as defined by EIP-712
     * @return bytes32 The domain separator
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /**
     * @dev Returns the current nonce for an address
     * @param owner Address to query
     * @return uint256 Current nonce value
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the fields and values that describe the domain separator used by this contract for EIP-712 signature.
     * @return fields A byte string of concatenated field names (e.g., "name,version,chainId,verifyingContract")
     * @return name The user-readable name of signing domain
     * @return version The current major version of the signing domain
     * @return chainId The EIP-155 chain id
     * @return verifyingContract The address of the contract that will verify the signature
     * @return salt A disambiguating salt for the protocol (not used, returns bytes32(0))
     * @return extensions An array of EIP numbers that extend EIP-712 (not used, returns empty array)
     */
    function eip712Domain()
        external
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        );

    /**
     * @dev Execute a transfer operation on behalf of a signer using EIP-712 signature
     * @param from Address of the token sender
     * @param to Address of the token recipient
     * @param value Amount of tokens (ERC20/ERC3643) or token ID (ERC721)
     * @param deadline Unix timestamp after which the signature expires
     * @param v Recovery byte of the signature
     * @param r First 32 bytes of the signature
     * @param s Second 32 bytes of the signature
     */
    function transferBySponsor(
        address from,
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Execute a mint operation on behalf of a signer using EIP-712 signature
     * @param to Address receiving the minted tokens
     * @param value Amount of tokens to mint (ERC20/ERC3643) or token ID (ERC721)
     * @param deadline Unix timestamp after which the signature expires
     * @param v Recovery byte of the signature
     * @param r First 32 bytes of the signature
     * @param s Second 32 bytes of the signature
     */
    function mintBySponsor(
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Execute a burn operation on behalf of a signer using EIP-712 signature
     * @param from Address whose tokens will be burned
     * @param value Amount of tokens to burn (ERC20/ERC3643) or token ID (ERC721)
     * @param deadline Unix timestamp after which the signature expires
     * @param v Recovery byte of the signature
     * @param r First 32 bytes of the signature
     * @param s Second 32 bytes of the signature
     */
    function burnBySponsor(
        address from,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
