## AccessControl

Implements role-based access control mechanisms

_Inherits from IAccessControl and Common, providing external role management functions_

### protectISBERole

```solidity
modifier protectISBERole(bytes32 _role)
```

### constructor

```solidity
constructor() internal
```

Constructor that disables the initializer

### initializeAccessControl

```solidity
function initializeAccessControl(struct IAccessControl.Rbac[] _rbacs) external
```

Initializes the access control contract

#### Parameters

| Name    | Type                         | Description                                                          |
| ------- | ---------------------------- | -------------------------------------------------------------------- |
| \_rbacs | struct IAccessControl.Rbac[] | Array of role-based access control configurations to initialize with |

### grantRole

```solidity
function grantRole(bytes32 _role, address _account) external
```

Grants a role to an account

#### Parameters

| Name      | Type    | Description                      |
| --------- | ------- | -------------------------------- |
| \_role    | bytes32 | The role identifier              |
| \_account | address | The address to grant the role to |

### revokeRole

```solidity
function revokeRole(bytes32 _role, address _account) external
```

Revokes a role from an account

#### Parameters

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| \_role    | bytes32 | The role identifier                 |
| \_account | address | The address to revoke the role from |

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 _role, bytes32 _adminRole) external
```

Sets the admin role of a given role

#### Parameters

| Name        | Type    | Description                           |
| ----------- | ------- | ------------------------------------- |
| \_role      | bytes32 | The role whose admin is being changed |
| \_adminRole | bytes32 | The new admin role                    |

### renounceRole

```solidity
function renounceRole(bytes32 _role) external
```

Allows caller to renounce a role they hold

#### Parameters

| Name   | Type    | Description          |
| ------ | ------- | -------------------- |
| \_role | bytes32 | The role to renounce |

### hasRole

```solidity
function hasRole(bytes32 _role, address _account) external view returns (bool)
```

Checks if an account holds a given role

#### Parameters

| Name      | Type    | Description          |
| --------- | ------- | -------------------- |
| \_role    | bytes32 | The role identifier  |
| \_account | address | The address to check |

#### Return Values

| Name | Type | Description                                   |
| ---- | ---- | --------------------------------------------- |
| [0]  | bool | True if account has the role, false otherwise |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 _role) external view returns (bytes32)
```

Returns the admin role controlling a given role

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_role | bytes32 | The role to query |

#### Return Values

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| [0]  | bytes32 | The admin role associated with the role |

### getRoleMembersCount

```solidity
function getRoleMembersCount(bytes32 _role) external view returns (uint256)
```

Returns the number of members assigned to a specific role

#### Parameters

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| \_role | bytes32 | The role identifier |

#### Return Values

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| [0]  | uint256 | The total number of accounts that have been granted the role |

### getRoleMembers

```solidity
function getRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) external view returns (address[] members_)
```

Returns a paginated list of addresses that hold a specific role

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| \_role       | bytes32 | The role identifier                              |
| \_pageIndex  | uint256 | The index of the page to fetch (starting from 0) |
| \_pageLength | uint256 | The number of members to return per page         |

#### Return Values

| Name      | Type      | Description                                         |
| --------- | --------- | --------------------------------------------------- |
| members\_ | address[] | A list of addresses that have been granted the role |

### getRolesByAccountCount

```solidity
function getRolesByAccountCount(address _account) external view returns (uint256)
```

Returns the number of roles assigned to a specific account

#### Parameters

| Name      | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| \_account | address | The address whose roles are being queried |

#### Return Values

| Name | Type    | Description                               |
| ---- | ------- | ----------------------------------------- |
| [0]  | uint256 | The total number of roles the account has |

### getRolesByAccount

```solidity
function getRolesByAccount(address _account, uint256 _pageIndex, uint256 _pageLength) external view returns (bytes32[] roles_)
```

Returns a paginated list of roles assigned to a specific account

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| \_account    | address | The address whose roles are being queried        |
| \_pageIndex  | uint256 | The index of the page to fetch (starting from 0) |
| \_pageLength | uint256 | The number of roles to return per page           |

