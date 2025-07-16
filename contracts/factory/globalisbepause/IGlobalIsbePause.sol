// SPDX-License-Identifier: UNLICENSED
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
