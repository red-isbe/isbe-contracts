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

import {IValidatorManager} from './internal/validators/IValidatorManager.sol';
import {IBootNodeManager} from './internal/bootnodes/IBootNodeManager.sol';
import {IExecutionNodeManager} from './internal/executionnodes/IExecutionNodeManager.sol';
import {IBesuNodeManagerCommon} from './internal/IBesuNodeManagerCommon.sol';

/**
 * @title IBesuNodeManager
 * @notice Unified interface for managing Hyperledger Besu network nodes
 * @dev Inherits from all specialized interfaces:
 *      - IValidatorManager (validator lifecycle and queries)
 *      - IBootNodeManager (boot node lifecycle and queries)
 *      - IExecutionNodeManager (execution node lifecycle and queries)
 *      - IBesuNodeManagerCommon (cross-category utility: getNode)
 *      All types (enums, structs, errors) are defined in Types library
 *      All functions, events, and pagination inherited from specialized interfaces
 */
// solhint-disable-next-line no-empty-blocks
interface IBesuNodeManager is
    IValidatorManager,
    IBootNodeManager,
    IExecutionNodeManager,
    IBesuNodeManagerCommon
{}
