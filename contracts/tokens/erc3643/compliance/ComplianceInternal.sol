// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../core/Common.sol';
import {_COMPLIANCE_STORAGE_POSITION} from '../../../constants/storagePositions.sol';

/**
 * @title ComplianceInternal
 * @notice Internal contract for managing compliance logic (ERC-3643).
 * @dev Orchestrates calls to feature internals for compliance checks and hooks.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ComplianceInternal is Common {
    /// @dev Storage structure for compliance (can be extended for flags, config, etc.).
    struct ComplianceStorage {
        // Example: flags for enabling/disabling features
        bool countryRestrictionsEnabled;
        bool countryWhitelistingEnabled;
        // Add more feature flags as needed
    }

    /**
     * @dev Internal compliance check before transfer.
     * Orchestrates calls to feature internals.
     */
    function _canTransfer(address from, address to, uint256 amount) internal view returns (bool) {
        ComplianceStorage storage $ = _complianceStorage();
        bool ok = true;
        if ($.countryRestrictionsEnabled) {
            ok = ok && CountryRestrictionsInternal._canTransfer(from, to, amount);
        }
        if ($.countryWhitelistingEnabled) {
            ok = ok && CountryWhitelistingInternal._canTransfer(from, to, amount);
        }
        // Add more features as needed
        return ok;
    }

    /**
     * @dev Internal hook after transfer.
     */
    function _transferred(address from, address to, uint256 amount) internal {
        ComplianceStorage storage $ = _complianceStorage();
        if ($.countryRestrictionsEnabled) {
            CountryRestrictionsInternal._transferred(from, to, amount);
        }
        if ($.countryWhitelistingEnabled) {
            CountryWhitelistingInternal._transferred(from, to, amount);
        }
        // Add more features as needed
    }

    /**
     * @dev Internal hook after mint.
     */
    function _created(address to, uint256 amount) internal {
        ComplianceStorage storage $ = _complianceStorage();
        if ($.countryRestrictionsEnabled) {
            CountryRestrictionsInternal._created(to, amount);
        }
        if ($.countryWhitelistingEnabled) {
            CountryWhitelistingInternal._created(to, amount);
        }
        // Add more features as needed
    }

    /**
     * @dev Internal hook after burn.
     */
    function _destroyed(address from, uint256 amount) internal {
        ComplianceStorage storage $ = _complianceStorage();
        if ($.countryRestrictionsEnabled) {
            CountryRestrictionsInternal._destroyed(from, amount);
        }
        if ($.countryWhitelistingEnabled) {
            CountryWhitelistingInternal._destroyed(from, amount);
        }
        // Add more features as needed
    }

    /**
     * @dev Internal function to access the compliance storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ComplianceStorage struct in storage.
     */
    function _complianceStorage()
        private
        pure
        returns (ComplianceStorage storage storage_)
    {
        bytes32 position = _COMPLIANCE_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}