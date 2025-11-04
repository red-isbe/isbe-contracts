## IsbeFactoryInternal

Internal implementation for ISBE proxy configuration management

_Abstract contract providing core proxy functionality with configuration management_

### IsbeFactoryStorage

Storage structure for ISBE factory configuration data

_Stores configuration manager reference and version information_

```solidity
struct IsbeFactoryStorage {
  contract IIsbeFactory isbeFactory;
}
```

### \_setIsbeFactory

```solidity
function _setIsbeFactory(contract IIsbeFactory _isbeFactory) internal
```

### \_getIsbeFactory

```solidity
function _getIsbeFactory() internal view returns (contract IIsbeFactory)
```

Returns the governance address for DID and other queries

_Overrides GovernanceAddressResolver to return configurationManager
This enables external DID resolution for business logic proxies_

#### Return Values

| Name | Type                  | Description                       |
| ---- | --------------------- | --------------------------------- |
| [0]  | contract IIsbeFactory | The configuration manager address |

### \_isUseCase

```solidity
function _isUseCase() internal view returns (bool)
```

---

## IsbeProxy

EIP-2535 Diamond proxy implementation for ISBE system

_Combines Diamond Standard functionality with ISBE configuration management_

### IsbeProxyArgs

```solidity
struct IsbeProxyArgs {
  contract IConfigurationManagement configurationManagement;
  bytes32 configurationId;
  uint256 version;
  address[] init;
  bytes[] data;
}
```

### constructor

```solidity
constructor(struct IsbeProxy.IsbeProxyArgs _args) public
```

---

## IsbeProxyInternal

Internal implementation for ISBE proxy configuration management

_Abstract contract providing core proxy functionality with configuration management_

### IsbeProxyStorage

Storage structure for ISBE proxy configuration data

_Stores configuration manager reference and version information_

```solidity
struct IsbeProxyStorage {
    bytes32 configurationId;
    uint256 version;
}
```

### onlyValidConfiguration

```solidity
modifier onlyValidConfiguration(contract IConfigurationManagement _configurationManager, bytes32 _configurationId, uint256 _version)
```

Validates configuration exists before function execution

_Modifier that checks configuration validity via management contract_

#### Parameters

| Name                   | Type                              | Description                                    |
| ---------------------- | --------------------------------- | ---------------------------------------------- |
| \_configurationManager | contract IConfigurationManagement | The configuration management contract instance |
| \_configurationId      | bytes32                           | The configuration identifier to validate       |
| \_version              | uint256                           | The configuration version to validate          |

### \_setIsbeProxyConfiguration

```solidity
function _setIsbeProxyConfiguration(contract IConfigurationManagement _configurationManager, bytes32 _configurationId, uint256 _version, address[] _initAddresses, bytes[] _initData) internal
```

### \_initializeDiamondCut

```solidity
function _initializeDiamondCut(address _init, bytes _calldata) internal
```

### \_facets

```solidity
function _facets() internal view returns (struct IDiamondLoupe.Facet[] facets_)
```

### \_facetFunctionSelectors

```solidity
function _facetFunctionSelectors(address _facet) internal view returns (bytes4[] functionSelectors_)
```

### \_facetAddresses

```solidity
function _facetAddresses() internal view returns (address[] facetAddresses_)
```

### \_facetAddress

```solidity
function _facetAddress(bytes4 _signature) internal view returns (address)
```

Resolves a function selector to its corresponding facet address

_Must be implemented by inheriting contracts to provide resolution logic_

#### Parameters

| Name        | Type   | Description                      |
| ----------- | ------ | -------------------------------- |
| \_signature | bytes4 | The function selector to resolve |

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | address |             |

### \_supportsInterface

```solidity
function _supportsInterface(bytes4 _interfaceId) internal view virtual returns (bool)
```
