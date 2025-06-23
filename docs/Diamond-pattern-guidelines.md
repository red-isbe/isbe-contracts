# Diamond Pattern Guidelines

This document aims to provide a practical guide for implementing smart contracts that are fully compatible with the Diamond Pattern as specified in EIP-2535. Through these guidelines, developers will be able to structure their contracts in a way that ensures maintainability, upgradeability, and scalability by leveraging the advantages of this architecture.

Key topics covered include facet organization, management of Diamond Storage, function integration, and delegate call routing. By following these recommendations, developers can build complex, modular systems in Solidity while maintaining code clarity, efficiency, and security.

## Facet organization

In the Diamond Pattern architecture (EIP-2535), facets are used to achieve modularity, extensibility, and to overcome the contract size limitations imposed by the Ethereum Virtual Machine (EVM). A facet is simply a Solidity contract that contains a set of functions, and in a diamond-based system, multiple facets are "plugged into" a central contract (the diamond) to compose its full functionality.

This design allows developers to split logic into smaller, purpose-specific modules—facets—without bloating a single contract. Each facet handles a subset of the system's behavior, enabling clear separation of concerns and easier maintenance. Moreover, since the diamond delegates calls to these facets via delegatecall, all facets share a common storage context, ensuring consistent state management across the system.

Using facets also makes it easier to upgrade or extend parts of the contract without redeploying the entire system. This flexibility is a key benefit in complex smart contract systems that require frequent updates or customization over time.

**Note:** We recommend using composition instead of communication between facets due to gas consumption.

## Facet interface (IEIP2535Introspection)

In order to facilitate facet implementation, we have created an interface that every facet must implement. This interface is IEIP2535Introspection.

This interface allow you to define an unique id for your facet. Tho specify this id, you should implement the following function:

```
businessIdIntrospection()
```

This function is used by the diamond in order to identify the specific facets registered. Here you have an implementation example of this function:

```
// keccak256('isbe.contracts.erc20.resolver.key');
bytes32 constant _ERC20_RESOLVER_KEY = 0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad;

function businessIdIntrospection()
    external
    pure
    override
    returns (bytes32 businessId_)
{
    businessId_ = _ERC20_RESOLVER_KEY;
}
```

Also this interface allow you to specify all functions that this facet exposes. To specify these functions, you should implement the following function:

```
selectorsIntrospection()
```

This function is used by the diamond contract to know which facet should be invoked. Once the diamond identify the facet, it invokes a delegateCall in order to execute the transaction in a proper way.

Here you have an implementation example of this function:

```
function selectorsIntrospection()
    external
    pure
    override
    returns (bytes4[] memory selectors_)
{
    uint256 selectorsLength = 2;
    selectors_ = new bytes4[](selectorsLength);
    selectors_[--selectorsLength] = this.diamondCut.selector;
    selectors_[--selectorsLength] = this.facetUpdates.selector;
}
```

**_Important:_** Every function that is not specified in the selector mapping will not be exposed by the diamond contract. As a result, the diamond will return the following error:

```
error FunctionNotFound(bytes4 _functionSelector);
```

## External/Internal splitting

The smart contract business logic must be split in two different contracts.

- External contract: This external contract only containg specific functions that must be exposed to use. This contract must extend from internal in order to use internal functions. Implemented external functions must use internal ones.

- Internal contract: This internal contract must manage the storage and implement any necessary business logics. In this contract, functions defined must be named starting with "\_", for example: `_myFunction()`. Also. this contract must use unstructured storage and define specific slot to be used (see next section). We recommend to use implemented core smart contract `Common.sol` because it includes pause and access control, so if you extend from this contract you can use their functions and modifiers.

## Ustructured storage

In order to guarantee the compatibility with diamond pattern, we need to implement unstructured storage in our contracts. To implement it we need to follow next steps:

- Define storage struct: In this struct we should include any necessary field to be stored for our contract. For example:

```
struct ERC20Storage {
        mapping(address account => uint256) balances;
        mapping(address account => mapping(address spender => uint256)) allowances;
        uint256 totalSupply;
        uint8 decimals;
        string name;
        string symbol;
    }
```

- Define storage slot function: We need to specify the slot that will be used for storage in our contract. For example:

```
    function _erc20Storage()
        private
        pure
        returns (ERC20Storage storage storage_)
    {
        bytes32 position = _ERC20_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
```

As you can see, this slot position is defined by a constant, this constant must be defined in `storagePositions.sol`. For example:

```
    // keccak256('isbe.contracts.erc20.storage');
    bytes32 constant _ERC20_STORAGE_POSITION =    0xd93ac5c223af8b55b10aca6a04761f021176cb4baf866e7484f3c8d7325c3a93;
```

- Use storage function to interact with the storage: Once we have defined the previous function, any time we need to interact with contract storage, we need to use it. For example:

```
    function _totalSupply() internal view returns (uint256) {
        return _erc20Storage().totalSupply;
    }
```
