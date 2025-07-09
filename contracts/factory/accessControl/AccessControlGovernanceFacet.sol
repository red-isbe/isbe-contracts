// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    AccessControlFacet
} from '../../access/accessControl/AccessControlFacet.sol';

contract AccessControlGovernanceFacet is AccessControlFacet {
    // solhint-disable-next-line no-empty-blocks
    function _protectISBERole(bytes32 _role) internal pure override {}
}
