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
-------------------------------------------------------------- */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    PackedUserOperation
} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {IStakeManager} from './stakemanager/IStakeManager.sol';
import {INonceManager} from './noncemanager/INonceManager.sol';

/**
 * @title EntryPoint account abstraction interface
 * @notice Standard interface for an ERC-4337 style EntryPoint coordinating
 *         user operations.
 * @dev Extends stake and nonce management and defines the core surface for
 *      accounts, paymasters and bundlers. Implementations are expected to
 *      enforce validation, prefund and gas accounting semantics defined by
 *      the account abstraction specification.
 * @author ISBE Development Team
 */
interface IEntryPoint is IStakeManager, INonceManager {
    /**
     * @notice Execution outcome for the post-operation callback flow.
     * @param unused Reserved value, not used in standard control paths.
     * @param opSucceeded User operation executed successfully.
     * @param opReverted User operation reverted but gas must still be paid.
     * @param postOpReverted Internal cleanup mode after a postOp reverted;
     *        paymasters are not called directly with this value.
     */
    enum PostOpMode {
        unused,
        opSucceeded,
        opReverted,
        postOpReverted
    }

    /**
     * @notice Aggregated return values from a single user operation.
     * @param preOpGas Gas measured before validation and execution.
     * @param prefund Amount of native tokens charged as prefund.
     * @param accountValidationData Packed account validation result, including
     *        signature validity and optional time-range constraints.
     * @param paymasterValidationData Packed paymaster validation result and
     *        optional time-range constraints.
     * @param paymasterContext Opaque context passed back into paymaster
     *        postOp for follow-up accounting.
     */
    struct ReturnInfo {
        uint256 preOpGas;
        uint256 prefund;
        uint256 accountValidationData;
        uint256 paymasterValidationData;
        bytes paymasterContext;
    }

    /**
     * @notice In-memory representation of a user operation used internally.
     * @param sender Account that initiates the operation.
     * @param nonce Account nonce used for replay protection.
     * @param verificationGasLimit Gas reserved for validation logic, including
     *        account and paymaster checks.
     * @param callGasLimit Gas allocated for the execution phase of the call.
     * @param paymasterVerificationGasLimit Gas reserved for paymaster
     *        validation (validatePaymasterUserOp).
     * @param paymasterPostOpGasLimit Gas reserved for paymaster postOp
     *        execution after the main call.
     * @param preVerificationGas Gas accounted for pre-verification overhead,
     *        such as calldata and batching costs.
     * @param paymaster Paymaster contract sponsoring the operation, or zero
     *        address if unused.
     * @param maxFeePerGas Maximum fee per gas unit the sender is willing to
     *        pay (EIP-1559 style).
     * @param maxPriorityFeePerGas Maximum priority fee per gas unit the sender
     *        is willing to pay to the bundler.
     */
    struct MemoryUserOp {
        address sender;
        uint256 nonce;
        uint256 verificationGasLimit;
        uint256 callGasLimit;
        uint256 paymasterVerificationGasLimit;
        uint256 paymasterPostOpGasLimit;
        uint256 preVerificationGas;
        address paymaster;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
    }

    /**
     * @notice Metadata derived during validation of a user operation.
     * @param mUserOp In-memory representation of the user operation fields
     *        relevant for gas and accounting.
     * @param userOpHash Hash of the user operation used for signature and
     *        aggregator verification.
     * @param prefund Amount of native tokens the sender or paymaster must
     *        pre-fund to cover the worst-case gas usage.
     * @param contextOffset Memory offset where validation context is stored
     *        for later retrieval in postOp.
     * @param preOpGas Gas measured just before validation starts, used for
     *        accurate gas accounting.
     */
    struct UserOpInfo {
        MemoryUserOp mUserOp;
        bytes32 userOpHash;
        uint256 prefund;
        uint256 contextOffset;
        uint256 preOpGas;
    }

    /**
     * @notice Emitted after a user operation has been fully processed.
     * @param userOpHash Hash of the user operation used for validation.
     * @param sender Account that initiated the user operation.
     * @param paymaster Paymaster that sponsored the operation, if any.
     * @param nonce Nonce used for replay protection on the sender account.
     * @param success Indicates whether the call phase completed successfully.
     * @param actualGasCost Total gas cost charged to the sender or paymaster.
     * @param actualGasUsed Total gas consumed for the entire operation.
     */
    event UserOperationEvent(
        bytes32 indexed userOpHash,
        address indexed sender,
        address indexed paymaster,
        uint256 nonce,
        bool success,
        uint256 actualGasCost,
        uint256 actualGasUsed
    );

    /**
     * @notice Emitted when an account is deployed as part of a user
     *         operation.
     * @param userOpHash Hash of the user operation that triggered
     *        deployment.
     * @param sender Deployed account address acting as the operation sender.
     * @param factory Account factory contract that performed the deployment.
     * @param paymaster Paymaster that sponsored the deployment, if any.
     */
    event AccountDeployed(
        bytes32 indexed userOpHash,
        address indexed sender,
        address factory,
        address paymaster
    );

