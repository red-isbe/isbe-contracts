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

import {IBusinessLogicFactory} from './businesslogic/IBusinessLogicFactory.sol';
import {IConfigurationManagement} from './configurationmanagement/IConfigurationManagement.sol';
import {IDidRegistry} from '../identity/didregistry/IDidRegistry.sol';
import {IEnsResolver} from '../identity/ens/publicresolver/ensresolver/IEnsResolver.sol';
import {IGlobalIsbePause} from './globalisbepause/IGlobalIsbePause.sol';
import {IProxyFactory} from './proxyfactory/IProxyFactory.sol';
import {ITimeStampingRegistry} from '../client/tsr/ITimeStampingRegistry.sol';
import {IClientFiltering} from '../client/filtering/IClientFiltering.sol';
import {IAnchoringCore} from '../client/anchoring/IAnchoringCore.sol';
import {INetworkDirectory} from '../client/networkdirectory/INetworkDirectory.sol';
import {ISmartAccountFactory} from '../accountabstraction/smartaccount/factory/ISmartAccountFactory.sol';

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
    ITimeStampingRegistry,
    IAnchoringCore,
    INetworkDirectory,
    ISmartAccountFactory
{}
