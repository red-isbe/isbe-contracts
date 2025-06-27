// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ProxyFactoryInternal} from '../proxyfactory/ProxyFactoryInternal.sol';
import {IGlobalIsbePause} from './IGlobalIsbePause.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

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
     * @param proxyAddress The address of the proxy to be checked.
     */
    modifier onlyDeployedProxy(address proxyAddress) {
        _checkDeployedProxy(proxyAddress);
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

    function _checkDeployedProxy(address proxyAddress) private view {
        require(
            _isProxyDeployed(proxyAddress),
            IGlobalIsbePause.InvalidProxy(proxyAddress)
        );
    }
}
