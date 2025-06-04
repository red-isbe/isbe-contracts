// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title IERC20Controller
/// @notice Interface for administrative control over ERC-20 tokens, allowing forced transfers and burns
/// @dev Intended for use in regulated environments or asset-backed tokens where such functionality is required
interface IERC20Controller {
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

    /// @notice Transfers tokens from one account to another without requiring approval
    /// @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract)
    /// @param from The address to transfer tokens from
    /// @param to The address to transfer tokens to
    /// @param amount The number of tokens to transfer
    function forceTransfer(address from, address to, uint256 amount) external;

    /// @notice Burns tokens from an account without requiring approval
    /// @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract)
    /// @param from The address to burn tokens from
    /// @param amount The number of tokens to burn
    function forceBurn(address from, uint256 amount) external;
}
