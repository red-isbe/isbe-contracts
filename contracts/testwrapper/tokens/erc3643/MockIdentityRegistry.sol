// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
contract MockIdentityRegistry {
    address public lastIdentity;
    event SetIdentity(address identity);
    function setIdentity(address identity) external {
        lastIdentity = identity;
        emit SetIdentity(identity);
    }
}
