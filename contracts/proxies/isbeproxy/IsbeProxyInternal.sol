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

import {IsbeFactoryInternal} from './IsbeFactoryInternal.sol';
import {IIsbeFactory} from '../../factory/IIsbeFactory.sol';
import {IDiamondLoupe} from '../eip2535/interfaces/IDiamondLoupe.sol';
import {_ISBE_PROXY_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IConfigurationManagement} from '../../factory/configurationmanagement/IConfigurationManagement.sol';
import {FacetAddressResolver} from '../eip2535/FacetAddressResolver.sol';
import {InitializeBusinessLogic} from '../../utils/InitializeBusinessLogic.sol';
import {AccessControlInternal} from '../../access/accessControl/AccessControlInternal.sol';
import {PauseInternalCommon} from '../../pause/PauseInternalCommon.sol';

// solhint-disable no-inline-assembly
/**
 * @title IsbeProxyInternal
 * @notice Internal implementation for ISBE proxy configuration management
 * @dev Abstract contract providing core proxy functionality with configuration management
 * @author ISBE
 */
abstract contract IsbeProxyInternal is
    FacetAddressResolver,
    IsbeFactoryInternal,
    InitializeBusinessLogic,
    AccessControlInternal,
    PauseInternalCommon
{
    /**
     * @notice Storage structure for ISBE proxy configuration data
     * @dev Stores configuration manager reference and version information
     */
    struct IsbeProxyStorage {
        bytes32 configurationId;
        uint256 version;
    }

    /**
     * @notice Validates configuration exists before function execution
     * @dev Modifier that checks configuration validity via management contract
     * @param _configurationManager The configuration management contract instance
     * @param _configurationId The configuration identifier to validate
     * @param _version The configuration version to validate
     */
    modifier onlyValidConfiguration(
        IConfigurationManagement _configurationManager,
        bytes32 _configurationId,
        uint256 _version
    ) {
        _checkValidConfiguration(
            _configurationManager,
            _configurationId,
            _version
        );
        _;
    }

    function _setIsbeProxyConfiguration(
        IConfigurationManagement _configurationManager,
        bytes32 _configurationId,
        uint256 _version,
        address[] memory _initAddresses,
        bytes[] memory _initData
    ) internal {
        uint256 length = _initAddresses.length;
        _checkSameLength(length, _initData.length);

        IsbeProxyStorage storage $ = _isbeProxyStorage();
        _setIsbeFactory(IIsbeFactory(address(_configurationManager)));
        $.configurationId = _configurationId;
        $.version = _version;

        for (; length > 0; ) {
            unchecked {
                --length;
            }
            _initializeDiamondCut(_initAddresses[length], _initData[length]);
        }
    }

    function _initializeDiamondCut(
        address _init,
        bytes memory _calldata
    ) internal {
        if (_init == address(0)) {
            return;
        }
        _enforceHasContractCode(
            _init,
            'LibDiamondCut: _init address has no code'
        );
        _initializeBusinessLogic(_init, _calldata);
    }

    function _facets()
        internal
        view
        returns (IDiamondLoupe.Facet[] memory facets_)
    {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        facets_ = _getIsbeFactory().facets($.configurationId, $.version);
    }

    function _facetFunctionSelectors(
        address _facet
    ) internal view returns (bytes4[] memory functionSelectors_) {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        functionSelectors_ = _getIsbeFactory().facetFunctionSelectors(
            $.configurationId,
            $.version,
            _facet
        );
    }

    function _facetAddresses()
        internal
        view
        returns (address[] memory facetAddresses_)
    {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        facetAddresses_ = _getIsbeFactory().facetAddresses(
            $.configurationId,
            $.version
        );
    }

    function _facetAddress(
        bytes4 _signature
    ) internal view override returns (address) {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        return
            _getIsbeFactory().facetAddress(
                $.configurationId,
                $.version,
                _signature
            );
    }

    function _supportsInterface(
        bytes4 _interfaceId
    ) internal view virtual returns (bool) {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        return
            _getIsbeFactory().facetSupportsInterface(
                $.configurationId,
                $.version,
                _interfaceId
            );
    }

    function _checkValidConfiguration(
        IConfigurationManagement _configurationManager,
        bytes32 _configurationId,
        uint256 _version
    ) private view {
        _checkAddressIsNotZero(address(_configurationManager));
        _checkBytes32IsNotZero(_configurationId);
        _configurationManager.checkConfiguration(_configurationId, _version);
    }

    function _isbeProxyStorage()
        private
        pure
        returns (IsbeProxyStorage storage storage_)
    {
        bytes32 position = _ISBE_PROXY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
// solhint-enable no-inline-assembly
