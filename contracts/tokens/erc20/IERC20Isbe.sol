// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
    IERC20Metadata
} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';

interface IERC20Isbe is IERC20, IERC20Metadata {
    /**
     * @notice Emitted when the ERC20 token is initialized with a name, symbol, and decimals.
     * @param name The name of the initialized ERC20 token.
     * @param symbol The symbol of the initialized ERC20 token.
     * @param decimals The number of decimal places for the initialized ERC20 token.
     */
    event Erc20Initialized(string name, string symbol, uint8 decimals);

    /// @notice Error thrown when an operation tries to decrease the allowance, resulting in a negative value.
    error DecreasedAllowanceBellowZero();

    /// @notice Error thrown when a transfer amount exceeds the sender's available balance.
    error TransferAmountExceedsBalance();

    /// @notice Error thrown when a burn amount exceeds the sender's available balance.
    error BurnAmountExceedsBalance();

    /// @notice Error thrown when an operation tries to spend more tokens than the assigned allowance.
    error InsufficientAllowance();

    /**
     * @notice Initializes the ERC20 token with the given name, symbol, and decimals.
     * @param newName The name of the ERC20 token to be initialized.
     * @param newSymbol The symbol of the ERC20 token to be initialized.
     * @param newDecimals The number of decimal places for the ERC20 token.
     */
    function initializeErc20(
        string memory newName,
        string memory newSymbol,
        uint8 newDecimals
    ) external;
}
