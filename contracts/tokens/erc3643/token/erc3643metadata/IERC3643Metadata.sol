// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC3643Metadata
 * @notice Interface for updating and retrieving extended metadata in ERC-3643 tokens.
 * @dev Provides setter functions for name, symbol, and onchain identity.
 *      Includes read-only access to version and onchainID.
 *      This interface does not expose getters for name or symbol; those are expected
 *      to be available via the base ERC-20 interface.
 */

interface IERC3643Metadata {
    /**
     *  this event is emitted when the token information is updated.
     *  the event is emitted by the token init function and by the setTokenInformation function
     *  `_newName` is the name of the token
     *  `_newSymbol` is the symbol of the token
     *  `_newDecimals` is the decimals of the token
     */
    event UpdatedTokenInformation(
        string indexed _newName,
        string indexed _newSymbol,
        uint8 _newDecimals
    );

    /**
     * @notice Emitted when the token name is updated via {setName}.
     * @param operator The account performing the update.
     * @param newName The new token name.
     */
    event NameSet(address indexed operator, string newName);

    /**
     * @notice Emitted when the token symbol is updated via {setSymbol}.
     * @param operator The account performing the update.
     * @param newSymbol The new token symbol.
     */
    event SymbolSet(address indexed operator, string newSymbol);

    /**
     *  @dev sets the token name
     *  @param _name the name of token to set
     *  Only the owner of the token smart contract can call this function
     *  emits `UpdatedTokenInformation` and `NameSet` events
     */
    function setName(string calldata _name) external;

    /**
     *  @dev sets the token symbol
     *  @param _symbol the token symbol to set
     *  Only the owner of the token smart contract can call this function
     *  emits `UpdatedTokenInformation` and `SymbolSet` events
     */
    function setSymbol(string calldata _symbol) external;
}
