// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC203643Controller
 * @notice Interface for administrative control over ERC20 and ERC3643 tokens, allowing forced transfers and burns
 * @dev Intended for use in regulated environments or asset-backed tokens where such functionality is required.
 *      Behavior adapts automatically based on token type (ERC20 vs ERC3643).
 */
interface IERC203643Controller {
    // --- Events ---

    /// @notice Emitted when tokens are forcefully transferred from one account to another
    /// @param operator The address performing the forced transfer
    /// @param from The address the tokens are taken from
    /// @param to The address the tokens are sent to
    /// @param amount The number of tokens transferred
    event ForceTransfer(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /// @notice Emitted when tokens are forcefully burned from an account
    /// @param operator The address performing the forced burn
    /// @param from The address the tokens are burned from
    /// @param amount The number of tokens burned
    event ForceBurn(
        address indexed operator,
        address indexed from,
        uint256 amount
    );

    // --- Functions ---

    /**
     * @notice Transfers tokens from one account to another by an authorized controller
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holder.
     *
     *      For ERC3643 tokens: recipient must be verified and tokens may be unfrozen if needed.
     *      In case the `_from` address has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amount`
     *      the tokens will be unfrozen to complete the transfer.
     *
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _amount The number of tokens to transfer
     * @return `true` if successful, otherwise reverts
     *
     * Emits a `ForceTransfer` event
     * Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from` (ERC3643 only)
     * Emits a `Transfer` event
     */
    function forceTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);

    /**
     * @notice Burns tokens from an account by an authorized controller
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holder.
     *
     *      For ERC3643 tokens: tokens may be unfrozen if needed.
     *      In case the `_from` address has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amount`
     *      the tokens will be unfrozen to complete the burn.
     *
     * @param _from The address to burn tokens from
     * @param _amount The number of tokens to burn
     *
     * Emits a `ForceBurn` event
     * Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from` (ERC3643 only)
     * Emits a `Transfer` event to address(0)
     */
    function forceBurn(address _from, uint256 _amount) external;
}
