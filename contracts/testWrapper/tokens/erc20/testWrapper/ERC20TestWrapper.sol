// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ERC20Burnable
} from '../../../../tokens/erc20/extensions/ERC20Burnable.sol';
import {ERC20Capped} from '../../../../tokens/erc20/extensions/ERC20Capped.sol';
import {
    ERC20Snapshot
} from '../../../../tokens/erc20/extensions/ERC20Snapshot.sol';
import {
    ERC20SnapshotInternal
} from '../../../../tokens/erc20/extensions/ERC20SnapshotInternal.sol';
import {ERC20Internal} from '../../../../tokens/erc20/ERC20Internal.sol';

contract ERC20TestWrapper is ERC20Burnable, ERC20Capped, ERC20Snapshot {
    function snapshot() external returns (uint256) {
        return _snapshot();
    }

    function _mint(
        address account,
        uint256 amount
    ) internal virtual override(ERC20Capped, ERC20Internal) {
        ERC20Capped._mint(account, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20SnapshotInternal, ERC20Internal) {
        ERC20SnapshotInternal._beforeTokenTransfer(from, to, amount);
    }
}
