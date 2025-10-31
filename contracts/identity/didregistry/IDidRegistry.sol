// SPDX-License-Identifier: UNLICENSED
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
