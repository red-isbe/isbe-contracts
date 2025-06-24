# Development guidelines

The purpose of this document is to establish a set of guidelines to be followed for the development of smart contracts intended for deployment on the ISBE network. This facilitates the development of various use cases, providing developers with a clear understanding of the standards to follow and ensuring compliance with the requirements established for deployment on the network. Adherence to these guidelines is essential, as their fulfillment will be validated during the auditing process by the ISBE network administrators. Otherwise, the contracts will not be allowed to be deployed.

These guidelines are divided into three levels. The first level includes requirements that every contract must meet, while the following two levels define specific requirements depending on the type of proxy chosen for deploying the use case.

## General guidelines

- **No business logic should be exploitable outside of a proxy:**  
  This means that any contract intended to be deployed on the ISBE network must use a proxy through which it will be operated. Depending on the use case, it must be determined whether to use a Diamond proxy or a Transparent proxy. Both proxy types are available within the ISBE-contracts project for use. Additionally, this requirement implies that the default constructor must disable contract initialization.
- **All implemented business logic must extend from `Common`:**  
  This requirement is established by the ISBE network administrators to ensure compliance with the network's governance requirements.
- **All external functions that modify state must include restricted access management using `AccessControl` or `Ownable`:**  
  This requirement ensures that all use cases have limited access to contract functionality. Access control mechanisms are provided within the ISBE-contracts project and are included in the core `Common.sol` contract. Therefore, any exposed functions must be protected with the appropriate modifier based on the chosen access control mechanism (`onlyOwner` or `onlyRole`).
- **All external functions that modify state must include the `whenNotPaused()` modifier:**  
  This requirement is essential for complying with the governance rules of the ISBE network, disabling external functions when the smart contract has been paused. This modifier is part of the `Pausable.sol` contract, which is included in the ISBE-contracts project and extended by the `Common.sol` contract.
- **All business logic contracts must have a unique identifier (resolver key):**  
  This means that any contract implementing business logic specific to a use case must define a `bytes32` value that uniquely identifies it. An example is shown below:

```
  // keccak256('isbe.contracts.erc20.resolver.key');
  bytes32 constant _ERC20_RESOLVER_KEY = 0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad;
```

- **The storage of implemented contracts must follow the unstructured storage pattern:**  
  This is essential to avoid storage collisions between contracts. To achieve this, a fixed storage slot must be defined for each contract to manage its storage. Below is an example showing how to define it and how it should be used:

```
  // keccak256('isbe.contracts.erc20.storage');
  bytes32 constant _ERC20_STORAGE_POSITION = 0xd93ac5c223af8b55b10aca6a04761f021176cb4baf866e7484f3c8d7325c3a93;

  struct ERC20Storage {
      mapping(address account => uint256) balances;
      mapping(address account => mapping(address spender => uint256)) allowances;
      uint256 totalSupply;
      uint8 decimals;
      string name;
      string symbol;
  }

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
  function _initialize(
      string memory newName,
      string memory newSymbol,
      uint8 newDecimals
  ) internal {
      ERC20Storage storage $ = _erc20Storage();
      $.name = newName;
      $.symbol = newSymbol;
      $.decimals = newDecimals;
  }

  function _decimals() internal view returns (uint8) {
      return _erc20Storage().decimals;
  }

  function _symbol() internal view returns (string memory) {
      return _erc20Storage().symbol;
  }

  function _name() internal view returns (string memory) {
      return _erc20Storage().name;
  }
```

As shown in the previous example, a constant is first defined for the slot to be used. This constant sets the position of the slot that will be used for the contract's storage. Once the slot is defined, all read and write access to storage must be done using that same slot.

## Diamond Proxy Guidelines

If a Diamond proxy is used, the following guidelines must be followed:

- **A separate facet contract must be implemented for each business logic, following the naming convention `XXXFacet.sol`:**  
  For example, `ERC20Facet.sol`. This will be the contract registered in the diamond, which will receive delegate calls for the execution of its functions.

- **The facet contract must implement the `IEIP2535Introspection` interface:**  
  This interface is available within the ISBE-contracts project for use. It allows for the standardized management of the facet selectors supported by a diamond and simplifies the development of contracts compatible with a diamond proxy for developers.

- **The facet contract must implement the `interfacesIntrospection` function from the interface:**
  This enables the diamond to uniquely identify all the interface ids each facet exposes. This function returns a list of interface Ids according to the ERC165 format. Below is the exact implementation that every facet should use (copy / paste the code below):

```
  function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }
```

In order for this introspection method to work, you will need to implement the following internal method which is included in the `Common.sol`core contract your facet should be inheriting from. Below is an example of its implementation:

```
  function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IAccessControl).interfaceId;
    }

```

- **The facet contract must implement the `businessIdIntrospection` function from the interface:**  
  This enables the diamond to uniquely identify each business logic facet it manages. This function returns a `businessId`, which corresponds to the resolver key mentioned earlier. Below is an example of its implementation:

```
  function businessIdIntrospection()
      external
      pure
      override
      returns (bytes32 businessId_)
  {
      businessId_ = _ERC20_RESOLVER_KEY;
  }
```

- **The facet contract must implement the `selectorsIntrospection` function from the interface:**  
  This allows the diamond to determine which selectors or functions are exposed by that contract to be accessed through the proxy. In this way, when the proxy is called for a specific function, it determines which contract to delegate the call to based on its selectors. Below is an example of its implementation:

```
  function selectorsIntrospection()
      external
      pure
      override
      returns (bytes4[] memory selectors_)
  {
      uint256 selectorsLength = 12;
      selectors_ = new bytes4[](selectorsLength);
      selectors_[--selectorsLength] = this.initializeErc20.selector;
      selectors_[--selectorsLength] = this.transfer.selector;
      selectors_[--selectorsLength] = this.approve.selector;
      selectors_[--selectorsLength] = this.transferFrom.selector;
      selectors_[--selectorsLength] = this.increaseAllowance.selector;
      selectors_[--selectorsLength] = this.decreaseAllowance.selector;
      selectors_[--selectorsLength] = this.allowance.selector;
      selectors_[--selectorsLength] = this.decimals.selector;
      selectors_[--selectorsLength] = this.symbol.selector;
      selectors_[--selectorsLength] = this.name.selector;
      selectors_[--selectorsLength] = this.totalSupply.selector;
      selectors_[--selectorsLength] = this.balanceOf.selector;
  }
```

## Transparent proxy guidelines

- **All contracts using a transparent proxy must extend from `AccessControl`:**  
  This means that the implemented contract for the use case must inherit from `AccessControl.sol`, which is available in the ISBE-contracts project. This requirement is essential to comply with ISBE network governance rules. Any contract intended to be deployed using a transparent proxy that does not include `AccessControl` will not be allowed to deploy on the network.
- **All contracts using a transparent proxy must extend from `ISBEPause`:**  
  This means that the implemented contract for the use case must inherit from `ISBEPause.sol`, which is available in the ISBE-contracts project. This requirement is essential to comply with ISBE network governance rules. Any contract intended to be deployed using a transparent proxy that does not include `ISBEPause` will not be allowed to deploy on the network.

Here you have a contract example using transparent proxy:

```
import {AccessControl} from '../access/accessControl/AccessControl.sol';
import {ISBEPause} from '../pause/ISBEPause.sol';
import {ERC20InternalCommon} from './extensions/ERC20InternalCommon.sol';
import {IERC20Isbe} from './IERC20Isbe.sol';

contract ERC20 is AccessControl, ISBEPause, IERC20Isbe, ERC20InternalCommon {
  //ERC20 Implementation...
)
```
