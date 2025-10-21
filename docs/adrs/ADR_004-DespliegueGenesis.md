# ADR_004: Diamond of Governance deployment in Genesis

## Table of contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Description](#description)
    - [Process detail](#process-detail)
    - [Current known limitations](#current-known-limitations)
    - [Tests](#tests)
- [Benefits](#benefits)
- [Implementation phases](#implementation-phases)

## Status

Proposal

## Context

To streamline the contract deployment process, all contracts necessary for the ISBE infrastructure will be pre-deployed. They need to be available from the outset (first block) so that use cases can make use of them.

This requires to extract all deployed bytecode form contracts and the entire slot structure at last block. This is very challenging as there is almost no standard tooling to achieve this.

## Alternatives

### Static slot extraction

Vast majority of tooling performs static slot extraction. This requires to check the order fields are created in solidity contract to generate the slot structure. This method is very straightforward, however it has two severe limitations:

- It is suitable for simple type fields (i.e uint, address, bytes32...). These types use a single slot to keep field value. However, it cannot precalculate dynamic fields like mappings, string, bytes or dynamic arrays. Slot structure for those types are very complex and calculate slots by emulating EVM slot allocation is very complex
- This process is compromised if slot structure is set manually. This is our case as it is required for diamond pattern.

### Extract from Besu or Erigon

As an alternative, it is possible to use **debug_storageRangeAt** operation. This is a JSON-RPC method (available in clients like Geth, Erigon, and Besu) that lets you enumerate a contract’s storage slots at a specific block. Instead of only reading known keys, it returns a page of key/value pairs starting from a given startKey (usually 0x0) up to a maximum number of results (maxResults), along with a nextKey that you can use to paginate through the entire storage trie. This provides a very powerful tool for dumping all storage contents of a contract at a chosen block state, which you can then decode using Solidity’s storage layout rules.

**Example:**

```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_storageRangeAt",
    "params": [
        "0x<blockHash>", // Block hash
        0, // tx index in selected block
        "0x<address>", // Contract address
        "0x0000000000000000000000000000000000000000000000000000000000000000", // startKey (0x00..000" innitial). This process returns next startkey
        2048 // maxResults (for pagination)
    ]
}
```

This approach has a downfall: you need to know previously all contract addresses in order to extract slot information from them. In a regular deployment process in which all contracts are created by a creation transaction from an EOA, this is very simple. However, if creation procedure is more complex as ISBE Diamond, this method would not be feasible as it requires to extract trace information and detect CREATE/CREATE2 opcodes. Since this process depends on trace extraction, it makes more sense to use the following proposed procedure.

### Extract slot information by detecting SSTORE opcode

This case requires reviewing the trace of each transaction performed on the Hardhat network. It involves going through each trace in search of SSTORE opcodes. At first glance, this method seems simple, but the opcode does not have information on the stack about which contract it belongs to.

In order to determine the contract, it is necessary to emulate the behaviour of the EVM and modify the contract address as it enters and exits CALL, CREATE, CREATE2 blocks...

**Example:**

```javascript
const trace = await provider.send('debug_traceTransaction', [
    txHash,
    {
        disableStack: false, // We need stack associated with each OPCODE
        disableMemory: false, // For contract bytecode (CREATE2)
        disableStorage: false, //Not needed. Used for debug and audit purposes
    },
])
```

This method is more complex, but it extracts the entire slot structure for all transactions deployed in Hardhat so far.

## Decision

Due to the large number of contracts to be deployed in the infrastructure and the amount of bootstrapping they require, the deployment process is complex. Therefore, priority will be given to those pre-deployment processes in Genesis that have the least impact on the current deployment process and are flexible enough so that the addition of new contracts does not cause problems for pre-deployment.

Therefore, we plan to use third option "Extract slot information by detecting SSTORAGE opcode". It is the cleanest and most flexible procedure to extract slot structure.

## Description

In order to pre-deploy a contract in Genesis, the following information is required:

- **Deployed bytecode (mandatory for contracts)**: This is the code once a contract has been deployed onchain (do not be confused with deployment code which is used to deploy the contract). We need the resulting deployed code also known as "code".
- **Slot structure (optional)**: This is the initial state of the contract also known as "storage". In case needed, this genesis entry contains a key/value structure corresponding to SLOT_NUMBER / SLOT_VALUE.
- **Initial crypto balance (optional)**: In case needed, it is possible to provide an initial crypto balance for this contract.

### Process detail

Extracting the deployed code from contracts (not the deployment code) is straightforward; simply access the contract artifact or consult the code onchain using the contract address.

The slot structure, on the other hand, is not so simple. The rules for generating the slot structure are very complex, especially with dynamic types (strings, bytes, mappings, and arrays). Extracting the slot structure using EVM rules is a difficult task. There are several ways to extract the slot structure, but we have opted for the one that is most compatible with the current deployment procedure.

**Briefly**:

1. Deploy the contract on Hardhat’s in-memory chain.
2. Trace the deployment transaction and any other transaction, and collect every SSTORE executed in the constructor. Result is a list of modified slots for this contract
3. Read final values from the chain state for those slots.
4. Fetch runtime code and emit a normalized JSON.

**Detailed steps**:

1. Compile
2. Deploy the contract (for this test a constructor without params): we need a real EVM run of the constructor to record its SSTOREs, and the address to read code/storage afterward.
3. Trace the deployment transaction: we need structLogs with SSTORE steps. Enabling stack/storage gives us enough context to identify slot keys robustly. We need to take track of context changes in EVM that implies contract owner changes. We need to emulate EVM behaviour.
4. Collect the written slots: We check the entire trace to detect "SSTORE" op-code. If a SSTORE is detected process will store SLOT modified. It is essential to ensure we assign each SSTORE operation to the correct contract. If a transaction executes "CALL", "CREATE" or "CREATE2" opcodes, this changes the contract where the write operation is executed. DELEGATECALL will not change contract.

5. Read final values from chain state: guarantees we record the post-constructor state

6. Fetch runtime code: Generate an alloc-compatible structure for genesis

```js
{
  address:{
    "contract": "ContractName",
    "address": "0x…",
    "code": "0x…",
    "storage": {
      "0x…0000": "0x…0A",
      "0x…0001": "0x…0B"
    }
  }
}
```

7. Using a genesis template, process includes previous information in genesis alloc information.

Now generated genesis is ready to be deployed in a Besu network.

### Current known limitations

- This process assumes there is no SSTORE opcode within any STATICCALL block or nested block
- This process won't take care about reverts. If a revert is triggered, SSTORE will be kept in result structure. It assumes a exhaustive test prodecure has been performed.

### Audit

Script has several in-code checks in order to ensure we get expected results. Process will

- check any EVM context change comes from a specific opcode (CALL, DELEGATECALL, CODECALL, STATICALL, CREATE or CREATE2). It will fail if not. There exist an specific simulated opcode "INITIAL (EOA)" to detect the initial context. This opcode is taken into consideration for context changes
- check if CALL,DELEGATECALL,STATICALL... have a known destination.In other words, if any of those opcodes uses an unknown address process will fail immediatelly
- ensure the generated address for CREATE/CREATE2 is the same as the returned address at the end of the process. To simplify process we need to precalculate CREATE/CREATE2 deployed contract address by emulating EVM calculation procedures. At the end of the block the created address is returned (is include in stack). We check both addresses are the same to ensure precalculation procedure work as expected
- check SSTORE opcode to extract slot an compare it to returned slot diffs from debug_traceTransaction

Also it checks any returned value to ensure it is consistent (i.e: not unknown, empty string, empty array if it is not expected).

### Tests

**PoC tests:**
Two tests have been carried out

- Contract deployment test: The contract is implemented with a constructor without parameters (for simplicity) and the code and slot structure are generated by standard output. This checks if contract deployment generates expected slot structure **(and it does)**
- Same as the previous test, but changing the values via a regular contract call (transaction) after the contract has been deployed. Checks if a regular call is compatible with slot extracting process **(and it is)**

To check extraction behaviour several ways of data storing have been put in place in contract:

```js
ontract SubSubContract{
  uint public dummy;
  uint public aa;

  constructor(){
    aa=0xEE;
  }



  function setAA(uint _aa) public {
    aa=_aa;
  }
}


contract SubConrtact{
  uint public dummy1;
  uint public dumm2;
  uint public a;
  address public subSubContractAddress = address(new SubSubContract{salt: bytes32(uint256(0xC0FFEE))}()); //address(new SubSubContract());

  constructor(){
    string storage str;
    assembly {
      str.slot := 100
      sstore(str.slot, "1111111111")
    }
  }

  function getStr() public view returns (string memory) {
     string storage str;
    assembly {
      str.slot := 100
    }
    return str;
  }

  function setStr(uint _a) public {
    string storage str;
    assembly {
      str.slot := 100
      sstore(str.slot, _a)
    }
  }

  function setA(uint _a) public {
    a=_a;
    SubSubContract(subSubContractAddress).setAA(_a);
    // (bool ok, bytes memory ret) = subSubContractAddress.delegatecall(
    //   abi.encodeWithSelector(SubSubContract.setAA.selector, uint256(0xDD))
    // );
    // if (!ok) assembly { revert(add(ret, 32), mload(ret)) }
  }
}


contract Lock {

  struct pp{
    uint a;
  }
  uint public unlockTime;
  address payable public owner;
  string str="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
  address public subContractAddress =  address(new SubConrtact{salt: bytes32(uint256(0xC0FFEE))}()); // address(new SubConrtact());
  event Withdrawal(uint amount, uint when);

  constructor() payable {

    pp storage p;

    unlockTime = 0xFF;
    owner = payable(msg.sender);

    assembly {
      p.slot := 10
      sstore(11, 0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB)
    }
    p.a=0xCC;

    SubConrtact(subContractAddress).setA(0xDD);
    // (bool ok, bytes memory ret) = subContractAddress.delegatecall(
    //   abi.encodeWithSelector(SubConrtact.setA.selector, uint256(0xDD))
    // );
    // if (!ok) assembly { revert(add(ret, 32), mload(ret)) }
  }

  function get() public view returns(uint, address,address,string memory, uint,uint){
    pp storage p;
    pp storage p2;
    assembly {
      p2.slot := 11
      p.slot := 10
    }
    uint tmp = p2.a;
    uint tmp2 = p.a;
    return(unlockTime, owner, subContractAddress,str, tmp2, tmp);
  }

    function set(uint _unlocktime, address _owner, string calldata _str,uint u1, uint u2) public {
    pp storage p;
    pp storage p2;
    assembly {
      p2.slot := 11
      p.slot := 10
    }
    p2.a=u2;
    p.a=u1;
    unlockTime = _unlocktime;
    owner = payable(_owner);
    str = _str;
  }
}

```

To check its behaviour a genesis.json has been created with code and slot structure extracted from this process. This genesis has been installed in a besu one-node network and started.

To check contract data a regular call (contract + ABI) to **get()** is executed and result is compared to contract constructor data (**data contained is the same**)

**Real tests:**
Testing the resulting alloc structure for ISBE contracts is challenging.

**this activity still in progress**

### Benefits

This process can be included easily to current deployment process. High level steps:

1. Execute the current deployment process "**deployAll**" in Hardhat network (some not needed contracts could be excluded). Now Hardhat network contains all deployment transactions
2. Group these transactions by affected contract (created contract or destination contract)
3. By using **debug_traceTransaction** the execution stack is retrieved for each contract transaction and touched slots are included in a list. As a result a data structure containing for each contract a list of modified slots is generated
4. For each contract we get last value for each modified slot
5. Generate genesis.json from a selected template (we may require several templates depending on environment (test, pre, pro) and network type (bare, usecase))

It is relevant to point out that 1st step uses current deployment process "deployAll". "deployAll" may require minor adaptations, but that's all. If new contracts are added to deployAll process, genesis generation process will work as expected without any adaptation.

Additionally, 5th step is very convenient as it may automate generation and testing procedures. As we know, mistakes in blockchain are very severe and potentially devastating. Not to mention if the problem occurs in the genesis block.

For the sake of this project, we need to make absolutely sure this process works as expected and genesis file is correct. Therefore, we plan, as part of CI procedure, to start a Besu network using generated genesis and check stored values by using regular contract calls. This may require effort, however, it is fundamental to ensure genesis block correctness.

### Implementation phases

- ✅ Create hardhat task invoking current development process (deployAll)
- ✅ Extract from Hardhat network all transactions grouped by contract (transactions generated in step 1)
- ✅ Extract from transactions modified slots
- ✅ Retrieve from chain each value for each slot
- ✅ Generate from template genesis file
- ⏳ Testing resulting genesis
- ⬜ Deploy in pre-production environment
