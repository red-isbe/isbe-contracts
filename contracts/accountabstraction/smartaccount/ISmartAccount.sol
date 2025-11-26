// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';

/**
 * @title ERC-4337 Smart Account Interface
 * @notice Defines the external surface for a smart account that
 *         interacts with an EntryPoint.
 * @dev Conforms to EntryPoint callbacks for user operation validation
 *      and execution.
 * @author ISBE Development Team
 */
interface ISmartAccount {
    /**
     * @notice Emitted when the smart account is successfully initialised.
     * @param entryPoint The authorised EntryPoint contract.
     */
    event SmartAccountInitialized(address entryPoint);

    /**
     * @notice Thrown when the caller is not the stored EntryPoint or the contract's owner.
     */
    error SmartAccount_NotFromEntryPointOrOwner();

    /**
     * @notice Thrown when the caller is not the stored EntryPoint
     */
    error SmartAccount_NotFromEntryPoint();

    /**
     * @notice Thrown when an execution on behalf of the smart account fails.
     * @param result The failed call's result.
     */
    error SmartAccount_CallFailed(bytes result);

    /**
     * @notice Thrown when a provided EntryPoint does not implement the required interface.
     * @dev Shoul be raised during initialisation or update if the ERC-165
     *      interface check for {IEntryPoint} fails.
     * @param entryPoint The non-conforming EntryPoint contract address.
     */
    error EntryPointInterfaceMismatch(address entryPoint);

    /**
     * @notice Validates a user's signature and processes prefund settlement.
     * @dev Must be invoked by EntryPoint. Returns validationData encoding
     *      signature validity. Ensures prefund is paid when required.
     * @param userOp The complete user operation being executed.
     * @param userOpHash The request hash used for signature verification.
     * @param missingAccountFunds Missing funds on the account's deposit in the sender (entrypoint).
     *                            In case there is a paymaster in the request, this value will be zero.
     * @return validationData 0 for valid signature, 1 to mark signature failure.
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    /**
     * @notice Executes a call on behalf of the smart account.
     * @dev Requires caller to be EntryPoint or owner. Propagates revert data
     *      on downstream failure. Does not validate calldata shape.
     * @param dest The target contract or externally owned account.
     * @param value The amount of ETH forwarded with the call.
     * @param functionData The ABI-encoded function call data.
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata functionData
    ) external;
}
