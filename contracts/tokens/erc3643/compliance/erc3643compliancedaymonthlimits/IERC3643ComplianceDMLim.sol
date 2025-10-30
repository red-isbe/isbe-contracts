// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC3643ComplianceDMLim
 * @notice Interface for ERC-3643 compliance feature: Daily/Month transfer limits.
 * @dev Allows setting limits, checking compliance, and lifecycle hooks for transfers, minting, and burning.
 */
interface IERC3643ComplianceDMLim {
    /**
     * @notice Emitted when daily or monthly limits are updated.
     * @param dailyLimit The new daily transfer limit.
     * @param monthlyLimit The new monthly transfer limit.
     */
    event DayMonthLimitsSet(uint256 dailyLimit, uint256 monthlyLimit);

    /**
     * @notice Initializes the daily/monthly limits.
     * @dev Should be called once during contract setup.
     * @param dailyLimit The initial daily transfer limit.
     * @param monthlyLimit The initial monthly transfer limit.
     */
    function initializeERC3643ComplianceDMLim(
        uint256 dailyLimit,
        uint256 monthlyLimit
    ) external;

    /**
     * @notice Sets the daily transfer limit.
     * @param dailyLimit The new daily transfer limit.
     */
    function setDailyLimit(uint256 dailyLimit) external;

    /**
     * @notice Sets the monthly transfer limit.
     * @param monthlyLimit The new monthly transfer limit.
     */
    function setMonthlyLimit(uint256 monthlyLimit) external;

    /**
     * @notice Returns the current daily transfer limit.
     * @return dailyLimit The daily transfer limit.
     */
    function dailyLimit() external view returns (uint256 dailyLimit);

    /**
     * @notice Returns the current monthly transfer limit.
     * @return monthlyLimit The monthly transfer limit.
     */
    function monthlyLimit() external view returns (uint256 monthlyLimit);

    /**
     * @notice Checks if a transfer respects the daily/monthly limits.
     * @param from The address of the sender.
     * @param amount The amount of tokens to transfer.
     * @return isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnDayMonthLimits(
        address from,
        uint256 amount
    ) external view returns (bool isCompliant);
}
