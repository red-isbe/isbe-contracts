## ERC3643Regulatory

External contract implementing ERC-3643 regulatory infrastructure management.

_Provides public methods to configure Identity Registry and Compliance contracts.
Setting IdentityRegistry enables ERC3643 mode globally in the unified architecture.
Uses REGULATORY_ROLE for granular permission control over regulatory infrastructure._

### constructor

```solidity
constructor() internal
```

_Disables further initializations for this facet using its resolver key._

### initializeERC3643Regulatory

```solidity
function initializeERC3643Regulatory(address _newIdentityRegistry, address _newCompliance) external
```

Initializes the regulatory references of the token.

_Can only be called once via the initializer modifier.
Setting IdentityRegistry enables ERC3643 mode globally._

#### Parameters

| Name                  | Type    | Description                                                                                                                                                                                                                                                                   |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newIdentityRegistry | address | The initial IdentityRegistry contract address.                                                                                                                                                                                                                                |
| \_newCompliance       | address | The initial Compliance contract address. Effects: - Sets up regulatory infrastructure references - Enables ERC3643 mode if IdentityRegistry is non-zero - Calls bindToken on compliance contract if non-zero Emits: - {IdentityRegistryAdded} event - {ComplianceAdded} event |

### setIdentityRegistry

```solidity
function setIdentityRegistry(address _newIdentityRegistry) external
```

Updates the IdentityRegistry contract reference.

_Restricted to regulatory role. Critical function that enables/disables ERC3643 mode._

#### Parameters

| Name                  | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newIdentityRegistry | address | The new IdentityRegistry contract address. Requirements: - Caller must have REGULATORY_ROLE - Contract must not be paused Effects: - Updates IdentityRegistry reference - Enables ERC3643 mode if non-zero (affects all transfers globally) - Disables ERC3643 mode if zero (reverts to ERC20 mode) Emits: - {IdentityRegistryAdded} event Note: This is the key trigger that switches between ERC20 and ERC3643 modes in the unified architecture. All transfer validations will change behavior. |

### setCompliance

```solidity
function setCompliance(address _newCompliance) external
```

Updates the Compliance contract reference.

_Restricted to regulatory role. Automatically binds token to new compliance._

#### Parameters

| Name            | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newCompliance | address | The new Compliance contract address. Requirements: - Caller must have REGULATORY_ROLE - Contract must not be paused Effects: - Updates Compliance contract reference - Calls bindToken(address(this)) on compliance if non-zero Emits: - {ComplianceAdded} event Note: The compliance contract provides additional transfer rules and regulatory checks beyond basic identity verification. |

### identityRegistry

```solidity
function identityRegistry() external view returns (contract IIdentityRegistry)
```

Returns the current IdentityRegistry contract.

#### Return Values

| Name | Type                       | Description                                                                                                                                                                                                                                       |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | contract IIdentityRegistry | IIdentityRegistry The IdentityRegistry contract interface. Note: If this returns a contract with non-zero address, the token operates in ERC3643 mode with full regulatory compliance checks. If zero, the token operates in standard ERC20 mode. |

### compliance

```solidity
function compliance() external view returns (contract ICompliance)
```

Returns the current Compliance contract.

#### Return Values

| Name | Type                 | Description                                                                                                                                                                                                                                     |
| ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | contract ICompliance | ICompliance The Compliance contract interface. Note: The compliance contract provides additional transfer validation rules beyond basic identity verification, such as country restrictions, holding limits, and other regulatory requirements. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Declares the interfaces implemented by this facet._

#### Return Values

| Name         | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface identifiers. |

---

## ERC3643RegulatoryFacet

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

## ERC3643RegulatoryInternal

Internal contract for managing ERC-3643 regulatory infrastructure: IdentityRegistry and Compliance.

_Provides internal functions to read and write registry and compliance addresses.
This contract does not emit events or apply access control.
It is intended to be used by external contracts that handle authorization and event emission._

### ERC3643RegulatoryStorage

_Storage structure for ERC-3643 regulatory._

