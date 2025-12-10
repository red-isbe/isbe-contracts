// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC203643Capped
 * @notice Unified interface for capped tokens with minting functionality for both ERC20 and ERC3643
 * @dev Provides supply cap management and administrative mint operations.
 *      Behavior adapts automatically based on token type (ERC20 vs ERC3643).
 *
 *      Includes functionality to initialize a supply cap, emit related events, and handle cap validation errors.
 *      This interface must be implemented by any token contract with a supply cap mechanism.
 */
interface IERC203643Capped {
    // --- Events ---

    /**
     * @notice Emitted after successfully initializing or updating the token cap.
     * @dev Should be triggered when `initializeCap` or `setCap` sets the supply cap.
     * @param operator The account that set the cap.
     * @param newCap The value of the token supply cap.
     */
    event CapSet(address operator, uint256 newCap);

    /**
     * @notice Emitted after successfully minting tokens to a single account.
     * @param operator The account that executed the mint.
     * @param to The recipient that received the freshly minted tokens.
     * @param amount The number of tokens minted for the recipient.
     */
    event Minted(address indexed operator, address indexed to, uint256 amount);

    /**
     * @notice Emitted after successfully minting tokens to multiple accounts in a batch.
     * @param operator The account that executed the batch mint.
     * @param toList The list of recipients that received tokens.
     * @param amounts The number of tokens minted for each corresponding recipient.
     */
    event BatchMinted(
        address indexed operator,
        address[] toList,
        uint256[] amounts
    );

    // --- Custom Errors ---

    /**
     * @notice Thrown when an invalid token cap of less than the total supply is provided.
     * @dev Ensures that the token supply cap must always be greater than the total supply.
     */
    error NewCapIsLessThanTotalSupply(uint256 cap, uint256 totalSupply);

    /**
     * @notice Thrown when the maximum token supply cap is exceeded.
     * @dev Triggered during operations like minting that would breach the defined cap.
     */
    error CapExceeded();

    // --- Functions ---

    /**
     * @notice Initializes the maximum supply cap for the token.
     * @dev This function is expected to be called once to set the total supply cap.
     *      Emits a `CapSet` event if successful.
     * @param _cap The desired maximum token supply cap.
     *
     * Requirements:
     * - Can only be called once during initialization
     * - `_cap` must be greater than zero
     */
    function initializeCap(uint256 _cap) external;

    /**
     * @notice Mint tokens to an address by an authorized minter
     * @dev No approval required from token holder.
     *      Respects the supply cap - will revert if minting would exceed the cap.
     *
     *      **ERC20 Mode:** Simple minting without additional validations
     *      **ERC3643 Mode:** Requires recipient to be verified in Identity Registry
     *
     * @param _to The address to mint tokens to (must be verified for ERC3643)
     * @param _amount The number of tokens to mint
     *
     * Requirements:
     * - Caller must have MINTER_ROLE
     * - Contract must not be paused
     * - For ERC3643: `_to` must be verified in Identity Registry
     * - Total supply after minting must not exceed cap
     *
     * Emits:
     * - {Transfer} event from address(0) via internal mint mechanism
     *
     * Reverts:
     * - {CapExceeded} if minting would exceed the supply cap
     */
    function mint(address _to, uint256 _amount) external;

    /**
     * @notice Mint tokens to multiple addresses by an authorized minter (batch operation)
     * @dev No approval required from token holders.
     *      Respects the supply cap - will revert if minting would exceed the cap.
     *
     *      **ERC20 Mode:** Simple batch minting without additional validations
     *      **ERC3643 Mode:** Requires all recipients to be verified in Identity Registry
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _toList The addresses to mint tokens to (all must be verified for ERC3643)
     * @param _amounts The number of tokens to mint to each corresponding address
     *
     * Requirements:
     * - Caller must have MINTER_ROLE
     * - Contract must not be paused
     * - Arrays must have the same length
     * - For ERC3643: all addresses in `_toList` must be verified in Identity Registry
     * - Total supply after minting must not exceed cap
     *
     * Emits:
     * - {Transfer} event from address(0) for each mint via internal mint mechanism
     *
     * Reverts:
     * - {CapExceeded} if batch minting would exceed the supply cap
     */
    function batchMint(
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external;

    /**
     * @notice Update the supply cap
     * @dev Administrative function to modify the maximum token supply
     * @param _newCap The new maximum supply cap
     *
     * Requirements:
     * - Caller must have CAP_ROLE
     * - Contract must not be paused
     * - New cap must be >= current total supply
     * - New cap must be > 0
     *
     * Emits:
     * - {CapSet} event
     *
     * Reverts:
     * - {CapIsZero} if `_newCap` is zero
     * - {NewCapIsLessThanTotalSupply} if `_newCap` is less than current total supply
     */
    function setCap(uint256 _newCap) external;

    /**
     * @notice Get the current supply cap
     * @return The maximum number of tokens that can exist
     */
    function cap() external view returns (uint256);
}
