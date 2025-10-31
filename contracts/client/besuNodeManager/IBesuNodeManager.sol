// SPDX-License-Identifier: ISC
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
