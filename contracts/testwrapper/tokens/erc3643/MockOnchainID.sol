// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract MockOnchainID {
    address public lastOnchainID;
    event SetOnchainID(address onchainID);
    function setOnchainID(address onchainID) external {
        lastOnchainID = onchainID;
        emit SetOnchainID(onchainID);
    }
}
