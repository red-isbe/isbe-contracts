## DidRegistryQuery

Abstract contract exposing read-only queries with input validations

_Adds whenNotPaused and basic format checks; implementation lives in Facet_

### isKnownDid

```solidity
function isKnownDid(address account) external view returns (bool)
```

### didOf

```solidity
function didOf(address account) external view returns (bytes32 did)
```

Resolve the DID of an invocation address and return its did

#### Parameters

| Name    | Type    | Description                                                                     |
| ------- | ------- | ------------------------------------------------------------------------------- |
| account | address | EOA or contract address associated to a verification method in the DID Registry |

#### Return Values

| Name | Type    | Description                                   |
| ---- | ------- | --------------------------------------------- |
| did  | bytes32 | The DID string if found, otherwise bytes32(0) |
