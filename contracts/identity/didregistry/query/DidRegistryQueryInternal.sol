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

import {DidDocumentDetailedInternal} from '../DidDocumentDetailedInternal.sol';

/// @title DID Registry Query Internal
/// @notice Read helpers shared by the query facet and the modules that resolve DIDs locally
abstract contract DidRegistryQueryInternal is DidDocumentDetailedInternal {
    /**
     * @dev Resolves through the registry-wide address index, which is unique because a
     *      network-curve key cannot be bound to more than one DID (ISBECORE-435).
     */
    function _didOfRelationship(
        address _account,
        string memory _name
    ) internal view returns (bytes32 did_) {
        did_ = _getDidFromAddress(_account);
        if (!_hasActiveRelationship(did_, _name, _account)) return bytes32(0);
    }
}
