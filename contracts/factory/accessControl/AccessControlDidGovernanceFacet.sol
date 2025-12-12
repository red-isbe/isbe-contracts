// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
