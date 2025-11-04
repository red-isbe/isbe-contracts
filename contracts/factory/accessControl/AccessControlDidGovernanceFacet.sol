// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControlDidFacet} from '../../access/accessControl/AccessControlDidFacet.sol';

/// @title AccessControlDidGovernanceFacet
/// @notice DID Access Control facet for governance Diamonds (EIP2535AccessControl)
/// @dev Uses internal _didOf method for DID resolution within the same Diamond
///      This facet is used in governance Diamonds where DidRegistry is part of the same Diamond structure
contract AccessControlDidGovernanceFacet is AccessControlDidFacet {
    // solhint-disable-next-line no-empty-blocks
    function _checkProtectISBERole(bytes32 _role) internal pure override {}
}
