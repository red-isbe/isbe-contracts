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

import {IAccount} from '@account-abstraction/contracts/interfaces/IAccount.sol';
import {
    IEntryPoint,
    PackedUserOperation
} from '../../accountabstraction/entrypoint/IEntryPoint.sol';

contract MaliciousAccount is IAccount {
    IEntryPoint public immutable ENTRY_POINT;

    // calldata to reenter handleOps
    bytes public reenterCalldata;

    bool public reenterAttempted;
    bool public reenterSucceeded;

    constructor(IEntryPoint _entryPoint) {
        ENTRY_POINT = _entryPoint;
    }

    function setReenterCalldata(bytes calldata data) external {
        reenterCalldata = data;
    }

    function validateUserOp(
        PackedUserOperation calldata,
        bytes32,
        uint256
    ) external virtual returns (uint256 validationData) {
        return 0;
    }

    // main call does not revert but we can check the call failure with reenterSucceeded
    function execute(address, uint256, bytes calldata) external virtual {
        reenterAttempted = true;
        // solhint-disable-next-line avoid-low-level-calls
        (bool ok, ) = address(ENTRY_POINT).call(reenterCalldata);
        reenterSucceeded = ok;
    }
}
