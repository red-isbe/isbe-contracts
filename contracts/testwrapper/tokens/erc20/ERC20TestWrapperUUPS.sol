// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {
    ERC203643Capped
} from '../../../tokens/erc203643/erc203643capped/ERC203643Capped.sol';
import {
    ERC20Burnable
} from '../../../tokens/erc20/extensions/burn/ERC20Burnable.sol';
import {
    ERC203643Controller
} from '../../../tokens/erc203643/erc203643controller/ERC203643Controller.sol';
import {
    ERC20Snapshot
} from '../../../tokens/erc20/extensions/snapshot/ERC20Snapshot.sol';
import {ERC20} from '../../../tokens/erc20/ERC20.sol';
import {ISBEPause} from '../../../pause/ISBEPause.sol';
import {AccessControl} from '../../../access/accessControl/AccessControl.sol';
import {
    AccessControlInternal
} from '../../../access/accessControl/AccessControlInternal.sol';
import {
    DidDocumentDetailedInternal
} from '../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {
    IsbeUUPSUpgradeable
} from '../../../proxies/utils/IsbeUUPSUpgradeable.sol';
import {Pause} from '../../../pause/Pause.sol';

// solhint-disable-next-line
contract ERC20TestWrapperUUPS is
    ERC20,
    ERC20Burnable,
    ERC203643Capped,
    ERC20Snapshot,
    ERC203643Controller,
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
            ERC203643Capped,
            ERC203643Controller,
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
        interfaceGroups[--interfacesLength] = ERC203643Capped
            ._implementedInterfaces();
        interfaceGroups[--interfacesLength] = ERC203643Controller
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
