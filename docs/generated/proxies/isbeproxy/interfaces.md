## IIsbeCut

Interface for applying a registered configuration to an ISBE proxy.

_Provides a function to perform a diamond cut on a proxy using a
pre-registered configuration ID, separating management from execution._

### IsbeProxyConfigurationSet

```solidity
event IsbeProxyConfigurationSet(address configumrationManagement, bytes32 configurationId, uint256 version, address[] initAddresses, bytes[] initData)
```

Emitted when an ISBE proxy configuration is set

#### Parameters

| Name                     | Type      | Description                                   |
| ------------------------ | --------- | --------------------------------------------- |
| configumrationManagement | address   | The configuration management contract address |
| configurationId          | bytes32   | The identifier of the configuration           |
| version                  | uint256   | The version number of the configuration       |
| initAddresses            | address[] |                                               |
| initData                 | bytes[]   |                                               |

### setIsbeProxyConfiguration

```solidity
function setIsbeProxyConfiguration(contract IConfigurationManagement _configurationManagement, bytes32 _configurationId, uint256 _version, address[] _init, bytes[] _data) external
```

Sets the ISBE proxy configuration from an external management contract

_Updates the proxy configuration using the specified management contract_

#### Parameters

| Name                      | Type                              | Description                                      |
| ------------------------- | --------------------------------- | ------------------------------------------------ |
| \_configurationManagement | contract IConfigurationManagement | The configuration management contract instance   |
| \_configurationId         | bytes32                           | The identifier of the configuration to set       |
| \_version                 | uint256                           | The version number of the configuration to apply |
| \_init                    | address[]                         |                                                  |
| \_data                    | bytes[]                           |                                                  |
