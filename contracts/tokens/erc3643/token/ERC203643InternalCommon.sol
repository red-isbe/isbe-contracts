// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import {ERC20InternalCommon} from '../../erc20/extensions/ERC20InternalCommon.sol';
import {_ERC20_3643_INTERNAL_COMMON_STORAGE_POSITION} from '../../../constants/storagePositions.sol';

/// @title ERC203643InternalCommon
/// @notice This abstract contract puts together all ERC203643 internal logic.
abstract contract ERC203643InternalCommon is
    ERC20InternalCommon
{
    
    struct ERC203643InternalCommonStorage {
            uint8 version;
            string onchainid;
    }


    function _setName(string calldata _name) internal virtual {
        require(keccak256(abi.encode(_name)) != keccak256(abi.encode("")), "invalid argument - empty string");
        
        //ERC20Storage storage $ = ERC20InternalCommon._erc20Storage();
        //$.name = _name;
        
        
    }

    function _erc203643InternalCommonStorage()
        private
        pure
        returns (ERC203643InternalCommonStorage storage storage_)
    {
        bytes32 position = _ERC20_3643_INTERNAL_COMMON_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

}
