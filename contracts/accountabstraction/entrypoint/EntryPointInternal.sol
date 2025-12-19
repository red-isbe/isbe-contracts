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

/* solhint-disable no-inline-assembly */
/* solhint-disable avoid-low-level-calls */
/* solhint-disable gas-custom-errors */

import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import {
    ValidationData,
    _parseValidationData,
    min
} from '@account-abstraction/contracts/core/Helpers.sol';
import {Exec} from '@account-abstraction/contracts/utils/Exec.sol';
import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {NonceManagerInternal} from './noncemanager/NonceManagerInternal.sol';
import {StakeManagerInternal} from './stakemanager/StakeManagerInternal.sol';
import {EntryPointMemoryUtils} from './EntryPointMemoryUtils.sol';
import {UserOperationLib} from '../UserOperationLib.sol';
import {ISmartAccount} from '../smartaccount/ISmartAccount.sol';
import {IEntryPoint} from './IEntryPoint.sol';
import {MessageHashUtils} from '../MessageHashUtils.sol';
import './entryPointConstants.sol';

/**
 * @title EntryPoint internal logic
 * @notice Core internal implementation for ERC-4337 style EntryPoint
 *         operations.
 * @dev Implements validation, execution and accounting for user operations.
 *      Extends StakeManagerInternal and NonceManagerInternal, and uses
 *      EIP-712 for domain separation. This abstract contract is intended
 *      to be used as an internal logic mixin and not deployed directly.
 * @author ISBE Development Team
 */
