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

/* solhint-disable reason-string */
/* solhint-disable gas-custom-errors */

import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {ISmartAccount} from '../../accountabstraction/smartaccount/ISmartAccount.sol';

contract SmartAccountMock is ISmartAccount {
    uint256 public validateUserOpCalls;
    uint256 public executeCalls;

    error SmartAccountMockRevert();

    receive() external payable {}

    fallback() external payable {
        executeCalls++;
    }

    function validateUserOp(
        PackedUserOperation calldata,
        bytes32,
        uint256
    ) external override returns (uint256 validationData) {
        validateUserOpCalls++;
        return 0;
    }

    function execute(address, uint256, bytes calldata) external override {
        executeCalls++;
    }

    function executeReverts(address, uint256, bytes calldata) external pure {
        revert SmartAccountMockRevert();
    }

    function executeRevertsWithoutReason(
        address,
        uint256,
        bytes calldata
    ) external pure {
        revert();
    }
}
