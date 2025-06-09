// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IBusinessLogicFactory
 * @notice Interface to deploy single and bulk bytecodes with unique IDs and versioning.
 * @dev Provides methods for deploying single business logics and multiple business logics as a batch.
 */
interface IBusinessLogicFactory {
    /**
     * @notice Emitted when a single business logic is deployed successfully.
     * @param businessId Unique identifier of the deployed business logic.
     * @param version Version of the deployed business logic.
     */
    event Deployed(bytes32 businessId, uint256 version);

    /**
     * @notice Emitted when multiple business logics are deployed successfully in bulk.
     * @param businessIds List of unique IDs for the deployed business logics.
     * @param version Common version of all deployed business logics in the batch.
     */
    event BulkDeployed(bytes32[] businessIds, uint256 version);

    /**
     * @notice Deploys a single business logic by its unique ID and the provided bytecode.
     * @dev Emits the `Deployed` event upon successful deployment.
     * @param businessId Unique identifier of the business logic to deploy.
     * @param bytecode Binary data of the business logic to deploy.
     */
    function deploy(bytes32 businessId, bytes calldata bytecode) external;

    /**
     * @notice Deploys multiple business logics in one operation using IDs and corresponding bytecode.
     * @dev Emits the `BulkDeployed` event upon successful deployment of all business logics.
     * @param businessIds List of unique IDs of the business logics to deploy.
     * @param bytecodes List of binary data representing the business logics to deploy.
     */
    function deployBulk(
        bytes32[] calldata businessIds,
        bytes[] calldata bytecodes
    ) external;
}
