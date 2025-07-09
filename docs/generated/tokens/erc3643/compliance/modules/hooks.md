## IHooks

Interface for token compliance hooks and transfer validation

_Provides callbacks for token lifecycle events and compliance checks_

### transferred

```solidity
function transferred(address _from, address _to, uint256 _amount) external
```

@dev function called whenever tokens are transferred
from one wallet to another
this function can be used to update state variables of the compliance contract
This function can be called ONLY by the token contract bound to the compliance
@param \_from The address of the sender
@param \_to The address of the receiver
@param \_amount The amount of tokens involved in the transfer

### created

```solidity
function created(address _to, uint256 _amount) external
```

@dev function called whenever tokens are created on a wallet
this function can be used to update state variables of the compliance contract
This function can be called ONLY by the token contract bound to the compliance
@param \_to The address of the receiver
@param \_amount The amount of tokens involved in the minting

### destroyed

```solidity
function destroyed(address _from, uint256 _amount) external
```

@dev function called whenever tokens are destroyed from a wallet
this function can be used to update state variables of the compliance contract
This function can be called ONLY by the token contract bound to the compliance
@param \_from The address on which tokens are burnt
@param \_amount The amount of tokens involved in the burn

### canTransfer

```solidity
function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool)
```

@dev checks that the transfer is compliant.
default compliance always returns true
READ ONLY FUNCTION, this function cannot be used to increment
counters, emit events, ...
@param \_from The address of the sender
@param \_to The address of the receiver
@param \_amount The amount of tokens involved in the transfer
This function will call all checks implemented on compliance
If all checks return TRUE, the function returns TRUE
returns FALSE otherwise
