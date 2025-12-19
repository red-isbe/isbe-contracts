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

/* solhint-disable gas-custom-errors */
/* solhint-disable no-inline-assembly */

import {IEntryPoint} from '@account-abstraction/contracts/interfaces/IEntryPoint.sol';
import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';

/**
 * @title Validation Account Mock
 * @notice Test helper that simulates a smart account for ERC-4337 flows and
 *         returns crafted validationData to exercise EntryPoint code paths.
 * @dev Purpose-built for unit/integration tests. It can:
 *      - Force validation revert.
 *      - Signal signature failure bit.
 *      - Set validAfter/validUntil windows.
 *      - Provide an aggregator address in validationData.
 *      When EntryPoint reports missingAccountFunds, it self-deposits to cover it.
 *      Not intended for production usage.
 * @author ISBE Development Team
 */
contract ValidationAccountMock {
    /**
     * @notice Configuration used to compose validationData in tests.
     * @param validationShouldRevert When true, validation reverts to emulate failure.
     * @param sigFailed Sets the high-bit flag to mark signature verification failure.
     * @param validUntil Last timestamp at which the op remains valid (0 = indefinite).
     * @param validAfter First timestamp from which the op becomes valid.
     * @param aggregator Optional aggregator address encoded into validationData.
     */
    struct ValidationData {
        bool validationShouldRevert;
        bool validationShouldReturnBadData;
        bool sigFailed;
        uint48 validUntil;
        uint48 validAfter;
        address aggregator;
    }

    /**
     * @notice EntryPoint used to invoke validation and execution.
     * @dev Immutable reference set at construction.
     */
    IEntryPoint public immutable ENTRY_POINT;

    /**
     * @notice Current validation configuration used to pack validationData.
     * @dev Read in tests to assert configured windows and flags.
     */
    ValidationData public config;

    /**
     * @notice Deploys the mock with a fixed EntryPoint and owner.
     * @dev Does not perform ERC-165 checks; the test harness must supply a
     *      conforming EntryPoint instance or a stub with the same interface.
     * @param _entryPoint The EntryPoint contract interacting with this mock.
     */
    constructor(IEntryPoint _entryPoint) {
        ENTRY_POINT = _entryPoint;
    }

    /**
     * @notice Accepts Ether sent directly to the mock.
     * @dev Used in tests to fund deposits via EntryPoint calls.
     */
    receive() external payable {}

    /**
     * @notice EntryPoint callback that returns the packed validationData.
     * @dev Caller MUST be the configured EntryPoint. If configured to revert,
     *      it reverts to simulate validation failure. If EntryPoint signals
     *      missingAccountFunds, the mock deposits the requested value to itself.
     * @param userOp The packed user operation (unused by this mock).
     * @param userOpHash The user operation hash (unused by this mock).
     * @param missingAccountFunds Amount the EntryPoint requests to be deposited.
     * @return validationData Encoded flags and time-range as per ERC-4337 rules.
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external payable returns (uint256 validationData) {
        (userOp, userOpHash);

        if (config.validationShouldRevert) {
            revert('Validation Failed');
        }

        // force bad return data
        if (config.validationShouldReturnBadData) {
            assembly {
                return(0, 0)
            } // returndatasize = 0
        }

        if (missingAccountFunds > 0) {
            ENTRY_POINT.depositTo{value: missingAccountFunds}(address(this));
        }

        return _packValidationData(config);
    }

    /**
     * @notice Executes a call as instructed by the EntryPoint.
     * @dev Caller MUST be the EntryPoint. Performs a low-level call and
     *      reverts if the target call fails. Ether can be forwarded.
     * @param target The destination address to call.
     * @param value Ether value to forward with the call.
     * @param data Calldata to pass to the target.
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external {
        (bool success, ) = target.call{value: value}(data);
        require(success, 'execute failed');
    }

    /**
     * @notice Updates the validation configuration used by validateUserOp.
     * @dev Restricted to the test owner. Overwrites the entire config struct.
     * @param validationShouldRevert If true, validation will revert.
     * @param sigFailed If true, sets the signature-failed bit in validationData.
     * @param validUntil Last valid timestamp (0 means no upper bound).
     * @param validAfter First valid timestamp.
     * @param aggregator Aggregator address encoded into validationData.
     */
    function setValidationData(
        bool validationShouldRevert,
        bool validationShouldReturnBadData,
        bool sigFailed,
        uint48 validUntil,
        uint48 validAfter,
        address aggregator
    ) external {
        config = ValidationData(
            validationShouldRevert,
            validationShouldReturnBadData,
            sigFailed,
            validUntil,
            validAfter,
            aggregator
        );
    }

    /**
     * @notice Packs ValidationData into the ERC-4337 validationData format.
     * @dev Bit layout:
     *      - bit 255: signature failure flag (1 means failed).
     *      - bits 0..159: aggregator address.
     *      - bits 160..207: validUntil (uint48).
     *      - bits 208..255: validAfter (uint48).
     * @param data The configuration to pack.
     * @return packed The packed uint256 used as validationData.
     */
    function _packValidationData(
        ValidationData memory data
    ) internal pure returns (uint256 packed) {
        uint256 _packed;
        if (data.sigFailed) {
            _packed |= (1 << 255);
        }
        _packed |= uint256(uint160(data.aggregator));
        _packed |= uint256(data.validUntil) << 160;
        _packed |= uint256(data.validAfter) << (160 + 48);
        return _packed;
    }
}
