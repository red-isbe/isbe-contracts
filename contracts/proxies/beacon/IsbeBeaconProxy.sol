// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    BeaconProxy
} from '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

// solhint-disable-next-line
contract IsbeBeaconProxy is BeaconProxy {
    constructor(address beacon) BeaconProxy(beacon, '') {}
}
