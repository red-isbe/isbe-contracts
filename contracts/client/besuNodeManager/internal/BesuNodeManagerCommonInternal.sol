// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

import {ValidatorManager} from './validators/ValidatorManager.sol';
import {BootNodeManager} from './bootnodes/BootNodeManager.sol';
import {ExecutionNodeManager} from './executionnodes/ExecutionNodeManager.sol';
import {NodeDTO} from './core/Types.sol';

/// @title BesuNodeManagerCommonInternal
/// @notice Internal contract combining all specialized managers with facades
/// @dev Inherits from all three facade managers and the common utility layer:
///      - ValidatorManager (validator facade with RBAC declarations)
///      - BootNodeManager (boot node facade with RBAC declarations)
///      - ExecutionNodeManager (execution node facade with RBAC declarations)
///      - BesuNodeManagerCommon (cross-category getNode implementation)
///      Note: This resolves the diamond inheritance by inheriting facades that
///            don't include their own Internal inheritance, while BesuNodeManagerCommon
///            provides the actual Internal implementations
abstract contract BesuNodeManagerCommonInternal is
    ValidatorManager,
    BootNodeManager,
    ExecutionNodeManager
{
    /// @notice Internal function to get a complete NodeDTO for a given nodeId
    /// @dev Searches across all categories (validators, boot nodes, execution nodes)
    ///      Returns NodeDTO with nodeId included for caller convenience
    /// @param nodeId The node ID to query
    /// @return node_ The NodeDTO containing nodeId, enode, and timestamp
    function _getNode(
        bytes32 nodeId
    ) internal view returns (NodeDTO memory node_) {
        return
            !_isNodeRegistered(nodeId)
                ? node_
                : _isValidator(nodeId)
                    ? _getValidatorNode(nodeId)
                    : _isExecutionNode(nodeId)
                        ? _getExecutionNode(nodeId)
                        : _getBootNode(nodeId);
    }
}
