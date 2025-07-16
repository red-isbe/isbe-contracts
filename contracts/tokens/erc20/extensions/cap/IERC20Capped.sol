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
     * @dev Should be triggered when `initializeCap` or 'SetCap' sets the supply cap.
     * @param operator The account that set the cap.
     * @param newCap The value of the token supply cap.
     */
    event CapSet(address operator, uint256 newCap);

    /**
     * @notice Thrown when an invalid token cap of zero is provided.
     * @dev Ensures that the token supply cap must always be greater than zero.
     */
    error CapIsZero();

    /**
     * @notice Thrown when an invalid token cap of less than the total supply is provided.
     * @dev Ensures that the token supply cap must always be greater than the totalsupply.
     */
    error NewCapIsLessThanTotalSupply(uint256 cap, uint256 totalSupply);

    /**
     * @notice Thrown when the maximum token supply cap is exceeded.
     * @dev Triggered during operations like minting that would breach the defined cap.
     */
    error CapExceeded();

    /**
     * @notice Initializes the maximum supply cap for the token.
     * @dev This function is expected to be called once to set the total supply cap.
     *      Emits a `CapInitialized` event if successful.
     * @param _cap The desired maximum token supply cap.
     */
    function initializeCap(uint256 _cap) external;
}
