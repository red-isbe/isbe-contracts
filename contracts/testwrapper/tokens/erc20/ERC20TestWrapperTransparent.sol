// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ERC20Capped
} from '../../../tokens/erc20/extensions/cap/ERC20Capped.sol';
import {
    ERC20Burnable
} from '../../../tokens/erc20/extensions/burn/ERC20Burnable.sol';
import {
    ERC20Controller
} from '../../../tokens/erc20/extensions/controller/ERC20Controller.sol';
import {
    ERC20Snapshot
} from '../../../tokens/erc20/extensions/snapshot/ERC20Snapshot.sol';
import {ERC20} from '../../../tokens/erc20/ERC20.sol';
import {ISBEPause} from '../../../pause/ISBEPause.sol';
import {AccessControl} from '../../../access/accessControl/AccessControl.sol';

// solhint-disable-next-line
contract ERC20TestWrapperTransparent is
    ERC20,
    ERC20Burnable,
    ERC20Capped,
    ERC20Snapshot,
    ERC20Controller,
    ISBEPause,
    AccessControl
{
    function metadata()
        external
        view
        returns (string memory name, string memory symbol, uint8 decimals)
    {
        name = _name();
        symbol = _symbol();
        decimals = _decimals();
    }
}
