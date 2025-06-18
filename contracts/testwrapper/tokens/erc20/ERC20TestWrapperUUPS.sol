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
import {
    IsbeUUPSUpgradeable
} from '../../../proxies/utils/IsbeUUPSUpgradeable.sol';
import {Pause} from '../../../pause/Pause.sol';

// solhint-disable-next-line
contract ERC20TestWrapperUUPS is
    ERC20,
    ERC20Burnable,
    ERC20Capped,
    ERC20Snapshot,
    ERC20Controller,
    ISBEPause,
    AccessControl,
    IsbeUUPSUpgradeable
{
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC20,
            ERC20Burnable,
            ERC20Capped,
            ERC20Snapshot,
            ERC20Controller,
            Pause,
            AccessControl
        )
        returns (bool)
    {
        return
            _supportsERC165Interface(interfaceId) ||
            _supportsInterface(interfaceId, _erc20Interfaces()) ||
            _supportsInterface(interfaceId, _erc20BurnableInterfaces()) ||
            _supportsInterface(interfaceId, _erc20CappedInterfaces()) ||
            _supportsInterface(interfaceId, _erc20SnapshotInterfaces()) ||
            _supportsInterface(interfaceId, _erc20ControllerInterfaces()) ||
            _supportsInterface(interfaceId, _pauseInterfaces()) ||
            _supportsInterface(interfaceId, _accessControlInterfaces());
    }
    // solhint-disable-next-line
    function _authorizeUpgrade(address newImplementation) internal override {}
}
