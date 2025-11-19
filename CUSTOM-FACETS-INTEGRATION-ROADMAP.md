# Custom Facets Integration Roadmap

## Document Purpose

This document provides a complete implementation roadmap for integrating custom business logic facets into the ISBE network. It is designed for future reference to understand the complete process from client requirements to production deployment.

ISBE operates with pre-deployed business logics and Configuration ID-based proxy creation. Clients create proxies but cannot deploy custom use cases. This document addresses that limitation by enabling clients to add custom facets to their proxies post-deployment via `diamondCut()`.

## ISBE Architecture Foundation

ISBE uses the Diamond Pattern (EIP-2535) with a strict modular facet architecture:

### Facet Structure Pattern

Every business logic in ISBE follows this structure:

1. **XXXInternal.sol** (Optional) - Storage structures and internal functions
   - Defines storage struct with `keccak256` slot position
   - Implements private `_xxxStorage()` accessor using assembly
   - Contains internal helper functions
   - Inherits base abstracts (e.g., `DidDocumentDetailedInternal`)

2. **XXX.sol** - External logic layer
   - Inherits from XXXInternal (if exists) or base contracts
   - Implements interface functions with business logic
   - Applies modifiers (access control, pause, validation)
   - Emits events

3. **XXXFacet.sol** - Diamond facet exposing selectors
   - Inherits from XXX.sol
   - Implements `IEIP2535Introspection` interface
   - Provides three introspection functions:
     - `interfacesIntrospection()` - Returns supported interface IDs
     - `businessIdIntrospection()` - Returns resolver key (business ID)
     - `selectorsIntrospection()` - Returns function selectors array
   - Used for diamond registration and discovery

4. **IXXX.sol** - Interface definition
   - Defines external functions
   - Defines events
   - Follows ERC/IERC naming conventions

### Storage Pattern

ISBE uses **isolated storage slots** with assembly accessors:

```solidity
// In XXXInternal.sol
import {_XXX_STORAGE_POSITION} from '../../constants/storagePositions.sol';

struct XXXStorage {
    // Storage fields
    mapping(uint256 => string) customData;
    uint256 counter;
}

function _xxxStorage() private pure returns (XXXStorage storage storage_) {
    bytes32 position = _XXX_STORAGE_POSITION;
    assembly {
        storage_.slot := position
    }
}
```

Storage positions are defined in `contracts/constants/storagePositions.sol` using `keccak256` of unique identifiers.

### Resolver Keys (Business IDs)

Each facet has a unique resolver key defined in `contracts/constants/resolverKeys.sol`:

```solidity
bytes32 constant _XXX_RESOLVER_KEY = keccak256("XXX_BUSINESS_LOGIC");
```

These keys are used for:
- Configuration ID generation (Position-Based XOR algorithm)
- Business logic registry tracking
- Diamond facet identification

### Initialization Pattern

Facets use a custom initializer system:

```solidity
constructor() {
    _disableInitializers(_XXX_RESOLVER_KEY);
}

function initializeXxx(/* params */) 
    external 
    initializer(_XXX_RESOLVER_KEY) 
{
    _initialize(/* params */);
    emit XxxInitialized(/* params */);
}
```

This prevents re-initialization and ensures one-time setup per resolver key.

## Custom Facet Integration System

### Overview

The system enables clients to:
1. Develop custom facets following ISBE architecture
2. Submit facets to ISBE team for audit and registration
3. Integrate facets into their existing proxies via `diamondCut()`

### Workflow

```
[Client Developer]
    ↓ (1) Develop custom facet
    ↓ (2) Test locally
    ↓ (3) Submit for audit
    ↓
[ISBE Team]
    ↓ (4) Audit code
    ↓ (5) Deploy facet
    ↓ (6) Register in BusinessLogicRegistry
    ↓ (7) Generate resolver key
    ↓ (8) Return deployment info
    ↓
[Client]
    ↓ (9) Call diamondCut() on proxy
    ↓ (10) Verify integration
    ↓
[Production Ready]
```

## Implementation Guide

### Part 1: Client Developer Guide

#### Step 1.1: Understand Requirements

Before developing a custom facet, identify:
- **Functionality needed**: What operations must the facet perform?
- **Storage requirements**: What data needs to be persisted?
- **Access control**: Who can call these functions?
- **Integration points**: Does it interact with existing facets?

#### Step 1.2: Follow ISBE Architecture Pattern

