## IClaimTopicsRegistry

Interface for managing trusted claim topics in a security token registry

_Provides functionality to add, remove, and retrieve claim topics with a 15-topic limit_

### ClaimTopicAdded

```solidity
event ClaimTopicAdded(uint256 claimTopic)
```

this event is emitted when a claim topic has been added to the ClaimTopicsRegistry
the event is emitted by the 'addClaimTopic' function
`claimTopic` is the required claim added to the Claim Topics Registry

### ClaimTopicRemoved

```solidity
event ClaimTopicRemoved(uint256 claimTopic)
```

this event is emitted when a claim topic has been removed from the ClaimTopicsRegistry
the event is emitted by the 'removeClaimTopic' function
`claimTopic` is the required claim removed from the Claim Topics Registry

### addClaimTopic

```solidity
function addClaimTopic(uint256 _claimTopic) external
```

_Add a trusted claim topic (For example: KYC=1, AML=2).
Only owner can call.
emits `ClaimTopicAdded` event
cannot add more than 15 topics for 1 token as adding more could create gas issues_

#### Parameters

| Name         | Type    | Description           |
| ------------ | ------- | --------------------- |
| \_claimTopic | uint256 | The claim topic index |

### removeClaimTopic

```solidity
function removeClaimTopic(uint256 _claimTopic) external
```

@dev Remove a trusted claim topic (For example: KYC=1, AML=2).
Only owner can call.
emits `ClaimTopicRemoved` event
@param \_claimTopic The claim topic index

### getClaimTopics

```solidity
function getClaimTopics() external view returns (uint256[])
```

@dev Get the trusted claim topics for the security token
@return Array of trusted claim topics
