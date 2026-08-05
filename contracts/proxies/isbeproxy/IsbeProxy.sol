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

import {IsbeProxyInternal} from './IsbeProxyInternal.sol';
import {EIP2535} from '../eip2535/EIP2535.sol';
import {
    IConfigurationManagement
} from '../../factory/configurationmanagement/IConfigurationManagement.sol';

/**
 * @title IsbeProxy
 * @notice EIP-2535 Diamond proxy implementation for ISBE system
 * @dev Combines Diamond Standard functionality with ISBE configuration management
 * @author ISBE
 */
contract IsbeProxy is EIP2535, IsbeProxyInternal {
    struct IsbeProxyArgs {
        IConfigurationManagement configurationManagement;
        bytes32 configurationId;
        uint256 version;
        address[] init;
        bytes[] data;
    }

    constructor(
        IsbeProxyArgs memory _args
    )
        onlyValidConfiguration(
            _args.configurationManagement,
            _args.configurationId,
            _args.version
        )
    {
        _setIsbeProxyConfiguration(
            _args.configurationManagement,
            _args.configurationId,
            _args.version,
            _args.init,
            _args.data
        );
    }
}
