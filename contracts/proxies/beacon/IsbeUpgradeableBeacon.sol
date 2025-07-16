// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {UpgradeableBeacon} from '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol';

// solhint-disable-next-line
contract IsbeUpgradeableBeacon is UpgradeableBeacon {
    constructor(address implementation) UpgradeableBeacon(implementation) {}
}
