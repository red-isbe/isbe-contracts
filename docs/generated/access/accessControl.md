## AccessControl

Implements role-based access control mechanisms

_Inherits from IAccessControl and Common, providing external role management functions_

### constructor

```solidity
constructor() public
```

Constructor that disables the initializer

### initializeAccessControl

```solidity
function initializeAccessControl(address admin) external
```

Initializes the Access Control contrl grating admin right to an account

#### Parameters

| Name  | Type    | Description                            |
| ----- | ------- | -------------------------------------- |
| admin | address | The address to grant the admin role to |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external
```

Grants a role to an account

#### Parameters

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| role    | bytes32 | The role identifier              |
| account | address | The address to grant the role to |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external
```

Revokes a role from an account

#### Parameters

| Name    | Type    | Description                         |
| ------- | ------- | ----------------------------------- |
| role    | bytes32 | The role identifier                 |
| account | address | The address to revoke the role from |

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 role, bytes32 adminRole) external
```

Sets the admin role of a given role

#### Parameters

| Name      | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| role      | bytes32 | The role whose admin is being changed |
| adminRole | bytes32 | The new admin role                    |

### renounceRole

```solidity
function renounceRole(bytes32 role) external
```

Allows caller to renounce a role they hold

#### Parameters

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| role | bytes32 | The role to renounce |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

Checks if an account holds a given role

#### Parameters

| Name    | Type    | Description          |
| ------- | ------- | -------------------- |
| role    | bytes32 | The role identifier  |
| account | address | The address to check |

#### Return Values

| Name | Type | Description                                   |
| ---- | ---- | --------------------------------------------- |
| [0]  | bool | True if account has the role, false otherwise |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

Returns the admin role controlling a given role

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| role | bytes32 | The role to query |

#### Return Values

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| [0]  | bytes32 | The admin role associated with the role |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## AccessControlFacet

Access Control Facet smart contract

_Adds IEIP2535Introspection functionality_

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

## AccessControlInternal

Internal logic for role-based access control

### AccessControlStorage

Struct storing all roles and their data

```solidity
struct AccessControlStorage {
  mapping(bytes32 => struct AccessControlInternal.RoleData) roles;
}
```

### RoleData

Struct storing members and admin role for a specific role

```solidity
struct RoleData {
    mapping(address => bool) members;
    bytes32 adminRole;
}
```

### DEFAULT_ADMIN_ROLE

```solidity
bytes32 DEFAULT_ADMIN_ROLE
```

Constant value representing the default admin role

### onlyRole

```solidity
modifier onlyRole(bytes32 role)
```

Modifier to restrict function to accounts with a specific role

_Reverts with `AccountHasNoRole` error if the account does not have the specific role_

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| role | bytes32 | The required role |

### \_initializeRbacs

```solidity
function _initializeRbacs(struct IAccessControl.Rbac[] rbacs) internal virtual
```

### \_setRoleAdmin

```solidity
function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual
```

### \_grantRole

```solidity
function _grantRole(bytes32 role, address account) internal virtual
```

### \_grantRoles

```solidity
function _grantRoles(bytes32 role, address[] accounts) internal virtual
```

### \_revokeRole

```solidity
function _revokeRole(bytes32 role, address account) internal virtual
```

### \_hasRole

```solidity
function _hasRole(bytes32 role, address account) internal view virtual returns (bool)
```

### \_getRoleAdmin

```solidity
function _getRoleAdmin(bytes32 role) internal view virtual returns (bytes32)
```

### \_checkRole

```solidity
function _checkRole(bytes32 role) internal view virtual
```

### \_checkRole

```solidity
function _checkRole(bytes32 role, address account) internal view virtual
```

### \_checkRoles

```solidity
function _checkRoles(bytes32[] roles) internal view virtual
```

### \_checkRoles

```solidity
function _checkRoles(bytes32[] roles, address account) internal view virtual
```

### \_accessControlStorage

```solidity
function _accessControlStorage() internal pure returns (struct AccessControlInternal.AccessControlStorage storage_)
```

Returns the storage slot for access control

_Uses inline assembly to return storage struct at predefined slot_

#### Return Values

| Name      | Type                                              | Description                       |
| --------- | ------------------------------------------------- | --------------------------------- |
| storage\_ | struct AccessControlInternal.AccessControlStorage | The access control storage struct |

---

## IAccessControl

External interface for role-based access control functionality

### Rbac

_This struct is used to implement a simple role-based access control mechanism.
It defines a role and the list of addresses that are members of that role._

```solidity
struct Rbac {
    bytes32 role;
    address[] members;
}
```

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole, address sender)
```

