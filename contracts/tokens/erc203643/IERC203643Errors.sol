// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC203643Errors
 * @notice Common errors used across ERC20 and ERC3643 implementations
 * @dev This interface defines custom errors that can be referenced by all token contracts
 */
interface IERC203643Errors {
    /**
     * @notice Thrown when the lengths of two arrays provided to a batch operation do not match.
     * @dev Ensures that batch operations receive arrays of equal length.
     */
    error ArrayLengthMismatch();
}
