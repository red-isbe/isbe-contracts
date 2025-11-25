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
     * @notice Emitted when a transfer is checked against the max balance restriction.
     * @param from The address sending tokens.
     * @param amount The amount of tokens being transferred.
     */
    event MaxBalanceTransferHook(address indexed from, uint256 amount);

    /**
     * @notice Emitted when tokens are created and checked against the max balance restriction.
     * @param to The address receiving the newly created tokens.
     * @param amount The amount of tokens created.
     */
    event MaxBalanceCreationHook(address indexed to, uint256 amount);

    /**
     * @notice Emitted when tokens are destroyed and checked against the max balance restriction.
     * @param from The address from which tokens are destroyed.
     * @param amount The amount of tokens destroyed.
     */
    event MaxBalanceDestructionHook(address indexed from, uint256 amount);

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
