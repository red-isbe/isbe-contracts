## AccessControl

Implements EOA-based role access control mechanisms

_Inherits from IAccessControlEoa and Common, providing address-based role management functions_

### constructor

```solidity
constructor() internal
```

Constructor that disables the initializer

### initializeAccessControl

```solidity
function initializeAccessControl(struct IAccessControlEoa.Rbac[] _rbacs) external
```

Initializes the access control contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _rbacs | struct IAccessControlEoa.Rbac[] | Array of role-based access control configurations to initialize with |

### grantRole

```solidity
function grantRole(bytes32 _role, address _account) external
```

### revokeRole

```solidity
function revokeRole(bytes32 _role, address _account) external
```

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 _role, bytes32 _adminRole) external
```

### renounceRole

```solidity
function renounceRole(bytes32 _role) external
```

### hasRole

```solidity
function hasRole(bytes32 _role, address _account) external view returns (bool)
```

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 _role) external view returns (bytes32)
```

### getRoleMembersCount

```solidity
function getRoleMembersCount(bytes32 _role) external view returns (uint256)
```

### getRoleMembers

```solidity
function getRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) external view returns (address[] members_)
```

### getRolesByAccountCount

```solidity
function getRolesByAccountCount(address _account) external view returns (uint256)
```

### getRolesByAccount

```solidity
function getRolesByAccount(address _account, uint256 _pageIndex, uint256 _pageLength) external view returns (bytes32[] roles_)
```

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of interface IDs |



---

## AccessControlDid

Implements DID-based role access control mechanisms

_Inherits from IAccessControlDid and Common, providing DID role management functions_

### constructor

```solidity
constructor() internal
```

Constructor that disables the initializer

### initializeDidAccessControl

```solidity
function initializeDidAccessControl(struct IAccessControlDid.RbacDid[] _rbacs) external virtual
```

Initializes the DID Access Control system, granting initial DID roles

_Does not store DidRegistry address - queries are made to address(this) or configured address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _rbacs | struct IAccessControlDid.RbacDid[] | Initial roles and DID hashes to be granted |

### grantDidRole

```solidity
function grantDidRole(bytes32 _role, bytes32 _did) external virtual
```

Grants a role to a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |
| _did | bytes32 | The DID hash to grant the role to |

### revokeDidRole

```solidity
function revokeDidRole(bytes32 _role, bytes32 _did) external virtual
```

Revokes a role from a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |
| _did | bytes32 | The DID hash to revoke the role from |

### getRoleMembersCountForDids

```solidity
function getRoleMembersCountForDids(bytes32 _role) external view virtual returns (uint256)
```

Returns the total number of DIDs that have been granted the role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of DIDs that have been granted the role |

### getDidRoleMembers

```solidity
function getDidRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) external view virtual returns (bytes32[] dids_)
```

Returns a paginated list of DIDs that have been granted the role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |
| _pageIndex | uint256 | The index of the page to fetch (starting from 0) |
| _pageLength | uint256 | The number of DIDs to return per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| dids_ | bytes32[] | A list of DIDs that have been granted the role |

### getRolesByDidLength

```solidity
function getRolesByDidLength(bytes32 _did) external view virtual returns (uint256)
```

Returns the number of roles assigned to a specific DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | The DID whose roles are being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of roles the DID has |

### getRolesByDid

```solidity
function getRolesByDid(bytes32 _did, uint256 _pageIndex, uint256 _pageLength) external view virtual returns (bytes32[] roles_)
```

Returns a paginated list of roles assigned to a specific DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | The DID whose roles are being queried |
| _pageIndex | uint256 | The index of the page to fetch (starting from 0) |
| _pageLength | uint256 | The number of roles to return per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| roles_ | bytes32[] | A list of role identifiers that the DID holds |

### hasRoleForDid

