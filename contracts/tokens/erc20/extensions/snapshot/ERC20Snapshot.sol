// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Snapshot} from './IERC20Snapshot.sol';
import {_SNAPSHOT_ROLE} from '../../../../constants/roles.sol';

/// @title ERC20Snapshot
/// @notice Implements snapshot mechanism
/// @dev Inherits from IERC20Snapshot and ERC20InternalCommon
abstract contract ERC20Snapshot is IERC20Snapshot, ERC20InternalCommon {
    function snapshot()
        external
        override
        whenNotPaused
        onlyRole(_SNAPSHOT_ROLE)
    {
        _snapshot();
    }

    function balanceOfAt(
        address account,
        uint256 snapshotId
    ) external view override returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _erc20SnapshotStorage().accountBalanceSnapshots[account]
        );

        return snapshotted ? value : _balanceOf(account);
    }

    function totalSupplyAt(
        uint256 snapshotId
    ) external view override returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
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
