// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IBasicWhitelist
 * @author ISBE
 * @notice Interface for basic whitelist functionality
 * @dev Defines the external functions and events for managing a whitelist of addresses.
 *      This interface is designed to be used in diamond proxy patterns.
 */
interface IBasicWhitelist {
    /**
     * @notice Emitted when the whitelist is initialized
     * @param enabled Initial state of the whitelist
     */
    event WhitelistInitialized(bool enabled);

    /**
     * @notice Emitted when the whitelist status is changed
     * @param enabled New state of the whitelist
     */
    event WhitelistStatusChanged(bool enabled);

    /**
     * @notice Emitted when an address is added to the whitelist
     * @param account The address that was added
     */
    event AddedToWhitelist(address indexed account);

    /**
     * @notice Emitted when an address is removed from the whitelist
     * @param account The address that was removed
     */
    event RemovedFromWhitelist(address indexed account);

    /**
     * @notice Error thrown when attempting to add an address that is already whitelisted
     * @param account The address that is already whitelisted
     */
    error AlreadyWhitelisted(address account);

    /**
     * @notice Error thrown when attempting to remove an address that is not whitelisted
     * @param account The address that is not in the whitelist
     */
    error NotWhitelisted(address account);

    /**
     * @notice Initializes the whitelist with an initial enabled/disabled state
     * @dev Can only be called once during contract initialization
     * @param _enabled Initial state of the whitelist (true to enable, false to disable)
     */
    function initializeBasicWhitelist(bool _enabled) external;

    /**
     * @notice Adds an address to the whitelist
     * @dev Requires WHITELIST_ROLE
     * @param _account The address to add to the whitelist
     */
    function addToWhitelist(address _account) external;

    /**
     * @notice Removes an address from the whitelist
     * @dev Requires WHITELIST_ROLE
     * @param _account The address to remove from the whitelist
     */
    function removeFromWhitelist(address _account) external;

    /**
     * @notice Enables the whitelist enforcement
     * @dev Requires WHITELIST_ROLE
     */
    function enableWhitelist() external;

    /**
     * @notice Disables the whitelist enforcement
     * @dev Requires WHITELIST_ROLE
     */
    function disableWhitelist() external;

    /**
     * @notice Checks if an address is whitelisted
     * @dev Returns true if whitelist is disabled OR address is whitelisted
     * @param _account The address to check
     * @return isWhitelisted_ True if the address is whitelisted or whitelist is disabled
     */
    function isWhitelisted(
        address _account
    ) external view returns (bool isWhitelisted_);

    /**
     * @notice Checks if the whitelist is currently enabled
     * @return enabled_ True if whitelist is enabled, false otherwise
     */
    function isWhitelistEnabled() external view returns (bool enabled_);
}
