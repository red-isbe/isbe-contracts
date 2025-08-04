// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC721} from './IERC721.sol';
import {IERC721Metadata} from './IERC721Metadata.sol';

/**
 * @title ERC721 Token Interface
 * @notice This interface defines the standard functions, events, and errors for an ERC721 token,
 *         extending the standard ERC721 and ERC721Metadata interfaces.
 * @dev This interface introduces the `initializeErc721` function and custom errors specific to
 *      this implementation. It serves as a blueprint for implementing contract functionality while
 *      adhering to the ERC721 specification.
 */
interface IERC721Isbe is IERC721, IERC721Metadata {
    /**
     * @notice Emitted when the ERC721 token is initialized with a name and symbol.
     * @param name The name of the initialized ERC721 token.
     * @param symbol The symbol of the initialized ERC721 token.
     */
    event Erc721Initialized(string name, string symbol);

    /// @notice Error thrown when a token ID is zero.
    /// @dev Prevents the use of a zero token ID, which is not allowed in ERC721.
    error TokenIdZeroNotAllowed();

    /// @notice Error thrown when attempting to mint a token that already exists.
    /// @dev Prevent minting of a token with an ID that has already been assigned.
    error TokenAlreadyMinted();

    /// @notice Error thrown when the caller is neither the token owner nor an approved operator.
    /// @dev Restrict actions to only the owner or an address with the appropriate approval.
    error CallerNotOwnerNorApproved();

    /// @notice Error thrown when a token is transferred to a contract that does not implement
    /// the ERC721 receiver interface.
    /// @dev Prevent tokens from being locked in contracts that cannot handle ERC721 tokens.
    error TransferToNonERC721ReceiverImplementer();
    /**
     * @notice Initializes the ERC721 token with the given name and symbol.
     * @param newName The name of the ERC721 token to be initialized.
     * @param newSymbol The symbol of the ERC721 token to be initialized.
     */
    function initializeErc721(
        string memory newName,
        string memory newSymbol
    ) external;
}
