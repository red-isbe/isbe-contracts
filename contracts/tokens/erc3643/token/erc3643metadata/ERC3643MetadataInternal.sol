// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../../../erc20/extensions/ERC20InternalCommon.sol';
import {_ERC3643_METADATA_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/**
 * @title ERC3643MetadataInternal
 * @notice Internal contract for managing ERC-3643 metadata: onchain identity and version.
 * @dev Provides internal functions to read and write metadata fields.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643MetadataInternal is ERC20InternalCommon {
    /// @dev Storage structure for ERC-3643 metadata.
    struct ERC3643MetadataStorage {
        address onchainid;
        string version;
    }

    /**
     * @dev Internal function to initialize the onchain identity and version metadata in storage.
     * Sets the initial values for the token's onchain ID and version.
     * @param _newOnchainID The initial onchain identity address to assign.
     * @param _newVersion The initial version string of the token (e.g., "3.0.0").
     */
    function _initialize(
        address _newOnchainID,
        string memory _newVersion
    ) internal {
        _setVersion(_newVersion);
        _setOnchainID(_newOnchainID);
    }

    /**
     * @dev Internal function to update the onchain identity address in storage.
     * Setting the address to zero indicates that no onchain identity is currently bound to the token.
     * @param _newOnchainID The new onchain identity address to assign.
     */
    function _setOnchainID(address _newOnchainID) internal {
        ERC3643MetadataStorage storage $ = _erc3643MetadataStorage();
        $.onchainid = _newOnchainID;
    }

    /**
     * @dev Internal function to update the version string in storage.
     * The version should follow semantic versioning (e.g., "3.0.0").
     * @param _newVersion The new version string to assign.
     */
    function _setVersion(string memory _newVersion) internal {
        ERC3643MetadataStorage storage $ = _erc3643MetadataStorage();
        $.version = _newVersion;
    }

    /**
     * @dev Internal view function to retrieve the current onchain identity address from storage.
     * @return The address of the token's onchain identity.
     */
    function _onchainID() internal view returns (address) {
        return _erc3643MetadataStorage().onchainid;
    }

    /**
     * @dev Internal view function to retrieve the current version string from storage.
     * @return The version string of the token.
     */
    function _version() internal view returns (string memory) {
        return _erc3643MetadataStorage().version;
    }

    /**
     * @dev Internal function to access the ERC-3643 metadata storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ERC3643MetadataStorage struct in storage.
     */
    function _erc3643MetadataStorage()
        private
        pure
        returns (ERC3643MetadataStorage storage storage_)
    {
        bytes32 position = _ERC3643_METADATA_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
