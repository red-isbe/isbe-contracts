// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC712_STORAGE_POSITION} from "../../constants/storagePositions.sol";
import {
    _ERC712_TYPE_HASH,
    _ERC712_TRANSFER_TYPEHASH,
    _ERC712_MINT_TYPEHASH,
    _ERC712_BURN_TYPEHASH,
    _ERC712_FIELDS_BITMAP
} from "../../constants/values.sol";
import {IERC712} from "./IERC712.sol";

/**
 * @title ERC712Internal
 * @dev Internal implementation of EIP-712 typed structured data hashing and signing.
 * Provides domain separator generation, typed data hashing, and signature verification.
 */
abstract contract ERC712Internal {
    /**
     * @dev Storage layout for ERC712
     * @param cachedDomainSeparator Cached domain separator for gas optimization
     * @param cachedChainId Cached chain ID to detect chain forks
     * @param name User-readable name of signing domain
     * @param version Current major version of the signing domain
     * @param nonces Mapping of address => nonce for replay protection
     */
    struct ERC712Storage {
        bytes32 cachedDomainSeparator;
        uint256 cachedChainId;
        string name;
        string version;
        mapping(address account => uint256 nonce) nonces;
    }

    /**
     * @dev Returns the storage layout for ERC712
     * @return $ Storage layout at the defined storage position
     */
    function _erc712Storage() internal pure returns (ERC712Storage storage $) {
        bytes32 position = _ERC712_STORAGE_POSITION;
        assembly {
            $.slot := position
        }
    }

    /**
     * @dev Initializes the EIP-712 domain with name and version
     * Must be called during proxy initialization
     * @param _name The user-readable name of signing domain
     * @param _version The current major version of the signing domain
     */
    function _initialize(string memory _name, string memory _version) internal {
        ERC712Storage storage $ = _erc712Storage();
        $.name = _name;
        $.version = _version;
        $.cachedChainId = block.chainid;
        $.cachedDomainSeparator = _buildDomainSeparator();
    }

    /**
     * @dev Returns the domain separator for the current chain
     * Recomputes if chain ID has changed (fork detection)
     * @return bytes32 The domain separator
     */
    function _domainSeparatorV4() internal view returns (bytes32) {
        ERC712Storage storage $ = _erc712Storage();

        if (block.chainid == $.cachedChainId) {
            return $.cachedDomainSeparator;
        } else {
            return _buildDomainSeparator();
        }
    }

    /**
     * @dev Builds the domain separator from scratch
     * @return bytes32 The computed domain separator
     */
    function _buildDomainSeparator() internal view returns (bytes32) {
        ERC712Storage storage $ = _erc712Storage();

        return keccak256(
            abi.encode(
                _ERC712_TYPE_HASH,
                keccak256(bytes($.name)),
                keccak256(bytes($.version)),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Returns the hash of fully encoded EIP-712 message
     * @param structHash Hash of the typed data struct
     * @return bytes32 The EIP-712 compliant hash
     */
    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparatorV4(), structHash));
    }

    /**
     * @dev Returns the current nonce for an address and increments it
     * @param owner Address to get and increment nonce for
     * @return current The current nonce before incrementing
     */
    function _useNonce(address owner) internal returns (uint256 current) {
        ERC712Storage storage $ = _erc712Storage();
        current = $.nonces[owner];
        unchecked {
            $.nonces[owner] = current + 1;
        }
    }

    /**
     * @dev Returns the current nonce for an address without incrementing
     * @param owner Address to query
     * @return uint256 The current nonce
     */
    function _nonces(address owner) internal view returns (uint256) {
        return _erc712Storage().nonces[owner];
    }

    /**
     * @dev Verifies a Transfer signature
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param value Amount or token ID
     * @param deadline Signature expiration timestamp
     * @param v Recovery byte
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     * @return signer Address that signed the message
     */
    function _verifyTransferSignature(
        address from,
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal returns (address signer) {
        require(block.timestamp <= deadline, IERC712.ExpiredDeadline());

        bytes32 structHash =
            keccak256(abi.encode(_ERC712_TRANSFER_TYPEHASH, from, to, value, _useNonce(from), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);
        signer = ecrecover(hash, v, r, s);

        require(signer != address(0) && signer == from, IERC712.InvalidSignature());
    }

    /**
     * @dev Verifies a Mint signature
     * @param to Address receiving minted tokens
     * @param value Amount or token ID
     * @param deadline Signature expiration timestamp
     * @param v Recovery byte
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     * @return signer Address that signed the message
     */
    function _verifyMintSignature(
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal returns (address signer) {
        require(block.timestamp <= deadline, IERC712.ExpiredDeadline());

        // For mint, we use msg.sender as the signer (minter must sign)
        bytes32 structHash =
            keccak256(abi.encode(_ERC712_MINT_TYPEHASH, to, value, _useNonce(msg.sender), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);
        signer = ecrecover(hash, v, r, s);

        require(signer != address(0) && signer == msg.sender, IERC712.InvalidSignature());
    }

    /**
     * @dev Verifies a Burn signature
     * @param from Address whose tokens will be burned
     * @param value Amount or token ID
     * @param deadline Signature expiration timestamp
     * @param v Recovery byte
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     * @return signer Address that signed the message
     */
    function _verifyBurnSignature(
        address from,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal returns (address signer) {
        require(block.timestamp <= deadline, IERC712.ExpiredDeadline());

        bytes32 structHash =
            keccak256(abi.encode(_ERC712_BURN_TYPEHASH, from, value, _useNonce(from), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);
        signer = ecrecover(hash, v, r, s);

        require(signer != address(0) && signer == from, IERC712.InvalidSignature());
    }

    /**
     * @dev Returns the EIP-712 domain fields
     * @return fields Bitmap of used fields
     * @return name Domain name
     * @return version Domain version
     * @return chainId Current chain ID
     * @return verifyingContract This contract's address
     * @return salt Unused, returns bytes32(0)
     * @return extensions Unused, returns empty array
     */
    function _eip712Domain()
        internal
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        )
    {
        ERC712Storage storage $ = _erc712Storage();

        return (
            _ERC712_FIELDS_BITMAP, // name, version, chainId, verifyingContract
            $.name,
            $.version,
            block.chainid,
            address(this),
            bytes32(0),
            new uint256[](0)
        );
    }
}