#### Return Values

| Name    | Type      | Description                                       |
| ------- | --------- | ------------------------------------------------- |
| roles\_ | bytes32[] | A list of role identifiers that the account holds |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this contract

#### Return Values

| Name         | Type     | Description            |
| ------------ | -------- | ---------------------- |
| interfaces\_ | bytes4[] | Array of interface IDs |

### \_protectISBERole

```solidity
function _protectISBERole(bytes32 _role) internal pure virtual
```

Checks if a role is an ISBE role and protects it from modifications

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_role | bytes32 | The role to check |

### \_isISBERole

```solidity
function _isISBERole(bytes32 _role) internal pure returns (bool)
```

Checks if a role is an ISBE role

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_role | bytes32 | The role to check |

#### Return Values

| Name | Type | Description                                       |
| ---- | ---- | ------------------------------------------------- |
| [0]  | bool | True if the role is an ISBE role, false otherwise |

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
  mapping(address => struct EnumerableSet.Bytes32Set) rolesByAccount;
}
```

### RoleData

Struct storing members and admin role for a specific role

```solidity
struct RoleData {
  struct EnumerableSet.AddressSet members;
  bytes32 adminRole;
}
```

### onlyRole

```solidity
modifier onlyRole(bytes32 _role)
```

Modifier to restrict function to accounts with a specific role

_Reverts with `AccountHasNoRole` error if the account does not have the specific role_

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_role | bytes32 | The required role |

### \_initializeRbacs

```solidity
function _initializeRbacs(struct IAccessControl.Rbac[] _rbacs) internal virtual
```

### \_setRoleAdmin

```solidity
function _setRoleAdmin(bytes32 _role, bytes32 _adminRole) internal virtual
```

### \_grantRole

```solidity
function _grantRole(bytes32 _role, address _account) internal virtual
```

### \_grantRoles

```solidity
function _grantRoles(bytes32 _role, address[] _accounts) internal virtual
```

### \_revokeRole

```solidity
function _revokeRole(bytes32 _role, address _account) internal virtual
```

### \_hasRole

```solidity
function _hasRole(bytes32 _role, address _account) internal view virtual returns (bool)
```

### \_getRoleAdmin

```solidity
function _getRoleAdmin(bytes32 _role) internal view virtual returns (bytes32)
```

### \_checkRole

```solidity
function _checkRole(bytes32 _role) internal view virtual
```

### \_checkRole

```solidity
function _checkRole(bytes32 _role, address _account) internal view virtual
```

### \_checkRoles

```solidity
function _checkRoles(bytes32[] _roles) internal view virtual
```

### \_checkRoles

```solidity
function _checkRoles(bytes32[] _roles, address _account) internal view virtual
```

### \_getRoleMembersCount

```solidity
function _getRoleMembersCount(bytes32 _role) internal view virtual returns (uint256)
```

### \_getRoleMembers

```solidity
function _getRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) internal view virtual returns (address[] members_)
```

### \_getRolesByAccountCount

```solidity
function _getRolesByAccountCount(address _account) internal view virtual returns (uint256)
```

### \_getRolesByAccount

```solidity
function _getRolesByAccount(address _account, uint256 _pageIndex, uint256 _pageLength) internal view virtual returns (bytes32[] roles_)
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

### MissingAdminRole

```solidity
error MissingAdminRole()
```

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

### RoleIsImmutable

```solidity
error RoleIsImmutable(bytes32 role)
```

Error indicating that a role is immutable and it's members cannot be changed

#### Parameters

| Name | Type    | Description                   |
| ---- | ------- | ----------------------------- |
| role | bytes32 | The immutable role identifier |

### AtLeastOneMemberForRole

```solidity
error AtLeastOneMemberForRole(bytes32 role)
```

Error indicating that there has to be at least one member for a role

#### Parameters

| Name | Type    | Description         |
| ---- | ------- | ------------------- |
| role | bytes32 | The role identifier |

