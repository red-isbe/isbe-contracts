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
 *      interface, so a single verification path covers both cases.
 *
 *      It also implements the `IEIP2535Introspection` interface for discovery.
 */
abstract contract GlobalIsbePauseInternal is
    ProxyFactoryInternal,
    IEIP2535Introspection
{
    using Address for address;

    modifier onlyContract(address _proxyAddress) {
        _checkIsContract(_proxyAddress);
        _;
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
            _assertPauseState(_proxyAddress, IPause.pause.selector, true);
            return;
        }
        _execute(_proxyAddress, IPause.pause.selector, true);
    }

    /**
     * @notice Applies the unpause action on the target contract.
     * @dev Same routing logic as `_applyPause`.
     * @param _proxyAddress Target contract implementing `ISBEPause`.
     */
    function _applyUnpause(address _proxyAddress) internal {
        if (_isProxyDeployed(_proxyAddress)) {
            ISBEPause(_proxyAddress).unpause();
            _assertPauseState(_proxyAddress, IPause.unpause.selector, false);
            return;
        }
        _execute(_proxyAddress, IPause.unpause.selector, false);
    }

    function _checkIsContract(address _contractAddress) internal view {
        if (!_contractAddress.isContract()) {
            revert IGlobalIsbePause.InvalidContract(_contractAddress);
        }
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
     *      A successful call is not the end of the check: `_assertPauseState`
     *      reads the resulting state back from the target. See that function for
     *      why a non-reverting call proves nothing on its own.
     *
     * @param _target          Contract address to invoke.
     * @param _selector        Function selector (`IPause.pause` or `IPause.unpause`).
     * @param _expectedPaused  State the target must report once the call returns.
     */
    function _execute(
        address _target,
        bytes4 _selector,
        bool _expectedPaused
    ) private {
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
        _assertPauseState(_target, _selector, _expectedPaused);
    }

    /**
     * @notice Verifies that the target actually adopted the requested pause state.
     * @dev A `pause()` / `unpause()` call that does not revert is NOT proof that
     *      anything happened. A proxy with a permissive `fallback` accepts every
     *      selector, does nothing and returns successfully, so governance would
     *      emit `IsbePaused` for a contract that keeps operating normally. This
     *      function closes that gap by reading `paused()` back from the target.
     *
     *      Two conditions are required:
     *        - `paused()` must be callable and return exactly one ABI word. A
     *          permissive fallback returns empty data and is rejected here.
     *        - The returned state must match what was requested.
     *
     *      The word is decoded as `uint256` rather than `bool` on purpose: a
     *      target returning a non-canonical value (anything other than 0 or 1)
     *      would make `abi.decode(..., (bool))` panic inside this facet. Any
     *      non-zero value is treated as "paused".
     *
     *      Residual limitation: a contract can report `paused() == true` and
     *      still not guard its own write functions. That cannot be detected
     *      on-chain and must be verified functionally during homologation.
     *
     * @param _target          Contract that was called.
     * @param _selector        Selector that was invoked, kept for error context.
     * @param _expectedPaused  State the target must report.
     */
    function _assertPauseState(
        address _target,
        bytes4 _selector,
        bool _expectedPaused
    ) private view {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = _target.staticcall(
            abi.encodePacked(IPause.paused.selector)
        );

        if (!success || returnData.length != 32) {
            revert IGlobalIsbePause.PauseStateUnverifiable(
                _target,
                _selector,
                returnData
            );
        }

        if ((abi.decode(returnData, (uint256)) != 0) != _expectedPaused) {
            revert IGlobalIsbePause.PauseNotEffective(
                _target,
                _selector,
                _expectedPaused
            );
        }
    }
}