Create four files following the exact ISBE pattern:

##### File 1: XXXInternal.sol (Optional)

Create this file ONLY if you need custom storage. If your facet only reads/modifies existing storage, skip this file.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BaseInheritance} from 'path/to/base';

// Storage position will be provided by ISBE team after registration
bytes32 constant _XXX_STORAGE_POSITION = 0x0000000000000000000000000000000000000000000000000000000000000000; // Placeholder

abstract contract XXXInternal is BaseInheritance {
    struct XXXStorage {
        // Define your storage fields
        mapping(uint256 => string) customData;
        uint256 counter;
    }

    function _initialize(/* params */) internal {
        XXXStorage storage $ = _xxxStorage();
        // Initialize storage
        $.counter = 0;
    }

    // Internal helper functions
    function _internalOperation(uint256 id) internal view returns (string memory) {
        return _xxxStorage().customData[id];
    }

    function _xxxStorage() private pure returns (XXXStorage storage storage_) {
        bytes32 position = _XXX_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}
```

##### File 2: XXX.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {XXXInternal} from './XXXInternal.sol'; // Or base contract if no Internal
import {IXXX} from './IXXX.sol';
// Import modifiers and constants as needed

// Resolver key will be provided by ISBE team
bytes32 constant _XXX_RESOLVER_KEY = 0x0000000000000000000000000000000000000000000000000000000000000000; // Placeholder

abstract contract XXX is IXXX, XXXInternal {
    constructor() {
        _disableInitializers(_XXX_RESOLVER_KEY);
    }

    function initializeXxx(/* params */) 
        external 
        override 
        initializer(_XXX_RESOLVER_KEY) 
    {
        _initialize(/* params */);
        emit XxxInitialized(/* params */);
    }

    // External functions implementing IXXX interface
    function publicOperation(uint256 id) 
        external 
        override
        whenNotPaused // Apply modifiers as needed
        returns (string memory) 
    {
        // Business logic
        return _internalOperation(id);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IXXX).interfaceId;
    }
}
```

##### File 3: XXXFacet.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_XXX_RESOLVER_KEY} from 'path/to/resolverKeys'; // Will be added by ISBE
import {XXX} from './XXX.sol';
import {IEIP2535Introspection} from 'path/to/introspection';

contract XXXFacet is XXX, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _XXX_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        // Count total selectors (initialize + external functions)
        uint256 selectorsLength = 2; // Adjust based on your functions
        selectors_ = new bytes4[](selectorsLength);
        
        // Add selectors in reverse order
        selectors_[--selectorsLength] = this.initializeXxx.selector;
        selectors_[--selectorsLength] = this.publicOperation.selector;
    }
}
```

##### File 4: IXXX.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IXXX {
    // Events
    event XxxInitialized(/* params */);
    event OperationExecuted(uint256 indexed id, string data);

    // Functions
    function initializeXxx(/* params */) external;
    function publicOperation(uint256 id) external returns (string memory);
}
```

#### Step 1.3: Testing Requirements

Create comprehensive tests following ISBE test structure:

```solidity
// test/tokens/xxx/XXX.test.ts
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

describe("XXX Custom Facet", function () {
    // Test initialization
    it("Should initialize correctly", async function () {
        // Test code
    });

    // Test business logic
    it("Should execute custom operation", async function () {
        // Test code
    });

    // Test access control
    it("Should enforce role restrictions", async function () {
        // Test code
    });

    // Test storage isolation
    it("Should not conflict with existing storage", async function () {
        // Test code
    });
});
```

#### Step 1.4: Submission Package

Prepare and submit:

1. **Source Code**
   - All four contract files (Internal, Logic, Facet, Interface)
   - Test files with >90% coverage
   - README explaining functionality

2. **Documentation**
   - Function specifications
   - Storage layout diagram
   - Integration requirements
   - Security considerations

3. **Deployment Configuration**
   - Constructor parameters
   - Initialization parameters
   - Required roles/permissions

### Part 2: ISBE Team Tasks

#### Step 2.1: Audit Process

Review submission for:

1. **Architecture Compliance**
   - Follows ISBE facet pattern (Internal/Logic/Facet/Interface)
   - Correct introspection implementation
   - Proper storage isolation
   - Initialization pattern compliance

2. **Security**
   - Access control implementation
   - Reentrancy protection
   - Integer overflow/underflow checks
   - Storage collision prevention

