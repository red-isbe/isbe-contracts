// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC20_STORAGE_POSITION} from '../../constants/storagePositions.sol';

contract ERC20 {
    struct ERC20Storage {
        //        mapping(address account => uint256) balances;
        //        mapping(address account => mapping(address spender => uint256)) allowances;
        //        uint256 totalSupply;
        uint8 decimals;
        string name;
        string symbol;
    }

    // slither-
    constructor(
        string memory newName,
        string memory newSymbol,
        uint8 newDecimals
    ) payable {
        ERC20Storage storage $ = _erc20Storage();
        $.name = newName;
        $.symbol = newSymbol;
        $.decimals = newDecimals;
    }

    function decimals() external view returns (uint8) {
        return _erc20Storage().decimals;
    }

    function symbol() external view returns (string memory) {
        return _erc20Storage().symbol;
    }

    function name() external view returns (string memory) {
        return _erc20Storage().name;
    }

    function _erc20Storage()
        internal
        pure
        returns (ERC20Storage storage erc20Storage_)
    {
        bytes32 position = _ERC20_STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            erc20Storage_.slot := position
        }
    }
}
