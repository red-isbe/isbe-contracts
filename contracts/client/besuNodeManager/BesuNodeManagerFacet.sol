// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

import {BesuNodeManagerCommon} from './internal/BesuNodeManagerCommon.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_BESU_NODE_MANAGER_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IValidatorManager} from './internal/validators/IValidatorManager.sol';
import {IBootNodeManager} from './internal/bootnodes/IBootNodeManager.sol';
import {IExecutionNodeManager} from './internal/executionnodes/IExecutionNodeManager.sol';
import {IBesuNodeManagerCommon} from './internal/IBesuNodeManagerCommon.sol';

/// @title BesuNodeManagerFacet
/// @notice Diamond facet for comprehensive Besu node management
/// @dev Concrete facet inheriting from:
///      - BesuNodeManagerCommon (combines all manager facades + implementations)
///      - DidDocumentDetailedInternal (provides DID document functionality)
///      - IEIP2535Introspection (provides Diamond introspection)
///      All facade functions with RBAC already defined in manager facades
contract BesuNodeManagerFacet is BesuNodeManagerCommon, IEIP2535Introspection {
    /// @notice Returns the business ID for this facet
    /// @dev Used by the Diamond pattern for facet identification and routing
    /// @return The resolver key for BesuNodeManager (keccak256('BESU_NODE_MANAGER'))
    function businessIdIntrospection() external pure returns (bytes32) {
        return _BESU_NODE_MANAGER_RESOLVER_KEY;
    }

    /// @notice Returns the implemented interfaces
    /// @dev Used for EIP-165 interface detection
    /// @return interfaces_ Array of supported interface IDs
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = _implementedInterfaces();
    }

    /// @notice Returns all function selectors implemented by this facet
    /// @dev Required by IEIP2535Introspection
    /// @return selectors_ Array of function selectors
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 index = 28;
        selectors_ = new bytes4[](index);
        // Validator functions (11)
        selectors_[--index] = this.addValidator.selector;
        selectors_[--index] = this.addValidatorStandby.selector;
        selectors_[--index] = this.promoteValidator.selector;
        selectors_[--index] = this.standbyValidator.selector;
        selectors_[--index] = this.quarantineValidator.selector;
        selectors_[--index] = this.unquarantineValidator.selector;
        selectors_[--index] = this.removeValidator.selector;
        selectors_[--index] = this.getValidatorState.selector;
        selectors_[--index] = this.isValidator.selector;
        selectors_[--index] = this.getTotalValidators.selector;
        selectors_[--index] = this.getPaginatedValidators.selector;
        // BootNode functions (8)
        selectors_[--index] = this.addBootNode.selector;
        selectors_[--index] = this.quarantineBootNode.selector;
        selectors_[--index] = this.unquarantineBootNode.selector;
        selectors_[--index] = this.removeBootNode.selector;
        selectors_[--index] = this.getBootNodeState.selector;
        selectors_[--index] = this.isBootNode.selector;
        selectors_[--index] = this.getTotalBootNodes.selector;
        selectors_[--index] = this.getPaginatedBootNodes.selector;
        // ExecutionNode functions (8)
        selectors_[--index] = this.addExecutionNode.selector;
        selectors_[--index] = this.quarantineExecutionNode.selector;
        selectors_[--index] = this.unquarantineExecutionNode.selector;
        selectors_[--index] = this.removeExecutionNode.selector;
        selectors_[--index] = this.getExecutionNodeState.selector;
        selectors_[--index] = this.isExecutionNode.selector;
        selectors_[--index] = this.getTotalExecutionNodes.selector;
        selectors_[--index] = this.getPaginatedExecutionNodes.selector;
        // Common function (1)
        selectors_[--index] = this.getNode.selector;
    }

    /// @notice Internal function to return implemented interfaces
    /// @dev Returns the IBesuNodeManager interface ID
    ///      IBesuNodeManager includes all specialized interfaces via inheritance
    /// @return interfaces_ Array of supported interface IDs
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 index = 4;
        interfaces_ = new bytes4[](index);
        interfaces_[--index] = type(IValidatorManager).interfaceId;
        interfaces_[--index] = type(IBootNodeManager).interfaceId;
        interfaces_[--index] = type(IExecutionNodeManager).interfaceId;
        interfaces_[--index] = type(IBesuNodeManagerCommon).interfaceId;
    }
}
