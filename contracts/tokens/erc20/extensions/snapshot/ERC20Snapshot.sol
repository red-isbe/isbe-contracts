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

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
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
        emit Snapshot(_snapshot());
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