3. **Gas Optimization**
   - Efficient storage usage
   - Minimal external calls
   - Optimized loops and operations

4. **Code Quality**
   - Solidity best practices
   - Clear documentation
   - Comprehensive tests

#### Step 2.2: Generate Constants

After approval, generate unique constants:

##### Storage Position (if custom storage exists)

```bash
# Generate storage position
cast keccak "isbe.storage.CustomFacetName"
# Result: 0xabcd...1234

# Add to contracts/constants/storagePositions.sol
bytes32 constant _CUSTOM_FACET_STORAGE_POSITION = 0xabcd...1234;
```

##### Resolver Key

```bash
# Generate resolver key
cast keccak "CUSTOM_FACET_BUSINESS_LOGIC"
# Result: 0xef12...5678

# Add to contracts/constants/resolverKeys.sol
bytes32 constant _CUSTOM_FACET_RESOLVER_KEY = 0xef12...5678;
```

#### Step 2.3: Update Client Contracts

1. Replace placeholder constants in client contracts:
   ```solidity
   // In XXXInternal.sol (if exists)
   import {_CUSTOM_FACET_STORAGE_POSITION} from '../../constants/storagePositions.sol';
   
   // In XXX.sol
   import {_CUSTOM_FACET_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
   
   // In XXXFacet.sol
   import {_CUSTOM_FACET_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
   ```

2. Update imports to use ISBE paths

3. Run tests to verify integration

#### Step 2.4: Deploy Facet

Create deployment script:

```typescript
// scripts/custom/deploy-custom-facet.ts
import { ethers } from "hardhat";
import { updateBusinessLogicRegistry } from "../utils/registry";

async function main() {
    const CustomFacet = await ethers.getContractFactory("CustomFacetName");
    const customFacet = await CustomFacet.deploy();
    await customFacet.waitForDeployment();
    
    const address = await customFacet.getAddress();
    console.log(`CustomFacet deployed to: ${address}`);
    
    // Get introspection data
    const businessId = await customFacet.businessIdIntrospection();
    const selectors = await customFacet.selectorsIntrospection();
    
    console.log(`Business ID: ${businessId}`);
    console.log(`Selectors: ${selectors}`);
    
    return { address, businessId, selectors };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

Run deployment:

```bash
npx hardhat run scripts/custom/deploy-custom-facet.ts --network <network-name>
```

#### Step 2.5: Register in BusinessLogicRegistry

Create registration task:

```typescript
// tasks/custom/registerCustomFacet.ts
import { task } from "hardhat/config";

task("register:custom-facet", "Register custom facet in BusinessLogicRegistry")
    .addParam("facet", "Facet contract address")
    .addParam("businessId", "Business ID (resolver key)")
    .setAction(async (taskArgs, hre) => {
        const { facet, businessId } = taskArgs;
        
        const registry = await hre.ethers.getContractAt(
            "BusinessLogicRegistry",
            process.env.BUSINESS_LOGIC_REGISTRY_ADDRESS
        );
        
        const facetContract = await hre.ethers.getContractAt(
            "IEIP2535Introspection",
            facet
        );
        
        const selectors = await facetContract.selectorsIntrospection();
        
        const tx = await registry.registerBusinessLogic(
            businessId,
            facet,
            selectors
        );
        
        await tx.wait();
        
        console.log(`Custom facet registered:`);
        console.log(`  Business ID: ${businessId}`);
        console.log(`  Facet Address: ${facet}`);
        console.log(`  Selectors: ${selectors.length}`);
    });
```

Run registration:

```bash
npx hardhat register:custom-facet \
    --facet <deployed-facet-address> \
    --business-id <resolver-key> \
    --network <network-name>
```

#### Step 2.6: Provide Integration Info to Client

Send client deployment package:

```json
{
    "facetName": "CustomFacet",
    "facetAddress": "0xABCD...1234",
    "businessId": "0xef12...5678",
    "selectors": [
        "0x12345678",
        "0x9abcdef0"
    ],
    "initializeSelector": "0x12345678",
    "initializeParams": {
        "types": ["string", "uint256"],
        "description": "Initialize custom facet with name and counter"
    },
    "networkDeployedOn": "isbe-mainnet",
    "deploymentDate": "2024-01-15"
}
```

### Part 3: Client Integration Process

#### Step 3.1: Verify Facet Deployment

Client should verify the facet is correctly deployed and registered:

```typescript
// scripts/client/verify-facet.ts
import { ethers } from "hardhat";

