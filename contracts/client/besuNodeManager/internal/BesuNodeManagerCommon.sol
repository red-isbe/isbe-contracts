// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

import {IBesuNodeManagerCommon} from './IBesuNodeManagerCommon.sol';
import {NodeDTO} from './core/Types.sol';
import {BesuNodeManagerCommonInternal} from './BesuNodeManagerCommonInternal.sol';

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
