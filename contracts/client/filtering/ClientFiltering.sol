// SPDX-License-Identifier: UNLICENSED
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
        {
            emit FilterRegistered(
                _filter.filterId,
                _filter.filterType,
                _filter.transactionHash,
                _filter.contractAddress,
                _filter.signature,
                _filter.jsonRpcMethod,
                _filter.initialBlock,
                _filter.endBlock
            );
        }
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
