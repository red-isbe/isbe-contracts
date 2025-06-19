## BusinessLogicFactory

A factory contract for deploying and managing versioned business logic contracts.

_This contract serves as the public-facing entry point for the business logic
deployment system. It implements the `IBusinessLogicFactory` interface and inherits
the core deployment and storage logic from `BusinessLogicFactoryInternal`.
Access to state-changing functions is restricted by role-based access control._

### deploy

```solidity
function deploy(bytes32 businessId, bytes bytecode) external
```

Deploys a business logic contract using its unique identifier and bytecode.

_Takes the `businessId` and the contract's `bytecode`, deploys it,
and stores its address. Emits a `Deployed` event upon success.
If it's the first deployment for a `businessId`, the version will be 1.
Subsequent deployments for the same `businessId` will increment the version._

#### Parameters

| Name       | Type    | Description                                                  |
| ---------- | ------- | ------------------------------------------------------------ |
| businessId | bytes32 | The unique identifier for the business logic to be deployed. |
| bytecode   | bytes   | The creation bytecode of the contract to deploy.             |

### getBusinessLogicAddress

```solidity
function getBusinessLogicAddress(bytes32 businessId, uint256 versionNumber) external view returns (address businessLogicAddress_)
```

### getBusinessLogics

```solidity
function getBusinessLogics() external view returns (bytes32[] businessLogicIds_)
```

Retrieves a list of all unique business logic identifiers deployed by this factory.

#### Return Values

| Name               | Type      | Description                                                     |
| ------------------ | --------- | --------------------------------------------------------------- |
| businessLogicIds\_ | bytes32[] | An array of all unique `businessId`s registered in the factory. |

### getBusinessLogicVersions

```solidity
function getBusinessLogicVersions(bytes32 businessId) external view returns (address[] versions_)
```

Retrieves all deployed contract addresses for a given business logic ID.

_Each address in the returned array corresponds to a deployed version of the contract._

#### Parameters

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| businessId | bytes32 | The unique identifier of the business logic. |

#### Return Values

| Name       | Type      | Description                                                                      |
| ---------- | --------- | -------------------------------------------------------------------------------- |
| versions\_ | address[] | An array of addresses for all deployed versions of the specified business logic. |

---

## BusinessLogicFactoryFacet

A facet for a Diamond Proxy that provides the functionality to deploy and manage
versioned business logic contracts.

_This contract is designed to be used as a facet within an EIP-2535 Diamond-compliant
proxy. It inherits the logic from `BusinessLogicFactory` and adds the necessary
introspection functions (`businessIdIntrospection` and `selectorsIntrospection`) required
by the Diamond Standard. These functions allow the proxy to discover which functions
this facet exposes and what its unique identifier is._

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Retrieves the function selectors supported by the EIP-2535 Diamond Standard.

_Returns a static list of function selectors supported by the interface. It is a pure function and does not
modify or depend on contract state._

#### Return Values

| Name        | Type     | Description                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------------- |
| selectors\_ | bytes4[] | An array of function selectors (`bytes4[]`) compliant with the EIP-2535 standard. |

---

## BusinessLogicFactoryInternal

An abstract contract containing the internal logic to deploy and manage
versioned business logic (implementation) contracts.

_This contract uses an unstructured storage layout (akin to Diamond Storage)
to ensure its logic is reusable across different contexts, such as within a proxy
facet. It handles the deployment of contracts via the CREATE opcode and maintains
a versioned record of each business logic._

### BusinessLogicStorage

