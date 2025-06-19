// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Context} from '@openzeppelin/contracts/utils/Context.sol';

/**
 * @title ISBEContext
 * @author ISBE
 * @notice Provides context-related utility functions and common validation checks.
 * @dev This abstract contract encapsulates common helper functions for accessing blockchain
 * context information (e.g., block timestamp, message signature) and for performing
 * standard input validation. Making these functions `virtual` allows for easier mocking
 * and testing in derivative contracts. The contract is an extension of the OpenZeppelin `Context` contract.
 */
abstract contract ISBEContext is Context {
    /**
     * @notice Raised when an operation receives the zero address where a valid address is expected.
     * @param addr The address that was found to be zero.
     */
    error AddressZero(address addr);

    /**
     * @notice Raised when a `bytes32` value is empty (i.e., all zeros) but is expected to have a value.
     */
    error EmptyBytes32();

    /**
     * @notice Raised when a `bytes` array is empty but is expected to have content.
     */
    error EmptyBytes();

    /**
     * @notice Raised when a function is called that has not been implemented.
     * @dev This is useful in fallback functions or as a placeholder to prevent
     * the execution of incomplete or abstract functionality.
     */
    error UnimplementedMethod();

    /**
     * @notice Returns the timestamp of the current block.
     * @dev This is a virtual function that wraps `block.timestamp`, allowing it to be
     * overridden in child contracts for testing purposes.
     * @return uint256 The current block timestamp.
     */
    function _blockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    /**
     * @notice Returns the function selector of the current call (`msg.sig`).
     * @dev This is a virtual function that wraps `msg.sig`, allowing it to be
     * overridden in child contracts for testing purposes.
     * @return bytes4 The function selector from the call data.
     */
    function _msgSig() internal view virtual returns (bytes4) {
        return msg.sig;
    }

    /**
     * @notice Checks that a given address is not the zero address.
     * @dev Reverts with `AddressZero` error if the condition is not met.
     * This is an internal helper function intended to be used like a modifier.
     * @param addr The address to check.
     */
    function _addressIsNotZero(address addr) internal pure {
        require(addr != address(0), AddressZero(addr));
    }

    /**
     * @notice Checks that a `bytes32` value is not empty (all zeros).
     * @dev Reverts with `EmptyBytes32` error if the condition is not met.
     * @param hash The `bytes32` value to check.
     */
    function _bytes32IsNotZero(bytes32 hash) internal pure {
        require(hash != bytes32(0), EmptyBytes32());
    }

    /**
     * @notice Checks that a `bytes` array is not empty.
     * @dev Reverts with `EmptyBytes` error if the byte array's length is zero.
     * @param code The `bytes` array to check.
     */
    function _emptyBytes(bytes memory code) internal pure {
        require(code.length != 0, EmptyBytes());
    }
}
