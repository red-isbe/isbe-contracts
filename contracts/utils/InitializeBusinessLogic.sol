// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title A Helper for Executing Initialisation Logic via Delegate Call
/// @author [Your Name/Company Here]
/// @notice This is an abstract contract that provides a safe way to run setup instructions
///         from a separate "business logic" contract.
/// @dev This contract is designed to be inherited by another contract, typically a proxy,
///      that needs to delegate its initialisation to an implementation contract.
///      It provides a standardised internal function, `_initialize`, which performs a
///      `delegatecall`. This allows the inheriting contract to execute code from another
///      address as if it were its own, ensuring state is initialised in the proxy's context.
abstract contract InitializeBusinessLogic {
    /// @notice Emitted when the initialisation function call failed without returning a specific error message.
    /// @dev This error is reverted when the `delegatecall` within `_initialize` returns `success = false`
    ///      but provides no specific error data (i.e., the return data size is zero).
    /// @param _initializationContractAddress The address of the contract that was meant to handle the initialisation.
    /// @param _calldata The raw call data that was sent in the failed delegate call.
    /// @param _error The empty byte string returned from the failed call.
    error InitializationFunctionReverted(
        address _initializationContractAddress,
        bytes _calldata,
        bytes _error
    );

    /// @notice Internally executes the initialisation logic using a delegate call.
    /// @dev This function makes a low-level `delegatecall` to a specified address (`_init`)
    ///      with provided call data (`_calldata`). It is a core mechanism for proxy patterns,
    ///      allowing an implementation contract to set the initial state of the proxy's storage.
    ///      If the delegate call fails, this function will "bubble up" (re-throw) the original
    ///      revert message from the target contract. If the call fails without providing such a
    ///      message, it reverts with the custom `InitializationFunctionReverted` error instead.
    /// @param _init The address of the implementation contract containing the logic to be executed.
    /// @param _calldata The encoded function call and arguments to be executed by the `_init` contract.
    function _initializeBusinessLogic(
        address _init,
        bytes memory _calldata
    ) internal {
        // solhint-disable avoid-low-level-calls
        // slither-disable-next-line controlled-delegatecall
        (bool success, bytes memory error) = _init.delegatecall(_calldata);
        // solhint-enable avoid-low-level-calls
        if (success) {
            return;
        }
        if (error.length == 0) {
            revert InitializationFunctionReverted(_init, _calldata, error);
        }

        // solhint-disable no-inline-assembly
        // Bubble up the original error message from the failed delegate call.
        /// @solidity memory-safe-assembly
        assembly {
            let returndata_size := mload(error)
            revert(add(32, error), returndata_size)
        }
        // solhint-enable no-inline-assembly
    }
}
