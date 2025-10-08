// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../ERC203643InternalCommon.sol';
import {IERC20Snapshot} from './IERC20Snapshot.sol';
import {_SNAPSHOT_ROLE} from '../../../../constants/roles.sol';

/// @title ERC20Snapshot
/// @notice Implements snapshot mechanism
/// @dev Inherits from IERC20Snapshot and ERC203643InternalCommon
abstract contract ERC20Snapshot is IERC20Snapshot, ERC203643InternalCommon {
    function snapshot()
        external
        override
        whenNotPaused
        onlyRole(_SNAPSHOT_ROLE)
    {
        _snapshot();
    }

    function balanceOfAt(
        address _account,
        uint256 _snapshotId
    ) external view override returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            _snapshotId,
            _erc20SnapshotStorage().accountBalanceSnapshots[_account]
        );

        return snapshotted ? value : _balanceOf(_account);
    }

    function totalSupplyAt(
        uint256 _snapshotId
    ) external view override returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            _snapshotId,
            _erc20SnapshotStorage().totalSupplySnapshots
        );

        return snapshotted ? value : _totalSupply();
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20Snapshot).interfaceId;
    }
}
