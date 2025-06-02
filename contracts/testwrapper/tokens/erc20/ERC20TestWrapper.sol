// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ERC20Burnable
} from '../../../tokens/erc20/extensions/ERC20Burnable.sol';
import {ERC20Capped} from '../../../tokens/erc20/extensions/ERC20Capped.sol';
import {
    ERC20PausableInternal
} from '../../../tokens/erc20/extensions/ERC20PausableInternal.sol';
import {ERC20Internal} from '../../../tokens/erc20/ERC20Internal.sol';

// solhint-disable-next-line
contract ERC20TestWrapper is ERC20Burnable, ERC20Capped, ERC20PausableInternal {
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
    ) internal virtual override(ERC20Internal, ERC20PausableInternal) {
        ERC20PausableInternal._beforeTokenTransfer(from, to, amount);
    }
}
