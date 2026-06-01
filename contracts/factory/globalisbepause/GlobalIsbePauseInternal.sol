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
import {IPause} from '../../pause/IPause.sol';
import {ISBEPause} from '../../pause/ISBEPause.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {Address} from '@openzeppelin/contracts/utils/Address.sol';

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
    using Address for address;

    modifier onlyContract(address _proxyAddress) {
        if (!_proxyAddress.isContract()) {
            revert IGlobalIsbePause.InvalidProxy(_proxyAddress);
        }
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

    /**
     * @notice Applies the pause action on the target contract.
     * @dev Registered proxies (modality 1) are called directly — no wrapping.
     *      If the call fails it is our own code that is broken, the error bubbles
     *      raw and must be fixed in the contracts.
     *      Unregistered contracts (modality 2) are wrapped in `_execute` so that
     *      any failure is surfaced as a structured `PauseCallFailed` error with
     *      full context to take governance action externally.
     * @param _proxyAddress Target contract implementing `ISBEPause`.
     */
    function _applyPause(address _proxyAddress) internal {
        if (_isProxyDeployed(_proxyAddress)) {
            ISBEPause(_proxyAddress).pause();
            return;
        }
        _execute(_proxyAddress, IPause.pause.selector);
    }

    /**
     * @notice Applies the unpause action on the target contract.
     * @dev Same routing logic as `_applyPause`.
     * @param _proxyAddress Target contract implementing `ISBEPause`.
     */
    function _applyUnpause(address _proxyAddress) internal {
        if (_isProxyDeployed(_proxyAddress)) {
            ISBEPause(_proxyAddress).unpause();
            return;
        }
        _execute(_proxyAddress, IPause.unpause.selector);
    }

    /**
     * @notice Generic execution handler for governance-initiated pausable actions.
     * @dev Performs a low-level call with the given selector and, on failure,
     *      reverts with `PauseCallFailed` carrying three pieces of information:
     *        - `target`     — the contract that was called.
     *        - `selector`   — the function that was invoked.
     *        - `returnData` — the raw revert payload, as-is.
     *
     *      The raw payload is intentionally NOT decoded here. Solidity can
     *      produce many error formats (custom errors, panics, require strings)
     *      and decoding every possible case is fragile. Off-chain tooling can
     *      decode `returnData` independently using standard ABI tools.
     *
     *      This single function handles both modality-1 and modality-2 targets
     *      uniformly: any failure from any target is surfaced with full context.
     *
     * @param _target    Contract address to invoke.
     * @param _selector  Function selector (`IPause.pause` or `IPause.unpause`).
     */
    function _execute(address _target, bytes4 _selector) private {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = _target.call(
            abi.encodePacked(_selector)
        );
        if (!success) {
            revert IGlobalIsbePause.PauseCallFailed(
                _target,
                _selector,
                returnData
            );
        }
    }
}
