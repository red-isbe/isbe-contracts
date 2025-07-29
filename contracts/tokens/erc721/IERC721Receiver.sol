// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title ERC721 Token Receiver Interface
/// @notice Interface for contracts that want to handle safe receipt of ERC721 tokens.
/// @dev Any contract that wants to receive ERC721 tokens safely must implement this interface.
interface IERC721Receiver {
    /**
     * @notice Handles the receipt of an ERC721 token.
     * @dev Called by the ERC721 contract after a safe transfer. Must return its selector to confirm the token transfer.
     *      If any other value is returned or the interface is not implemented, the transfer will be reverted.
     * @param operator The address which initiated the transfer (i.e., msg.sender).
     * @param from The address which previously owned the token.
     * @param tokenId The ID of the token being transferred.
     * @param data Additional data with no specified format.
     * @return The selector to confirm the token transfer.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}
