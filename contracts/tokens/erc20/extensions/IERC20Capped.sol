// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC20Capped
 * @notice Interface for implementing a capped total supply for ERC20 tokens.
 *         It includes functionality to initialize a supply cap, emit related events, and handle cap validation errors.
 * @dev Provides:
 *      - `initializeCap`: A function to set the maximum allowable token supply.
 *      - `CapInitialized`: An event emitted when the cap is successfully set.
 *      - `CapIsZero` and `CapExceeded`: Custom errors to enforce and validate cap-related rules.
 *      This interface must be implemented by any ERC20 token contract with a supply cap mechanism.
 */
interface IERC20Capped {
    /**
     * @notice Emitted after successfully initializing the token cap.
     * @dev Should be triggered when `initializeCap` sets the supply cap.
     * @param cap The value of the token supply cap.
     */
    event CapInitialized(uint256 cap);

    /**
     * @notice Thrown when an invalid token cap of zero is provided.
     * @dev Ensures that the token supply cap must always be greater than zero.
     */
    error CapIsZero();

    /**
     * @notice Thrown when the maximum token supply cap is exceeded.
     * @dev Triggered during operations like minting that would breach the defined cap.
     */
    error CapExceeded();

    /**
     * @notice Initializes the maximum supply cap for the token.
     * @dev This function is expected to be called once to set the total supply cap.
     *      Emits a `CapInitialized` event if successful.
     * @param cap The desired maximum token supply cap.
     */
    function initializeCap(uint256 cap) external;
}
