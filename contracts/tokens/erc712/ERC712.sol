// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../erc203643/ERC203643InternalCommon.sol';
import {IERC712} from "./IERC712.sol";
import {_SPONSOR_ROLE} from "../../constants/roles.sol";
import {_ERC712_RESOLVER_KEY} from "../../constants/resolverKeys.sol";
import {_ERC712_FACET_VERSION} from "../../constants/facetVersions.sol";

/**
 * @title ERC712
 * @dev Abstract contract for ERC712 functionality.
 * Provides sponsor functions that execute token operations on behalf of signers using EIP-712 signatures.
 *
 * INHERITANCE CHAIN:
 * This contract inherits from:
 * - IERC712: Interface for EIP-712 functionality
 * - ERC203643InternalCommon: Provides unified ERC20/ERC3643 token logic and includes:
 *   - ERC20SnapshotInternal → ERC20Internal → DidDocumentDetailedInternal
 *   - ERC3643FreezeInternal
 *   - ERC3643ComplianceInternal
 *   - ERC712Internal: Core EIP-712 implementation (storage, domain separator, signature verification)
 *
 * Through this inheritance chain, ERC712 has access to:
 * - Token operations: _transfer, _mint, _burn
 * - Access control: onlyRole, _hasRole
 * - Initialization: _disableInitializers, initializer modifier
 * - EIP-712 internals: _domainSeparatorV4, _verifyTransferSignature, etc.
 */
abstract contract ERC712 is IERC712, ERC203643InternalCommon {
    /**
     * @dev Constructor that disables initializers for this facet
     */
    constructor() {
        _disableInitializers(_ERC712_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the EIP-712 domain with name and version
     * @param _name The user-readable name of signing domain
     * @param _version The current major version of the signing domain
     */
    function initializeErc712(
        string memory _name,
        string memory _version
    ) external initializer(_ERC712_RESOLVER_KEY, _ERC712_FACET_VERSION) {
        _initialize(_name, _version);
        emit Erc712Initialized(_name, _version);
    }

    /**
     * @dev Returns the domain separator used in the encoding of the signature for permits, as defined by EIP-712
     * @return bytes32 The domain separator
     */
    function DOMAIN_SEPARATOR() external view override returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Returns the current nonce for an address
     * @param owner Address to query
     * @return uint256 Current nonce value
     */
    function nonces(address owner) external view override returns (uint256) {
        return _nonces(owner);
    }

    /**
     * @dev Returns the fields and values that describe the domain separator used by this contract for EIP-712 signature
     */
    function eip712Domain()
        external
        view
        override
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
        return _eip712Domain();
    }

    /**
     * @dev Execute a transfer operation on behalf of a signer using EIP-712 signature
     * Requires SPONSOR_ROLE
     */
    function transferBySponsor(
        address from,
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override onlyRole(_SPONSOR_ROLE) {

        address signer = _verifyTransferSignature(from, to, value, deadline, v, r, s);

        _transfer(from, to, value);

        emit TransferBySponsor(from, to, value, msg.sender, signer);
    }

    /**
     * @dev Execute a mint operation on behalf of a signer using EIP-712 signature
     * Requires SPONSOR_ROLE
     */
    function mintBySponsor(
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override onlyRole(_SPONSOR_ROLE) {

        address signer = _verifyMintSignature(to, value, deadline, v, r, s);

        _mint(to, value);

        emit MintBySponsor(to, value, msg.sender, signer);
    }

    /**
     * @dev Execute a burn operation on behalf of a signer using EIP-712 signature
     * Requires SPONSOR_ROLE
     */
    function burnBySponsor(
        address from,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override onlyRole(_SPONSOR_ROLE) {

        address signer = _verifyBurnSignature(from, value, deadline, v, r, s);

        _burn(from, value);

        emit BurnBySponsor(from, value, msg.sender, signer);
    }

    /// @notice Returns the list of interfaces implemented by this contract
    /// @return interfaces_ Array of interface IDs
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC712).interfaceId;
    }

}
