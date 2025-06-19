## ITransparentAccessControl

This interface defines the functions and events required for setting up
the initial Role-Based Access Control (RBAC) configuration.

_It is designed to be used in contexts, such as with transparent upgradeable
proxies, where a distinct, one-off function call is needed to initialise the
access control settings after deployment._

### RbacsInitialized

```solidity
event RbacsInitialized(struct IAccessControl.Rbac[] rbacs)
```

This event is emitted when the RBAC roles have been successfully initialised.

_It signals that the `initializeRbacs` function has been completed._

#### Parameters

| Name  | Type                         | Description                                                |
| ----- | ---------------------------- | ---------------------------------------------------------- |
| rbacs | struct IAccessControl.Rbac[] | An array of the RBAC structures that have been configured. |

### initializeRbacs

```solidity
function initializeRbacs(struct IAccessControl.Rbac[] rbacs) external
```

Initialises the contract with a set of Role-Based Access Control configurations.

_This is intended to be a one-time function call, executed right after the contract's
deployment to establish all necessary roles and their permissions from the outset.
Calling this function should set up the complete access control scheme for the contract._

#### Parameters

| Name  | Type                         | Description                                                                             |
| ----- | ---------------------------- | --------------------------------------------------------------------------------------- |
| rbacs | struct IAccessControl.Rbac[] | An array of `IAccessControl.Rbac` structures, each defining a role and its permissions. |

---

## ProxyFactory

### initializeProxyFactory

```solidity
function initializeProxyFactory(address[] defaultAdminMembers, address[] isbeMembers, bytes32[] isbeGovernanceFacets) external
```

Initialises the proxy factory with its core administrative and governance settings.

_Sets up the initial access control for the factory contract itself. This function should
be called once upon deployment to grant the necessary administrative roles and configure
any associated governance mechanisms._

#### Parameters

| Name                 | Type      | Description                                                           |
| -------------------- | --------- | --------------------------------------------------------------------- |
| defaultAdminMembers  | address[] | The list of addresses to be granted the default admin role.           |
| isbeMembers          | address[] | The list of addresses to be granted a specific ISBE operational role. |
| isbeGovernanceFacets | bytes32[] | The encoded data for any governance facets to be configured.          |

### deployTransparent

```solidity
function deployTransparent(bytes32 businessId, struct IAccessControl.Rbac[] rbacs, bytes initData) external
```

Deploys a new transparent proxy contract with specified logic and access control.

_This function should handle the creation of a new transparent upgradeable proxy,
link it to an implementation contract (identified by `businessId`), and execute its
initialisation routine using the provided `initData`._

#### Parameters

| Name       | Type                         | Description                                                          |
| ---------- | ---------------------------- | -------------------------------------------------------------------- |
| businessId | bytes32                      | The identifier for the business logic (implementation) contract.     |
| rbacs      | struct IAccessControl.Rbac[] | An array of access control roles to configure on the new proxy.      |
| initData   | bytes                        | The encoded function call data used to initialise the proxy's state. |

### deployDiamond

```solidity
function deployDiamond(bytes32[] businessIds, struct IAccessControl.Rbac[] rbacs, bytes32 initBusinessId, bytes initData) external
```

Deploys a new EIP-2535 Diamond proxy with a specified set of facets and access control.

_This function should handle the creation of a diamond proxy, attach a set of facets
(identified by `businessIds`), and configure the access control roles. It must also
be able to execute an initialisation function on one of the specified facets._

#### Parameters

| Name           | Type                         | Description                                                             |
| -------------- | ---------------------------- | ----------------------------------------------------------------------- |
| businessIds    | bytes32[]                    | A list of identifiers for the specific business logic facets to attach. |
| rbacs          | struct IAccessControl.Rbac[] | An array of access control roles to configure on the new diamond.       |
| initBusinessId | bytes32                      | The identifier of the facet that contains the initialisation function.  |
| initData       | bytes                        | The encoded call data for the initialisation function.                  |

---

## ProxyFactoryInternal

### ProxyFactoryStorage

```solidity
struct ProxyFactoryStorage {
  struct EnumerableSet.AddressSet defaultAdminRoleMembers;
  struct EnumerableSet.AddressSet isbeRoleMembers;
  struct EnumerableSet.Bytes32Set isbeGovernanceFacets;
  mapping(bytes32 => struct EnumerableSet.AddressSet) businessIdToProxyAddress;
  mapping(address => struct EnumerableSet.Bytes32Set) proxyAddressToBusinessIds;
}
```

### \_initializeProxyFactory

```solidity
function _initializeProxyFactory(address[] defaultAdminMembers, address[] isbeMembers, bytes32[] isbeGovernanceFacets) internal
```

### \_deployTransparent

```solidity
function _deployTransparent(bytes32 businessId, struct IAccessControl.Rbac[] rbacs, bytes data) internal returns (address proxyAddress)
```

### \_deployDiamond

```solidity
function _deployDiamond(bytes32[] businessIds, struct IAccessControl.Rbac[] rbacs, bytes32 initBusinessId, bytes initData) internal returns (address proxyAddress)
```
