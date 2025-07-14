// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ITrustedIssuersManagement
} from './modules/ITrustedIssuersManagement.sol';
import {ITrustedIssuersView} from './modules/ITrustedIssuersView.sol';
/**
 * @title ITrustedIssuersRegistry
 * @notice Interface for comprehensive trusted claim issuers management
 * @dev Combines trusted issuers lifecycle management and verification logic
 * @author ISBE
 */
// solhint-disable-next-line no-empty-blocks
interface ITrustedIssuersRegistry is
    ITrustedIssuersManagement,
    ITrustedIssuersView
{}
