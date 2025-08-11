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
     *  `_newVersion` is the version of the token, current version is 3.0
     *  `_newOnchainID` is the address of the onchainID of the token
     */
    event UpdatedTokenInformation(
        string indexed _newName,
        string indexed _newSymbol,
        uint8 _newDecimals,
        string _newVersion,
        address indexed _newOnchainID
    );

    /**
     *  @dev sets the token name
     *  @param _name the name of token to set
     *  Only the owner of the token smart contract can call this function
     *  emits a `UpdatedTokenInformation` event
     */
    function setName(string calldata _name) external;

    /**
     *  @dev sets the token symbol
     *  @param _symbol the token symbol to set
     *  Only the owner of the token smart contract can call this function
     *  emits a `UpdatedTokenInformation` event
     */
    function setSymbol(string calldata _symbol) external;

    /**
     *  @dev sets the onchain ID of the token
     *  @param _onchainID the address of the onchain ID to set
     *  Only the owner of the token smart contract can call this function
     *  emits a `UpdatedTokenInformation` event
     */
    function setOnchainID(address _onchainID) external;

    /**
     * @notice Initializes the ERC-3643 metadata fields of the token.
     * @dev Sets the initial onchain identity and version string.
     *      Emits a {UpdatedTokenInformation} event.
     * @param _newOnchainID The initial onchain identity address. Can be the zero address if not set.
     * @param _newVersion The initial version string of the token. Must be non-empty.
     */
    function initializeERC3643Metadata(
        address _newOnchainID,
        string memory _newVersion
    ) external;

    /**
     * @dev Returns the address of the onchainID of the token.
     * the onchainID of the token gives all the information available
     * about the token and is managed by the token issuer or his agent.
     */
    function onchainID() external view returns (address);

    /**
     * @dev Returns the TREX version of the token.
     * current version is 3.0.0
     */
    function version() external view returns (string memory);


}
