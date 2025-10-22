// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title DID Controller Interface
 * @notice Interface for managing decentralised identifier (DID) controllers and base documents
 * @dev Provides functionality to add, revoke, and query DID controllers with proper
 *      authorisation mechanisms
 * @author ISBE Development Team
 */
interface IDidController {
    /**
     * @notice Emitted when a new controller is added to a DID
     * @param did The decentralised identifier receiving the new controller
     * @param controller The controller identifier being added
     */
    event ControllerAdded(bytes32 did, bytes32 controller);

    /**
     * @notice Emitted when a controller is revoked from a DID
     * @param did The decentralised identifier losing the controller
     * @param controller The controller identifier being revoked
     */
    event ControllerRevoked(bytes32 did, bytes32 controller);

    /**
     * @notice Raised when a controller is not authorized
     * @param did The decentralised identifier losing the controller
     * @param controller The controller identifier being revoked
     */
    error ControllerNotAuthorized(bytes32 did, address controller);

    /**
     * @notice Raised when a DID is not controlled by
     * @param did The decentralised identifier
     * @param controller The controller identifier
     */
    error DidIsNotControlledBy(bytes32 did, bytes32 controller);

    /**
     * @notice Raised when a DID is controlled by
     * @param did The decentralised identifier
     * @param controller The controller identifier
     */
    error DidIsControlledBy(bytes32 did, bytes32 controller);

    /**
     * @notice Adds a new controller to the specified DID
     * @dev Requires appropriate authorisation to modify the DID
     * @param did The decentralised identifier to receive the new controller
     * @param controller The controller identifier to be added
     * @return success Boolean indicating whether the operation completed successfully
     */
    function addController(
        bytes32 did,
        bytes32 controller
    ) external returns (bool success);

    /**
     * @notice Revokes an existing controller from the specified DID
     * @dev Requires appropriate authorisation to modify the DID
     * @param did The decentralised identifier to lose the controller
     * @param controller The controller identifier to be revoked
     * @return success Boolean indicating whether the operation completed successfully
     */
    function revokeController(
        bytes32 did,
        bytes32 controller
    ) external returns (bool success);

    /**
     * @notice Retrieves paginated list of DIDs controlled by the specified controller
     * @dev Returns paginated results to handle large datasets efficiently
     * @param controller The controller identifier to query for
     * @param page The page number to retrieve (zero-based)
     * @param pageSize The maximum number of items per page
     * @return items Array of DID strings controlled by the specified controller
     * @return total Total number of DIDs controlled by this controller
     * @return howMany Number of items returned in current page
     * @return prev Previous page number (zero if no previous page)
     * @return next Next page number (zero if no next page)
     */
    function getDidsByController(
        bytes32 controller,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            bytes32[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Checks if an address is authorised as a controller for the specified DID
     * @dev Validates controller permissions using bytes32 did format
     * @param did The decentralised identifier to check against
     * @param controller The address to verify as a controller
     * @return isController Boolean indicating if the address is an authorised controller
     */
    function checkController(
        bytes32 did,
        address controller
    ) external view returns (bool isController);

    /**
     * @notice Checks if an address is authorised as a controller for the specified DID
     * @dev Validates controller permissions using bytes DID format for optimised operations
     * @param did The decentralised identifier in bytes format to check against
     * @param controller The address to verify as a controller
     * @return isController Boolean indicating if the address is an authorised controller
     */
    function checkController(
        bytes memory did,
        address controller
    ) external view returns (bool isController);
}
