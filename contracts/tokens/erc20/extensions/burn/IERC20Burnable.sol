// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC20Burnable
 * @notice Interface for ERC20 tokens that support token burning.
 *         Allows users or approved accounts to reduce the total token supply.
 * @dev This interface defines two methods:
 *      - `burn`: Burns a specific amount of tokens from the caller's account.
 *      - `burnFrom`: Burns a specific amount of tokens from another account, using an allowance mechanism.
 *      Implementing contracts are expected to handle the necessary checks and emissions of events
 *      like `Transfer` to reflect changes in token balances and total supply.
 */
interface IERC20Burnable {
    /**
     * @notice Burns a specific amount of tokens from the caller's account.
     * @dev Reduces the caller's token balance and the total supply by the specified `amount`.
     *      The caller must have at least the specified `amount` of tokens in their account.
     *      Implementations should emit a `Transfer` event to indicate tokens were burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) external;

    /**
     * @notice Burns a specific amount of tokens from another account, using an allowance.
     * @dev Reduces the balance of `account` and the total supply by the specified `amount`.
     *      The caller must be allowed to spend at least `amount` of tokens on behalf of `account`.
     *      Implementations should emit a `Transfer` event to indicate tokens were burned.
     * @param account The address of the account whose tokens are to be burned.
     * @param amount The amount of tokens to burn.
     */
    function burnFrom(address account, uint256 amount) external;
}