async function verifyFacet(facetAddress: string, expectedBusinessId: string) {
    const facet = await ethers.getContractAt("IEIP2535Introspection", facetAddress);
    
    // Verify business ID
    const businessId = await facet.businessIdIntrospection();
    console.log(`Business ID: ${businessId}`);
    console.log(`Expected: ${expectedBusinessId}`);
    console.log(`Match: ${businessId === expectedBusinessId}`);
    
    // Get selectors
    const selectors = await facet.selectorsIntrospection();
    console.log(`Selectors (${selectors.length}):`);
    selectors.forEach((sel, idx) => console.log(`  [${idx}] ${sel}`));
    
    // Verify interfaces
    const interfaces = await facet.interfacesIntrospection();
    console.log(`Interfaces: ${interfaces}`);
}

// Usage
verifyFacet("0xABCD...1234", "0xef12...5678");
```

#### Step 3.2: Prepare DiamondCut Data

Create integration script:

```typescript
// scripts/client/integrate-custom-facet.ts
import { ethers } from "hardhat";

interface FacetCut {
    facetAddress: string;
    action: 0 | 1 | 2; // Add=0, Replace=1, Remove=2
    functionSelectors: string[];
}

async function integrateFacet(
    proxyAddress: string,
    facetAddress: string,
    selectors: string[],
    initializeCalldata?: string
) {
    const proxy = await ethers.getContractAt("IDiamondCut", proxyAddress);
    
    // Prepare facet cut
    const facetCut: FacetCut = {
        facetAddress: facetAddress,
        action: 0, // Add
        functionSelectors: selectors
    };
    
    // Execute diamond cut
    const tx = await proxy.diamondCut(
        [facetCut],
        facetAddress, // init contract (use facet itself if has initializer)
        initializeCalldata || "0x" // init calldata
    );
    
    await tx.wait();
    console.log(`Facet integrated successfully!`);
    console.log(`Transaction: ${tx.hash}`);
}

// Example usage
const facetAddress = "0xABCD...1234";
const selectors = ["0x12345678", "0x9abcdef0"];

// Encode initialize call
const initCalldata = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "uint256"],
    ["MyToken", 100]
);

integrateFacet(
    "0xPROXY...ADDRESS",
    facetAddress,
    selectors,
    initCalldata
);
```

#### Step 3.3: Execute Diamond Cut

Run integration script:

```bash
npx hardhat run scripts/client/integrate-custom-facet.ts --network <network-name>
```

The `diamondCut()` function will:
1. Validate the facet cut data
2. Add function selectors to the diamond
3. Map selectors to facet address
4. Execute initialization if provided
5. Emit `DiamondCut` event

#### Step 3.4: Verify Integration

Test the integrated facet:

```typescript
// scripts/client/test-integration.ts
import { ethers } from "hardhat";

async function testIntegration(proxyAddress: string) {
    // Get proxy with custom facet ABI
    const customInterface = new ethers.Interface([
        "function publicOperation(uint256 id) returns (string)",
        "function customFunction() view returns (uint256)"
    ]);
    
    const proxy = new ethers.Contract(
        proxyAddress,
        customInterface,
        ethers.provider
    );
    
    // Test custom functions
    const result = await proxy.publicOperation(1);
    console.log(`Operation result: ${result}`);
    
    const value = await proxy.customFunction();
    console.log(`Custom value: ${value}`);
}

testIntegration("0xPROXY...ADDRESS");
```

#### Step 3.5: Update Client Documentation

Document the integration:

```markdown
# Custom Facet Integration

## Facet: CustomFacet
- **Address**: 0xABCD...1234
- **Business ID**: 0xef12...5678
- **Network**: isbe-mainnet
- **Integrated On**: 2024-01-15

## Functions Available
- `initializeXxx(string name, uint256 counter)` - Initialize facet
- `publicOperation(uint256 id) returns (string)` - Execute operation
- `customFunction() view returns (uint256)` - View custom data

## Usage Example
```javascript
const proxy = await ethers.getContractAt("CustomFacet", proxyAddress);
const result = await proxy.publicOperation(1);
```

