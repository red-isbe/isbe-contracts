// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {
    _BASIC_WHITELIST_STORAGE_POSITION
} from '../../../constants/storagePositions.sol';
import {IBasicWhitelist} from './IBasicWhitelist.sol';

/**
 * @title BasicWhitelistInternal
 * @author ISBE
 * @notice Internal abstract contract providing storage and helper functions for whitelist management.
 * @dev This contract defines the storage structure and internal functions for managing a basic whitelist.
 *      It uses unstructured storage to avoid storage collisions in diamond proxy patterns.
 *      Inherits from DidDocumentDetailedInternal to access common ISBE functionality.
 */
abstract contract BasicWhitelistInternal {
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
     * @notice Restricts access to accounts that are not whitelisted.
     * @dev Checks if the provided account is not whitelisted before allowing execution.
     * @param _account The address to check against the whitelist.
     */
    modifier onlyWhitelisted(address _account) {
        _checkNotWhitelisted(_account);
        _;
    }

    /**
     * @notice Restricts access to accounts that are already whitelisted.
     * @dev Checks if the provided account is already whitelisted before allowing execution.
     * @param _account The address to check against the whitelist.
     */
    modifier onlyNotWhitelisted(address _account) {
        _checkAlreadyWhitelisted(_account);
        _;
    }

    /**
     * @notice Restricts access to a batch of accounts that are not whitelisted.
     * @dev Checks if all provided accounts are not whitelisted before allowing execution.
     * @param _accounts An array of addresses to check against the whitelist.
     */
    modifier batchOnlyWhitelisted(address[] calldata _accounts) {
        _checkBatchNotWhitelisted(_accounts);
        _;
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
        _basicWhitelistStorage().whitelisted[_account] = true;
    }

    /**
     * @notice Removes an address from the whitelist
     * @dev Internal function that reverts if address is not whitelisted
     * @param _account The address to remove from the whitelist
     */
    function _removeFromWhitelist(address _account) internal {
        _basicWhitelistStorage().whitelisted[_account] = false;
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
     * @notice Checks a batch of accounts to ensure none are already whitelisted.
     * @dev Iterates through a batch of addresses, calling `_checkNotWhitelisted` on each.
     *      This prevents duplicate whitelisting of accounts.
     * @param _accounts Array of addresses to check.
     */
    function _checkBatchNotWhitelisted(
        address[] calldata _accounts
    ) private view {
        uint256 length = _accounts.length;
        for (uint256 i; i < length; ) {
            require(
                _isWhitelisted(_accounts[i]),
                IBasicWhitelist.NotWhitelistedInBatch(_accounts[i])
            );
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Checks if an account is not whitelisted.
     * @dev Reverts with `IBasicWhitelist.NotWhitelisted` if the account is already whitelisted.
     * @param _account The address to check.
     */
    function _checkNotWhitelisted(address _account) private view {
        require(
            _isWhitelisted(_account),
            IBasicWhitelist.NotWhitelisted(_account)
        );
    }

    /**
     * @notice Checks if an account is already whitelisted.
     * @dev Reverts with `IBasicWhitelist.AlreadyWhitelisted` if the account is not whitelisted.
     * @param _account The address to check.
     */
    function _checkAlreadyWhitelisted(address _account) private view {
        require(
            !_isWhitelisted(_account),
            IBasicWhitelist.AlreadyWhitelisted(_account)
        );
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
