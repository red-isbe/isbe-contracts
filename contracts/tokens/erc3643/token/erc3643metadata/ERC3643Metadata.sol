// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_METADATA_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Metadata} from './IERC3643Metadata.sol';
import {_METADATA_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643Metadata
 * @notice External contract implementing ERC-3643 metadata management.
 * @dev Provides public methods to update and retrieve token metadata such as name, symbol,
 *      onchain identity, and version. Uses METADATA_ROLE for granular permission control.
 */
abstract contract ERC3643Metadata is IERC3643Metadata, ERC203643InternalCommon {
    /**
     * @dev Disables further initializations for this facet using its resolver key.
     */
    constructor() {
        _disableInitializers(_ERC3643_METADATA_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the metadata fields of the token.
     * @dev Can only be called once via the initializer modifier.
     *      Emits a {UpdatedTokenInformation} event.
     * @param _newVersion The initial version string. Must be non-empty.
     */
    function initializeERC3643Metadata(
        string memory _newVersion
    )
        external
        override
        initializer(_ERC3643_METADATA_RESOLVER_KEY)
        emptyString(_newVersion)
    {
        _initialize(_newVersion);
        emit UpdatedTokenInformation(
            _name(),
            _symbol(),
            _decimals(),
            _newVersion
        );
    }

    /**
     * @notice Updates the token name.
     * @dev Restricted to metadata role. Requires non-empty input and unpaused state.
     *      Updates the ERC20 name storage and emits regulatory compliance event.
     * @param _newName The new name to assign to the token.
     *
     * Requirements:
     * - Caller must have METADATA_ROLE
     * - Contract must not be paused
     * - _newName must not be empty
     *
     * Emits:
     * - {UpdatedTokenInformation} event with all current token metadata
     */
    function setName(
        string memory _newName
    )
        external
        override
        onlyRole(_METADATA_ROLE)
        emptyString(_newName)
        whenNotPaused
    {
        _setName(_newName);
        emit UpdatedTokenInformation(
            _newName,
            _symbol(),
            _decimals(),
            _version()
        );
    }

    /**
     * @notice Updates the token symbol.
     * @dev Restricted to metadata role. Requires non-empty input and unpaused state.
     *      Updates the ERC20 symbol storage and emits regulatory compliance event.
     * @param _newSymbol The new symbol to assign to the token.
     *
     * Requirements:
     * - Caller must have METADATA_ROLE
     * - Contract must not be paused
     * - _newSymbol must not be empty
     *
     * Emits:
     * - {UpdatedTokenInformation} event with all current token metadata
     */
    function setSymbol(
        string memory _newSymbol
    )
        external
        override
        onlyRole(_METADATA_ROLE)
        emptyString(_newSymbol)
        whenNotPaused
    {
        _setSymbol(_newSymbol);
        emit UpdatedTokenInformation(
            _name(),
            _newSymbol,
            _decimals(),
            _version()
        );
    }

    /**
     * @notice Returns the current version string of the token.
     * @return string The ERC3643/TREX version string (e.g., "4.0.0").
     *
     * Note: Version follows semantic versioning and indicates the
     * ERC3643 protocol version implemented by this token.
     */
    function version() external view override returns (string memory) {
        return _version();
    }

    /**
     * @dev Declares the interfaces implemented by this facet.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC3643Metadata).interfaceId;
    }
}