## Integration Transaction
- TX Hash: 0xTX...HASH
- Block: 123456
```

## Concrete Example: ERC721 TokenURI Custom Facet

This example demonstrates adding custom tokenURI functionality to an ERC721 token.

### Use Case

Client has deployed an ERC721 proxy using ISBE standard configuration. They need to:
1. Set custom base URI for metadata
2. Set individual token URIs for specific NFTs
3. Override default tokenURI behavior

### Architecture

Following ISBE pattern exactly:

```
contracts/tokens/erc721/extensions/customuri/
├── ERC721CustomURIInternal.sol    (Storage + internals)
├── ERC721CustomURI.sol             (External logic)
├── ERC721CustomURIFacet.sol        (Diamond facet)
└── IERC721CustomURI.sol            (Interface)
```

### Implementation Files

#### IERC721CustomURI.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC721CustomURI {
    // Events
    event CustomURIInitialized(string baseURI);
    event BaseURIUpdated(string newBaseURI);
    event TokenURIUpdated(uint256 indexed tokenId, string tokenURI);
    
    // Functions
    function initializeCustomURI(string memory baseURI_) external;
    function setBaseURI(string memory newBaseURI) external;
    function setTokenURI(uint256 tokenId, string memory tokenURI_) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
```

#### ERC721CustomURIInternal.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../../ERC721Internal.sol';
import {_ERC721_CUSTOM_URI_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

abstract contract ERC721CustomURIInternal is ERC721Internal {
    struct ERC721CustomURIStorage {
        string baseURI;
        mapping(uint256 => string) tokenURIs;
    }
    
    function _initializeCustomURI(string memory baseURI_) internal {
        ERC721CustomURIStorage storage $ = _erc721CustomURIStorage();
        $.baseURI = baseURI_;
    }
    
    function _setBaseURI(string memory newBaseURI) internal {
        _erc721CustomURIStorage().baseURI = newBaseURI;
    }
    
    function _setTokenURI(uint256 tokenId, string memory tokenURI_) internal {
        _erc721CustomURIStorage().tokenURIs[tokenId] = tokenURI_;
    }
    
    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        ERC721CustomURIStorage storage $ = _erc721CustomURIStorage();
        
        string memory _tokenURIValue = $.tokenURIs[tokenId];
        string memory base = $.baseURI;
        
        // If token has specific URI, return it
        if (bytes(_tokenURIValue).length > 0) {
            return _tokenURIValue;
        }
        
        // Otherwise return baseURI + tokenId
        if (bytes(base).length > 0) {
            return string(abi.encodePacked(base, _toString(tokenId)));
        }
        
        return "";
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _erc721CustomURIStorage() 
        private 
        pure 
        returns (ERC721CustomURIStorage storage storage_) 
    {
        bytes32 position = _ERC721_CUSTOM_URI_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}
```

#### ERC721CustomURI.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721CustomURIInternal} from './ERC721CustomURIInternal.sol';
import {IERC721CustomURI} from './IERC721CustomURI.sol';
import {_ERC721_CUSTOM_URI_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {_METADATA_ROLE} from '../../../../constants/roles.sol';

abstract contract ERC721CustomURI is IERC721CustomURI, ERC721CustomURIInternal {
    constructor() {
        _disableInitializers(_ERC721_CUSTOM_URI_RESOLVER_KEY);
    }
    
    function initializeCustomURI(string memory baseURI_) 
        external 
        override 
        initializer(_ERC721_CUSTOM_URI_RESOLVER_KEY) 
    {
        _initializeCustomURI(baseURI_);
        emit CustomURIInitialized(baseURI_);
    }
    
    function setBaseURI(string memory newBaseURI) 
        external 
        override 
        onlyRole(_METADATA_ROLE) 
        whenNotPaused 
    {
        _setBaseURI(newBaseURI);
        emit BaseURIUpdated(newBaseURI);
    }
    
    function setTokenURI(uint256 tokenId, string memory tokenURI_) 
        external 
        override 
        onlyRole(_METADATA_ROLE) 
        whenNotPaused 
    {
        _checkTokenOwned(tokenId);
        _setTokenURI(tokenId, tokenURI_);
        emit TokenURIUpdated(tokenId, tokenURI_);
    }
    
    function tokenURI(uint256 tokenId) 
        external 
        view 
        override 
        returns (string memory) 
    {
        _checkTokenOwned(tokenId);
        return _tokenURI(tokenId);
    }
    
    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC721CustomURI).interfaceId;
    }
}
```

#### ERC721CustomURIFacet.sol

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC721_CUSTOM_URI_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721CustomURI} from './ERC721CustomURI.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC721CustomURIFacet is ERC721CustomURI, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC721_CUSTOM_URI_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeCustomURI.selector;
        selectors_[--selectorsLength] = this.setBaseURI.selector;
        selectors_[--selectorsLength] = this.setTokenURI.selector;
        selectors_[--selectorsLength] = this.tokenURI.selector;
    }
}
```

### Constants Required

#### contracts/constants/storagePositions.sol

```solidity
// Add this line
bytes32 constant _ERC721_CUSTOM_URI_STORAGE_POSITION = keccak256("isbe.storage.ERC721CustomURI");
```

#### contracts/constants/resolverKeys.sol

```solidity
// Add this line
bytes32 constant _ERC721_CUSTOM_URI_RESOLVER_KEY = keccak256("ERC721_CUSTOM_URI_BUSINESS_LOGIC");
```

### Client Integration Example

#### Step 1: Verify Deployment

```typescript
const facetAddress = "0xABCD...1234"; // Provided by ISBE team
const facet = await ethers.getContractAt("IEIP2535Introspection", facetAddress);