```solidity
function hasRoleForDid(bytes32 _role, bytes32 _didHash) external view virtual returns (bool)
```

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```



---

## AccessControlDidFacet

Access Control DID Facet smart contract

_Adds IEIP2535Introspection functionality for DID-based access control_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## AccessControlFacet

Access Control EOA Facet smart contract

_Adds IEIP2535Introspection functionality for address-based access control_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## AccessControlInternal

Internal logic for role-based access control

### AccessControlStorage

Struct storing all roles and their data

```solidity
struct AccessControlStorage {
  mapping(bytes32 => struct AccessControlInternal.RoleData) roles;
  mapping(address => struct EnumerableSet.Bytes32Set) rolesByAccount;
  mapping(bytes32 => struct EnumerableSet.Bytes32Set) didRolesByAccount;
}
```

### RoleData

Struct storing members and admin role for a specific role

```solidity
struct RoleData {
  struct EnumerableSet.AddressSet members;
  struct EnumerableSet.Bytes32Set didMembers;
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

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The required role |

### protectISBERole

```solidity
modifier protectISBERole(bytes32 _role)
```

Modifier to protect ISBE role from being modified

_Reverts with `RoleIsImmutable` error if the role is the ISBE role_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role to check |

### _initializeRbacs

```solidity
function _initializeRbacs(struct IAccessControlEoa.Rbac[] _rbacs) internal virtual
```

### _initializeDidAccessControl

```solidity
function _initializeDidAccessControl(struct IAccessControlDid.RbacDid[] _rbacs) internal virtual
```

Initializes DID-based roles

_Does not store DidRegistry address - DID resolution happens via address(this)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _rbacs | struct IAccessControlDid.RbacDid[] | Array of DID roles to initialize |

### _setRoleAdmin

```solidity
function _setRoleAdmin(bytes32 _role, bytes32 _adminRole) internal virtual
```

### _grantRole

```solidity
function _grantRole(bytes32 _role, address _account) internal virtual
```

### _grantRoles

```solidity
function _grantRoles(bytes32 _role, address[] _accounts) internal virtual
```

### _revokeRole

```solidity
function _revokeRole(bytes32 _role, address _account) internal virtual
```

### _grantDidRole

```solidity
function _grantDidRole(bytes32 _role, bytes32 _did) internal virtual
```

### _revokeDidRole

```solidity
function _revokeDidRole(bytes32 _role, bytes32 _did) internal virtual
```

### _hasRole

```solidity
function _hasRole(bytes32 _role, address _account) internal view virtual returns (bool)
```

### _hasEoaRole

```solidity
function _hasEoaRole(bytes32 _role, address _account) internal view virtual returns (bool)
```

### _getRoleAdmin

```solidity
function _getRoleAdmin(bytes32 _role) internal view virtual returns (bytes32)
```

### _checkRole

```solidity
function _checkRole(bytes32 _role) internal view virtual
```

### _checkRole

```solidity
function _checkRole(bytes32 _role, address _account) internal view virtual
```

### _checkRoles

```solidity
function _checkRoles(bytes32[] _roles) internal view virtual
```

### _checkRoles

```solidity
function _checkRoles(bytes32[] _roles, address _account) internal view virtual
```

### _getRoleMembersCount

```solidity
function _getRoleMembersCount(bytes32 _role) internal view virtual returns (uint256)
```

### _getRoleMembers

```solidity
function _getRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) internal view virtual returns (address[] members_)
```

### _getRolesByAccountCount

```solidity
function _getRolesByAccountCount(address _account) internal view virtual returns (uint256)
```

### _getRolesByAccount

```solidity
function _getRolesByAccount(address _account, uint256 _pageIndex, uint256 _pageLength) internal view virtual returns (bytes32[] roles_)
```

### _hasDidRole

```solidity
function _hasDidRole(bytes32 _role, bytes32 _did) internal view virtual returns (bool)
```

### _getDidRoleMembersCount

```solidity
function _getDidRoleMembersCount(bytes32 _role) internal view virtual returns (uint256)
```

### _getDidRoleMembers

```solidity
function _getDidRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) internal view virtual returns (bytes32[] dids_)
```

### _getRolesByDidCount

```solidity
function _getRolesByDidCount(bytes32 _did) internal view virtual returns (uint256)
```

### _getRolesByDid

```solidity
function _getRolesByDid(bytes32 _did, uint256 _pageIndex, uint256 _pageLength) internal view virtual returns (bytes32[] roles_)
```

### _resolveDidOf

```solidity
function _resolveDidOf(address _account) internal view returns (bytes32)
```

Resolves an address to its associated DID hash by querying the DidRegistry

_CRITICAL: Always queries DidRegistry - no local caching or storage.
     Works for both same-Diamond and cross-Diamond architectures via _getGovernanceAddress():
     - IsbeProxy: queries configurationManager (external resolution)
     - EIP2535AccessControl: queries address(this) (internal Diamond resolution)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The address to resolve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | bytes32 The DID hash if found and active, otherwise bytes32(0) |

### _localDidOf

```solidity
function _localDidOf(address) internal view virtual returns (bytes32)
```

Internal function to resolve DID locally - can be overridden by derived contracts

_Default implementation returns bytes32(0), indicating no local DID resolution_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | bytes32 The DID hash if found and active, otherwise bytes32(0) |

### _isbeFactoryDidOf

```solidity
function _isbeFactoryDidOf(address _account) internal view virtual returns (bytes32)
```

Resolves an address to its associated DID hash using the ISBE factory

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The address to resolve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | bytes32 The DID hash if found and active, otherwise bytes32(0) |

### _accessControlStorage

```solidity
function _accessControlStorage() internal pure returns (struct AccessControlInternal.AccessControlStorage storage_)
```

Returns the storage slot for access control

_Uses inline assembly to return storage struct at predefined slot_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| storage_ | struct AccessControlInternal.AccessControlStorage | The access control storage struct |

### _checkProtectISBERole

```solidity
function _checkProtectISBERole(bytes32 _role) internal pure virtual
```

### _isISBERole

```solidity
function _isISBERole(bytes32 _role) internal pure returns (bool)
```



---

## IAccessControl



---

## IAccessControlDid

Interface for role-based access control with DID support, designed to work alongside IAccessControl

_This interface provides DID-specific role management while preserving full compatibility with
     existing AccessControl patterns_

### RbacDid

_This struct is used to implement a simple role-based access control mechanism.
It defines a role and the list of DIDs that are members of that role._

```solidity
struct RbacDid {
  bytes32 role;
  bytes32[] dids;
}
```

### RoleGrantedToDid

```solidity
event RoleGrantedToDid(bytes32 role, bytes32 did, address sender)
```

Emitted when a role is granted to a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| did | bytes32 | The DID hash receiving the role |
| sender | address | The address that performed the grant |

### RoleRevokedFromDid

```solidity
event RoleRevokedFromDid(bytes32 role, bytes32 did, address sender)
```

Emitted when a role is revoked from a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| did | bytes32 | The DID hash losing the role |
| sender | address | The address that performed the revocation |

### DidAccessControlInitialized

```solidity
event DidAccessControlInitialized(uint256 initialRolesCount, address initializer)
```

Emitted when the DID Access Control system is initialized

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initialRolesCount | uint256 | The number of initial roles granted during initialization |
| initializer | address | The address that performed the initialization |

### initializeDidAccessControl

```solidity
function initializeDidAccessControl(struct IAccessControlDid.RbacDid[] _rbacs) external
```

Initializes the DID Access Control system, granting initial DID roles

_Does not store DidRegistry address - queries are made to address(this) or configured address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _rbacs | struct IAccessControlDid.RbacDid[] | Initial roles and DID hashes to be granted |

### grantDidRole

```solidity
function grantDidRole(bytes32 _role, bytes32 _did) external
```

Grants a role to a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |
| _did | bytes32 | The DID hash to grant the role to |

### revokeDidRole

```solidity
function revokeDidRole(bytes32 _role, bytes32 _did) external
```

Revokes a role from a DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |
| _did | bytes32 | The DID hash to revoke the role from |

### getRoleMembersCountForDids

```solidity
function getRoleMembersCountForDids(bytes32 _role) external view returns (uint256)
```

Returns the total number of DIDs that have been granted the role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of DIDs that have been granted the role |

### getDidRoleMembers

```solidity
function getDidRoleMembers(bytes32 _role, uint256 _pageIndex, uint256 _pageLength) external view returns (bytes32[] dids_)
```

Returns a paginated list of DIDs that have been granted the role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier |
| _pageIndex | uint256 | The index of the page to fetch (starting from 0) |
| _pageLength | uint256 | The number of DIDs to return per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| dids_ | bytes32[] | A list of DIDs that have been granted the role |

### getRolesByDidLength

```solidity
function getRolesByDidLength(bytes32 _did) external view returns (uint256)
```

Returns the number of roles assigned to a specific DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | The DID whose roles are being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of roles the DID has |

### getRolesByDid

```solidity
function getRolesByDid(bytes32 _did, uint256 _pageIndex, uint256 _pageLength) external view returns (bytes32[] roles_)
```

Returns a paginated list of roles assigned to a specific DID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | The DID whose roles are being queried |
| _pageIndex | uint256 | The index of the page to fetch (starting from 0) |
| _pageLength | uint256 | The number of roles to return per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| roles_ | bytes32[] | A list of role identifiers that the DID holds |

### hasRoleForDid

```solidity
function hasRoleForDid(bytes32 _role, bytes32 _did) external view returns (bool)
```

Checks if a specific DID hash has the specified role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | The role identifier to check |
| _did | bytes32 | The DID hash to check for role membership |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the DID hash has been granted the role |



---

## IAccessControlEoa

Interface for traditional address-based role access control

_This interface provides the standard OpenZeppelin-style access control functionality_

### Rbac

_This struct is used to implement a simple role-based access control mechanism.
It defines a role and the list of addresses that are members of that role._

```solidity
struct Rbac {
  bytes32 role;
  address[] members;
}
```

### RoleGranted

```solidity
event RoleGranted(bytes32 role, address account, address sender)
```

Emitted when a role is granted to an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| account | address | The address receiving the role |
| sender | address | The address that performed the grant |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 role, address account, address sender)
```

Emitted when a role is revoked from an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| account | address | The address losing the role |
| sender | address | The address that performed the revocation |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 role, bytes32 previousAdminRole, bytes32 newAdminRole, address sender)
```

