// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IERC721Consecutive - ERC721 Consecutive Transfer Extension Interface
/// @dev See https://eips.ethereum.org/EIPS/eip-2309
interface IERC721Consecutive {
    /// @dev This event MUST be emitted when tokens are minted in a consecutive range.
    /// See EIP-2309 for details.
    event ConsecutiveTransfer(
        uint256 indexed fromTokenId,
        uint256 toTokenId,
        address indexed fromAddress,
        address indexed toAddress
    );

    /// @notice Mints a consecutive range of tokens to `to`.
    /// @param to The address to receive the minted tokens.
    /// @param quantity The number of tokens to mint.
    function mintConsecutive(address to, uint256 quantity) external;
}
