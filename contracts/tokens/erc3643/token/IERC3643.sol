// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20Isbe} from '../../erc20/IERC20Isbe.sol';
import {IERC3643Metadata} from './erc3643metadata/IERC3643Metadata.sol';

/**
 * @title IERC3643
 * @notice Interface for ERC-3643 compliant tokens supporting regulatory features.
 * @dev This interface extends the ERC-20 standard with additional modules for identity,
 *      compliance, recovery, freezing, pausing, batch operations, and extended metadata.
 *
 * The interface is composed of modular sub-interfaces, each responsible for a specific
 * functional domain.
 *
 * This interface serves as the unified entry point for ERC-3643 functionality.
 * It is intended to be implemented by security tokens requiring regulatory compliance.
 */

// solhint-disable-next-line no-empty-blocks
interface IERC3643 is IERC20Isbe, IERC3643Metadata {}
