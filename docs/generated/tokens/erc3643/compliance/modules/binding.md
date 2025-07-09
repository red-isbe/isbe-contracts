## IBind

Interface for binding tokens to compliance contracts

_Provides functionality to bind/unbind tokens with owner-only access control_

### TokenBound

```solidity
event TokenBound(address _token)
```

this event is emitted when a token has been bound to the compliance contract
the event is emitted by the bindToken function
`_token` is the address of the token to bind

### TokenUnbound

```solidity
event TokenUnbound(address _token)
```

this event is emitted when a token has been unbound from the compliance contract
the event is emitted by the unbindToken function
`_token` is the address of the token to unbind

### bindToken

```solidity
function bindToken(address _token) external
```

@dev binds a token to the compliance contract
@param \_token address of the token to bind
This function can be called ONLY by the owner of the compliance contract
Emits a TokenBound event

### unbindToken

```solidity
function unbindToken(address _token) external
```

@dev unbinds a token from the compliance contract
@param \_token address of the token to unbind
This function can be called ONLY by the owner of the compliance contract
Emits a TokenUnbound event

### getTokenBound

```solidity
function getTokenBound() external view returns (address)
```

@dev getter for the address of the token bound
returns the address of the token
