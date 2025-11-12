// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC3643ComplianceHookEvents
 * @notice Interface containing compliance hook events for testing and monitoring.
 * @dev This interface allows external contracts and tests to listen for hook execution events
 *      emitted from internal compliance contracts. These events are primarily used for
 *      coverage tracking and integration testing.
 */
interface IERC3643ComplianceHookEvents {
    /**
     * @notice Emitted when the MaxBalance destruction hook is executed.
     * @dev This event is emitted for coverage purposes to ensure the destruction hook
     *      execution path is tracked by coverage tools (generates detectable bytecode via LOG opcode).
     * @param account The account whose tokens are being destroyed.
     * @param amount The amount of tokens being destroyed.
     */
    event CoverageHookMaxBalance(address indexed account, uint256 amount);

    /**
     * @notice Emitted when the DayMonthLimits destruction hook is executed.
     * @dev This event is emitted for coverage purposes to ensure the destruction hook
     *      execution path is tracked by coverage tools (generates detectable bytecode via LOG opcode).
     * @param account The account whose tokens are being destroyed.
     * @param amount The amount of tokens being destroyed.
     */
    event CoverageHookDayMonthLimits(address indexed account, uint256 amount);
}
