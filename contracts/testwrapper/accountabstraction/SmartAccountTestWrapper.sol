// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {SmartAccountInternal} from '../../accountabstraction/smartaccount/SmartAccountInternal.sol';
// TODO: Import our own
import '@account-abstraction/contracts/interfaces/IEntryPoint.sol';
import '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';

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
    {}
}
