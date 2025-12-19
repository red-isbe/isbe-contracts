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
    PackedUserOperation,
    EntryPoint
} from '../../accountabstraction/entrypoint/EntryPoint.sol';

/**
 * @title EntryPointTestWrapper
 * @dev A specialized EntryPoint wrapper used exclusively for unit testing.
 *
 * This contract exposes internal EntryPoint logic (such as `_validatePrepayment`
 * and `_executeUserOp`) in controlled ways so that specific AA error codes,
 * branches, and gas-related behaviour can be tested deterministically.
 *
 * NONE of these methods should ever be used in production — they exist only
 * to isolate internal execution paths that are normally difficult or impossible
 * to reach through standard `handleOps` flows.
 */
contract EntryPointTestWrapper is EntryPoint {
    /**
     * @dev Test helper that directly invokes `_validatePrepayment`.
     *
     * It is used to force the "AA26 over verificationGasLimit" failure path by
     * combining this call with the overridden `_validateAccountPrepayment`,
     * which intentionally burns gas.
     */
    function testValidatePrepaymentAA26(
        PackedUserOperation calldata op
    ) external {
        _validateSingleUserOp(0, op);
    }

    /**
     * @dev Test helper that forces the "prefund too low" post-execution path.
     *
     * It bypasses `_validatePrepayment` entirely by:
     *  - Manually copying the userOp into memory.
     *  - Computing the userOpHash.
     *  - Overriding the prefund with an arbitrarily low value.
     *
     * Then runs `_executeUserOp` normally, allowing tests to observe:
     *  - `UserOperationPrefundTooLow`
     *  - `UserOperationEvent(success=false)`
     *
     * Useful for testing the `INNER_REVERT_LOW_PREFUND` magic-code branch.
     */
    function executeUserOpWithLowPrefund(
        PackedUserOperation calldata op,
        uint256 prefundOverride
    ) external returns (uint256 collected) {
        UserOpInfo memory info;

        // Populate mUserOp from the packed userOperation
        _copyUserOpToMemory(op, info.mUserOp);

        // Compute userOpHash while preserving free memory pointer
        uint256 freePtr = _getFreePtr();
        info.userOpHash = _getUserOpHash(op);
        _restoreFreePtr(freePtr);

        // Force a minimal prefund value
        info.prefund = prefundOverride;

        // For testing purposes, approximate preOpGas using preVerificationGas
        info.preOpGas = op.preVerificationGas;

        // Execute the normal `_executeUserOp` flow
        return _executeUserOp(0, op, info);
    }

    /**
     * @dev Test helper that forces the `INNER_OUT_OF_GAS` execution path.
     *
     * Conditions required to hit this branch:
     *  - No paymaster involved.
     *  - Extremely large `callGasLimit`, ensuring the internal call runs out of gas.
     *  - CallData can be empty (the account call is irrelevant for this test).
     *
     * This method sets up just enough of `UserOpInfo` to reach the OOG branch,
     * without performing validation or prefund accounting.
     */
    function executeUserOpForceOOG(
        PackedUserOperation calldata op,
        uint256 callGasLimit
    ) external {
        UserOpInfo memory info;

        // Force a huge callGasLimit and ensure no paymaster is used
        info.mUserOp.callGasLimit = callGasLimit;
        info.mUserOp.paymasterPostOpGasLimit = 0;
        info.mUserOp.paymaster = address(0);

        // No need to set userOpHash, prefund, or preOpGas:
        // these are unused in the OOG failure branch.

        _executeUserOp(0, op, info);
    }
}
