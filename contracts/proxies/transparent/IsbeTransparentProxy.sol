// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    TransparentUpgradeableProxy
} from '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol';

contract IsbeTransparentProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address _admin
    ) TransparentUpgradeableProxy(_logic, _admin, '') {}
}