abstract contract EntryPointInternal is
    EntryPointMemoryUtils,
    StakeManagerInternal,
    NonceManagerInternal,
    EIP712
{
    using UserOperationLib for PackedUserOperation;

    /**
     * @notice Initialises the EIP-712 domain separator.
     * @dev Sets up the typed data domain for user operation hashing and
     *      signature verification.
     */
    constructor() EIP712(DOMAIN_NAME, DOMAIN_VERSION) {}

    /**
     * @notice Executes an internal operation on behalf of the EntryPoint.
     * @dev Only callable via a low-level call from this contract itself.
     *      Enforces _msgSender() == address(this) (AA92). Verifies that
     *      sufficient gas remains for call and paymaster postOp, executes
     *      the user call, derives the post-operation mode, and finally
     *      calls _postExecution to charge gas and run postOp.
     * @param callData Encoded function call to be executed on the sender
     *        account.
     * @param opInfo Struct containing pre-validated operation data.
     * @return actualGasCost Total gas cost incurred by this operation in
     *         wei.
     */
    function innerHandleOp(
        bytes memory callData,
        IEntryPoint.UserOpInfo memory opInfo
    ) external returns (uint256 actualGasCost) {
        uint256 preGas = gasleft();
        require(_msgSender() == address(this), IEntryPoint.InternalCallOnly());
        _verifyGasLeft(opInfo.mUserOp.callGasLimit);

        IEntryPoint.PostOpMode mode = IEntryPoint.PostOpMode.opSucceeded;
        if (callData.length > 0) {
            bool success = _callSmartAccount(callData, opInfo);
            if (!success) {
                mode = IEntryPoint.PostOpMode.opReverted;
            }
        }

        unchecked {
            uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
            actualGasCost = _postExecution(mode, opInfo, actualGas);
        }
    }

    /**
     * @notice Handles the main batch execution of user operations.
     * @dev Validates all operations, executes them and settles accounts
     *      in a single atomic process. Emits BeforeExecution once before
     *      executing the batch and uses collected gas to compensate the
     *      beneficiary.
     * @param ops Array of packed user operations to process.
     * @param beneficiary Address receiving collected gas compensation.
     */
    function _handleOps(
        PackedUserOperation[] calldata ops,
        address payable beneficiary
    ) internal {
        require(
            beneficiary != address(0),
            IEntryPoint.InvalidBeneficiary(beneficiary)
        );
        uint256 opslen = ops.length;
        unchecked {
            IEntryPoint.UserOpInfo[] memory opInfos = _validateUserOps(ops);

            emit IEntryPoint.BeforeExecution();
            uint256 collected;
            for (uint256 i; i < opslen; ++i) {
                collected += _executeUserOp(i, ops[i], opInfos[i]);
            }

            _compensate(beneficiary, collected);
        }
    }

    /**
     * @notice Validates a single user operation and prepares its metadata.
     * @dev Performs core validation (copy into memory, gas checks, nonce,
     *      hash, prefund, initCode, validateUserOp), then validates
     *      time-range and aggregator data and charges the paymaster
     *      prefund. Reverts with appropriate AA errors on failure.
     * @param opIndex Index of the operation within the batch.
     * @param userOp Packed user operation being validated.
     * @return opInfo Populated user operation metadata for later use in
     *         execution and accounting.
     */
    function _validateSingleUserOp(
        uint256 opIndex,
        PackedUserOperation calldata userOp
    ) internal returns (IEntryPoint.UserOpInfo memory opInfo) {
        // 1) Core validation: copy, nonce, gas, hash, prefund, initCode,
        //    validateUserOp
        uint256 validationData = _validateUserOpCore(opIndex, userOp, opInfo);

        // 2) Validation of time windows and aggregator
        _validateAccountValidationData(opIndex, validationData, address(0));

        // 3) Charge prefund from the paymaster deposit
        _chargePaymasterPrefund(opIndex, opInfo);
    }

    /**
     * @notice Executes a user operation and handles its revert paths.
     * @dev Calls innerHandleOp via _callExecuteUserOp, interprets the
     *      revert code produced by inner execution and either:
     *      - returns the inner collected value on success,
     *      - reverts with AA95 on inner out-of-gas,
     *      - handles low prefund paths, or
     *      - handles generic reverts with events and postOp.
     * @param opIndex Index of the operation within the batch.
     * @param userOp Packed user operation being executed.
     * @param opInfo Metadata and prefund information for this operation.
     * @return collected Amount effectively collected from the prefund for
     *         this operation.
     */
    function _executeUserOp(
        uint256 opIndex,
        PackedUserOperation calldata userOp,
        IEntryPoint.UserOpInfo memory opInfo
    ) internal returns (uint256 collected) {
        uint256 preGas = gasleft();
        (bool success, uint256 innerCost) = _callInnerHandleOp(
            userOp.callData,
            opInfo
        );

        if (success) {
            return innerCost;
        }

        bytes32 innerRevertCode = _getRevertCode();

        if (innerRevertCode == INNER_OUT_OF_GAS) {
            revert IEntryPoint.FailedOp(opIndex, OUT_OF_GAS);
        }

        // By construction, any non-success revert must be LOW_PREFUND here.
        // If that ever stops being true, it's a bug elsewhere.
        // This MUST be adapted when further business logic is added.
        assert(innerRevertCode == INNER_REVERT_LOW_PREFUND);
        return _handleLowPrefund(opInfo, preGas);
    }

    /**
     * @notice Computes the hash for a given user operation.
     * @dev Uses the current EIP-712 domain separator and the packed user
     *      operation hash as produced by UserOperationLib.hash.
     * @param userOp Packed user operation structure.
     * @return bytes32 User operation hash used for signature validation.
     */
    function _getUserOpHash(
        PackedUserOperation calldata userOp
    ) internal view returns (bytes32) {
        return
            MessageHashUtils.toTypedDataHash(
                _domainSeparatorV4(),
                userOp.hash()
            );
    }

    /**
     * @notice Copies data from a packed user operation into a memory
     *         struct.
     * @dev Unpacks gas fields and paymaster fields using UserOperationLib.
     *      Requires non-empty paymasterAndData (AA93).
     * @param userOp Packed user operation calldata.
     * @param mUserOp Destination in-memory struct for unpacked fields.
     */
    function _copyUserOpToMemory(
        PackedUserOperation calldata userOp,
        IEntryPoint.MemoryUserOp memory mUserOp
    ) internal pure {
        mUserOp.sender = userOp.sender;
        mUserOp.nonce = userOp.nonce;
        (mUserOp.verificationGasLimit, mUserOp.callGasLimit) = UserOperationLib
            .unpackUints(userOp.accountGasLimits);
        mUserOp.preVerificationGas = userOp.preVerificationGas;
        (mUserOp.maxPriorityFeePerGas, mUserOp.maxFeePerGas) = UserOperationLib
            .unpackUints(userOp.gasFees);
        mUserOp.paymaster = address(
            bytes20(userOp.paymasterAndData[:ADDRESS_LENGTH])
        );
    }

    /**
     * @notice Validates a batch of user operations.
     * @dev Iterates over the array and validates each operation through
     *      _validateSingleUserOp. Reverts on the first failing operation
     *      with the corresponding AA error.
     * @param ops Array of packed user operations to validate.
     * @return opInfos Array of per-operation metadata populated during
     *         validation.
     */
    function _validateUserOps(
        PackedUserOperation[] calldata ops
    ) private returns (IEntryPoint.UserOpInfo[] memory opInfos) {
        uint256 opslen = ops.length;
        opInfos = new IEntryPoint.UserOpInfo[](opslen);
        for (uint256 i; i < opslen; ++i) {
            opInfos[i] = _validateSingleUserOp(i, ops[i]);
        }
    }

    /**
     * @notice Performs core validation steps for a single user operation.
     * @dev Copies calldata into the in-memory struct, checks gas value
     *      bounds, validates and updates nonce, computes the operation
     *      hash and required prefund, creates the sender if needed and
     *      calls validateUserOp. Also enforces that verification gas
     *      usage does not exceed verificationGasLimit (AA26).
     * @param opIndex Index of the operation within the batch.
     * @param userOp Packed user operation being validated.
     * @param outOpInfo UserOpInfo struct to be filled with validation
     *        metadata.
     * @return validationData Packed validation data returned by
     *         validateUserOp.
     */
    function _validateUserOpCore(
        uint256 opIndex,
        PackedUserOperation calldata userOp,
        IEntryPoint.UserOpInfo memory outOpInfo
    ) private returns (uint256 validationData) {
        require(
            userOp.paymasterAndData.length > 0,
            IEntryPoint.FailedOp(opIndex, INVALID_PAYMASTER_AND_DATA)
        );
        uint256 preGas = gasleft();
        IEntryPoint.MemoryUserOp memory mUserOp = outOpInfo.mUserOp;
        _copyUserOpToMemory(userOp, mUserOp);

        require(
            mUserOp.paymaster != address(0),
            IEntryPoint.FailedOp(opIndex, INVALID_PAYMASTER)
        );

        _checkGasValuesOverflow(opIndex, mUserOp);
        _checkAndUpdateNonce(opIndex, mUserOp);

        outOpInfo.userOpHash = _getUserOpHash(userOp);
        outOpInfo.prefund = _getRequiredPrefund(mUserOp);

        _createSenderIfNeeded(opIndex, outOpInfo, userOp.initCode);
        validationData = _callValidateUserOp(opIndex, userOp, outOpInfo);

        unchecked {
            uint256 gasUsed = preGas - gasleft();
            require(
                gasUsed <= mUserOp.verificationGasLimit,
                IEntryPoint.FailedOp(opIndex, OVER_VERIFICATION_GAS_LIMIT)
            );
            outOpInfo.preOpGas = gasUsed + userOp.preVerificationGas;
        }
    }

    /**
     * @notice Charges the paymaster deposit with the required prefund.
     * @dev Requires that a paymaster is set (AA98) and attempts to
     *      decrement its deposit by the prefund amount. Reverts with
     *      AA31 if the paymaster has insufficient deposit.
     * @param opIndex Index of the operation within the batch.
     * @param opInfo User operation metadata containing prefund and
     *        paymaster information.
     */
    function _chargePaymasterPrefund(
        uint256 opIndex,
        IEntryPoint.UserOpInfo memory opInfo
    ) private {
        address paymaster = opInfo.mUserOp.paymaster;
        unchecked {
            if (!_tryDecrementDeposit(paymaster, opInfo.prefund)) {
                revert IEntryPoint.FailedOp(opIndex, PAYMASTER_DEPOSIT_TOO_LOW);
            }
        }
    }

    /**
     * @notice Validates and updates the sender nonce for an operation.
     * @dev Calls _validateAndUpdateNonce on the NonceManager. Reverts
     *      with AA25 if the nonce is invalid or already used.
     * @param opIndex Index of the operation within the batch.
     * @param mUserOp In-memory user operation struct containing sender
     *        and nonce.
     */
    function _checkAndUpdateNonce(
        uint256 opIndex,
        IEntryPoint.MemoryUserOp memory mUserOp
    ) private {
        require(
            _validateAndUpdateNonce(mUserOp.sender, mUserOp.nonce),
            IEntryPoint.FailedOp(opIndex, INVALID_ACCOUNT_NONCE)
        );
    }

    /**
     * @notice Sends collected gas compensation to the beneficiary.
     * @dev Transfers Ether to the beneficiary. Reverts with
     *      AA91 if the transfer fails.
     * @param beneficiary Address to receive compensation.
     * @param amount Amount of Ether to transfer.
     */
    function _compensate(address payable beneficiary, uint256 amount) private {
        (bool success, ) = beneficiary.call{value: amount}('');
        require(success, IEntryPoint.FailedSendToBeneficiary(beneficiary));
    }

    /**
     * @notice Handles the path where prefund is lower than actual gas
     *         cost.
     * @dev Computes the actual gas used, emits the prefund too low and
     *      UserOperationEvent with success set to false, and charges the
     *      full prefund amount.
     * @param opInfo Metadata for the underfunded operation.
     * @param preGas Gas level measured before invoking innerHandleOp.
     * @return collected Amount collected (equal to prefund).
     */
    function _handleLowPrefund(
        IEntryPoint.UserOpInfo memory opInfo,
        uint256 preGas
    ) private returns (uint256 collected) {
        uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
        uint256 actualGasCost = opInfo.prefund;
        _emitPrefundTooLow(opInfo);
        _emitUserOperationEvent(opInfo, false, actualGasCost, actualGas);
        collected = actualGasCost;
    }

    /**
     * @notice Performs the low-level call into innerHandleOp.
     * @dev Encodes a call to innerHandleOp and uses a low-level call with
     *      all remaining gas. Returns the success flag and the collected
     *      value from innerHandleOp. Uses scratch memory via the free
     *      memory pointer helpers.
     * @param callData Encoded user call to be executed.
     * @param opInfo Metadata and prefund information passed to
     *        innerHandleOp.
     * @return success True if innerHandleOp completed without reverting.
     * @return collected Value returned by innerHandleOp as actualGasCost.
     */
    function _callInnerHandleOp(
        bytes calldata callData,
        IEntryPoint.UserOpInfo memory opInfo
    ) private returns (bool success, uint256 collected) {
        // gas-optimisation: treat revert data buffer as temporary memory
        uint256 saveFreePtr = _getFreePtr();
        bytes memory innerCall;
        innerCall = abi.encodeCall(this.innerHandleOp, (callData, opInfo));
        assembly ('memory-safe') {
            success := call(
                gas(),
                address(),
                0,
                add(innerCall, 0x20),
                mload(innerCall),
                0,
                32
            )
            collected := mload(0)
        }
        _restoreFreePtr(saveFreePtr);
    }

    /**
     * @notice Executes the user call on the sender account.
     * @dev Uses Exec.call with the configured callGasLimit. On failure,
     *      retrieves limited revert data and emits UserOperationRevertReason.
     *      Uses temporary memory via the free memory pointer helpers.
     * @param callData Encoded call to be executed on the sender.
     * @param opInfo Operation metadata containing sender, nonce and hash.
     * @return success True if the user call succeeded.
     */
    function _callSmartAccount(
        bytes memory callData,
        IEntryPoint.UserOpInfo memory opInfo
    ) private returns (bool success) {
        success = Exec.call(
            opInfo.mUserOp.sender,
            0,
            callData,
            opInfo.mUserOp.callGasLimit
        );
        if (!success) {
            // gas-optimisation: treat revert data buffer as temporary memory
            uint256 freePtr = _getFreePtr();
            bytes memory result = Exec.getReturnData(REVERT_REASON_MAX_LEN);
            if (result.length > 0) {
                emit IEntryPoint.UserOperationRevertReason(
                    opInfo.userOpHash,
                    opInfo.mUserOp.sender,
                    opInfo.mUserOp.nonce,
                    result
                );
            }
            _restoreFreePtr(freePtr);
        }
    }

    /**
     * @notice Deploys a sender account if it is not already deployed.
     * @dev Validates that the sender has no code (SenderAlreadyConstructed), that initCode
     *      is at least 20 bytes (AA99), creates the sender, and checks that the
     *      returned address is non-zero (AA13), matches the expected
     *      sender (AA14) and has code (AA15). Emits AccountDeployed on
     *      success.
     * @param opIndex Operation index for revert tracking.
     * @param opInfo Metadata of the user operation.
     * @param initCode Initialisation code for account creation.
     */
    function _createSenderIfNeeded(
        uint256 opIndex,
        IEntryPoint.UserOpInfo memory opInfo,
        bytes calldata initCode
    ) private {
        address sender = opInfo.mUserOp.sender;
        if (initCode.length != 0) {
            require(
                sender.code.length == 0,
                IEntryPoint.FailedOp(opIndex, SENDER_ALREADY_CONSTRUCTED)
            );
            require(
                initCode.length >= 20,
                IEntryPoint.FailedOp(opIndex, INIT_CODE_TOO_SMALL)
            );

            address createdSender = _createSender(initCode);

            require(
                createdSender != address(0),
                IEntryPoint.FailedOp(opIndex, INIT_CODE_FAILED_OR_OOG)
            );
            require(
                createdSender == sender,
                IEntryPoint.FailedOp(opIndex, INIT_CODE_MUST_RETURN_SENDER)
            );
            require(
                createdSender.code.length > 0,
                IEntryPoint.FailedOp(opIndex, INIT_CODE_MUST_CREATE_SENDER)
            );

            address factory = address(bytes20(initCode[0:ADDRESS_LENGTH]));
            emit IEntryPoint.AccountDeployed(
                opInfo.userOpHash,
                sender,
                factory,
                opInfo.mUserOp.paymaster
            );
        } else {
            require(
                sender.code.length != 0,
                IEntryPoint.FailedOp(opIndex, ACCOUNT_NOT_DEPLOYED)
            );
        }
    }

    /**
     * @notice Invokes ISmartAccount.validateUserOp for account validation.
     * @dev Calls validateUserOp on the sender with the configured
     *      verificationGasLimit. Expects exactly 32 bytes of return data
     *      representing validationData. If the call fails and the sender
     *      has no code, reverts with AA20. Otherwise reverts with
     *      FailedOpWithRevert and AA23 including truncated revert data.
     * @param opIndex Index of the user operation.
     * @param op Packed user operation calldata.
     * @param opInfo Operation metadata structure.
     * @return validationData Encoded result returned from validation.
     */
    function _callValidateUserOp(
        uint256 opIndex,
        PackedUserOperation calldata op,
        IEntryPoint.UserOpInfo memory opInfo
    ) private returns (uint256 validationData) {
        uint256 gasLimit = opInfo.mUserOp.verificationGasLimit;
        address sender = opInfo.mUserOp.sender;
        bool success;
        {
            // gas-optimisation: treat revert data buffer as temporary memory
            uint256 saveFreePtr = _getFreePtr();
            bytes memory callData = abi.encodeCall(
                ISmartAccount.validateUserOp,
                (
                    op,
                    opInfo.userOpHash,
                    0 // missingAccountFunds as the Smart Account does not pay
                )
            );
            assembly ('memory-safe') {
                success := call(
                    gasLimit,
                    sender,
                    0,
                    add(callData, 0x20),
                    mload(callData),
                    0,
                    32
                )
                validationData := mload(0)
                if iszero(eq(returndatasize(), 32)) {
                    success := 0
                }
            }
            _restoreFreePtr(saveFreePtr);
        }
        if (!success) {
            revert IEntryPoint.FailedOpWithRevert(
                opIndex,
                VALIDATION_REVERTED,
                Exec.getReturnData(REVERT_REASON_MAX_LEN)
            );
        }
    }

    /**
     * @notice Handles post-execution processing after a user operation
     *         is executed.
     * @dev Finalises gas accounting, computes the final gas cost
     *      and either refund surplus or signal low prefund conditions.
     * @param mode Post-operation mode (opSucceeded, opReverted).
     * @param opInfo Struct containing metadata and prefund information.
     * @param actualGas Total gas consumed during validation and
     *        execution before penalties.
     * @return actualGasCost Total Ether cost (gas × price) incurred by
     *         the operation in wei.
     */
    function _postExecution(
        IEntryPoint.PostOpMode mode,
        IEntryPoint.UserOpInfo memory opInfo,
        uint256 actualGas
    ) private returns (uint256 actualGasCost) {
        unchecked {
            IEntryPoint.MemoryUserOp memory mUserOp = opInfo.mUserOp;
            uint256 gasPrice = _getUserOpGasPrice(mUserOp);
            actualGasCost = actualGas * gasPrice;
            uint256 prefund = opInfo.prefund;
            if (prefund < actualGasCost) {
                assembly ('memory-safe') {
                    mstore(0, INNER_REVERT_LOW_PREFUND)
                    revert(0, 32)
                }
            } else {
                uint256 refund = prefund - actualGasCost;
                _refund(
                    mode,
                    opInfo,
                    mUserOp.paymaster,
                    refund,
                    actualGasCost,
                    actualGas
                );
            }
        }
    }

    /**
     * @notice Credits remaining prefund and emits the final operation
     *         event.
     * @dev Credits the refund amount to the paymaster deposit via
     *      _incrementDeposit, and emits UserOperationEvent with success
     *      derived from the post-operation mode.
     * @param mode Post-operation mode describing the outcome.
     * @param opInfo Aggregated metadata for the operation.
     * @param refundAddress Address whose deposit is credited with the
     *        refund.
     * @param refund Surplus amount in wei returned from prefund.
     * @param actualGasCost Final cost of the operation in wei.
     * @param actualGas Final gas usage in units.
     */
    function _refund(
        IEntryPoint.PostOpMode mode,
        IEntryPoint.UserOpInfo memory opInfo,
        address refundAddress,
        uint256 refund,
        uint256 actualGasCost,
        uint256 actualGas
    ) private {
        _incrementDeposit(refundAddress, refund);
        bool success = mode == IEntryPoint.PostOpMode.opSucceeded;
        _emitUserOperationEvent(opInfo, success, actualGasCost, actualGas);
    }

    /**
     * @notice Deploys a smart account using the provided initCode.
     * @dev Interprets the first ADDRESS_LENGTH bytes of `initCode` as the
     *      factory address and the remaining bytes as calldata to that
     *      factory. Performs a low-level call forwarding all remaining gas
     *      and expects the factory to return the deployed account address
     *      in the first 32 bytes of returndata on success. Returns zero if
     *      the call fails or no address is returned.
     * @param initCode Concatenation of the factory address (first
     *        ADDRESS_LENGTH bytes) and the factory call data.
     * @return sender Address of the deployed smart account returned by the
     *         factory, or address(0) if deployment fails.
     */
    function _createSender(
        bytes calldata initCode
    ) private returns (address sender) {
        address factory = address(bytes20(initCode[0:ADDRESS_LENGTH]));

        bytes memory initCallData = initCode[ADDRESS_LENGTH:];
        bool success;
        assembly ('memory-safe') {
            success := call(
                gas(),
                factory,
                0,
                add(initCallData, 0x20),
                mload(initCallData),
                0,
                32
            )
            if success {
                sender := mload(0)
            }
        }
    }

    /**
     * @notice Emits the standard UserOperationEvent.
     * @dev Logs operation result, prefund payer and gas accounting
     *      details for off-chain analysis.
     * @param opInfo Operation metadata and state.
     * @param success True if execution succeeded.
     * @param actualGasCost Gas cost charged in wei.
     * @param actualGas Total gas used including post-operation work.
     */
    function _emitUserOperationEvent(
        IEntryPoint.UserOpInfo memory opInfo,
        bool success,
        uint256 actualGasCost,
        uint256 actualGas
    ) private {
        emit IEntryPoint.UserOperationEvent(
            opInfo.userOpHash,
            opInfo.mUserOp.sender,
            opInfo.mUserOp.paymaster,
            opInfo.mUserOp.nonce,
            success,
            actualGasCost,
            actualGas
        );
    }

    /**
     * @notice Emits an event when the prefund is insufficient.
     * @dev Used to trace underfunded operations and distinguish them
     *      from other revert reasons.
     * @param opInfo Operation metadata containing sender and nonce.
     */
    function _emitPrefundTooLow(IEntryPoint.UserOpInfo memory opInfo) private {
        emit IEntryPoint.UserOperationPrefundTooLow(
            opInfo.userOpHash,
            opInfo.mUserOp.sender,
            opInfo.mUserOp.nonce
        );
    }

    /**
     * @notice Decodes packed validation data into aggregator and time data.
     * @dev Parses the uint256 validationData into a ValidationData struct.
     *      Returns the aggregator address and a flag indicating whether
     *      the current timestamp is outside the allowed time window.
     * @param validationData Packed validation data as returned by
     *        validateUserOp.
     * @return aggregator Aggregator that signed the user operation, or
     *         zero if unused.
     * @return outOfTimeRange True if now is either after validUntil or
     *         strictly before or equal to validAfter.
     */
    function _getValidationData(
        uint256 validationData
    ) private view returns (address aggregator, bool outOfTimeRange) {
        if (validationData == 0) {
            return (address(0), false);
        }
        ValidationData memory data = _parseValidationData(validationData);
        // solhint-disable-next-line not-rely-on-time
        uint256 ts = block.timestamp;
        outOfTimeRange = (ts > data.validUntil) || (ts <= data.validAfter);
        aggregator = data.aggregator;
    }

    /**
     * @notice Validates aggregator address and time-range constraints.
     * @dev Decodes validationData into a ValidationData struct and checks
     *      that the aggregator matches expectedAggregator (AA24) and that
     *      the current timestamp is within the validAfter/validUntil
     *      range (AA22).
     * @param opIndex Index of the operation within the batch.
     * @param validationData Packed validation data from validateUserOp.
     * @param expectedAggregator Aggregator expected to have signed the
     *        operation; zero means no aggregator.
     */
    function _validateAccountValidationData(
        uint256 opIndex,
        uint256 validationData,
        address expectedAggregator
    ) private view {
        (address aggregator, bool outOfTimeRange) = _getValidationData(
            validationData
        );

        if (expectedAggregator != aggregator) {
            revert IEntryPoint.FailedOp(opIndex, SIGNATURE_ERROR);
        }
        if (outOfTimeRange) {
            revert IEntryPoint.FailedOp(opIndex, SIGNATURE_EXPIRED_OR_NOT_DUE);
        }
    }

    /**
     * @notice Ensures that enough gas remains to safely execute the
     *         operation.
     * @dev Applies the 63/64 rule to remaining gas and compares it
     *      against the required gas for callGasLimit and INNER_GAS_OVERHEAD. If not
     *      enough gas is left, reverts with the INNER_OUT_OF_GAS
     *      sentinel code.
     * @param callGasLimit Gas allocated for the user operation call.
     */
    function _verifyGasLeft(uint256 callGasLimit) private view {
        unchecked {
            // Verifies that sufficient gas remains for the operation
            if ((gasleft() * 63) / 64 < callGasLimit + INNER_GAS_OVERHEAD) {
                assembly ('memory-safe') {
                    mstore(0, INNER_OUT_OF_GAS)
                    revert(0, 32)
                }
            }
        }
    }

    /**
     * @notice Computes the required prefund for a given operation.
     * @dev Sums verification, call, paymaster validation, paymaster
     *      postOp and pre-verification gas, then multiplies by
     *      maxFeePerGas. The result is the worst-case prefund in wei.
     * @param mUserOp In-memory user operation data.
     * @return requiredPrefund Ether amount required for prefunding.
     */
    function _getRequiredPrefund(
        IEntryPoint.MemoryUserOp memory mUserOp
    ) private pure returns (uint256 requiredPrefund) {
        unchecked {
            uint256 requiredGas = mUserOp.verificationGasLimit +
                mUserOp.callGasLimit +
                mUserOp.preVerificationGas;
            requiredPrefund = requiredGas * mUserOp.maxFeePerGas;
        }
    }

    /**
     * @notice Ensures that gas-related values fit within supported bounds.
     * @dev ORs together several gas and fee fields and checks that the
     *      result fits into uint120. Reverts with AA94 if any value is
     *      too large and could cause overflows in downstream logic.
     * @param opIndex Index of the operation within the batch.
     * @param mUserOp In-memory user operation struct with gas fields.
     */
    function _checkGasValuesOverflow(
        uint256 opIndex,
        IEntryPoint.MemoryUserOp memory mUserOp
    ) private pure {
        uint256 maxGasValues = mUserOp.preVerificationGas |
            mUserOp.verificationGasLimit |
            mUserOp.callGasLimit |
            mUserOp.maxFeePerGas |
            mUserOp.maxPriorityFeePerGas;
        require(
            maxGasValues <= type(uint120).max,
            IEntryPoint.FailedOp(opIndex, GAS_VALUES_OVERFLOW)
        );
    }

    /**
     * @notice Determines the effective gas price for a user operation.
     * @dev Considers maxFeePerGas and maxPriorityFeePerGas in an
     *      EIP-1559-inspired manner. On Istanbul EVM (no basefee
     *      support), uses min(maxFeePerGas, maxPriorityFeePerGas).
     * @param mUserOp In-memory user operation struct containing gas
     *        parameters.
     * @return Effective gas price used for accounting.
     */
    function _getUserOpGasPrice(
        IEntryPoint.MemoryUserOp memory mUserOp
    ) private pure returns (uint256) {
        unchecked {
            return min(mUserOp.maxFeePerGas, mUserOp.maxPriorityFeePerGas + 0);
        }
    }
}
