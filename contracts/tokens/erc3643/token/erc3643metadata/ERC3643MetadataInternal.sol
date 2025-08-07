// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import {ERC20Internal} from '../../../erc20/ERC20Internal.sol';
import {_ERC3643_METADATA_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

//TODO
abstract contract ERC3643MetadataInternal is ERC20Internal{
    
    struct ERC3643MetadataStorage {
        address onchainid;
        string version;
    }

    function _initialize(
        address _newOnchainID,
        string memory _newVersion

    ) internal {
        ERC3643MetadataStorage storage $ = _erc3643MetadataStorage();
        $.onchainid = _newOnchainID;
        $.version = _newVersion;
        //TODO/falta el initialize mirar el trex que hace comprobaciones y emite eventos
    }
    
    /**
     * @dev Internal function to update the onchain identity address in storage.
     * This function does not perform access control or emit events.
     * It is intended to be called by external logic that handles authorization and event emission.
     * Setting the address to zero indicates that no onchain identity is currently bound to the token.
     * @param _newOnchainID The new onchain identity address to assign.
     */
    function _setOnchainID(address _newOnchainID) internal virtual {       
        ERC203643InternalCommonStorage storage $ = _erc3643MetadataStorage();
        $.onchainid = _newOnchainID;
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
