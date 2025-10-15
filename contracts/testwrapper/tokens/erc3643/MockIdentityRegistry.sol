// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract MockIdentityRegistry {
    address public lastIdentity;
    mapping(address => bool) private _verified;

    event SetIdentity(address identity);

    function setIdentity(address identity) external {
        lastIdentity = identity;
        emit SetIdentity(identity);
    }

    function setIsVerified(address account, bool verified) external {
        _verified[account] = verified;
    }

    function isVerified(address account) external view returns (bool) {
        return _verified[account];
    }
}
