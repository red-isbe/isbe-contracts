// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../../core/Common.sol';
import {_ERC3643_REGULATORY_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
import {ICompliance} from '../../compliance/ICompliance.sol';

/**
 * @title ERC3643RegulatoryInternal
 * @notice Internal contract for managing ERC-3643 regulatory infrastructure: IdentityRegistry and Compliance.
 * @dev Provides internal functions to read and write registry and compliance addresses.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643RegulatoryInternal is Common {
    /// @dev Storage structure for ERC-3643 regulatory.
    struct ERC3643RegulatoryStorage {
        address identityRegistry;
        address compliance;
    }

    /**
     * @dev Internal function to initialize the regulatory references in storage.
     * Sets the initial values for the Identity Registry and Compliance contracts.
     * @param _newIdentityRegistry The initial Identity Registry contract address.
     * @param _newCompliance The initial Compliance contract address.
     */
    function _initialize(
        address _newIdentityRegistry,
        address _newCompliance
    ) internal {
        ERC3643RegulatoryStorage storage $ = _erc3643RegulatoryStorage();
        $.identityRegistry = _newIdentityRegistry;
        $.compliance = _newCompliance;
    }

    /**
     * @dev Internal function to update the Identity Registry reference in storage.
     * @param _newIdentityRegistry The new Identity Registry contract address.
     */
    function _setIdentityRegistry(address _newIdentityRegistry) internal {
        ERC3643RegulatoryStorage storage $ = _erc3643RegulatoryStorage();
        $.identityRegistry = _newIdentityRegistry;
    }

    /**
     * @dev Internal function to update the Compliance reference in storage.
     * @param _newCompliance The new Compliance contract address.
     */
    function _setCompliance(address _newCompliance) internal {
        ERC3643RegulatoryStorage storage $ = _erc3643RegulatoryStorage();
        $.compliance = _newCompliance;

        if (_newCompliance != address(0)) {
            ICompliance(_newCompliance).bindToken(address(this));
        }
    }

    /**
     * @dev Internal view function to retrieve the current Identity Registry contract from storage.
     * @return The Identity Registry contract linked to the token.
     */
    function _identityRegistry() internal view returns (address) {
        return _erc3643RegulatoryStorage().identityRegistry;
    }

    /**
     * @dev Internal view function to retrieve the current Compliance contract from storage.
     * @return The Compliance contract linked to the token.
     */
    function _compliance() internal view returns (address) {
        return _erc3643RegulatoryStorage().compliance;
    }

    /**
     * @dev Internal function to access the ERC-3643 regulatory storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ERC3643RegulatoryStorage struct in storage.
     */
    function _erc3643RegulatoryStorage()
        private
        pure
        returns (ERC3643RegulatoryStorage storage storage_)
    {
        bytes32 position = _ERC3643_REGULATORY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
