// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title IPause - Interface for pause functionality with authority checks
/// @notice Interface for contracts that require pausing and unpausing capability
interface IPause {
    /// @notice Emitted when the contract is paused
    /// @param account The address that triggered the pause
    event Paused(address account);

    /// @notice Emitted when the contract is unpaused
    /// @param account The address that triggered the unpause
    event Unpaused(address account);

    /// @notice Thrown when an account's authority level is insufficient
    /// @param authorityLevel The caller's current authority level
    /// @param requiredAuthorityLevel The minimum required authority level to perform the operation
    error InsufficientAuthorityLevel(
        uint256 authorityLevel,
        uint256 requiredAuthorityLevel
    );

    /// @notice Thrown when attempting to execute an action that requires the contract to be unpaused
    error IsPaused();

    /// @notice Thrown when attempting to execute an action that requires the contract to be paused
    error IsNotPaused();

    /// @notice Initializes the paused state of the contract
    /// @dev Should be called only once during the contract's initialization
    /// @param _paused Whether the contract should start in a paused state
    function initializePause(bool _paused) external;

    /// @notice Pauses the contract
    /// @dev Only callable by accounts with sufficient authority
    function pause() external;

    /// @notice Unpauses the contract
    /// @dev Only callable by accounts with sufficient authority
    function unpause() external;

    /// @notice Returns whether the contract is currently paused
    /// @return True if the contract is paused, false otherwise
    function paused() external view returns (bool);

    /// @notice Returns the authority level of the account that paused the contract
    /// @return The last pauser's authority level
    function authorityLevel() external view returns (uint256);
}
