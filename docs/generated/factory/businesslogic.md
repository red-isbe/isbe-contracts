## BusinessLogicFactory

A factory contract for deploying and managing versioned business logic contracts.

_This contract serves as the public-facing entry point for the business logic
deployment system. It implements the `IBusinessLogicFactory` interface and inherits
the core deployment and storage logic from `BusinessLogicFactoryInternal`.
Access to state-changing functions is restricted by role-based access control._

### deploy

```solidity
function deploy(bytes32 _businessId, bytes _bytecode) external
```

Deploys a business logic contract using its unique identifier and bytecode.

_Takes the `businessId` and the contract's `bytecode`, deploys it,
and stores its address. Emits a `Deployed` event upon success.
If it's the first deployment for a `businessId`, the version will be 1.
Subsequent deployments for the same `businessId` will increment the version._

#### Parameters

| Name         | Type    | Description                                                  |
| ------------ | ------- | ------------------------------------------------------------ |
| \_businessId | bytes32 | The unique identifier for the business logic to be deployed. |
| \_bytecode   | bytes   | The creation bytecode of the contract to deploy.             |

### getBusinessLogicAddress

```solidity
function getBusinessLogicAddress(bytes32 _businessId, uint256 _versionNumber) external view returns (address businessLogicAddress_)
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
function getBusinessLogicVersions(bytes32 _businessId) external view returns (address[] versions_)
```

Retrieves all deployed contract addresses for a given business logic ID.

_Each address in the returned array corresponds to a deployed version of the contract._

#### Parameters

| Name         | Type    | Description                                  |
| ------------ | ------- | -------------------------------------------- |
| \_businessId | bytes32 | The unique identifier of the business logic. |

#### Return Values

| Name       | Type      | Description                                                                      |
| ---------- | --------- | -------------------------------------------------------------------------------- |
| versions\_ | address[] | An array of addresses for all deployed versions of the specified business logic. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## BusinessLogicFactoryFacet

A facet for a Diamond Proxy that provides the functionality to deploy and manage
versioned business logic contracts.

_This contract is designed to be used as a facet within an EIP-2535 Diamond-compliant
proxy. It inherits the logic from `BusinessLogicFactory` and adds the necessary
introspection functions (`businessIdIntrospection` and `selectorsIntrospection`) required
by the Diamond Standard. These functions allow the proxy to discover which functions
this facet exposes and what its unique identifier is._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name         | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| interfaces\_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| businessId\_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name        | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| selectors\_ | bytes4[] | An array of `bytes4` function selectors. |

---

## BusinessLogicFactoryInternal

Abstract contract with internal logic to deploy and manage
versioned business logic (implementation) contracts.

_Uses unstructured storage to be reusable across different contexts.
It handles contract deployment via the CREATE opcode and maintains
a versioned record of each business logic contract._

### BusinessLogicStorage

_Holds all data related to business logic deployments._

```solidity
struct BusinessLogicStorage {
    mapping(bytes32 => address) latestVersions;
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
function _deploy(bytes32 _businessId, bytes _code) internal returns (address businessLogicAddress_, uint256 currentVersion_)
```

### \_getBusinessLogicAddress

```solidity
function _getBusinessLogicAddress(bytes32 _businessId, uint256 _versionNumber) internal view returns (address businessLogicAddress_)
```

### \_isDeployedBusinessLogic

```solidity
function _isDeployedBusinessLogic(bytes32 _businessId, uint256 _version) internal view returns (bool)
```

### \_getBusinessLogics

```solidity
function _getBusinessLogics() internal view returns (bytes32[] businessLogicIds_)
```

### \_getBusinessLogicVersions

```solidity
function _getBusinessLogicVersions(bytes32 _businessId) internal view returns (address[] versions_)
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
function deploy(bytes32 _businessId, bytes _bytecode) external
```

Deploys a business logic contract using its unique identifier and bytecode.

_Takes the `businessId` and the contract's `bytecode`, deploys it,
and stores its address. Emits a `Deployed` event upon success.
If it's the first deployment for a `businessId`, the version will be 1.
Subsequent deployments for the same `businessId` will increment the version._

#### Parameters

| Name         | Type    | Description                                                  |
| ------------ | ------- | ------------------------------------------------------------ |
| \_businessId | bytes32 | The unique identifier for the business logic to be deployed. |
| \_bytecode   | bytes   | The creation bytecode of the contract to deploy.             |

### getBusinessLogicAddress

```solidity
function getBusinessLogicAddress(bytes32 _businessId, uint256 _version) external view returns (address businessLogicAddress_)
```

Gets the deployed address for a specific version of a business logic.

#### Parameters

| Name         | Type    | Description                                           |
| ------------ | ------- | ----------------------------------------------------- |
| \_businessId | bytes32 | The unique identifier of the business logic.          |
| \_version    | uint256 | The version number of the business logic to retrieve. |

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
function getBusinessLogicVersions(bytes32 _businessId) external view returns (address[] versions_)
```

Retrieves all deployed contract addresses for a given business logic ID.

_Each address in the returned array corresponds to a deployed version of the contract._

#### Parameters

| Name         | Type    | Description                                  |
| ------------ | ------- | -------------------------------------------- |
| \_businessId | bytes32 | The unique identifier of the business logic. |

#### Return Values

| Name       | Type      | Description                                                                      |
| ---------- | --------- | -------------------------------------------------------------------------------- |
| versions\_ | address[] | An array of addresses for all deployed versions of the specified business logic. |
