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

import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_RESOLVER_KEY, CounterFacetInternal} from './CounterFacetInternal.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../../constants/roles.sol';
import {_INITIALIZABLE_STORAGE_POSITION} from '../../../constants/storagePositions.sol';
uint256 constant _COUNTER_FACET_VERSION = 2;

contract CounterV2FacetTestWrapper is
    CounterFacetInternal,
    IEIP2535Introspection
{
    constructor() {
        _disableInitializers(_RESOLVER_KEY);
    }

    function initializeCounter(
        uint256 _startingValue
    ) external initializer(_RESOLVER_KEY, _COUNTER_FACET_VERSION) {
        _counterStorage().counter = _startingValue;
    }

    function badInitializer() external initializer(_RESOLVER_KEY, 0) {
        _counterStorage().counter = type(uint256).max;
    }

    function reinitializeCounter(
        uint256 _restartingValue
    )
        external
        reinitializer(_RESOLVER_KEY, _COUNTER_FACET_VERSION)
        onlyRole(_DEFAULT_ADMIN_ROLE)
    {
        _counterStorage().counter = _restartingValue;
    }

    function increment(
        uint256 _amount
    )
        external
        whenNotPaused
        onlyRole(_DEFAULT_ADMIN_ROLE)
        onlyBeforeVersion(_RESOLVER_KEY, _COUNTER_FACET_VERSION)
    {
        _counterStorage().counter += _amount;
    }

    function decrement(
        uint256 _amount
    )
        external
        whenNotPaused
        onlyRole(_DEFAULT_ADMIN_ROLE)
        onlyAfterVersion(_RESOLVER_KEY, _COUNTER_FACET_VERSION)
    {
        _counterStorage().counter -= _amount;
    }

    function setVersion(
        uint256 version
    ) external whenNotPaused onlyRole(_DEFAULT_ADMIN_ROLE) {
        _initStorage().initialized[_RESOLVER_KEY] = version;
    }

    function counter() external view returns (uint256) {
        return _counterStorage().counter;
    }

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
        businessId_ = _RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 7;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeCounter.selector;
        selectors_[--selectorsLength] = this.badInitializer.selector;
        selectors_[--selectorsLength] = this.reinitializeCounter.selector;
        selectors_[--selectorsLength] = this.increment.selector;
        selectors_[--selectorsLength] = this.counter.selector;
        selectors_[--selectorsLength] = this.decrement.selector;
        selectors_[--selectorsLength] = this.setVersion.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IEIP2535Introspection).interfaceId;
    }

    /**
     * @dev Returns the storage pointer for InitializableStorage.
     * @return storage_ The storage struct at the designated position
     */
    function _initStorage()
        private
        pure
        returns (InitializableStorage storage storage_)
    {
        bytes32 position = _INITIALIZABLE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
