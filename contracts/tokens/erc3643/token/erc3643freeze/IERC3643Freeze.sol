// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC3643Freeze
 * @notice Interface for freezing and unfreezing addresses and token balances in ERC-3643 tokens.
 * @dev Defines full address freeze and partial token freeze operations,
 *      together with read-only inspection functions.
 */
interface IERC3643Freeze {
    /**
     *  this event is emitted when the wallet of an investor is frozen or unfrozen
     *  the event is emitted by setAddressFrozen and batchSetAddressFrozen functions
     *  `_userAddress` is the wallet of the investor that is concerned by the freezing status
     *  `_isFrozen` is the freezing status of the wallet
     *  if `_isFrozen` equals `true` the wallet is frozen after emission of the event
     *  if `_isFrozen` equals `false` the wallet is unfrozen after emission of the event
     *  `_owner` is the address of the agent who called the function to freeze the wallet
     */
    event AddressFrozen(
        address indexed _userAddress,
        bool indexed _isFrozen,
        address indexed _owner
    );

    /**
     *  this event is emitted when a certain amount of tokens is frozen on a wallet
     *  the event is emitted by freezePartialTokens and batchFreezePartialTokens functions
     *  `_userAddress` is the wallet of the investor that is concerned by the freezing status
     *  `_amount` is the amount of tokens that are frozen
     */
    event TokensFrozen(address indexed _userAddress, uint256 _amount);

    /**
     *  this event is emitted when a certain amount of tokens is unfrozen on a wallet
     *  the event is emitted by unfreezePartialTokens and batchUnfreezePartialTokens functions
     *  `_userAddress` is the wallet of the investor that is concerned by the freezing status
     *  `_amount` is the amount of tokens that are unfrozen
     */
    event TokensUnfrozen(address indexed _userAddress, uint256 _amount);

    /**
     * @notice Emitted when multiple addresses have their frozen status updated in a single call.
     * @param operator The account performing the batch update.
     * @param userAddresses The list of investors impacted.
     * @param statuses The resulting frozen status for each investor.
     */
    event BatchAddressFrozen(
        address indexed operator,
        address[] userAddresses,
        bool[] statuses
    );

    /**
     * @notice Emitted when multiple addresses have tokens frozen in a single call.
     * @param operator The account performing the batch freeze.
     * @param userAddresses The list of investors impacted.
     * @param amounts The amount frozen for each investor.
     */
    event BatchTokensFrozen(
        address indexed operator,
        address[] userAddresses,
        uint256[] amounts
    );

    /**
     * @notice Emitted when multiple addresses have tokens unfrozen in a single call.
     * @param operator The account performing the batch unfreeze.
     * @param userAddresses The list of investors impacted.
     * @param amounts The amount unfrozen for each investor.
     */
    event BatchTokensUnfrozen(
        address indexed operator,
        address[] userAddresses,
        uint256[] amounts
    );

    /// @notice Error indicating that an attempt was made to unfreeze more tokens than are frozen
    /// @param account The address attempting to unfreeze tokens
    /// @param requested The amount requested to unfreeze
    /// @param available The amount actually frozen
    error UnfreezeAmountExceedsFrozen(
        address account,
        uint256 requested,
        uint256 available
    );

    /// @notice Error when attempting to transfer more tokens than available free balance
    /// @param account The address attempting the transfer
    /// @param requested The amount requested to transfer
    /// @param freeBalance The actual free (unfrozen) balance available
    error InsufficientFreeBalance(
        address account,
        uint256 requested,
        uint256 freeBalance
    );

    /// @notice Error when sender account is completely frozen
    /// @param sender The frozen sender address
    error SenderIsFrozen(address sender);

    /// @notice Error when recipient account is completely frozen
    /// @param recipient The frozen recipient address
    error RecipientIsFrozen(address recipient);

    /**
     *  @dev sets an address frozen status for this token.
     *  @param _userAddress The address for which to update frozen status
     *  @param _freeze Frozen status of the address
     *  This function can only be called by a wallet set as agent of the token
     *  emits an `AddressFrozen` event
     */
    function setAddressFrozen(address _userAddress, bool _freeze) external;

    /**
     *  @dev freezes token amount specified for given address.
     *  @param _userAddress The address for which to update frozen tokens
     *  @param _amount Amount of Tokens to be frozen
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `TokensFrozen` event
     */
    function freezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external;

    /**
     *  @dev unfreezes token amount specified for given address
     *  @param _userAddress The address for which to update frozen tokens
     *  @param _amount Amount of Tokens to be unfrozen
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `TokensUnfrozen` event
     */
    function unfreezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) external;

    /**
     *  @dev function allowing to set frozen addresses in batch
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *  @param _userAddresses The addresses for which to update frozen status
     *  @param _freeze Frozen status of the corresponding address
     *  This function can only be called by a wallet set as agent of the token
     *  emits `_userAddresses.length` `AddressFrozen` events and one `BatchAddressFrozen` event
     */
    function batchSetAddressFrozen(
        address[] calldata _userAddresses,
        bool[] calldata _freeze
    ) external;

    /**
     *  @dev function allowing to freeze tokens partially in batch
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *  @param _userAddresses The addresses on which tokens need to be frozen
     *  @param _amounts the amount of tokens to freeze on the corresponding address
     *  This function can only be called by a wallet set as agent of the token
     *  emits `_userAddresses.length` `TokensFrozen` events and one `BatchTokensFrozen` event
     */
    function batchFreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external;

    /**
     *  @dev function allowing to unfreeze tokens partially in batch
     *  IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
     *  USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *  @param _userAddresses The addresses on which tokens need to be unfrozen
     *  @param _amounts the amount of tokens to unfreeze on the corresponding address
     *  This function can only be called by a wallet set as agent of the token
     *  emits `_userAddresses.length` `TokensUnfrozen` events and one `BatchTokensUnfrozen` event
     */
    function batchUnfreezePartialTokens(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external;

    /**
     *  @dev Returns the freezing status of a wallet
     *  if isFrozen returns `true` the wallet is frozen
     *  if isFrozen returns `false` the wallet is not frozen
     *  isFrozen returning `true` doesn't mean that the balance is free, tokens could be blocked by
     *  a partial freeze or the whole token could be blocked by pause
     *  @param _userAddress the address of the wallet on which isFrozen is called
     */
    function isFrozen(address _userAddress) external view returns (bool);

    /**
     *  @dev Returns the amount of tokens that are partially frozen on a wallet
     *  the amount of frozen tokens is always <= to the total balance of the wallet
     *  @param _userAddress the address of the wallet on which getFrozenTokens is called
     */
    function getFrozenTokens(
        address _userAddress
    ) external view returns (uint256);
}
