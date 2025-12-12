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

import {_ISBE_FACTORY_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IIsbeFactory} from '../../factory/IIsbeFactory.sol';

// solhint-disable no-inline-assembly
/**
 * @title IsbeProxyInternal
 * @notice Internal implementation for ISBE proxy configuration management
 * @dev Abstract contract providing core proxy functionality with configuration management
 * @author ISBE
 */
abstract contract IsbeFactoryInternal {
    /**
     * @notice Storage structure for ISBE factory configuration data
     * @dev Stores configuration manager reference and version information
     */
    struct IsbeFactoryStorage {
        IIsbeFactory isbeFactory;
    }

    function _setIsbeFactory(IIsbeFactory _isbeFactory) internal {
        _isbeFactoryStorage().isbeFactory = _isbeFactory;
    }

    /// @notice Returns the governance address for DID and other queries
    /// @dev Overrides GovernanceAddressResolver to return configurationManager
    ///      This enables external DID resolution for business logic proxies
    /// @return The configuration manager address
    function _getIsbeFactory() internal view returns (IIsbeFactory) {
        return _isbeFactoryStorage().isbeFactory;
    }

    function _isUseCase() internal view returns (bool) {
        return address(_isbeFactoryStorage().isbeFactory) != address(0);
    }

    function _isbeFactoryStorage()
        private
        pure
        returns (IsbeFactoryStorage storage storage_)
    {
        bytes32 position = _ISBE_FACTORY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
        // solhint-enable no-inline-assembly
    }
}
