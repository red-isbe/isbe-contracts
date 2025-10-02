// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_METADATA_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643InternalCommon} from '../ERC3643InternalCommon.sol';
import {IERC3643Metadata} from './IERC3643Metadata.sol';
import {_TOKEN_OWNER_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643Metadata
 * @notice External contract implementing ERC-3643 metadata management.
 * @dev Provides public methods to update and retrieve token metadata such as name, symbol,
 *      onchain identity, and version. Applies access control, validation, and emits events.
 */
abstract contract ERC3643Metadata is IERC3643Metadata, ERC3643InternalCommon {
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
     * @param _newOnchainID The initial onchain identity address. Can be zero if not set.
     * @param _newVersion The initial version string. Must be non-empty.
     */
    function initializeERC3643Metadata(
        address _newOnchainID,
        string memory _newVersion
    )
        external
        override
        initializer(_ERC3643_METADATA_RESOLVER_KEY)
        emptyString(_newVersion)
    {
        _initialize(_newOnchainID, _newVersion);
        emit UpdatedTokenInformation(
            _name(),
            _symbol(),
            _decimals(),
            _newVersion,
            _newOnchainID
        );
    }

    /**
     * @notice Updates the token name.
     * @dev Restricted to token owner. Requires non-empty input and unpaused state.
     *      Emits a {UpdatedTokenInformation} event.
     * @param _newName The new name to assign to the token.
     */
    function setName(
        string memory _newName
    )
        external
        override
        onlyRole(_TOKEN_OWNER_ROLE)
        emptyString(_newName)
        whenNotPaused
    {
        _setName(_newName);
        emit UpdatedTokenInformation(
            _newName,
            _symbol(),
            _decimals(),
            _version(),
            _onchainID()
        );
    }

    /**
     * @notice Updates the token symbol.
     * @dev Restricted to token owner. Requires non-empty input and unpaused state.
     *      Emits a {UpdatedTokenInformation} event.
     * @param _newSymbol The new symbol to assign to the token.
     */
    function setSymbol(
        string memory _newSymbol
    )
        external
        override
        onlyRole(_TOKEN_OWNER_ROLE)
        emptyString(_newSymbol)
        whenNotPaused
    {
        _setSymbol(_newSymbol);
        emit UpdatedTokenInformation(
            _name(),
            _newSymbol,
            _decimals(),
            _version(),
            _onchainID()
        );
    }

    /**
     * @notice Updates the onchain identity address.
     * @dev Restricted to token owner. Can be set to zero. Requires unpaused state.
     *      Emits a {UpdatedTokenInformation} event.
     * @param _newOnchainID The new onchain identity address to assign.
     */
    function setOnchainID(
        address _newOnchainID
    )
        external
        override
        onlyRole(_TOKEN_OWNER_ROLE)
        whenNotPaused
        addressIsNotZero(_newOnchainID)
    {
        _setOnchainID(_newOnchainID);
        emit UpdatedTokenInformation(
            _name(),
            _symbol(),
            _decimals(),
            _version(),
            _newOnchainID
        );
    }

    /**
     * @notice Returns the current onchain identity address.
     * @return The address of the token's onchain identity.
     */
    function onchainID() external view override returns (address) {
        return _onchainID();
    }

    /**
     * @notice Returns the current version string of the token.
     * @return The TREX version string (e.g., "3.0.0").
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