const businessId = await facet.businessIdIntrospection();
console.log(`Business ID: ${businessId}`);

const selectors = await facet.selectorsIntrospection();
console.log(`Selectors: ${selectors}`);
```

#### Step 2: Prepare Diamond Cut

```typescript
const proxyAddress = "0xPROXY...ADDRESS";
const proxy = await ethers.getContractAt("IDiamondCut", proxyAddress);

const facetCut = {
    facetAddress: facetAddress,
    action: 0, // Add
    functionSelectors: selectors
};

// Encode initialization
const initCalldata = ethers.AbiCoder.defaultAbiCoder().encodeFunctionCall(
    {
        name: "initializeCustomURI",
        type: "function",
        inputs: [{ type: "string", name: "baseURI_" }]
    },
    ["https://api.mynft.com/metadata/"]
);
```

#### Step 3: Execute Integration

```typescript
const tx = await proxy.diamondCut(
    [facetCut],
    facetAddress,
    initCalldata
);

await tx.wait();
console.log(`Custom URI facet integrated! TX: ${tx.hash}`);
```

#### Step 4: Use Custom Functionality

```typescript
const customURIFacet = await ethers.getContractAt("IERC721CustomURI", proxyAddress);

// Set specific token URI
await customURIFacet.setTokenURI(1, "https://special.com/token/1");

// Get token URI
const uri = await customURIFacet.tokenURI(1);
console.log(`Token URI: ${uri}`); // "https://special.com/token/1"

// Token without specific URI uses baseURI + tokenId
const uri2 = await customURIFacet.tokenURI(2);
console.log(`Token URI: ${uri2}`); // "https://api.mynft.com/metadata/2"
```

### Handling Selector Conflicts

If the proxy already has a `tokenURI(uint256)` function from base ERC721Facet, the new custom facet will OVERRIDE it since `diamondCut()` with action `Replace` (action=1) can replace existing selectors.

To replace instead of add:

```typescript
const facetCut = {
    facetAddress: facetAddress,
    action: 1, // Replace instead of Add
    functionSelectors: [
        "0x...", // tokenURI selector
        // Only include selectors that need replacement
    ]
};
```

## Important Considerations

### Storage Collision Prevention

Always use unique storage positions generated via `keccak256`. Never reuse positions from other facets.

### Selector Conflicts

Before integration, verify selectors don't conflict:

```typescript
const diamondLoupe = await ethers.getContractAt("IDiamondLoupe", proxyAddress);
const existingFacets = await diamondLoupe.facets();

for (const selector of newSelectors) {
    for (const facet of existingFacets) {
        if (facet.functionSelectors.includes(selector)) {
            console.warn(`Selector ${selector} already exists in facet ${facet.facetAddress}`);
        }
    }
}
```

### Initialization Order

If custom facet depends on other facets, ensure they are initialized first:

```typescript
// Initialize dependencies first
await proxy.initializeErc721("MyNFT", "MNFT");

// Then initialize custom facet
await proxy.initializeCustomURI("https://api.mynft.com/metadata/");
```

### Access Control

Custom facets inherit ISBE role-based access control. Ensure proper role assignments:

```typescript
const accessControl = await ethers.getContractAt("IAccessControl", proxyAddress);

