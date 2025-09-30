// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract MockCompliance {
    address public lastToken;
    event Bound(address token);
    function bindToken(address token) external {
        lastToken = token;
        emit Bound(token);
    }
}