### initializeAccessControl

```solidity
function initializeAccessControl(struct IAccessControl.Rbac[] _rbacs) external
```

Initializes the Access Control contrl grating roles

#### Parameters

| Name    | Type                         | Description                       |
| ------- | ---------------------------- | --------------------------------- |
| \_rbacs | struct IAccessControl.Rbac[] | Addresses and roles to be granted |

### grantRole

```solidity
function grantRole(bytes32 _role, address _account) external
```

Grants a role to an account

#### Parameters

| Name      | Type    | Description                      |
| --------- | ------- | -------------------------------- |
| \_role    | bytes32 | The role identifier              |
| \_account | address | The address to grant the role to |

### revokeRole

```solidity
function revokeRole(bytes32 _role, address _account) external
```

Revokes a role from an account

#### Parameters

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| \_role    | bytes32 | The role identifier                 |
| \_account | address | The address to revoke the role from |

### renounceRole

```solidity
function renounceRole(bytes32 _role) external
```

Allows caller to renounce a role they hold

#### Parameters

| Name   | Type    | Description          |
| ------ | ------- | -------------------- |
| \_role | bytes32 | The role to renounce |

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 _role, bytes32 _adminRole) external
```

Sets the admin role of a given role

#### Parameters

| Name        | Type    | Description                           |
| ----------- | ------- | ------------------------------------- |
| \_role      | bytes32 | The role whose admin is being changed |
| \_adminRole | bytes32 | The new admin role                    |

### hasRole

```solidity
function hasRole(bytes32 _role, address _account) external view returns (bool)
```

Checks if an account holds a given role

#### Parameters

| Name      | Type    | Description          |
| --------- | ------- | -------------------- |
| \_role    | bytes32 | The role identifier  |
| \_account | address | The address to check |

#### Return Values

| Name | Type | Description                                   |
| ---- | ---- | --------------------------------------------- |
| [0]  | bool | True if account has the role, false otherwise |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 _role) external view returns (bytes32)
```

Returns the admin role controlling a given role

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_role | bytes32 | The role to query |

#### Return Values

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| [0]  | bytes32 | The admin role associated with the role |

### getRoleMembersCount

```solidity
function getRoleMembersCount(bytes32 _role) external view returns (uint256)
```

Returns the number of members assigned to a specific role

#### Parameters

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| \_role | bytes32 | The role identifier |

#### Return Values

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| [0]  | uint256 | The total number of accounts that have been granted the role |

### getRoleMembers

```solidity
function getRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) external view returns (address[] members_)
```

Returns a paginated list of addresses that hold a specific role

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| \_role       | bytes32 | The role identifier                              |
| \_pageIndex  | uint256 | The index of the page to fetch (starting from 0) |
| \_pageLength | uint256 | The number of members to return per page         |

#### Return Values

| Name      | Type      | Description                                         |
| --------- | --------- | --------------------------------------------------- |
| members\_ | address[] | A list of addresses that have been granted the role |

### getRolesByAccountCount

```solidity
function getRolesByAccountCount(address _account) external view returns (uint256)
```

Returns the number of roles assigned to a specific account

#### Parameters

| Name      | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| \_account | address | The address whose roles are being queried |

#### Return Values

| Name | Type    | Description                               |
| ---- | ------- | ----------------------------------------- |
| [0]  | uint256 | The total number of roles the account has |

### getRolesByAccount

```solidity
function getRolesByAccount(address _account, uint256 _pageIndex, uint256 _pageLength) external view returns (bytes32[] roles_)
```

Returns a paginated list of roles assigned to a specific account

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| \_account    | address | The address whose roles are being queried        |
| \_pageIndex  | uint256 | The index of the page to fetch (starting from 0) |
| \_pageLength | uint256 | The number of roles to return per page           |

#### Return Values

| Name    | Type      | Description                                       |
| ------- | --------- | ------------------------------------------------- |
| roles\_ | bytes32[] | A list of role identifiers that the account holds |
