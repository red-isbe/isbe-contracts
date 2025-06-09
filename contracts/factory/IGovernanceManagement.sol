// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IGovernanceManagement
 * @notice Interface for managing governance contract states (pause and unpause).
 * @dev Provides functions to pause and unpause proxy contracts, ensuring controlled management of their state.
 */
interface IGovernanceManagement {
    /**
     * @notice Emitted when a proxy contract is paused.
     * @dev Indicates that the proxy contract is in a paused state.
     * @param proxyAddress The address of the proxy contract that has been paused.
     */
    event IsbePaused(address proxyAddress);

    /**
     * @notice Emitted when a proxy contract is unpaused.
     * @dev Indicates that the proxy contract is active again and functional.
     * @param proxyAddress The address of the proxy contract that has been unpaused.
     */
    event IsbeUnpaused(address proxyAddress);

    /**
     * @notice Pauses a specified proxy contract, disabling its functionality.
     * @dev Only callable by authorized roles, emits the `IsbePaused` event upon success.
     * @param proxyAddress The address of the proxy contract to pause.
     */
    function pause(address proxyAddress) external;

    /**
     * @notice Unpauses a specified proxy contract, enabling its functionality.
     * @dev Only callable by authorized roles, emits the `IsbeUnpaused` event upon success.
     * @param proxyAddress The address of the proxy contract to unpause.
     */
    function unpause(address proxyAddress) external;
}
