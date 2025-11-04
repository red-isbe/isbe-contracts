// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControlEoa} from './IAccessControlEoa.sol';
import {IAccessControlDid} from './IAccessControlDid.sol';

// solhint-disable-next-line no-empty-blocks
interface IAccessControl is IAccessControlEoa, IAccessControlDid {}
