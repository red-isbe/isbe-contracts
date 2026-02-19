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

import {IBesuNodeManagerCommon} from './IBesuNodeManagerCommon.sol';
import {NodeDTO} from './core/Types.sol';
import {
    BesuNodeManagerCommonInternal
} from './BesuNodeManagerCommonInternal.sol';

/// @title BesuNodeManagerCommon
/// @notice Common contract implementing cross-category utility functions
/// @dev Inherits from all three specialized internal managers to access their storage
///      Provides the getNode() function that searches across all node categories
abstract contract BesuNodeManagerCommon is
    IBesuNodeManagerCommon,
    BesuNodeManagerCommonInternal
{
    /// @inheritdoc IBesuNodeManagerCommon
    function getNode(
        bytes32 nodeId
    ) external view override returns (NodeDTO memory) {
        return _getNode(nodeId);
    }
}
