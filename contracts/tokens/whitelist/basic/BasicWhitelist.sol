// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BasicWhitelistInternal} from './BasicWhitelistInternal.sol';
import {IBasicWhitelist} from './IBasicWhitelist.sol';
import {_BASIC_WHITELIST_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {_WHITELIST_MANAGER_ROLE} from '../../../constants/roles.sol';

/**
 * @title BasicWhitelist
 * @author ISBE
 * @notice Abstract contract implementing basic whitelist functionality with role-based access control.
 * @dev This contract provides the external interface for whitelist management.
 *      It inherits from BasicWhitelistInternal for storage and helper functions.
 *      Access control is enforced using ISBE's role-based system.
 *      This is designed to be used in diamond proxy patterns via BasicWhitelistFacet.
 */
abstract contract BasicWhitelist is IBasicWhitelist, BasicWhitelistInternal {
    /**
     * @notice Constructor that disables initializers for the logic contract
     * @dev This prevents the logic contract from being initialized directly
     */
    constructor() {
        _disableInitializers(_BASIC_WHITELIST_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the whitelist with an initial enabled/disabled state
     * @dev Can only be called once. Uses the initializer modifier to prevent re-initialization
     * @param _enabled Initial state of the whitelist (true to enable, false to disable)
     */
    function initializeBasicWhitelist(
        bool _enabled
    ) external override initializer(_BASIC_WHITELIST_RESOLVER_KEY) {
        _initialize(_enabled);
        emit WhitelistInitialized(_enabled);
    }

    /**
     * @notice Adds an address to the whitelist
     * @dev Requires WHITELIST_MANAGER_ROLE. Reverts if address is already whitelisted.
     * @param _account The address to add to the whitelist
     */
    function addToWhitelist(
        address _account
    )
        external
        override
        whenNotPaused
        onlyRole(_WHITELIST_MANAGER_ROLE)
        addressIsNotZero(_account)
    {
        _addToWhitelist(_account);
    }

    /**
     * @notice Removes an address from the whitelist
     * @dev Requires WHITELIST_MANAGER_ROLE. Reverts if address is not whitelisted.
     * @param _account The address to remove from the whitelist
     */
    function removeFromWhitelist(
        address _account
    )
        external
        override
        whenNotPaused
        onlyRole(_WHITELIST_MANAGER_ROLE)
        addressIsNotZero(_account)
    {
        _removeFromWhitelist(_account);
    }

    /**
     * @notice Enables the whitelist enforcement
     * @dev Requires WHITELIST_MANAGER_ROLE
     */
    function enableWhitelist()
        external
        override
        whenNotPaused
        onlyRole(_WHITELIST_MANAGER_ROLE)
    {
        _enableWhitelist();
    }

    /**
     * @notice Disables the whitelist enforcement
     * @dev Requires WHITELIST_MANAGER_ROLE
     */
    function disableWhitelist()
        external
        override
        whenNotPaused
        onlyRole(_WHITELIST_MANAGER_ROLE)
    {
        _disableWhitelist();
    }

    /**
     * @notice Checks if an address is whitelisted
     * @dev Returns true if whitelist is disabled OR address is whitelisted
     * @param _account The address to check
     * @return isWhitelisted_ True if the address is whitelisted or whitelist is disabled
     */
    function isWhitelisted(
        address _account
    ) external view override returns (bool isWhitelisted_) {
        isWhitelisted_ = _isWhitelisted(_account);
    }

    /**
     * @notice Checks if the whitelist is currently enabled
     * @return enabled_ True if whitelist is enabled, false otherwise
     */
    function isWhitelistEnabled()
        external
        view
        override
        returns (bool enabled_)
    {
        enabled_ = _isWhitelistEnabled();
    }

    /**
     * @notice Returns the list of interfaces implemented by this contract
     * @dev Used for ERC165 introspection
     * @return interfaces_ Array of interface IDs
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IBasicWhitelist).interfaceId;
    }
}
