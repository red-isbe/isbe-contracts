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

import {IERC20Isbe} from '../../erc20/IERC20Isbe.sol';
import {IERC3643Metadata} from './erc3643metadata/IERC3643Metadata.sol';
import {IERC3643Freeze} from './erc3643freeze/IERC3643Freeze.sol';
import {
    IERC203643Controller
} from '../../erc203643/erc203643controller/IERC203643Controller.sol';
import {
    IERC203643Capped
} from '../../erc203643/erc203643capped/IERC203643Capped.sol';
import {IERC3643Recovery} from './erc3643recovery/IERC3643Recovery.sol';

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
interface IERC3643 is
    IERC20Isbe,
    IERC3643Metadata,
    IERC3643Freeze,
    IERC203643Controller,
    IERC203643Capped,
    IERC3643Recovery
{}
