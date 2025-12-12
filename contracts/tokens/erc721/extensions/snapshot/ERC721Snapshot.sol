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

import {ERC721InternalCommon} from '../ERC721InternalCommon.sol';
import {IERC721Snapshot} from './IERC721Snapshot.sol';
import {_SNAPSHOT_ROLE} from '../../../../constants/roles.sol';

/// @title ERC721Snapshot
/// @notice Implements snapshot mechanism for ERC721 tokens
/// @dev Inherits from IERC721Snapshot and ERC721SnapshotInternal
abstract contract ERC721Snapshot is IERC721Snapshot, ERC721InternalCommon {
    /**
     * @notice Creates a new snapshot.
     * @dev Only callable by accounts with the snapshot role.
     *      Emits a Snapshot event.
     */
    function snapshot()
        external
        override
        whenNotPaused
        onlyRole(_SNAPSHOT_ROLE)
    {
        _snapshot();
    }

    /**
     * @notice Retrieves the balance of an account at the specified snapshot ID.
     * @param account The address of the account whose balance is being queried.
     * @param snapshotId The ID of the snapshot to query.
     * @return The balance of the specified account at the queried snapshot ID.
     */
    function balanceOfAt(
        address account,
        uint256 snapshotId
    ) external view override returns (uint256) {
        return _balanceOfAt(account, snapshotId);
    }

    /**
     * @notice Retrieves the total token supply at the specified snapshot ID.
     * @param snapshotId The ID of the snapshot to query.
     * @return The total token supply at the queried snapshot ID.
     */
    function totalSupply(
        uint256 snapshotId
    ) external view override returns (uint256) {
        return _totalSupplyAt(snapshotId);
    }

    /**
     * @notice Retrieves the owner of a token at the specified snapshot ID.
     * @param tokenId The ID of the token whose owner is being queried.
     * @param snapshotId The ID of the snapshot to query.
     * @return The owner of the specified token at the queried snapshot ID.
     */
    function ownerOfAt(
        uint256 tokenId,
        uint256 snapshotId
    ) external view override returns (address) {
        return _ownerOfAt(tokenId, snapshotId);
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
        interfaces_[--interfacesLength] = type(IERC721Snapshot).interfaceId;
    }
}
