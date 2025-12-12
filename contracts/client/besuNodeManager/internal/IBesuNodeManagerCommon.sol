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
pragma solidity 0.8.28;

import {NodeDTO} from './core/Types.sol';

/// @title IBesuNodeManagerCommon
/// @notice Interface for cross-category BesuNodeManager utility functions
/// @dev Provides functions that operate across all node categories (validators, boot nodes, execution nodes)
interface IBesuNodeManagerCommon {
    /**
     * @notice Returns the NodeDTO for a given ID across all categories
     * @dev Searches across validators, boot nodes, and execution nodes
     *      Returns the complete node information including nodeId, enode, and timestamp
     * @param nodeId The unique identifier of the node (keccak256 of enode)
     * @return node The NodeDTO containing nodeId, enode, and timestamp
     */
    function getNode(bytes32 nodeId) external view returns (NodeDTO memory);
}
