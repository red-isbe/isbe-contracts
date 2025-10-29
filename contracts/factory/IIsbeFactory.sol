// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IBusinessLogicFactory} from './businesslogic/IBusinessLogicFactory.sol';
import {IConfigurationManagement} from './configurationmanagement/IConfigurationManagement.sol';
import {IDidRegistry} from '../identity/didregistry/IDidRegistry.sol';
import {IEnsResolver} from '../identity/ens/publicresolver/ensresolver/IEnsResolver.sol';
import {IGlobalIsbePause} from './globalisbepause/IGlobalIsbePause.sol';
import {IProxyFactory} from './proxyfactory/IProxyFactory.sol';
import {ITimeStampingRegistry} from '../client/tsr/ITimeStampingRegistry.sol';
import {IClientFiltering} from '../client/filtering/IClientFiltering.sol';

/**
 * @title ISBE Factory Interface
 * @notice Comprehensive interface for the ISBE governance diamond factory system
 * @dev Aggregates all core governance interfaces into a unified factory interface for
 *      complete ecosystem management including business logic deployment, proxy creation,
 *      configuration management, global pause controls, and DID registry operations
 * @author ISBE Development Team
 */
// solhint-disable-next-line no-empty-blocks
interface IIsbeFactory is
    IBusinessLogicFactory,
    IConfigurationManagement,
    IProxyFactory,
    IGlobalIsbePause,
    IDidRegistry,
    IEnsResolver,
    IClientFiltering,
    ITimeStampingRegistry
{}
