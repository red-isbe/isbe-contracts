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

/**
 * @title IERC203643Controller
 * @notice Interface for administrative control over ERC20 and ERC3643 tokens, allowing forced transfers and burns
 * @dev Intended for use in regulated environments or asset-backed tokens where such functionality is required.
 *      Behavior adapts automatically based on token type (ERC20 vs ERC3643).
 */
interface IERC203643Controller {
    // --- Events ---

    /// @notice Emitted when tokens are forcefully transferred from one account to another
    /// @param operator The address performing the forced transfer
    /// @param from The address the tokens are taken from
    /// @param to The address the tokens are sent to
    /// @param amount The number of tokens transferred
    event ForcedTransfer(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /// @notice Emitted when tokens are forcefully burned from an account
    /// @param operator The address performing the forced burn
    /// @param from The address the tokens are burned from
    /// @param amount The number of tokens burned
    event ForcedBurn(
        address indexed operator,
        address indexed from,
        uint256 amount
    );

    /// @notice Emitted when tokens are forcefully burned from multiple accounts in a batch
    /// @param operator The address performing the forced burn
    /// @param _userAddresses The list of addresses the tokens are burned from
    /// @param _amounts The number of tokens burned for each corresponding address
    event BatchForcedBurn(
        address indexed operator,
        address[] _userAddresses,
        uint256[] _amounts
    );

    /// @notice Emitted when tokens are forcefully transferred between multiple accounts in a batch
    /// @param operator The address performing the forced transfer
    /// @param _fromList The list of addresses the tokens are taken from
    /// @param _toList The list of addresses the tokens are sent to
    /// @param _amounts The number of tokens transferred for each corresponding pair
    event BatchForcedTransfer(
        address indexed operator,
        address[] _fromList,
        address[] _toList,
        uint256[] _amounts
    );

    /**
     * @notice Transfers tokens from one account to another by an authorized controller
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holder.
     *
     *      For ERC3643 tokens: recipient must be verified and tokens may be unfrozen if needed.
     *      In case the `_from` address has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amount`
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _amount The number of tokens to transfer
     * @return `true` if successful, otherwise reverts
     *
     * Emits a `ForcedTransfer` event
     * Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from` (ERC3643 only)
     * Emits a `Transfer` event
     */
    function forceTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool);

    /**
     * @notice Burns tokens from an account by an authorized controller
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holder.
     *
     *      For ERC3643 tokens: tokens may be unfrozen if needed.
     *      In case the `_from` address has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amount`
     *      the tokens will be unfrozen to complete the burn.
     *
     * @param _from The address to burn tokens from
     * @param _amount The number of tokens to burn
     *
     * Emits a `ForcedBurn` event
     * Emits a `TokensUnfrozen` event if `_amount` is higher than the free balance of `_from` (ERC3643 only)
     * Emits a `Transfer` event to address(0)
     */
    function forceBurn(address _from, uint256 _amount) external;

    /**
     * @notice Burns tokens from multiple accounts by an authorized controller (batch operation)
     * @dev This function should only be callable by an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holders.
     *
     *      For ERC3643 tokens: tokens may be unfrozen if needed.
     *      In case any `_userAddresses[i]` has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amounts[i]`
     *      the tokens will be unfrozen to complete the burn.
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _userAddresses The addresses to burn tokens from
     * @param _amounts The number of tokens to burn from each corresponding address
     *
     * Emits a `BatchForcedBurn` event for each burn
     * Emits a `TokensUnfrozen` event if `_amounts[i]`
     * is higher than the free balance of `_userAddresses[i]` (ERC3643 only)
     * Emits a `Transfer` event to address(0) for each burn
     */
    function batchForceBurn(
        address[] calldata _userAddresses,
        uint256[] calldata _amounts
    ) external;

    /**
     * @notice Transfers tokens from multiple accounts to multiple recipients
     * by an authorized controller (batch operation)
     * @dev This function should only be callable by
     * an authorized controller (e.g., regulator or admin contract).
     *      No approval required from token holders.
     *
     *      For ERC3643 tokens: recipients must be verified and tokens may be unfrozen if needed.
     *      In case any `_fromList[i]` address has not enough free tokens (unfrozen tokens)
     *      but has a total balance higher or equal to the `_amounts[i]`
     *      the tokens will be unfrozen to complete the transfer.
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_fromList.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _fromList The addresses to transfer tokens from
     * @param _toList The addresses to transfer tokens to
     * @param _amounts The number of tokens to transfer for each corresponding pair
     *
     * Emits a `BatchForcedTransfer` event for each transfer
     * Emits a `TokensUnfrozen` event if `_amounts[i]` is higher than the free balance of `_fromList[i]` (ERC3643 only)
     * Emits a `Transfer` event for each transfer
     */
    function batchForceTransfer(
        address[] calldata _fromList,
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external;
}
