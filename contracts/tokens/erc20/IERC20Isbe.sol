// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
    IERC20Metadata
} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';

/**
 * @title ERC20 Token Interface
 * @notice This interface defines the standard functions, events, and errors for an ERC20 token,
 *         extending the standard ERC20 and ERC20Metadata interfaces.
 * @dev This interface introduces the `initializeErc20` function and custom errors specific to
 *      this implementation. It serves as a blueprint for implementing contract functionality while
 *      adhering to the ERC20 specification.
 */
interface IERC20Isbe is IERC20, IERC20Metadata {
    /**
     * @notice Emitted when the ERC20 token is initialized with a name, symbol, and decimals.
     * @param name The name of the initialized ERC20 token.
     * @param symbol The symbol of the initialized ERC20 token.
     * @param decimals The number of decimal places for the initialized ERC20 token.
     */
    event Erc20Initialized(string name, string symbol, uint8 decimals);

    /**
     * @notice Emitted after executing a batch transfer operation.
     * @param sender The address initiating the batch transfer.
     * @param recipients The list of recipient addresses.
     * @param amounts The list of token amounts transferred to each recipient.
     */
    event BatchTransferExecuted(
        address indexed sender,
        address[] recipients,
        uint256[] amounts
    );

    /**
     * @notice Emitted when `transferFrom` successfully transfers tokens.
     * @param operator The address executing the transfer.
     * @param from The address the tokens are transferred from.
     * @param to The address receiving the tokens.
     * @param amount The amount of tokens transferred.
     */
    event TransferFromExecuted(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /**
     * @notice Emitted when `increaseAllowance` raises a spender's allowance.
     * @param owner The address granting the allowance.
     * @param spender The address whose allowance increases.
     * @param addedValue The amount added to the allowance.
     * @param newAllowance The resulting allowance after the increase.
     */
    event AllowanceIncreased(
        address indexed owner,
        address indexed spender,
        uint256 addedValue,
        uint256 newAllowance
    );

    /**
     * @notice Emitted when `decreaseAllowance` reduces a spender's allowance.
     * @param owner The address granting the allowance.
     * @param spender The address whose allowance decreases.
     * @param subtractedValue The amount subtracted from the allowance.
     * @param newAllowance The resulting allowance after the decrease.
     */
    event AllowanceDecreased(
        address indexed owner,
        address indexed spender,
        uint256 subtractedValue,
        uint256 newAllowance
    );

    /// @notice Error thrown when an operation tries to decrease the allowance, resulting in a negative value.
    error DecreasedAllowanceBellowZero();

    /// @notice Error thrown when a transfer amount exceeds the sender's available balance.
    error TransferAmountExceedsBalance();

    /// @notice Error thrown when a burn amount exceeds the sender's available balance.
    error BurnAmountExceedsBalance();

    /// @notice Error thrown when an operation tries to spend more tokens than the assigned allowance.
    error InsufficientAllowance();

    /**
     * @notice Transfer tokens to multiple addresses in a single transaction (batch operation)
     * @dev Transfers tokens from the caller's account to multiple recipients.
     *
     *      **ERC20 Mode:** Simple batch transfers without additional validations
     *      **ERC3643 Mode:** Requires all recipients to be verified and sender/recipients not frozen
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _toList The addresses of the receivers (all must be verified for ERC3643)
     * @param _amounts The number of tokens to transfer to each corresponding receiver
     *
     * Requirements:
     * - Caller must have sufficient balance for the total amount
     * - Arrays must have the same length
     * - For ERC3643: all addresses in `_toList` must be verified in Identity Registry
     * - For ERC3643: caller and all recipients must not be frozen
     *
     * Emits:
     * - {Transfer} event for each transfer via internal transfer mechanism
     *
     * Reverts:
     * - {TransferAmountExceedsBalance} if caller has insufficient balance
     */
    function batchTransfer(
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external;

    /**
     * @notice Initializes the ERC20 token with the given name, symbol, and decimals.
     * @param _newName The name of the ERC20 token to be initialized.
     * @param _newSymbol The symbol of the ERC20 token to be initialized.
     * @param _newDecimals The number of decimal places for the ERC20 token.
     */
    function initializeErc20(
        string memory _newName,
        string memory _newSymbol,
        uint8 _newDecimals
    ) external;
}