Emitted when a role's admin is changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role whose admin is changing |
| previousAdminRole | bytes32 | The previous admin role |
| newAdminRole | bytes32 | The new admin role |
| sender | address | The address that performed the change |

### AccountHasNoRole

```solidity
error AccountHasNoRole(address account, bytes32 role)
```

_Error thrown when an account does not have a required role_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account that lacks the role |
| role | bytes32 | The required role that is missing |

### AccountHasNoRoles

```solidity
error AccountHasNoRoles(address account, bytes32[] roles)
```

_Error thrown when an account does not have any of the required roles_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account that lacks the roles |
| roles | bytes32[] | The array of roles, none of which the account has |

### RoleMustBeUnique

```solidity
error RoleMustBeUnique(bytes32 role)
```

_Error thrown when trying to assign duplicate roles_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The duplicate role |

### AtLeastOneMemberForRole

```solidity
error AtLeastOneMemberForRole(bytes32 role)
```

_Error thrown when trying to renounce the last member of a critical role_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role that must have at least one member |

### RoleIsImmutable

```solidity
error RoleIsImmutable(bytes32 role)
```

_Error thrown when trying to modify an immutable ISBE role_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The immutable role that cannot be modified |

### MissingAdminRole

```solidity
error MissingAdminRole()
```

