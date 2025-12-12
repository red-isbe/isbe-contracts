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

import {IClientFiltering} from './IClientFiltering.sol';
import {ClientFilteringInternal} from './ClientFilteringInternal.sol';
import {_CLIENT_FILTERING_ROLE} from '../../constants/roles.sol';

abstract contract ClientFiltering is IClientFiltering, ClientFilteringInternal {
    function registerFilter(
        Filter calldata _filter
    )
        external
        override
        bytes32IsNotZero(_filter.filterId)
        validateFilter(_filter)
        onlyUniqueFilterId(_filter.filterId)
        whenNotPaused
        onlyRole(_CLIENT_FILTERING_ROLE)
    {
        _registerFilter(_filter);
        emit FilterRegistered(
            _filter.filterId,
            _filter.filterType,
            _filter.transactionHash,
            _filter.contractAddress,
            _filter.signature,
            _filter.jsonRpcMethod,
            _filter.initialBlock,
            _filter.endBlock,
            _filter.disabled
        );
    }

    function updateFilter(
        Filter calldata _filter
    )
        external
        override
        bytes32IsNotZero(_filter.filterId)
        validateFilter(_filter)
        filterExists(_filter.filterId)
        whenNotPaused
        onlyRole(_CLIENT_FILTERING_ROLE)
    {
        _updateFilter(_filter);
        emit FilterUpdated(
            _filter.filterId,
            _filter.filterType,
            _filter.transactionHash,
            _filter.contractAddress,
            _filter.signature,
            _filter.jsonRpcMethod,
            _filter.initialBlock,
            _filter.endBlock,
            _filter.disabled
        );
    }

    function getFiltersLength() external view override returns (uint256) {
        return _getFiltersLength();
    }

    function getFiltersByPage(
        uint256 _pageNumber,
        uint256 _pageSize
    ) external view override returns (Filter[] memory filters_) {
        filters_ = _getFiltersByPage(_pageNumber, _pageSize);
    }

    function isFilterRegistered(
        bytes32 _filterId
    ) external view returns (bool) {
        return _isFilterRegistered(_filterId);
    }
}
