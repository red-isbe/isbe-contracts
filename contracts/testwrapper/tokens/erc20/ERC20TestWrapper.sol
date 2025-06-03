// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ERC20Burnable
} from '../../../tokens/erc20/extensions/ERC20Burnable.sol';
import {ERC20Capped} from '../../../tokens/erc20/extensions/ERC20Capped.sol';
import {ERC20} from '../../../tokens/erc20/ERC20.sol';
import {
    ERC20Snapshot
} from '../../../tokens/erc20/extensions/ERC20Snapshot.sol';

// solhint-disable-next-line
contract ERC20TestWrapper is ERC20, ERC20Burnable, ERC20Capped, ERC20Snapshot {}
