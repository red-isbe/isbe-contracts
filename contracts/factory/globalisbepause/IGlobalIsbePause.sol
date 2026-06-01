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

/**
 * @title Global ISBE Pausable Interface
 * @author ISBE
 * @notice Defines a global pausing mechanism for ISBE use-case proxies.
 * @dev Allows an authorised role to centrally pause and unpause any proxy
 *      contract registered within the ISBE ecosystem.
 */
interface IGlobalIsbePause {
    /**
     * @notice Emitted when a use-case proxy is paused by the ISBE governance.
     * @param proxyAddress The address of the proxy that has been paused.
     * @param account The address that triggered the pause
     */
    event IsbePaused(address indexed proxyAddress, address indexed account);

    /**
     * @notice Emitted when a use-case proxy is unpaused by the ISBE governance.
     * @param proxyAddress The address of the proxy that has been unpaused.
     * @param account The address that triggered the pause
     */
    event IsbeUnpaused(address indexed proxyAddress, address indexed account);

    /**
     * @notice Reverted if the target address is not a valid or known proxy.
     * @param proxyAddress The address that was identified as an invalid proxy.
     */
    error InvalidProxy(address proxyAddress);

    /**
     * @notice Reverted when a `pause()` or `unpause()` call on a target contract fails.
     * @dev Carries the raw information needed to audit the failure without requiring
     *      the governance layer to decode every possible error format (custom errors,
     *      panics, require strings, etc.). Off-chain tooling can decode `returnData`
     *      independently.
     * @param target     The contract that was called.
     * @param selector   The function selector that was invoked (`pause()` or `unpause()`).
     * @param returnData The raw revert payload returned by the target.
     */
    error PauseCallFailed(address target, bytes4 selector, bytes returnData);

    /**
     * @notice Pauses a specific use-case proxy contract.
     * @dev This can only be called by an account with the appropriate role.
     * @param _proxyAddress The address of the proxy contract to pause.
     */
    function pauseIsbe(address _proxyAddress) external;

    /**
     * @notice Unpauses a specific use-case proxy contract.
     * @dev This can only be called by an account with the appropriate role.
     * @param _proxyAddress The address of the proxy contract to unpause.
     */
    function unpauseIsbe(address _proxyAddress) external;
}
