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
import {ISBEPause} from '../../pause/ISBEPause.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title Internal Global ISBE Pausable Logic
 * @author ISBE
 * @notice Abstract contract with the internal logic for global pausing.
 * @dev Provides core functions for pausing and unpausing any contract that
 *      implements `ISBEPause`, regardless of whether it is registered as a
 *      diamond proxy in the factory (modality 1) or deployed as a standalone
 *      pausable contract (modality 2). Both modalities use the same `ISBEPause`
 *      interface, so a single try-catch path covers both cases.
 *
 *      It also implements the `IEIP2535Introspection` interface for discovery.
 */
abstract contract GlobalIsbePauseInternal is
    ProxyFactoryInternal,
    IEIP2535Introspection
{
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

    /**
     * @notice Calls `pause()` on any `ISBEPause`-compliant contract.
     * @dev Try-catch covers both modality-1 (registered diamond proxy) and
     *      modality-2 (standalone ISBEPause contract, not in the factory registry).
     *
     *      Error semantics:
     *      - `returnData` empty → address has no `pause()` (EOA, wrong contract)
     *        → `InvalidProxy`.
     *      - `returnData` non-empty AND address NOT registered → address is not a
     *        valid pause target even though it exposes ISBEPause selectors (e.g.
     *        the governance diamond itself) → `InvalidProxy`.
     *      - `returnData` non-empty AND address IS registered → a legitimate error
     *        from the target (e.g. `IsPaused`, `AccountHasNoRole`) → re-bubbled.
     *
     * @param _proxyAddress Target contract implementing `ISBEPause`.
     */
    function _tryPause(address _proxyAddress) internal {
        if (_proxyAddress.code.length == 0)
            revert IGlobalIsbePause.InvalidProxy(_proxyAddress);
        try ISBEPause(_proxyAddress).pause() {} catch (
            bytes memory returnData
        ) {
            if (returnData.length == 0 || !_isProxyDeployed(_proxyAddress)) {
                revert IGlobalIsbePause.InvalidProxy(_proxyAddress);
            }
            // solhint-disable-next-line no-inline-assembly
            assembly {
                revert(add(returnData, 32), mload(returnData))
            }
        }
    }

    /**
     * @notice Calls `unpause()` on any `ISBEPause`-compliant contract.
     * @dev Same error semantics as `_tryPause`.
     * @param _proxyAddress Target contract implementing `ISBEPause`.
     */
    function _tryUnpause(address _proxyAddress) internal {
        if (_proxyAddress.code.length == 0)
            revert IGlobalIsbePause.InvalidProxy(_proxyAddress);
        try ISBEPause(_proxyAddress).unpause() {} catch (
            bytes memory returnData
        ) {
            if (returnData.length == 0 || !_isProxyDeployed(_proxyAddress)) {
                revert IGlobalIsbePause.InvalidProxy(_proxyAddress);
            }
            // solhint-disable-next-line no-inline-assembly
            assembly {
                revert(add(returnData, 32), mload(returnData))
            }
        }
    }
}