```solidity
struct ERC3643RegulatoryStorage {
    address identityRegistry;
    address compliance;
}
```

### \_initialize

```solidity
function _initialize(address _newIdentityRegistry, address _newCompliance) internal
```

_Internal function to initialize the regulatory references in storage.
Sets the initial values for the Identity Registry and Compliance contracts._

#### Parameters

| Name                  | Type    | Description                                     |
| --------------------- | ------- | ----------------------------------------------- |
| \_newIdentityRegistry | address | The initial Identity Registry contract address. |
| \_newCompliance       | address | The initial Compliance contract address.        |

### \_setIdentityRegistry

```solidity
function _setIdentityRegistry(address _newIdentityRegistry) internal
```

_Internal function to update the Identity Registry reference in storage._

#### Parameters

| Name                  | Type    | Description                                 |
| --------------------- | ------- | ------------------------------------------- |
| \_newIdentityRegistry | address | The new Identity Registry contract address. |

### \_setCompliance

```solidity
function _setCompliance(address _newCompliance) internal
```

_Internal function to update the Compliance reference in storage._

#### Parameters

| Name            | Type    | Description                          |
| --------------- | ------- | ------------------------------------ |
| \_newCompliance | address | The new Compliance contract address. |

### \_identityRegistry

```solidity
function _identityRegistry() internal view returns (address)
```

_Internal view function to retrieve the current Identity Registry contract from storage._

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | address | The Identity Registry contract linked to the token. |

### \_compliance

```solidity
function _compliance() internal view returns (address)
```

_Internal view function to retrieve the current Compliance contract from storage._

#### Return Values

| Name | Type    | Description                                  |
| ---- | ------- | -------------------------------------------- |
| [0]  | address | The Compliance contract linked to the token. |

---

## IERC3643Regulatory

Interface for ERC-3643 regulatory infrastructure.

_Exposes IdentityRegistry and Compliance management._

### IdentityRegistryAdded

```solidity
event IdentityRegistryAdded(address _newIdentityRegistry)
```

this event is emitted when the IdentityRegistry has been set for the token
the event is emitted by the token constructor and by the setIdentityRegistry function
`_identityRegistry` is the address of the Identity Registry of the token

### ComplianceAdded

```solidity
event ComplianceAdded(address _newCompliance)
```

this event is emitted when the Compliance has been set for the token
the event is emitted by the token constructor and by the setCompliance function
`_compliance` is the address of the Compliance contract of the token

### setIdentityRegistry

```solidity
function setIdentityRegistry(address _newIdentityRegistry) external
```

@dev sets the Identity Registry for the token
@param \_newIdentityRegistry the address of the Identity Registry to set
Only the owner of the token smart contract can call this function
emits an `IdentityRegistryAdded` event

### setCompliance

```solidity
function setCompliance(address _newCompliance) external
```

@dev sets the compliance contract of the token
@param \_newCompliance the address of the compliance contract to set
Only the owner of the token smart contract can call this function
calls bindToken on the compliance contract
emits a `ComplianceAdded` event

### initializeERC3643Regulatory

```solidity
function initializeERC3643Regulatory(address _newIdentityRegistry, address _newCompliance) external
```

Initializes the ERC-3643 regulatory references of the token.

_Sets the initial IdentityRegistry and Compliance contracts.
Emits {IdentityRegistryAdded} and {ComplianceAdded} events._

#### Parameters

| Name                  | Type    | Description                                                                        |
| --------------------- | ------- | ---------------------------------------------------------------------------------- |
| \_newIdentityRegistry | address | The initial IdentityRegistry contract address. Can be the zero address if not set. |
| \_newCompliance       | address | The initial Compliance contract address. Can be the zero address if not set.       |

### identityRegistry

```solidity
function identityRegistry() external view returns (contract IIdentityRegistry)
```

@dev Returns the Identity Registry linked to the token

### compliance

```solidity
function compliance() external view returns (contract ICompliance)
```

@dev Returns the Compliance contract linked to the token
