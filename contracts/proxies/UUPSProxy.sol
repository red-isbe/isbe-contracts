// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import './ERC1967Proxy.sol';

contract UUPSProxy is ERC1967Proxy {
    constructor(address implementation_) {
        _setImplementation(implementation_);
    }

    function implementation() external view returns (address) {
        return _getImplementation();
    }
}
