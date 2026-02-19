## ReentrancyGuard

### ReentrancyGuardStorage

```solidity
struct ReentrancyGuardStorage {
  mapping(bytes32 => uint256) status;
}
```

### ReentrantNotAllowed

```solidity
error ReentrantNotAllowed(bytes32 reentrantKey)
```

### nonReentrant

```solidity
modifier nonReentrant(bytes32 _reentrantKey)
```

### _nonReentrantBefore

```solidity
function _nonReentrantBefore(bytes32 _reentrantKey) internal
```

### _nonReentrantAfter

```solidity
function _nonReentrantAfter(bytes32 _reentrantKey) internal
```

