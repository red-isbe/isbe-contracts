// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC3643ComplianceMaxBalance
 * @notice Interface for ERC-3643 compliance feature: MaxBalance restriction.
 * @dev Allows setting and getting the max balance, and checking compliance for transfers.
 */
interface IERC3643ComplianceMaxBal {
    /**
     * @notice Emitted when the max balance is updated.
     * @param _maxBalance The new max balance value.
     */
    event MaxBalanceSet(uint256 _maxBalance);



    /**
     * @notice Error emitted when a transfer would exceed the max balance.
     * @param to The address of the receiver.
     * @param attemptedBalance The balance that would be exceeded.
     * @param maxBalance The maximum allowed balance.
     */
    error MaxBalanceExceeded(
        address to,
        uint256 attemptedBalance,
        uint256 maxBalance
    );

    /**
     * @notice Initializes the max balance restriction.
     * @dev Can only be called once via the initializer modifier.
     * @param _maxBalance The initial max balance value.
     */
    function initializeERC3643ComplianceMaxBalance(
        uint256 _maxBalance
    ) external;

    /**
     * @notice Sets the maximum balance allowed per address.
     * @param _maxBalance The maximum amount of tokens an address can hold.
     */
    function setMaxBalance(uint256 _maxBalance) external;

    /**
     * @notice Returns the current maximum balance allowed per address.
     * @return _maxBalance The maximum balance value.
     */
    function maxBalance() external view returns (uint256 _maxBalance);

    /**
     * @notice Checks if a transfer respects the max balance restriction.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens to transfer.
     * @return _isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnMaxBalance(
        address _to,
        uint256 _amount
    ) external view returns (bool _isCompliant);
}