Emitted when a role's admin role is changed

#### Parameters

| Name              | Type    | Description                          |
| ----------------- | ------- | ------------------------------------ |
| role              | bytes32 | The role identifier                  |
| previousAdminRole | bytes32 | The previous admin role              |
| newAdminRole      | bytes32 | The new admin role                   |
| sender            | address | The address that performed the grant |

### RoleGranted

```solidity
event RoleGranted(bytes32 role, address account, address sender)
```

Emitted when a role is granted to an account

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| role    | bytes32 | The role identifier                  |
| account | address | The account receiving the role       |
| sender  | address | The address that performed the grant |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 role, address account, address sender)
```

Emitted when a role is revoked from an account

#### Parameters

| Name    | Type    | Description                               |
| ------- | ------- | ----------------------------------------- |
| role    | bytes32 | The role identifier                       |
| account | address | The account losing the role               |
| sender  | address | The address that performed the revocation |

### RoleMustBeUnique

```solidity
error RoleMustBeUnique(bytes32 role)
```

### RoleMemberMustBeUnique

```solidity
error RoleMemberMustBeUnique(bytes32 role, address member)
```

### AccountHasNoRole

```solidity
error AccountHasNoRole(address account, bytes32 role)
```

Error indicating an account does not hold a required role

#### Parameters

| Name    | Type    | Description               |
| ------- | ------- | ------------------------- |
| account | address | The account being checked |
| role    | bytes32 | The role required         |

### AccountHasNoRoles

```solidity
error AccountHasNoRoles(address account, bytes32[] roles)
```

Error indicating an account does not hold any of the required roles

#### Parameters

| Name    | Type      | Description               |
| ------- | --------- | ------------------------- |
| account | address   | The account being checked |
| roles   | bytes32[] | The roles required        |

### initializeAccessControl

```solidity
function initializeAccessControl(address admin) external
```

Initializes the Access Control contrl grating admin right to an account

#### Parameters

| Name  | Type    | Description                            |
| ----- | ------- | -------------------------------------- |
| admin | address | The address to grant the admin role to |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external
```

Grants a role to an account

#### Parameters

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| role    | bytes32 | The role identifier              |
| account | address | The address to grant the role to |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external
```

Revokes a role from an account

#### Parameters

| Name    | Type    | Description                         |
| ------- | ------- | ----------------------------------- |
| role    | bytes32 | The role identifier                 |
| account | address | The address to revoke the role from |

### renounceRole

```solidity
function renounceRole(bytes32 role) external
```

Allows caller to renounce a role they hold

#### Parameters

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| role | bytes32 | The role to renounce |

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 role, bytes32 adminRole) external
```

Sets the admin role of a given role

#### Parameters

| Name      | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| role      | bytes32 | The role whose admin is being changed |
| adminRole | bytes32 | The new admin role                    |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

Checks if an account holds a given role

#### Parameters

| Name    | Type    | Description          |
| ------- | ------- | -------------------- |
| role    | bytes32 | The role identifier  |
| account | address | The address to check |

#### Return Values

| Name | Type | Description                                   |
| ---- | ---- | --------------------------------------------- |
| [0]  | bool | True if account has the role, false otherwise |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

Returns the admin role controlling a given role

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| role | bytes32 | The role to query |

#### Return Values

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| [0]  | bytes32 | The admin role associated with the role |
