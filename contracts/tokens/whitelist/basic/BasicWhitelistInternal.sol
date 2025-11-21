// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidDocumentDetailedInternal} from '../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {_BASIC_WHITELIST_STORAGE_POSITION} from '../../../constants/storagePositions.sol';
import {IBasicWhitelist} from './IBasicWhitelist.sol';

/**
 * @title BasicWhitelistInternal
 * @author ISBE
 * @notice Internal abstract contract providing storage and helper functions for whitelist management.
 * @dev This contract defines the storage structure and internal functions for managing a basic whitelist.
 *      It uses unstructured storage to avoid storage collisions in diamond proxy patterns.
 *      Inherits from DidDocumentDetailedInternal to access common ISBE functionality.
 */
abstract contract BasicWhitelistInternal is DidDocumentDetailedInternal {
    /**
     * @notice Storage structure for BasicWhitelist data
     * @dev Uses unstructured storage pattern for diamond compatibility
     * @param whitelisted Mapping from address to whitelist status
     * @param enabled Global whitelist enable/disable flag
     */
    struct BasicWhitelistStorage {
        mapping(address => bool) whitelisted;
        bool enabled;
    }

    /**
     * @notice Initializes the whitelist with an enabled/disabled state
     * @dev Internal function to be called during contract initialization
     * @param _enabled Initial state of the whitelist (true to enable, false to disable)
     */
    function _initialize(bool _enabled) internal {
        BasicWhitelistStorage storage $ = _basicWhitelistStorage();
        $.enabled = _enabled;
        emit IBasicWhitelist.WhitelistStatusChanged(_enabled);
    }

    /**
     * @notice Enables the whitelist enforcement
     * @dev Internal function callable by authorized contracts
     */
    function _enableWhitelist() internal {
        BasicWhitelistStorage storage $ = _basicWhitelistStorage();
        $.enabled = true;
        emit IBasicWhitelist.WhitelistStatusChanged(true);
    }

    /**
     * @notice Disables the whitelist enforcement
     * @dev Internal function callable by authorized contracts
     */
    function _disableWhitelist() internal {
        BasicWhitelistStorage storage $ = _basicWhitelistStorage();
        $.enabled = false;
        emit IBasicWhitelist.WhitelistStatusChanged(false);
    }

    /**
     * @notice Adds an address to the whitelist
     * @dev Internal function that reverts if address is already whitelisted
     * @param _account The address to add to the whitelist
     */
    function _addToWhitelist(address _account) internal {
        BasicWhitelistStorage storage $ = _basicWhitelistStorage();
        if ($.whitelisted[_account]) {
            revert IBasicWhitelist.AddressAlreadyWhitelisted(_account);
        }
        $.whitelisted[_account] = true;
        emit IBasicWhitelist.AddedToWhitelist(_account);
    }

    /**
     * @notice Removes an address from the whitelist
     * @dev Internal function that reverts if address is not whitelisted
     * @param _account The address to remove from the whitelist
     */
    function _removeFromWhitelist(address _account) internal {
        BasicWhitelistStorage storage $ = _basicWhitelistStorage();
        if (!$.whitelisted[_account]) {
            revert IBasicWhitelist.AddressNotWhitelisted(_account);
        }
        $.whitelisted[_account] = false;
        emit IBasicWhitelist.RemovedFromWhitelist(_account);
    }

    /**
     * @notice Checks if an address is whitelisted
     * @dev Internal view function that returns true if whitelist is disabled OR address is whitelisted
     * @param _account The address to check
     * @return isWhitelisted_ True if address is whitelisted or whitelist is disabled
     */
    function _isWhitelisted(
        address _account
    ) internal view returns (bool isWhitelisted_) {
        BasicWhitelistStorage storage $ = _basicWhitelistStorage();
        // If whitelist is disabled, allow all addresses
        if (!$.enabled) {
            return true;
        }
        isWhitelisted_ = $.whitelisted[_account];
    }

    /**
     * @notice Checks if the whitelist is currently enabled
     * @dev Internal view function
     * @return enabled_ True if whitelist is enabled, false otherwise
     */
    function _isWhitelistEnabled() internal view returns (bool enabled_) {
        enabled_ = _basicWhitelistStorage().enabled;
    }

    /**
     * @notice Returns the storage struct for BasicWhitelist
     * @dev Uses assembly to access unstructured storage at a fixed position
     * @return $ Storage pointer to BasicWhitelistStorage struct
     */
    function _basicWhitelistStorage()
        private
        pure
        returns (BasicWhitelistStorage storage $)
    {
        bytes32 position = _BASIC_WHITELIST_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := position
        }
        // slither-disable-end assembly
    }
}
