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

import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {IDidController} from './interfaces/IDidController.sol';
import {IDidVerificationRelationship} from './interfaces/IDidVerificationRelationship.sol';
import {IDidVerificationMethod} from './interfaces/IDidVerificationMethod.sol';
import {IDidRegistryQuery} from './interfaces/IDidRegistryQuery.sol';

/**
 * @title DID Registry Interface
 * @notice Comprehensive interface for decentralised identifier (DID) registry operations
 * @dev Aggregates all DID management interfaces into a single, unified interface for
 *      complete DID document lifecycle management including controllers, verification
 *      methods, verification relationships and registry query.
 * @author ISBE Development Team
 */
// solhint-disable-next-line no-empty-blocks
interface IDidRegistry is
    IDidDocumentDetailed,
    IDidController,
    IDidVerificationRelationship,
    IDidVerificationMethod,
    IDidRegistryQuery
{}
