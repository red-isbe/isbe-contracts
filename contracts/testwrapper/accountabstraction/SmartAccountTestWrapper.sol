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
    SmartAccountInternal
} from '../../accountabstraction/smartaccount/SmartAccountInternal.sol';
import {IEntryPoint} from '../../accountabstraction/entrypoint/IEntryPoint.sol';
import {
    PackedUserOperation
} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';

contract SmartAccountTestWrapper is SmartAccountInternal {
    event UserOpValidated(uint256 result);

    error SmartAccountTestWrapper_DummyError();

    function initializeSmartAccount(
        IEntryPoint entryPoint,
        address owner
    ) external addressIsNotZero(address(entryPoint)) {
        _initializeSmartAccount(entryPoint);
        _transferOwnership(owner);
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external {
        uint256 result = _validateUserOp(
            userOp,
            userOpHash,
            missingAccountFunds
        );
        emit UserOpValidated(result);
    }

    function dummyFunction(bool success) external pure {
        if (!success) {
            revert SmartAccountTestWrapper_DummyError();
        }
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    // solhint-disable-next-line no-empty-blocks
    {

    }
}
