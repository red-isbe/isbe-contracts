// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title IERC721Controller
/// @notice Interface for administrative control over ERC-721 tokens, allowing forced transfers and burns
/// @dev Intended for use in regulated environments or asset-backed NFTs where such functionality is required
interface IERC721Controller {
    /// @notice Emitted when a token is forcefully transferred from one account to another
    /// @param operator The address performing the forced transfer
    /// @param from The address the token is taken from
    /// @param to The address the token is sent to
    /// @param tokenId The identifier of the token transferred
    event ForceTransfer(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    /// @notice Emitted when a token is forcefully burned from an account
    /// @param operator The address performing the forced burn
    /// @param from The address the token is burned from
    /// @param tokenId The identifier of the token burned
    event ForceBurn(
        address indexed operator,
        address indexed from,
        uint256 tokenId
    );

    /// @notice Error thrown when attempting to force burn a token not owned by the specified address
    error ForceBurnNotTokenOwner();

    /// @notice Transfers a token from one account to another without requiring approval
    /// @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract)
    /// @param from The address to transfer the token from
    /// @param to The address to transfer the token to
    /// @param tokenId The identifier of the token to transfer
    function forceTransfer(address from, address to, uint256 tokenId) external;

    /// @notice Burns a token from an account without requiring approval
    /// @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract)
    /// @param from The address to burn the token from
    /// @param tokenId The identifier of the token to burn
    function forceBurn(address from, uint256 tokenId) external;
}
