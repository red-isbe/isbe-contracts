// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_CLIENT_FILTERING_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {DidDocumentDetailedInternal} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {IClientFiltering} from './IClientFiltering.sol';

abstract contract ClientFilteringInternal is DidDocumentDetailedInternal {
    struct ClientFilteringStorage {
        IClientFiltering.Filter[] clientFilters;
        mapping(bytes32 => bool) exists;
        mapping(bytes32 => uint256) filterIdPosition;
    }

    modifier validateFilter(IClientFiltering.Filter calldata _filter) {
        _validateFilter(_filter);
        _;
    }

    modifier onlyUniqueFilterId(bytes32 _filterId) {
        _checkFilterUnique(_filterId);
        _;
    }

    modifier filterExists(bytes32 _filterId) {
        _checkFilterExists(_filterId);
        _;
    }

    function _registerFilter(
        IClientFiltering.Filter calldata _newState
    ) internal virtual {
        ClientFilteringStorage storage $ = _clientFilteringStorage();
        $.filterIdPosition[_newState.filterId] = $.clientFilters.length;
        $.clientFilters.push(_newState);
        $.exists[_newState.filterId] = true;
    }

    function _updateFilter(
        IClientFiltering.Filter calldata _newState
    ) internal virtual {
        ClientFilteringStorage storage $ = _clientFilteringStorage();
        uint256 position = $.filterIdPosition[_newState.filterId];
        IClientFiltering.Filter storage stored = $.clientFilters[position];

        stored.filterType = _newState.filterType;
        stored.transactionHash = _newState.transactionHash;
        stored.contractAddress = _newState.contractAddress;
        stored.signature = _newState.signature;
        stored.jsonRpcMethod = _newState.jsonRpcMethod;
        stored.initialBlock = _newState.initialBlock;
        stored.endBlock = _newState.endBlock;
        stored.disabled = _newState.disabled;
    }

    function _getFiltersLength() internal view returns (uint256) {
        return _clientFilteringStorage().clientFilters.length;
    }

    function _getFiltersByPage(
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        virtual
        returns (IClientFiltering.Filter[] memory filters_)
    {
        ClientFilteringStorage storage $ = _clientFilteringStorage();
        (uint256 cursor, uint256 howMany, , ) = LibCommon
            .getPaginationParameters($.clientFilters.length, _page, _pageSize);
        filters_ = new IClientFiltering.Filter[](howMany);
        for (uint256 i; i < howMany; ) {
            filters_[i] = $.clientFilters[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _isFilterRegistered(
        bytes32 _filterId
    ) internal view returns (bool) {
        return _clientFilteringStorage().exists[_filterId];
    }

    function _checkFilterUnique(bytes32 _filterId) private view {
        require(
            !_isFilterRegistered(_filterId),
            IClientFiltering.FilterIdExists(_filterId)
        );
    }

    function _checkFilterExists(bytes32 _filterId) private view {
        require(
            _isFilterRegistered(_filterId),
            IClientFiltering.FilterNotFound(_filterId)
        );
    }

    function _validateFilter(
        IClientFiltering.Filter calldata _filter
    ) private pure {
        require(
            _isValidFilter(_filter),
            IClientFiltering.InvalidFilter(
                _filter.filterId,
                _filter.filterType,
                _filter.transactionHash,
                _filter.contractAddress,
                _filter.signature,
                _filter.jsonRpcMethod,
                _filter.initialBlock,
                _filter.endBlock,
                _filter.disabled
            )
        );
    }

    function _isValidFilter(
        IClientFiltering.Filter calldata _filter
    ) private pure returns (bool) {
        return
            (
                _filter.filterType ==
                    IClientFiltering.FilterType.TRANSACTION_HASH
                    ? _isNotEmptyBytes32(_filter.transactionHash)
                    : _filter.filterType == IClientFiltering.FilterType.CONTRACT
                        ? _isNotEmptyAddress(_filter.contractAddress)
                        : _filter.filterType ==
                            IClientFiltering.FilterType.CONTRACT_AND_SIGNATURE
                            ? _isNotEmptyAddress(_filter.contractAddress) &&
                                _isNotEmptySignature(_filter.signature)
                            : _filter.filterType ==
                                IClientFiltering.FilterType.SIGNATURE
                                ? _isNotEmptySignature(_filter.signature)
                                : _filter.filterType ==
                                    IClientFiltering.FilterType.JSONRPC_METHOD
                                    ? _isNotEmptyBytes32(_filter.jsonRpcMethod)
                                    : false
            ) && _hasValidBlockNumbers(_filter.initialBlock, _filter.endBlock);
    }
    function _hasValidBlockNumbers(
        uint256 _initial,
        uint256 _end
    ) private pure returns (bool) {
        if (_end == 0) return true;
        return _initial < _end;
    }

    /// @notice Returns the storage slot for asset event tracker
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The asset event tracker storage struct
    function _clientFilteringStorage()
        private
        pure
        returns (ClientFilteringStorage storage storage_)
    {
        bytes32 position = _CLIENT_FILTERING_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
