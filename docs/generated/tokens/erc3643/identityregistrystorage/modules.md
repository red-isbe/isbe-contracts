## IIdentityStorageManagement

Interface to manage storage identities

_Identity lifecycle operations_

### IdentityStored

```solidity
event IdentityStored(address investorAddress, contract IIdentity identity)
```

this event is emitted when an Identity is registered into the storage contract.
the event is emitted by the 'registerIdentity' function
`investorAddress` is the address of the investor's wallet
`identity` is the address of the Identity smart contract (onchainID)

### IdentityUnstored

```solidity
event IdentityUnstored(address investorAddress, contract IIdentity identity)
```

this event is emitted when an Identity is removed from the storage contract.
the event is emitted by the 'deleteIdentity' function
`investorAddress` is the address of the investor's wallet
`identity` is the address of the Identity smart contract (onchainID)

### IdentityModified

```solidity
event IdentityModified(contract IIdentity oldIdentity, contract IIdentity newIdentity)
```

this event is emitted when an Identity has been updated
the event is emitted by the 'updateIdentity' function
`oldIdentity` is the old Identity contract's address to update
`newIdentity` is the new Identity contract's

### CountryModified

```solidity
event CountryModified(address investorAddress, uint16 country)
```

this event is emitted when an Identity's country has been updated
the event is emitted by the 'updateCountry' function
`investorAddress` is the address on which the country has been updated
`country` is the numeric code (ISO 3166-1) of the new country

### addIdentityToStorage

```solidity
function addIdentityToStorage(address _userAddress, contract IIdentity _identity, uint16 _country) external
```

@dev adds an identity contract corresponding to a user address in the storage.
Requires that the user doesn't have an identity contract already registered.
This function can only be called by an address set as agent of the smart contract
@param \_userAddress The address of the user
@param \_identity The address of the user's identity contract
@param \_country The country of the investor
emits `IdentityStored` event

### removeIdentityFromStorage

```solidity
function removeIdentityFromStorage(address _userAddress) external
```

@dev Removes an user from the storage.
Requires that the user have an identity contract already deployed that will be deleted.
This function can only be called by an address set as agent of the smart contract
@param \_userAddress The address of the user to be removed
emits `IdentityUnstored` event

### modifyStoredInvestorCountry

```solidity
function modifyStoredInvestorCountry(address _userAddress, uint16 _country) external
```

@dev Updates the country corresponding to a user address.
Requires that the user should have an identity contract already deployed that will be replaced.
This function can only be called by an address set as agent of the smart contract
@param \_userAddress The address of the user
@param \_country The new country of the user
emits `CountryModified` event

### modifyStoredIdentity

```solidity
function modifyStoredIdentity(address _userAddress, contract IIdentity _identity) external
```

@dev Updates an identity contract corresponding to a user address.
Requires that the user address should be the owner of the identity contract.
Requires that the user should have an identity contract already deployed that will be replaced.
This function can only be called by an address set as agent of the smart contract
@param \_userAddress The address of the user
@param \_identity The address of the user's new identity contract
emits `IdentityModified` event

### storedIdentity

```solidity
function storedIdentity(address _userAddress) external view returns (contract IIdentity)
```

@dev Returns the onchainID of an investor.
@param \_userAddress The wallet of the investor

### storedInvestorCountry

```solidity
function storedInvestorCountry(address _userAddress) external view returns (uint16)
```

@dev Returns the country code of an investor.
@param \_userAddress The wallet of the investor

---

## IIdentityStorageRegistryManagement

Interface to manage linked registries

_Registry binding logic_

### IdentityRegistryBound

```solidity
event IdentityRegistryBound(address identityRegistry)
```

this event is emitted when an Identity Registry is bound to the storage contract
the event is emitted by the 'addIdentityRegistry' function
`identityRegistry` is the address of the identity registry added

### IdentityRegistryUnbound

```solidity
event IdentityRegistryUnbound(address identityRegistry)
```

this event is emitted when an Identity Registry is unbound from the storage contract
the event is emitted by the 'removeIdentityRegistry' function
`identityRegistry` is the address of the identity registry removed

### bindIdentityRegistry

```solidity
function bindIdentityRegistry(address _identityRegistry) external
```

@notice Adds an identity registry as agent of the Identity Registry Storage Contract.
This function can only be called by the wallet set as owner of the smart contract
This function adds the identity registry to the list of identityRegistries linked to the storage contract
cannot bind more than 300 IR to 1 IRS
@param \_identityRegistry The identity registry address to add.

### unbindIdentityRegistry

```solidity
function unbindIdentityRegistry(address _identityRegistry) external
```

@notice Removes an identity registry from being agent of the Identity Registry Storage Contract.
This function can only be called by the wallet set as owner of the smart contract
This function removes the identity registry from the list of identityRegistries linked to the storage contract
@param \_identityRegistry The identity registry address to remove.

### linkedIdentityRegistries

```solidity
function linkedIdentityRegistries() external view returns (address[])
```

@dev Returns the identity registries linked to the storage contract