// Grant METADATA_ROLE to admin
await accessControl.grantRole(METADATA_ROLE, adminAddress);
```

### Upgradeability

Custom facets can be updated via `diamondCut()` with action `Replace`:

```typescript
const facetCut = {
    facetAddress: newFacetAddress,
    action: 1, // Replace
    functionSelectors: selectors
};

await proxy.diamondCut([facetCut], ethers.ZeroAddress, "0x");
```

### Gas Considerations

Each `diamondCut()` operation costs gas. Batch multiple facet additions when possible:

```typescript
const facetCuts = [
    { facetAddress: customURI, action: 0, functionSelectors: uriSelectors },
    { facetAddress: customRoyalty, action: 0, functionSelectors: royaltySelectors }
];

await proxy.diamondCut(facetCuts, ethers.ZeroAddress, "0x");
```

## Testing Strategy

### Unit Tests

Test facet in isolation:

```solidity
import { ERC721CustomURIFacet } from "contracts/tokens/erc721/extensions/customuri/ERC721CustomURIFacet.sol";

describe("ERC721CustomURIFacet", function () {
    it("Should set and get base URI", async function () {
        // Deploy facet
        const CustomURI = await ethers.getContractFactory("ERC721CustomURIFacet");
        const customURI = await CustomURI.deploy();
        
        // Initialize
        await customURI.initializeCustomURI("https://base.com/");
        
        // Test functionality
        await customURI.setTokenURI(1, "https://special.com/1");
        expect(await customURI.tokenURI(1)).to.equal("https://special.com/1");
    });
});
```

### Integration Tests

Test with diamond proxy:

```solidity
describe("Diamond Integration", function () {
    it("Should integrate custom URI facet", async function () {
        // Deploy base diamond
        const diamond = await deployDiamond();
        
        // Deploy custom facet
        const CustomURI = await ethers.getContractFactory("ERC721CustomURIFacet");
        const customURI = await CustomURI.deploy();
        
        // Integrate via diamondCut
        const selectors = await customURI.selectorsIntrospection();
        await diamond.diamondCut(
            [{ facetAddress: customURI.address, action: 0, functionSelectors: selectors }],
            customURI.address,
            customURI.interface.encodeFunctionData("initializeCustomURI", ["https://base.com/"])
        );
        
        // Verify integration
        const uri = await ethers.getContractAt("IERC721CustomURI", diamond.address);
        await uri.setTokenURI(1, "test");
        expect(await uri.tokenURI(1)).to.equal("test");
    });
});
```

### End-to-End Tests

Test complete workflow:

```typescript
describe("Custom Facet E2E", function () {
    it("Should complete full integration workflow", async function () {
        // 1. Client creates proxy
        const proxy = await createERC721Proxy();
        
        // 2. ISBE deploys custom facet
        const customFacet = await deployCustomFacet();
        
        // 3. Client integrates facet
        await integrateCustomFacet(proxy, customFacet);
        
        // 4. Client uses custom functionality
        const result = await useCustomFunctionality(proxy);
        
        expect(result).to.be.valid;
    });
});
```

## Future Enhancements

### Web Portal for Custom Facets

Future implementation could include:

1. **Submission Interface**
   - Upload contracts via web form
   - Automated basic validation
   - Test result submission

2. **Audit Dashboard**
   - Review submitted facets
   - Approve/reject with comments
   - Track audit status

3. **Deployment Automation**
   - One-click deployment after approval
   - Automatic registry registration
   - Generate integration packages

4. **Client Integration Helper**
   - Web interface to generate integration scripts
   - Pre-filled transaction data
   - Verification tools

### Facet Marketplace

Consider building a marketplace where:
- ISBE-approved facets are listed
- Clients can browse and select facets
- One-click integration with deployed proxies
- Community ratings and reviews

## Summary

This roadmap provides a complete guide for implementing custom facet integration in ISBE network:

1. **Clients** develop facets following ISBE architecture patterns exactly
2. **ISBE Team** audits, deploys, and registers facets with unique constants
3. **Clients** integrate facets into their proxies via `diamondCut()`
4. **Production** proxies gain custom functionality without redeployment

The key principle is maintaining strict adherence to ISBE's architectural patterns:
- Storage isolation via assembly accessors
- Resolver key identification
- Four-file structure (Internal/Logic/Facet/Interface)
- Introspection implementation
- Initialization pattern

This ensures consistency, security, and maintainability across all custom facets in the ISBE ecosystem.
