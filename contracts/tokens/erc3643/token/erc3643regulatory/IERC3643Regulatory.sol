// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';
import {ICompliance} from '../../compliance/ICompliance.sol';

/**
 * @title IERC3643Regulatory
 * @notice Interface for ERC-3643 regulatory infrastructure.
 * @dev Exposes IdentityRegistry and Compliance management.
 */
interface IERC3643Regulatory {
    /**
     *  this event is emitted when the IdentityRegistry has been set for the token
     *  the event is emitted by the token constructor and by the setIdentityRegistry function
     *  `_identityRegistry` is the address of the Identity Registry of the token
     */
    event IdentityRegistryAdded(address indexed _newIdentityRegistry);

    /**
     *  this event is emitted when the Compliance has been set for the token
     *  the event is emitted by the token constructor and by the setCompliance function
     *  `_compliance` is the address of the Compliance contract of the token
     */
    event ComplianceAdded(address indexed _newCompliance);

    // --- Custom Errors ---

    /// @notice Error indicating that the recipient address is not verified in the Identity Registry.
    /// @param account The unverified recipient address.
    error RecipientNotVerified(address account);

    /**
     *  @dev sets the Identity Registry for the token
     *  @param _newIdentityRegistry the address of the Identity Registry to set
     *  Only the owner of the token smart contract can call this function
     *  emits an `IdentityRegistryAdded` event
     */
    function setIdentityRegistry(address _newIdentityRegistry) external;

    /**
     *  @dev sets the compliance contract of the token
     *  @param _newCompliance the address of the compliance contract to set
     *  Only the owner of the token smart contract can call this function
     *  calls bindToken on the compliance contract
     *  emits a `ComplianceAdded` event
     */
    function setCompliance(address _newCompliance) external;

    /**
     * @notice Initializes the ERC-3643 regulatory references of the token.
     * @dev Sets the initial IdentityRegistry and Compliance contracts.
     *      Emits {IdentityRegistryAdded} and {ComplianceAdded} events.
     * @param _newIdentityRegistry The initial IdentityRegistry contract address. Can be the zero address if not set.
     * @param _newCompliance The initial Compliance contract address. Can be the zero address if not set.
     */
    function initializeERC3643Regulatory(
        address _newIdentityRegistry,
        address _newCompliance
    ) external;

    /**
     *  @dev Returns the Identity Registry linked to the token
     */
    function identityRegistry() external view returns (IIdentityRegistry);

    /**
     *  @dev Returns the Compliance contract linked to the token
     */
    function compliance() external view returns (ICompliance);
}
