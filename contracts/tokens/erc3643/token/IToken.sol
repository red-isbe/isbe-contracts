// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC3643} from './IERC3643.sol';
import {ITrustedIssuersRegistry} from '../trustedissuersregistry/ITrustedIssuersRegistry.sol';
import {IRecovery} from './IRecovery.sol';
import {IERC3643Infrastructure} from './IERC3643Infrastructure.sol';

/**
 * @dev Required interface of an ERC3643 compliant security token contract.
 * @notice This interface combines all core ERC3643 security token functionality
 * including compliance, trusted issuers registry, recovery mechanisms,
 * and infrastructure components.
 */
interface IToken is
    IERC3643,
    ITrustedIssuersRegistry,
    IRecovery,
    IERC3643Infrastructure
{}
