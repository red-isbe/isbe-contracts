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

import {ProxyFactoryInternal} from '../proxyfactory/ProxyFactoryInternal.sol';
import {IGlobalIsbePause} from './IGlobalIsbePause.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title Internal Global ISBE Pausable Logic
 * @author ISBE
 * @notice Abstract contract with the internal logic for global pausing.
 * @dev Provides core functions for pausing and unpausing any deployed proxy.
 *      It relies on `ProxyFactoryInternal` to verify that a given address
 *      is a valid proxy before applying changes. It also implements the
 *      `IEIP2535Introspection` interface for discovery purposes.
 */
abstract contract GlobalIsbePauseInternal is
    ProxyFactoryInternal,
    IEIP2535Introspection
{
    /**
     * @notice Ensures the function is called for a deployed proxy.
     * @dev Reverts if `proxyAddress` is not a known, deployed proxy address.
     * @param _proxyAddress The address of the proxy to be checked.
     */
    modifier onlyDeployedProxy(address _proxyAddress) {
        _checkDeployedProxy(_proxyAddress);
        _;
    }

    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IGlobalIsbePause).interfaceId;
    }

    function _checkDeployedProxy(address _proxyAddress) private view {
        require(
            _isProxyDeployed(_proxyAddress),
            IGlobalIsbePause.InvalidProxy(_proxyAddress)
        );
    }
}
