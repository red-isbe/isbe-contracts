// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Capped} from '../../../tokens/erc20/extensions/cap/ERC20Capped.sol';
import {ERC20Burnable} from '../../../tokens/erc20/extensions/burn/ERC20Burnable.sol';
import {ERC20Controller} from '../../../tokens/erc20/extensions/controller/ERC20Controller.sol';
import {ERC20Snapshot} from '../../../tokens/erc20/extensions/snapshot/ERC20Snapshot.sol';
import {ERC20} from '../../../tokens/erc20/ERC20.sol';
import {ISBEPause} from '../../../pause/ISBEPause.sol';
import {AccessControl} from '../../../access/accessControl/AccessControl.sol';
import {AccessControlInternal} from '../../../access/accessControl/AccessControlInternal.sol';
import {DidDocumentDetailedInternal} from '../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {IsbeUUPSUpgradeable} from '../../../proxies/utils/IsbeUUPSUpgradeable.sol';
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
    function _localDidOf(
        address _account
    )
        internal
        view
        override(AccessControlInternal, DidDocumentDetailedInternal)
        returns (bytes32)
    {
        return DidDocumentDetailedInternal._localDidOf(_account);
    }

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
        uint256 interfacesLength = 7;
        bytes4[][] memory interfaceGroups = new bytes4[][](interfacesLength);
        interfaceGroups[--interfacesLength] = ERC20._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC20Burnable
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC20Capped
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC20Controller
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC20Snapshot
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = Pause._implementedInterfaces();
        interfaceGroups[--interfacesLength] = AccessControl
            ._implementedInterfaces();

        return _aggregateInterfaces(interfaceGroups, new bytes4[](0));
    }

    // solhint-disable-next-line
    function _authorizeUpgrade(address _newImplementation) internal override {}
}
