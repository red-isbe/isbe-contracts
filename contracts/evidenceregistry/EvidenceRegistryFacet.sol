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

import {_EVIDENCE_REGISTRY_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {EvidenceRegistry} from './EvidenceRegistry.sol';
import {
    IEIP2535Introspection
} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title EvidenceRegistryFacet
/// @notice Evidence registry facet attributed to entity DIDs or authorised accounts
contract EvidenceRegistryFacet is EvidenceRegistry, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _EVIDENCE_REGISTRY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 10;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.registerEvidence.selector;
        selectors_[--selectorsLength] = this.registerEvidenceWithRole.selector;
        selectors_[--selectorsLength] = this.existsEvidenceByAccount.selector;
        selectors_[--selectorsLength] = this
            .getEvidenceRecordByAccount
            .selector;
        selectors_[--selectorsLength] = this
            .getAccountEvidenceRecordsCount
            .selector;
        selectors_[--selectorsLength] = this.getAccountEvidenceRecords.selector;
        selectors_[--selectorsLength] = this.existsEvidence.selector;
        selectors_[--selectorsLength] = this.getEvidenceRecord.selector;
        selectors_[--selectorsLength] = this.getEvidenceRecordsCount.selector;
        selectors_[--selectorsLength] = this.getEvidenceRecords.selector;
    }
}
