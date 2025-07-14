## ITrustedIssuersManagement

_Interface for managing trusted claim issuers in a registry.
Provides functions to add, remove, and query trusted issuers,
as well as to retrieve all trusted issuers and their claim topics.
Events are emitted on issuer addition and removal._

### TrustedIssuerAdded

```solidity
event TrustedIssuerAdded(contract IClaimIssuer trustedIssuer, uint256[] claimTopics)
```

this event is emitted when a trusted issuer is added in the registry.
the event is emitted by the addTrustedIssuer function
`trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
`claimTopics` is the set of claims that the trusted issuer is allowed to emit

### TrustedIssuerRemoved

```solidity
event TrustedIssuerRemoved(contract IClaimIssuer trustedIssuer)
```

this event is emitted when a trusted issuer is removed from the registry.
the event is emitted by the removeTrustedIssuer function
`trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract

### ClaimTopicsUpdated

```solidity
event ClaimTopicsUpdated(contract IClaimIssuer trustedIssuer, uint256[] claimTopics)
```

this event is emitted when the set of claim topics is changed for a given trusted issuer.
the event is emitted by the updateIssuerClaimTopics function
`trustedIssuer` is the address of the trusted issuer's ClaimIssuer contract
`claimTopics` is the set of claims that the trusted issuer is allowed to emit

### addTrustedIssuer

```solidity
function addTrustedIssuer(contract IClaimIssuer _trustedIssuer, uint256[] _claimTopics) external
```

@dev registers a ClaimIssuer contract as trusted claim issuer.
Requires that a ClaimIssuer contract doesn't already exist
Requires that the claimTopics set is not empty
Requires that there is no more than 15 claimTopics
Requires that there is no more than 50 Trusted issuers
@param \_trustedIssuer The ClaimIssuer contract address of the trusted claim issuer.
@param \_claimTopics the set of claim topics that the trusted issuer is allowed to emit
This function can only be called by the owner of the Trusted Issuers Registry contract
emits a `TrustedIssuerAdded` event

### removeTrustedIssuer

```solidity
function removeTrustedIssuer(contract IClaimIssuer _trustedIssuer) external
```

@dev Removes the ClaimIssuer contract of a trusted claim issuer.
Requires that the claim issuer contract to be registered first
@param \_trustedIssuer the claim issuer to remove.
This function can only be called by the owner of the Trusted Issuers Registry contract
emits a `TrustedIssuerRemoved` event

### updateIssuerClaimTopics

```solidity
function updateIssuerClaimTopics(contract IClaimIssuer _trustedIssuer, uint256[] _claimTopics) external
```

@dev Updates the set of claim topics that a trusted issuer is allowed to emit.
Requires that this ClaimIssuer contract already exists in the registry
Requires that the provided claimTopics set is not empty
Requires that there is no more than 15 claimTopics
@param \_trustedIssuer the claim issuer to update.
@param \_claimTopics the set of claim topics that the trusted issuer is allowed to emit
This function can only be called by the owner of the Trusted Issuers Registry contract
emits a `ClaimTopicsUpdated` event

---

## ITrustedIssuersView

### getTrustedIssuers

```solidity
function getTrustedIssuers() external view returns (contract IClaimIssuer[])
```

@dev Function for getting all the trusted claim issuers stored.
@return array of all claim issuers registered.

### getTrustedIssuersForClaimTopic

```solidity
function getTrustedIssuersForClaimTopic(uint256 claimTopic) external view returns (contract IClaimIssuer[])
```

@dev Function for getting all the trusted issuer allowed for a given claim topic.
@param claimTopic the claim topic to get the trusted issuers for.
@return array of all claim issuer addresses that are allowed for the given claim topic.

### isTrustedIssuer

```solidity
function isTrustedIssuer(address _issuer) external view returns (bool)
```

@dev Checks if the ClaimIssuer contract is trusted
@param \_issuer the address of the ClaimIssuer contract
@return true if the issuer is trusted, false otherwise.

### getTrustedIssuerClaimTopics

```solidity
function getTrustedIssuerClaimTopics(contract IClaimIssuer _trustedIssuer) external view returns (uint256[])
```

@dev Function for getting all the claim topic of trusted claim issuer
Requires the provided ClaimIssuer contract to be registered in the trusted issuers registry.
@param \_trustedIssuer the trusted issuer concerned.
@return The set of claim topics that the trusted issuer is allowed to emit

### hasClaimTopic

```solidity
function hasClaimTopic(address _issuer, uint256 _claimTopic) external view returns (bool)
```

@dev Function for checking if the trusted claim issuer is allowed
to emit a certain claim topic
@param \_issuer the address of the trusted issuer's ClaimIssuer contract
@param \_claimTopic the Claim Topic that has to be checked to know if the `issuer` is allowed to emit it
@return true if the issuer is trusted for this claim topic.
