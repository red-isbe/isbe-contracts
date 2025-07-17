## IIdentityManagement

Interface to handle the registration, update, and removal of user identities and country

_Defines the core lifecycle operations for managing investor identity data_

### IdentityRegistered

```solidity
event IdentityRegistered(address investorAddress, contract IIdentity identity)
```

this event is emitted when an Identity is registered into the Identity Registry.
the event is emitted by the 'registerIdentity' function
`investorAddress` is the address of the investor's wallet
`identity` is the address of the Identity smart contract (onchainID)

### IdentityRemoved

```solidity
event IdentityRemoved(address investorAddress, contract IIdentity identity)
```

this event is emitted when an Identity is removed from the Identity Registry.
the event is emitted by the 'deleteIdentity' function
`investorAddress` is the address of the investor's wallet
`identity` is the address of the Identity smart contract (onchainID)

### IdentityUpdated

```solidity
event IdentityUpdated(contract IIdentity oldIdentity, contract IIdentity newIdentity)
```

this event is emitted when an Identity has been updated
the event is emitted by the 'updateIdentity' function
`oldIdentity` is the old Identity contract's address to update
`newIdentity` is the new Identity contract's

### CountryUpdated

```solidity
event CountryUpdated(address investorAddress, uint16 country)
```

this event is emitted when an Identity's country has been updated
the event is emitted by the 'updateCountry' function
`investorAddress` is the address on which the country has been updated
`country` is the numeric code (ISO 3166-1) of the new country

### registerIdentity

```solidity
function registerIdentity(address _userAddress, contract IIdentity _identity, uint16 _country) external
```

@dev Register an identity contract corresponding to a user address.
Requires that the user doesn't have an identity contract already registered.
This function can only be called by a wallet set as agent of the smart contract
@param \_userAddress The address of the user
@param \_identity The address of the user's identity contract
@param \_country The country of the investor
emits `IdentityRegistered` event

### deleteIdentity

```solidity
function deleteIdentity(address _userAddress) external
```

@dev Removes an user from the identity registry.
Requires that the user have an identity contract already deployed that will be deleted.
This function can only be called by a wallet set as agent of the smart contract
@param \_userAddress The address of the user to be removed
emits `IdentityRemoved` event

### updateIdentity

```solidity
function updateIdentity(address _userAddress, contract IIdentity _identity) external
```

@dev Updates an identity contract corresponding to a user address.
Requires that the user address should be the owner of the identity contract.
Requires that the user should have an identity contract already deployed that will be replaced.
This function can only be called by a wallet set as agent of the smart contract
@param \_userAddress The address of the user
@param \_identity The address of the user's new identity contract
emits `IdentityUpdated` event

### batchRegisterIdentity

```solidity
function batchRegisterIdentity(address[] _userAddresses, contract IIdentity[] _identities, uint16[] _countries) external
```

@dev function allowing to register identities in batch
This function can only be called by a wallet set as agent of the smart contract
Requires that none of the users has an identity contract already registered.
IMPORTANT : THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_userAddresses.length` IS TOO HIGH,
USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
@param \_userAddresses The addresses of the users
@param \_identities The addresses of the corresponding identity contracts
@param \_countries The countries of the corresponding investors
emits \_userAddresses.length `IdentityRegistered` events

### updateCountry

```solidity
function updateCountry(address _userAddress, uint16 _country) external
```

@dev Updates the country corresponding to a user address.
Requires that the user should have an identity contract already deployed that will be replaced.
This function can only be called by a wallet set as agent of the smart contract
@param \_userAddress The address of the user
@param \_country The new country of the user
emits `CountryUpdated` event

### contains

```solidity
function contains(address _userAddress) external view returns (bool)
```

@dev This functions checks whether a wallet has its Identity registered or not
in the Identity Registry.
@param \_userAddress The address of the user to be checked.
@return 'True' if the address is contained in the Identity Registry, 'false' if not.

### identity

```solidity
function identity(address _userAddress) external view returns (contract IIdentity)
```

@dev Returns the onchainID of an investor.
@param \_userAddress The wallet of the investor

### investorCountry

```solidity
function investorCountry(address _userAddress) external view returns (uint16)
```

@dev Returns the country code of an investor.
@param \_userAddress The wallet of the investor

---

## IRegistriesManagement

Interface for registries management

_Management of the ClaimTopicsRegistry, TrustedIssuersRegistry, and IdentityRegistryStorage_

### ClaimTopicsRegistrySet

```solidity
event ClaimTopicsRegistrySet(address claimTopicsRegistry)
```

this event is emitted when the ClaimTopicsRegistry has been set for the IdentityRegistry
the event is emitted by the IdentityRegistry constructor
`claimTopicsRegistry` is the address of the Claim Topics Registry contract

### IdentityStorageSet

```solidity
event IdentityStorageSet(address identityStorage)
```

this event is emitted when the IdentityRegistryStorage has been set for the IdentityRegistry
the event is emitted by the IdentityRegistry constructor
`identityStorage` is the address of the Identity Registry Storage contract

### TrustedIssuersRegistrySet

```solidity
event TrustedIssuersRegistrySet(address trustedIssuersRegistry)
```

this event is emitted when the TrustedIssuersRegistry has been set for the IdentityRegistry
the event is emitted by the IdentityRegistry constructor
`trustedIssuersRegistry` is the address of the Trusted Issuers Registry contract

### setIdentityRegistryStorage

```solidity
function setIdentityRegistryStorage(address _identityRegistryStorage) external
```

@dev Replace the actual identityRegistryStorage contract with a new one.
This function can only be called by the wallet set as owner of the smart contract
@param \_identityRegistryStorage The address of the new Identity Registry Storage
emits `IdentityStorageSet` event

### setClaimTopicsRegistry

```solidity
function setClaimTopicsRegistry(address _claimTopicsRegistry) external
```

@dev Replace the actual claimTopicsRegistry contract with a new one.
This function can only be called by the wallet set as owner of the smart contract
@param \_claimTopicsRegistry The address of the new claim Topics Registry
emits `ClaimTopicsRegistrySet` event

### setTrustedIssuersRegistry

```solidity
function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external
```

@dev Replace the actual trustedIssuersRegistry contract with a new one.
This function can only be called by the wallet set as owner of the smart contract
@param \_trustedIssuersRegistry The address of the new Trusted Issuers Registry
emits `TrustedIssuersRegistrySet` event

### identityStorage

```solidity
function identityStorage() external view returns (contract IIdentityRegistryStorage)
```

@dev Returns the IdentityRegistryStorage linked to the current IdentityRegistry.

### issuersRegistry

```solidity
function issuersRegistry() external view returns (contract ITrustedIssuersRegistry)
```

@dev Returns the TrustedIssuersRegistry linked to the current IdentityRegistry.

### topicsRegistry

```solidity
function topicsRegistry() external view returns (contract IClaimTopicsRegistry)
```

@dev Returns the ClaimTopicsRegistry linked to the current IdentityRegistry.

---

## IVerification

Exposes identity verification logic based on registered claims and trusted issuers

_Implements methods to check if a user is verified_

### isVerified

```solidity
function isVerified(address _userAddress) external view returns (bool)
```

@dev This functions checks whether an identity contract
corresponding to the provided user address has the required claims or not based
on the data fetched from trusted issuers registry and from the claim topics registry
@param \_userAddress The address of the user to be verified.
@return 'True' if the address is verified, 'false' if not.
