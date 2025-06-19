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
import {Pause} from '../../../pause/Pause.sol';
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
    function _implementedInterfaces()
        internal
        pure
        virtual
        override(
            ERC20,
            ERC20Burnable,
            ERC20Capped,
            ERC20Controller,
            ERC20Snapshot,
            Pause,
            AccessControl
        )
        returns (bytes4[] memory interfaces_)
    {
        uint256 index = 0;
        bytes4[][] memory interfaceGroups = new bytes4[][](7);
        interfaceGroups[index++] = ERC20._implementedInterfaces();
        interfaceGroups[index++] = ERC20Burnable._implementedInterfaces();
        interfaceGroups[index++] = ERC20Capped._implementedInterfaces();
        interfaceGroups[index++] = ERC20Controller._implementedInterfaces();
        interfaceGroups[index++] = ERC20Snapshot._implementedInterfaces();
        interfaceGroups[index++] = Pause._implementedInterfaces();
        interfaceGroups[index++] = AccessControl._implementedInterfaces();

        return _aggregateInterfaces(interfaceGroups, new bytes4[](0));
    }
}
