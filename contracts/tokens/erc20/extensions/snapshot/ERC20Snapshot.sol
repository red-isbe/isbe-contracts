// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../ERC20InternalCommon.sol';
import {IERC20Snapshot} from './IERC20Snapshot.sol';
import {_SNAPSHOT_ROLE} from '../../../../constants/roles.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

/// @title ERC20Snapshot
/// @notice Implements snapshot mechanism
/// @dev Inherits from IERC20Snapshot and ERC20InternalCommon
abstract contract ERC20Snapshot is
    IERC20Snapshot,
    IERC165,
    ERC20InternalCommon
{
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

    function supportsInterface(
        bytes4 interfaceId
    ) external view virtual override returns (bool) {
        return
            _supportsERC165Interface(interfaceId) ||
            _supportsInterface(interfaceId, _erc20SnapshotInterfaces());
    }

    function _erc20SnapshotInterfaces()
        internal
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20Snapshot).interfaceId;
    }
}
