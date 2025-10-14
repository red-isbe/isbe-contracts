// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_REGULATORY_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Regulatory} from './IERC3643Regulatory.sol';
import {_REGULATORY_ROLE} from '../../../../constants/roles.sol';
import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';
import {ICompliance} from '../../compliance/ICompliance.sol';

/**
 * @title ERC3643Regulatory
 * @notice External contract implementing ERC-3643 regulatory infrastructure management.
 * @dev Provides public methods to configure Identity Registry and Compliance contracts.
 *      Setting IdentityRegistry enables ERC3643 mode globally in the unified architecture.
 *      Uses REGULATORY_ROLE for granular permission control over regulatory infrastructure.
 */
abstract contract ERC3643Regulatory is
    IERC3643Regulatory,
    ERC203643InternalCommon
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
     *      Setting IdentityRegistry enables ERC3643 mode globally.
     * @param _newIdentityRegistry The initial IdentityRegistry contract address.
     * @param _newCompliance The initial Compliance contract address.
     *
     * Effects:
     * - Sets up regulatory infrastructure references
     * - Enables ERC3643 mode if IdentityRegistry is non-zero
     * - Calls bindToken on compliance contract if non-zero
     *
     * Emits:
     * - {IdentityRegistryAdded} event
     * - {ComplianceAdded} event
     */
    function initializeERC3643Regulatory(
        address _newIdentityRegistry,
        address _newCompliance
    ) external override initializer(_ERC3643_REGULATORY_RESOLVER_KEY) {
        _initialize(_newIdentityRegistry, _newCompliance);

        // Bind token to compliance contract if provided
        if (_newCompliance != address(0)) {
            ICompliance(_newCompliance).bindToken(address(this));
        }

        emit IdentityRegistryAdded(_newIdentityRegistry);
        emit ComplianceAdded(_newCompliance);
    }

    /**
     * @notice Updates the IdentityRegistry contract reference.
     * @dev Restricted to regulatory role. Critical function that enables/disables ERC3643 mode.
     * @param _newIdentityRegistry The new IdentityRegistry contract address.
     *
     * Requirements:
     * - Caller must have REGULATORY_ROLE
     * - Contract must not be paused
     *
     * Effects:
     * - Updates IdentityRegistry reference
     * - Enables ERC3643 mode if non-zero (affects all transfers globally)
     * - Disables ERC3643 mode if zero (reverts to ERC20 mode)
     *
     * Emits:
     * - {IdentityRegistryAdded} event
     *
     * Note: This is the key trigger that switches between ERC20 and ERC3643 modes
     * in the unified architecture. All transfer validations will change behavior.
     */
    function setIdentityRegistry(
        address _newIdentityRegistry
    ) external override onlyRole(_REGULATORY_ROLE) whenNotPaused {
        _setIdentityRegistry(_newIdentityRegistry);
        emit IdentityRegistryAdded(_newIdentityRegistry);
    }

    /**
     * @notice Updates the Compliance contract reference.
     * @dev Restricted to regulatory role. Automatically binds token to new compliance.
     * @param _newCompliance The new Compliance contract address.
     *
     * Requirements:
     * - Caller must have REGULATORY_ROLE
     * - Contract must not be paused
     *
     * Effects:
     * - Updates Compliance contract reference
     * - Calls bindToken(address(this)) on compliance if non-zero
     *
     * Emits:
     * - {ComplianceAdded} event
     *
     * Note: The compliance contract provides additional transfer rules
     * and regulatory checks beyond basic identity verification.
     */
    function setCompliance(
        address _newCompliance
    ) external override onlyRole(_REGULATORY_ROLE) whenNotPaused {
        _setCompliance(_newCompliance);

        // Automatically bind token to new compliance contract
        if (_newCompliance != address(0)) {
            ICompliance(_newCompliance).bindToken(address(this));
        }

        emit ComplianceAdded(_newCompliance);
    }

    /**
     * @notice Returns the current IdentityRegistry contract.
     * @return IIdentityRegistry The IdentityRegistry contract interface.
     *
     * Note: If this returns a contract with non-zero address, the token
     * operates in ERC3643 mode with full regulatory compliance checks.
     * If zero, the token operates in standard ERC20 mode.
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
     * @notice Returns the current Compliance contract.
     * @return ICompliance The Compliance contract interface.
     *
     * Note: The compliance contract provides additional transfer validation
     * rules beyond basic identity verification, such as country restrictions,
     * holding limits, and other regulatory requirements.
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
