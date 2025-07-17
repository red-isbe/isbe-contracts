// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ERC1967Proxy
} from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';

contract IsbeERC1967Proxy is ERC1967Proxy {
    constructor(address _logic) payable ERC1967Proxy(_logic, '') {}
}
