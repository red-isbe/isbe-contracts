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
 * @title IERC3643ComplianceDMLim
 * @notice Interface for ERC-3643 compliance feature: Daily/Month transfer limits.
 * @dev Allows setting limits, checking compliance, and lifecycle hooks for transfers, minting, and burning.
 */
interface IERC3643ComplianceDMLim {
    /**
     * @notice Emitted when a transfer is checked against the daily/monthly limits restriction.
     * @param from The address sending tokens.
     * @param amount The amount of tokens being transferred.
     */
    event DayMonthLimitsTransferHook(address indexed from, uint256 amount);

    /**
     * @notice Emitted when tokens are created and checked against the daily/monthly limits restriction.
     * @param to The address receiving the newly created tokens.
     * @param amount The amount of tokens created.
     */
    event DayMonthLimitsCreationHook(address indexed to, uint256 amount);

    /**
     * @notice Emitted when tokens are destroyed and checked against the daily/monthly limits restriction.
     * @param from The address from which tokens are destroyed.
     * @param amount The amount of tokens destroyed.
     */
    event DayMonthLimitsDestructionHook(address indexed from, uint256 amount);
    /**
     * @notice Emitted when daily or monthly limits are updated.
     * @param _dailyLimit The new daily transfer limit.
     * @param _monthlyLimit The new monthly transfer limit.
     */
    event DayMonthLimitsSet(uint256 _dailyLimit, uint256 _monthlyLimit);

    /**
     * @notice Initializes the daily/monthly limits.
     * @dev Should be called once during contract setup.
     * @param _dailyLimit The initial daily transfer limit.
     * @param _monthlyLimit The initial monthly transfer limit.
     */
    function initializeERC3643ComplianceDMLim(
        uint256 _dailyLimit,
        uint256 _monthlyLimit
    ) external;

    /**
     * @notice Sets the daily transfer limit.
     * @param _dailyLimit The new daily transfer limit.
     */
    function setDailyLimit(uint256 _dailyLimit) external;

    /**
     * @notice Sets the monthly transfer limit.
     * @param _monthlyLimit The new monthly transfer limit.
     */
    function setMonthlyLimit(uint256 _monthlyLimit) external;

    /**
     * @notice Returns the current daily transfer limit.
     * @return _dailyLimit The daily transfer limit.
     */
    function dailyLimit() external view returns (uint256 _dailyLimit);

    /**
     * @notice Returns the current monthly transfer limit.
     * @return _monthlyLimit The monthly transfer limit.
     */
    function monthlyLimit() external view returns (uint256 _monthlyLimit);

    /**
     * @notice Checks if a transfer respects the daily/monthly limits.
     * @param _from The address of the sender.
     * @param _amount The amount of tokens to transfer.
     * @return _isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnDayMonthLimits(
        address _from,
        uint256 _amount
    ) external view returns (bool _isCompliant);
}
