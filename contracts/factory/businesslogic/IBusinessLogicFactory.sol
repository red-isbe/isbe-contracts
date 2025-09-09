// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IBusinessLogicFactory
 * @author ISBE
 * @notice Provides an interface for deploying business logic contracts,
 * also known as implementation contracts. It allows for deploying contracts
 * with a unique identifier and versioning, making it easier to manage and
 * retrieve different versions of a contract.
 * @dev This factory stores deployed contract addresses based on a `bytes32`
 * businessId and an incrementing version number. It supports deploying single
 * contracts and retrieving information about them.
 */
interface IBusinessLogicFactory {
    /**
     * @notice Emitted when a new version of a business logic is successfully deployed.
     * @param businessId The unique identifier of the deployed business logic.
     * @param businessAddress The address where the new business logic has been deployed.
     * @param version The version number of the newly deployed business logic.
     */
    event Deployed(
        bytes32 businessId,
        address businessAddress,
        uint256 version
    );

    /**
     * @notice Deploys a business logic contract using its unique identifier and bytecode.
     * @dev Takes the `businessId` and the contract's `bytecode`, deploys it,
     * and stores its address. Emits a `Deployed` event upon success.
     * If it's the first deployment for a `businessId`, the version will be 1.
     * Subsequent deployments for the same `businessId` will increment the version.
     * @param _businessId The unique identifier for the business logic to be deployed.
     * @param _bytecode The creation bytecode of the contract to deploy.
     */
    function deploy(bytes32 _businessId, bytes calldata _bytecode) external;

    /**
     * @notice Gets the deployed address for a specific version of a business logic.
     * @param _businessId The unique identifier of the business logic.
     * @param _version The version number of the business logic to retrieve.
     * @return businessLogicAddress_ The address of the deployed contract for the given version.
     */
    function getBusinessLogicAddress(
        bytes32 _businessId,
        uint256 _version
    ) external view returns (address businessLogicAddress_);

    /**
     * @notice Retrieves a list of all unique business logic identifiers deployed by this factory.
     * @return businessLogicIds_ An array of all unique `businessId`s registered in the factory.
     */
    function getBusinessLogics()
        external
        view
        returns (bytes32[] memory businessLogicIds_);

    /**
     * @notice Retrieves all deployed contract addresses for a given business logic ID.
     * @dev Each address in the returned array corresponds to a deployed version of the contract.
     * @param _businessId The unique identifier of the business logic.
     * @return versions_ An array of addresses for all deployed versions of the specified business logic.
     */
    function getBusinessLogicVersions(
        bytes32 _businessId
    ) external view returns (address[] memory versions_);
}