_Error thrown when admin role is missing from initialization_

### RoleMemberMustBeUnique

```solidity
error RoleMemberMustBeUnique(bytes32 role, address member)
```

_Error thrown when trying to assign a role member that already exists_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| member | address | The member that already has the role |

### initializeAccessControl

```solidity
function initializeAccessControl(struct IAccessControlEoa.Rbac[] rbacs) external
```

Initializes the access control system with initial roles

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rbacs | struct IAccessControlEoa.Rbac[] | Array of roles and their initial members to be granted |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external
```

Grants a role to an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| account | address | The address to grant the role to |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external
```

Revokes a role from an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| account | address | The address to revoke the role from |

### renounceRole

```solidity
function renounceRole(bytes32 role) external
```

Renounces a role (can only be called by the role holder)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 role, bytes32 adminRole) external
```

Sets the admin role for a given role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role whose admin is being set |
| adminRole | bytes32 | The role that will become the admin |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

Checks if an account has a specific role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier to check |
| account | address | The address to check for role membership |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the account has the role |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

Returns the admin role that controls the given role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The admin role identifier |

### getRoleMembersCount

```solidity
function getRoleMembersCount(bytes32 role) external view returns (uint256)
```

Returns the number of accounts that have a specific role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of accounts with the role |

### getRoleMembers

```solidity
function getRoleMembers(bytes32 role, uint256 pageIndex, uint256 pageLength) external view returns (address[] members_)
```

Returns a paginated list of addresses that have a specific role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| role | bytes32 | The role identifier |
| pageIndex | uint256 | The page index (starting from 0) |
| pageLength | uint256 | The number of addresses to return per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| members_ | address[] | Array of addresses that have the role |

### getRolesByAccountCount

```solidity
function getRolesByAccountCount(address account) external view returns (uint256)
```

Returns the number of roles assigned to a specific address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose roles are being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of roles the address has |

### getRolesByAccount

```solidity
function getRolesByAccount(address account, uint256 pageIndex, uint256 pageLength) external view returns (bytes32[] roles_)
```

Returns a paginated list of roles assigned to a specific address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address whose roles are being queried |
| pageIndex | uint256 | The page index (starting from 0) |
| pageLength | uint256 | The number of roles to return per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| roles_ | bytes32[] | Array of role identifiers that the address holds |