_Defines the storage structure for the business logic factory._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct BusinessLogicStorage {
    mapping(bytes32 => address[]) businessLogicVersions;
    bytes32[] businessLogics;
}
```

### DeployFailed

```solidity
error DeployFailed()
```

Raised when the deployment of a business logic contract fails.

_This error is triggered if the `create` opcode does not result in a
contract with a code size greater than zero._

### BadBusinessId

```solidity
error BadBusinessId(bytes32 businessId)
```

Raised if the deployed contract's business ID does not match the expected ID.

_Triggered during the post-deployment check, ensuring the deployed contract
reports the correct identifier via its EIP-2535 introspection function._

#### Parameters

| Name       | Type    | Description                                                       |
| ---------- | ------- | ----------------------------------------------------------------- |
| businessId | bytes32 | The `businessId` that the deployed contract was expected to have. |

### \_deploy

```solidity
function _deploy(bytes32 businessId, bytes code) internal returns (address businessLogicAddress_, uint256 currentVersion_)
```

### \_getBusinessLogicAddress

```solidity
function _getBusinessLogicAddress(bytes32 businessId, uint256 versionNumber) internal view returns (address businessLogicAddress_)
```

### \_isDeployedBusinessLogic

```solidity
function _isDeployedBusinessLogic(bytes32 businessId) internal view returns (bool)
```

### \_getBusinessLogicAddresses

```solidity
function _getBusinessLogicAddresses(bytes32[] businessIds, uint256[] versionNumbers) internal view returns (address[] businessLogicAddresses_)
```

### \_getBusinessLogics

```solidity
function _getBusinessLogics() internal view returns (bytes32[] businessLogicIds)
```

### \_getBusinessLogicVersions

```solidity
function _getBusinessLogicVersions(bytes32 businessId) internal view returns (address[] versions_)
```

### \_businessLogicStorage

```solidity
function _businessLogicStorage() internal pure returns (struct BusinessLogicFactoryInternal.BusinessLogicStorage storage_)
```

---

## IBusinessLogicFactory

Provides an interface for deploying business logic contracts,
also known as implementation contracts. It allows for deploying contracts
with a unique identifier and versioning, making it easier to manage and
retrieve different versions of a contract.

_This factory stores deployed contract addresses based on a `bytes32`
businessId and an incrementing version number. It supports deploying single
contracts and retrieving information about them._

### Deployed

```solidity
event Deployed(bytes32 businessId, address businessAddress, uint256 version)
```

Emitted when a new version of a business logic is successfully deployed.

#### Parameters

| Name            | Type    | Description                                                 |
| --------------- | ------- | ----------------------------------------------------------- |
| businessId      | bytes32 | The unique identifier of the deployed business logic.       |
| businessAddress | address | The address where the new business logic has been deployed. |
| version         | uint256 | The version number of the newly deployed business logic.    |

### deploy

```solidity
function deploy(bytes32 businessId, bytes bytecode) external
```

Deploys a business logic contract using its unique identifier and bytecode.

_Takes the `businessId` and the contract's `bytecode`, deploys it,
and stores its address. Emits a `Deployed` event upon success.
If it's the first deployment for a `businessId`, the version will be 1.
Subsequent deployments for the same `businessId` will increment the version._

#### Parameters

| Name       | Type    | Description                                                  |
| ---------- | ------- | ------------------------------------------------------------ |
| businessId | bytes32 | The unique identifier for the business logic to be deployed. |
| bytecode   | bytes   | The creation bytecode of the contract to deploy.             |

### getBusinessLogicAddress

```solidity
function getBusinessLogicAddress(bytes32 businessId, uint256 version) external view returns (address businessLogicAddress_)
```

Gets the deployed address for a specific version of a business logic.

#### Parameters

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| businessId | bytes32 | The unique identifier of the business logic.          |
| version    | uint256 | The version number of the business logic to retrieve. |

#### Return Values

| Name                   | Type    | Description                                                 |
| ---------------------- | ------- | ----------------------------------------------------------- |
| businessLogicAddress\_ | address | The address of the deployed contract for the given version. |

### getBusinessLogics

```solidity
function getBusinessLogics() external view returns (bytes32[] businessLogicIds_)
```

Retrieves a list of all unique business logic identifiers deployed by this factory.

#### Return Values

| Name               | Type      | Description                                                     |
| ------------------ | --------- | --------------------------------------------------------------- |
| businessLogicIds\_ | bytes32[] | An array of all unique `businessId`s registered in the factory. |

### getBusinessLogicVersions

```solidity
function getBusinessLogicVersions(bytes32 businessId) external view returns (address[] versions_)
```

Retrieves all deployed contract addresses for a given business logic ID.

_Each address in the returned array corresponds to a deployed version of the contract._

#### Parameters

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| businessId | bytes32 | The unique identifier of the business logic. |

#### Return Values

| Name       | Type      | Description                                                                      |
| ---------- | --------- | -------------------------------------------------------------------------------- |
| versions\_ | address[] | An array of addresses for all deployed versions of the specified business logic. |
