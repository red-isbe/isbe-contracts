// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_REGULATORY_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643RegulatoryInternal} from './ERC3643RegulatoryInternal.sol';
import {IERC3643Regulatory} from './IERC3643Regulatory.sol';
import {_TOKEN_OWNER_ROLE} from '../../../../constants/roles.sol';
import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';
import {ICompliance} from '../../compliance/ICompliance.sol';

/**
 * @title ERC3643Regulatory
 * @notice External contract implementing ERC-3643 regulatory infrastructure management.
 * @dev Provides public methods to update and retrieve references to IdentityRegistry and Compliance contracts.
 *      Applies access control, validation, and emits events.
 */
abstract contract ERC3643Regulatory is
    IERC3643Regulatory,
    ERC3643RegulatoryInternal
{
    /**
     * @dev Disables further initializations for this facet using its resolver key.
     */
    constructor() {
        _disableInitializers(_ERC3643_REGULATORY_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the regulatory references of the token.
     * @dev Can only be called once via the initializer modifier.
     *      Emits {IdentityRegistryAdded} and {ComplianceAdded} events.
     * @param _newIdentityRegistry The initial IdentityRegistry contract address.
     * @param _newCompliance The initial Compliance contract address.
     */
    function initializeERC3643Regulatory(
        address _newIdentityRegistry,
        address _newCompliance
    ) external override initializer(_ERC3643_REGULATORY_RESOLVER_KEY) {
        _initialize(_newIdentityRegistry, _newCompliance);
        emit IdentityRegistryAdded(_newIdentityRegistry);
        emit ComplianceAdded(_newCompliance);
    }

    /**
     * @notice Updates the IdentityRegistry reference.
     * @dev Restricted to token owner. Can be set to zero.
     *      Emits an {IdentityRegistryAdded} event.
     * @param _newIdentityRegistry The new IdentityRegistry contract address.
     */
    function setIdentityRegistry(
        address _newIdentityRegistry
    ) external override onlyRole(_TOKEN_OWNER_ROLE) whenNotPaused {
        _setIdentityRegistry(_newIdentityRegistry);
        emit IdentityRegistryAdded(_newIdentityRegistry);
    }

    /**
     * @notice Updates the Compliance reference.
     * @dev Restricted to token owner. Can be set to zero.
     *      Calls `bindToken` on the compliance contract if non-zero.
     *      Emits a {ComplianceAdded} event.
     * @param _newCompliance The new Compliance contract address.
     */
    function setCompliance(
        address _newCompliance
    ) external override onlyRole(_TOKEN_OWNER_ROLE) whenNotPaused {
        _setCompliance(_newCompliance);

        emit ComplianceAdded(_newCompliance);
    }

    /**
     * @notice Returns the current IdentityRegistry reference.
     * @return The IdentityRegistry contract linked to the token.
     */
    function identityRegistry()
        external
        view
        override
        returns (IIdentityRegistry)
    {
        return IIdentityRegistry(_identityRegistry());
    }

    /**
     * @notice Returns the current Compliance reference.
     * @return The Compliance contract linked to the token.
     */
    function compliance() external view override returns (ICompliance) {
        return ICompliance(_compliance());
    }

    /**
     * @dev Declares the interfaces implemented by this facet.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC3643Regulatory).interfaceId;
    }
}
