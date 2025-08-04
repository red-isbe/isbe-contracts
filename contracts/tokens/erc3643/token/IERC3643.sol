// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20Isbe} from '../../erc20/IERC20Isbe.sol';
import {IERC203643Extended} from './modules/IERC203643Extended.sol';

import {IBatches} from './modules/IBatches.sol';
import {IERC3643Infrastructure} from './modules/IERC3643Infrastructure.sol';
import {IRecovery} from './modules/IRecovery.sol';
import {ITokenFreeze} from './modules/ITokenFreeze.sol';
import {IPause} from '../../../pause/IPause.sol';


// solhint-disable-next-line no-empty-blocks
interface IERC3643 is
    IERC20Isbe,
    IERC203643Extended,
    IPause,
    IBatches,
    IERC3643Infrastructure,
    IRecovery,
    ITokenFreeze
{}