    /**
     * @notice Emitted when a user operation reverts with a reason string.
     * @param userOpHash Hash of the reverted user operation.
     * @param sender Account that initiated the reverted operation.
     * @param nonce Nonce associated with the reverted operation.
     * @param revertReason ABI-encoded revert reason returned from execution.
     */
    event UserOperationRevertReason(
        bytes32 indexed userOpHash,
        address indexed sender,
        uint256 nonce,
        bytes revertReason
    );

    /**
     * @notice Emitted when a paymaster postOp execution reverts.
     * @param userOpHash Hash of the user operation whose postOp reverted.
     * @param sender Account that initiated the operation.
     * @param nonce Nonce associated with the user operation.
     * @param revertReason ABI-encoded revert reason from the postOp call.
     */
    event PostOpRevertReason(
        bytes32 indexed userOpHash,
        address indexed sender,
        uint256 nonce,
        bytes revertReason
    );

    /**
     * @notice Emitted when the prefund provided for a user operation is too
     *         low.
     * @param userOpHash Hash of the user operation with insufficient prefund.
     * @param sender Account that failed to pre-fund its operation.
     * @param nonce Nonce associated with the underfunded operation.
     */
    event UserOperationPrefundTooLow(
        bytes32 indexed userOpHash,
        address indexed sender,
        uint256 nonce
    );

    /**
     * @notice Emitted once before a batch of user operations is executed.
     * @dev Can be used by off-chain infrastructure to delimit execution
     *      phases for logging and profiling.
     */
    event BeforeExecution();

    /**
     * @notice Thrown when the beneficiary address for collected fees
     *         is invalid.
     * @dev Implementations typically use this when the beneficiary is the
     *      zero address or otherwise not supported as a payout target.
     * @param beneficiary Address that was rejected as fee beneficiary.
     */
    error InvalidBeneficiary(address beneficiary);

    /**
     * @notice Thrown when sending collected fees to the beneficiary fails.
     * @dev Indicates a low-level transfer failure while forwarding the
     *      batch's collected gas fees.
     * @param beneficiary Address that should have received the fees.
     */
    error FailedSendToBeneficiary(address beneficiary);

    /**
     * @notice Thrown when a function intended for internal use only is
     *         called externally.
     * @dev Implementations use this to enforce that certain entry points
     *      are reachable only via internal calls (for example, via
     *      delegatecall or self-call patterns).
     */
    error InternalCallOnly();

    /**
     * @notice Thrown when processing a specific operation in a batch fails.
     * @dev The EntryPoint reverts the whole handleOps call but indicates
     *      which index failed and with which high-level error code. The
     *      `reason` parameter is a fixed-size AA error code hash
     *      (for example, one of the predefined AAxx constants).
     * @param opIndex Index of the failing operation within the batch.
     * @param reason Fixed-size AA error code hash describing the failure.
     */
    error FailedOp(uint256 opIndex, bytes32 reason);

    /**
     * @notice Thrown when an operation fails and an inner revert payload is
     *         preserved.
     * @dev Similar to FailedOp but also carries the underlying revert data
     *      from the failing call for off-chain diagnosis. The `reason`
     *      field is a fixed-size AA error code hash.
     * @param opIndex Index of the failing operation within the batch.
     * @param reason Fixed-size AA error code hash describing the failure.
     * @param inner ABI-encoded revert data from the inner failing call.
     */
    error FailedOpWithRevert(uint256 opIndex, bytes32 reason, bytes inner);

    /**
     * @notice Processes a batch of user operations.
     * @dev Bundlers call this entry point to validate, execute and settle a
     *      batch of operations. Implementations are expected to:
     *      - Validate each operation's account and optional paymaster.
     *      - Perform deterministic gas accounting and prefund checks.
     *      - Execute the call for each valid operation.
     *      - Charge the sender or paymaster for actual gas used.
     *      - Emit UserOperationEvent per operation and relevant error
     *        events.
     *      May revert with FailedOp or FailedOpWithRevert if a specific
     *      index fails irrecoverably.
     * @param ops Array of packed user operations to be processed.
     * @param beneficiary Address that receives the collected fees for gas
     *        consumed by the batch.
     */
    function handleOps(
        PackedUserOperation[] calldata ops,
        address payable beneficiary
    ) external;

    /**
     * @notice Computes the hash for a given user operation.
     * @dev Implementations typically use an EIP-712 style domain separator
     *      and deterministic packing of the user operation fields. The
     *      resulting hash is used for account or aggregator signature
     *      validation.
     * @param userOp Packed user operation structure to be hashed.
     * @return bytes32 Hash of the user operation for signature
     *         verification.
     */
    function getUserOpHash(
        PackedUserOperation calldata userOp
    ) external view returns (bytes32);
}
