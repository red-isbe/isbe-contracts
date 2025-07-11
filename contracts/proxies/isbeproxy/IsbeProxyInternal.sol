// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

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
    InitializeBusinessLogic,
    AccessControlInternal,
    PauseInternalCommon
{
    /**
     * @notice Storage structure for ISBE proxy configuration data
     * @dev Stores configuration manager reference and version information
     */
    struct IsbeProxyStorage {
        IConfigurationManagement configurationManager;
        bytes32 configurationId;
        uint256 version;
    }

    /**
     * @notice Validates configuration exists before function execution
     * @dev Modifier that checks configuration validity via management contract
     * @param configurationManager The configuration management contract instance
     * @param configurationId The configuration identifier to validate
     * @param version The configuration version to validate
     */
    modifier onlyValidConfiguration(
        IConfigurationManagement configurationManager,
        bytes32 configurationId,
        uint256 version
    ) {
        _checkValidConfiguration(
            configurationManager,
            configurationId,
            version
        );
        _;
    }

    function _setIsbeProxyConfiguration(
        IConfigurationManagement configurationManager,
        bytes32 configurationId,
        uint256 version
    ) internal {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        $.configurationManager = configurationManager;
        $.configurationId = configurationId;
        $.version = version;
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
        facets_ = $.configurationManager.facets($.configurationId, $.version);
    }

    function _facetFunctionSelectors(
        address _facet
    ) internal view returns (bytes4[] memory functionSelectors_) {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        functionSelectors_ = $.configurationManager.facetFunctionSelectors(
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
        facetAddresses_ = $.configurationManager.facetAddresses(
            $.configurationId,
            $.version
        );
    }

    function _facetAddress(
        bytes4 _signature
    ) internal view override returns (address) {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        return
            $.configurationManager.facetAddress(
                $.configurationId,
                $.version,
                _signature
            );
    }

    function _supportsInterface(
        bytes4 interfaceId
    ) internal view virtual returns (bool) {
        IsbeProxyStorage storage $ = _isbeProxyStorage();
        return
            $.configurationManager.facetSupportsInterface(
                $.configurationId,
                $.version,
                interfaceId
            );
    }

    function _checkValidConfiguration(
        IConfigurationManagement configurationManager,
        bytes32 configurationId,
        uint256 version
    ) private view {
        _addressIsNotZero(address(configurationManager));
        _bytes32IsNotZero(configurationId);
        configurationManager.checkConfiguration(configurationId, version);
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
