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

import {
    _TIMESTAMPING_REGISTRY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {TimeStampingRegistry} from './TimeStampingRegistry.sol';
import {ITimeStampingRegistry} from './ITimeStampingRegistry.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title TimeStampingRegistryFacet
/// @notice Diamond facet implementing timestamping registry with EIP712 support and originalHash primary key
/// @dev Provides external interface for TSR operations within the diamond architecture.
///      Inherits from TimeStampingRegistry and implements IEIP2535Introspection for
///      diamond introspection capabilities with optimized storage for originalHash queries
/// @author ISBE Team
/// @custom:security-level 3
/// @custom:auditor ISBE Security Team
contract TimeStampingRegistryFacet is
    TimeStampingRegistry,
    IEIP2535Introspection
{
    /// @notice Returns the implemented interfaces for this facet
    /// @dev Implements IEIP2535Introspection interface for diamond compatibility
    /// @return interfaces_ Array of supported interface IDs
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /// @notice Returns the business ID for this facet
    /// @dev Returns the resolver key used to identify this facet in the diamond
    /// @return businessId_ The resolver key for this facet
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _TIMESTAMPING_REGISTRY_RESOLVER_KEY;
    }

    /// @notice Returns the function selectors supported by this facet
    /// @dev Implements IEIP2535Introspection to return all function selectors for TSR operations
    /// @return selectors_ Array of function selectors supported by this facet
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 8;
        selectors_ = new bytes4[](selectorsLength);

        // Core timestamping functions
        selectors_[--selectorsLength] = ITimeStampingRegistry.stamp.selector;
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .stampWithSignature
            .selector;

        // View functions for hash checking
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .isOriginalHashRegistered
            .selector;
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .isTsaHashRegistered
            .selector;
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .isExternalReferenceIdRegistered
            .selector;

        // Data retrieval functions
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .getTsrRecordFromOriginalHash
            .selector;
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .getStampedSize
            .selector;
        selectors_[--selectorsLength] = ITimeStampingRegistry
            .getPaginatedStamped
            .selector;
    }
}
