// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import {ERC20Internal} from '../../../../erc20/ERC20Internal.sol';
import {_ERC20_3643_EXTENDED_STORAGE_POSITION} from '../../../../../constants/storagePositions.sol';

/// @title ERC203643ExtendedInternal
/// @notice This abstract contract puts together all ERC203643 internal logic.
abstract contract ERC203643ExtendedInternal is
    ERC20Internal
{
    
    struct ERC203643InternalCommonStorage {
            uint8 version;
            address onchainid;
    }


    function _setOnchainID(address _newOnchainID) internal virtual {       
        ERC203643InternalCommonStorage storage $ = _erc203643InternalCommonStorage();
        $.onchainid = _newOnchainID;
    }

    function _onchainID() internal view returns (address) {
        return _erc203643InternalCommonStorage().onchainid;
    }

    function _version() internal view returns (string memory) {
        return 'x.x.x'; // ToDO
    }



    function _erc203643InternalCommonStorage()
        private
        pure
        returns (ERC203643InternalCommonStorage storage storage_)
    {
        bytes32 position = _ERC20_3643_EXTENDED_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

}
