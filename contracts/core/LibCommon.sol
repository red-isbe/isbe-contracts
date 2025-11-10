// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

library LibCommon {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    function getFromSet(
        EnumerableSet.Bytes32Set storage _set,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view returns (bytes32[] memory items_) {
        uint256 listCount = _set.length();
        (uint256 start, uint256 end) = getStartAndEnd(_pageIndex, _pageLength);

        items_ = new bytes32[](getSize(start, end, listCount));

        for (uint256 i = 0; i < items_.length; i++) {
            items_[i] = _set.at(start + i);
        }
    }

    function getFromSet(
        EnumerableSet.AddressSet storage _set,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view returns (address[] memory items_) {
        uint256 listCount = _set.length();
        (uint256 start, uint256 end) = getStartAndEnd(_pageIndex, _pageLength);

        items_ = new address[](getSize(start, end, listCount));

        for (uint256 i = 0; i < items_.length; i++) {
            items_[i] = _set.at(start + i);
        }
    }

    function getFromSet(
        EnumerableSet.UintSet storage _set,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view returns (uint256[] memory items_) {
        (uint256 current, uint256 end) = getStartAndEnd(
            _pageIndex,
            _pageLength
        );
        uint256 size = getSize(current, end, _set.length());

        items_ = new uint256[](size);

        for (uint256 i; i < size; ) {
            items_[i] = _set.at(current);
            unchecked {
                ++i;
                ++current;
            }
        }
    }

    function getSize(
        uint256 _start,
        uint256 _end,
        uint256 _listCount
    ) internal pure returns (uint256) {
        if (_start >= _listCount) {
            return 0;
        }

        if (_end > _listCount) {
            _end = _listCount;
        }

        return _end - _start;
    }

    function getStartAndEnd(
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal pure returns (uint256 start_, uint256 end_) {
        start_ = _pageIndex * _pageLength;
        end_ = start_ + _pageLength;
    }

    function getPaginationParameters(
        uint256 _total,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        pure
        returns (
            uint256 cursor_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        unchecked {
            // Single division con ceil optimizado
            uint256 lastPage = (_total + _pageSize - 1) / _pageSize;

            cursor_ = (_page - 1) * _pageSize;

            // Evitar branch para howMany_
            uint256 remainingItems = _total > cursor_ ? _total - cursor_ : 0;
            howMany_ = remainingItems > _pageSize ? _pageSize : remainingItems;

            // Operaciones sin branches
            next_ = _page + ((_page < lastPage) ? 1 : (lastPage - _page));
            prev_ = _page - ((_page > 1) ? 1 : (_page - 1));
        }
    }
}
