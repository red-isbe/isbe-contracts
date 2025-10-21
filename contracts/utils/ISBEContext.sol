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
     * @notice Emitted when a uint256 value is zero but is expected to be greater than zero
     */
    error EmptyUint();

    /**
     * @notice Emitted when a string is empty but is expected to contain text
     */
    error EmptyString();

    /**
     * @notice Emitted when date validation fails due to invalid chronological ordering
     * @param _before The earlier timestamp that should precede the later one
     * @param _after The later timestamp that should follow the earlier one
     */
    error InvalidDates(uint256 _before, uint256 _after);

    /**
     * @notice Raised when a function is called that has not been implemented.
     * @dev This is useful in fallback functions or as a placeholder to prevent
     * the execution of incomplete or abstract functionality.
     */
    error UnimplementedMethod();

    /**
     * @notice Emitted when two values are expected to have the same length but differ
     * @param a The length of the first value
     * @param b The length of the second value
     */
    error NotSameLength(uint256 a, uint256 b);

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

    function _blockChainId() internal view virtual returns (uint256) {
        return block.chainid;
    }

    /**
     * @notice Checks that a given address is not the zero address.
     * @dev Reverts with `AddressZero` error if the condition is not met.
     * This is an internal helper function intended to be used like a modifier.
     * @param _addr The address to check.
     */
    function _checkAddressIsNotZero(address _addr) internal pure {
        require(_isNotEmptyAddress(_addr), AddressZero(_addr));
    }

    /**
     * @notice Checks that a `bytes32` value is not empty (all zeros).
     * @dev Reverts with `EmptyBytes32` error if the condition is not met.
     * @param _hash The `bytes32` value to check.
     */
    function _checkBytes32IsNotZero(bytes32 _hash) internal pure {
        require(_isNotEmptyBytes32(_hash), EmptyBytes32());
    }

    /**
     * @notice Validates that the provided uint256 value is not zero
     * @dev Internal validation function that reverts with EmptyUint error if the
     *      value is zero. Used for quantity and amount validation
     * @param _uint The uint256 value to validate for non-zero content
     */
    function _checkUintIsNotZero(uint256 _uint) internal pure {
        require(_uint != 0, EmptyUint());
    }

    /**
     * @notice Validates that the provided bytes array is not empty
     * @dev Internal validation function that reverts with EmptyBytes error if the
     *      array length is zero. Used for data payload validation
     * @param _code The bytes array to validate for non-empty content
     */
    function _checkEmptyBytes(bytes memory _code) internal pure {
        require(_code.length != 0, EmptyBytes());
    }

    /**
     * @notice Validates that two values have identical length
     * @dev Internal validation function that reverts with NotSameLength error if the
     *      values differ. Essential for parallel array operations
     * @param _a The first value's length to compare
     * @param _b The second value's length to compare
     */
    function _checkSameLength(uint256 _a, uint256 _b) internal pure {
        require(_a == _b, NotSameLength(_a, _b));
    }

    /**
     * @notice Validates that the provided string is not empty
     * @dev Internal validation function that reverts with EmptyString error if the
     *      string has zero length when encoded. Used for text content validation
     * @param _string The string to validate for non-empty content
     */
    function _checkEmptyString(string memory _string) internal pure {
        require(!_isEmptyString(_string), EmptyString());
    }

    /**
     * @notice Compares two strings for exact equality
     * @dev Internal utility function using keccak256 hash comparison for efficient
     *      string matching. Handles strings of different lengths correctly
     * @param a The first string to compare
     * @param b The second string to compare
     * @return isEqual_ True if strings are identical, false otherwise
     */
    function _equalStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return _equalBytes(abi.encodePacked(a), abi.encodePacked(b));
    }

    /**
     * @notice Compares two bytes arrays for exact equality
     * @dev Internal utility function using length check followed by keccak256 hash
     *      comparison for efficient bytes matching. Optimised for different lengths
     * @param a The first bytes array to compare
     * @param b The second bytes array to compare
     * @return isEqual_ True if bytes arrays are identical, false otherwise
     */
    function _equalBytes(
        bytes memory a,
        bytes memory b
    ) internal pure returns (bool) {
        return a.length == b.length ? keccak256(a) == keccak256(b) : false;
    }

    /**
     * @notice Validates chronological ordering of two timestamps
     * @dev Internal validation function that reverts with InvalidDates error if the
     *      after timestamp is before the before timestamp. Ensures temporal consistency
     * @param _before The earlier timestamp that should precede the later one
     * @param _after The later timestamp that should follow the earlier one
     */
    function _checkValidDates(uint256 _before, uint256 _after) internal pure {
        require(_after >= _before, InvalidDates(_before, _after));
    }

    function _isEmptyString(
        string memory _string
    ) internal pure returns (bool) {
        return abi.encodePacked(_string).length == 0;
    }

    function _isNotEmptyBytes32(bytes32 _hash) internal pure returns (bool) {
        return _hash != bytes32(0);
    }

    function _isNotEmptyAddress(address _addr) internal pure returns (bool) {
        return _addr != address(0);
    }

    function _isNotEmptySignature(bytes4 _sig) internal pure returns (bool) {
        return _sig != bytes4(0);
    }
}
