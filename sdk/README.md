# Token Factory SDK

TypeScript SDK for deploying and managing ERC20 and ERC721 tokens using the Factory Diamond pattern.

## Quick Start

### Installation

```bash
npm install ethers@^6
```

### Basic Usage - ERC20 Token

```typescript
import { ethers } from 'ethers';
import { ERC20Builder } from './src/core/ERC20Builder';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const builder = new ERC20Builder(provider, signer, FACTORY_ADDRESS);

const result = await builder
  .setToken('My Token', 'MTK', 18)
  .addMintable()
  .addCapped()
  .deploy();

console.log('Token deployed at:', result.tokenAddress);
```

### Basic Usage - ERC721 NFT

```typescript
import { ethers } from 'ethers';
import { ERC721Builder } from './src/core/ERC721Builder';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const builder = new ERC721Builder(provider, signer, FACTORY_ADDRESS);

const result = await builder
  .setToken('My NFT', 'MNFT')
  .addCapped()
  .deploy();

console.log('NFT deployed at:', result.tokenAddress);
```

## Core Components

### ERC20Builder

Fluent API for deploying ERC20 tokens with various features.

```typescript
const builder = new ERC20Builder(provider, signer, factoryAddress);

// Configure token
builder
  .setToken('Token Name', 'SYMBOL', 18)
  .addMintable()      // Enable minting
  .addCapped()        // Add supply cap
  .addBurnable()      // Enable burning
  .addPausable()      // Enable pausing
  .addSnapshot()      // Enable snapshots
  .addController();   // Add controller functions

// Deploy
const result = await builder.deploy();
```

### ERC721Builder

Fluent API for deploying ERC721 NFT collections.

```typescript
const builder = new ERC721Builder(provider, signer, factoryAddress);

// Configure NFT
builder
  .setToken('NFT Name', 'SYMBOL')
  .addCapped()        // Add supply cap (includes mint function)
  .addBurnable()      // Enable burning
  .addEnumerable()    // Enable enumeration
  .addRoyalty()       // Add ERC2981 royalty
  .addSnapshot();     // Enable snapshots

// Deploy
const result = await builder.deploy();
```

### RoleManager

Manage role-based access control for deployed tokens.

```typescript
import { RoleManager } from './src/admin/RoleManager';

const roleManager = new RoleManager(tokenAddress, signer);

// Grant roles
await roleManager.grantRole(ISBE_ROLES.MINTER_ROLE, address);
await roleManager.grantRole(ISBE_ROLES.PAUSER_ROLE, address);

// Check roles
const hasRole = await roleManager.hasRole(ISBE_ROLES.MINTER_ROLE, address);
```

### ConfigurationResolver

Query available token configurations.

```typescript
import { ConfigurationResolver } from './src/core/ConfigurationResolver';

const resolver = new ConfigurationResolver();

// Find by features
const config = resolver.findByFeatures('ERC20', ['base', 'mintable', 'capped']);

// Get all configurations
const allConfigs = resolver.getAllConfigurations('ERC20');
```

## Examples

The SDK includes several examples:

```bash
npx ts-node sdk/examples/01-deploy-erc20-simple.ts
npx ts-node sdk/examples/02-deploy-erc20-mintable.ts
npx ts-node sdk/examples/03-mint-and-burn.ts
npx ts-node sdk/examples/04-deploy-erc721-nft.ts
```

## Available Features

### ERC20 Features
- **base**: Basic ERC20 functionality
- **mintable**: Enable minting new tokens
- **capped**: Limit total supply
- **burnable**: Enable burning tokens
- **pausable**: Enable pausing transfers
- **snapshot**: Enable balance snapshots
- **controller**: Administrative control functions

### ERC721 Features
- **base**: Basic ERC721 functionality
- **capped**: Limit total supply (includes mint function)
- **burnable**: Enable burning NFTs
- **enumerable**: Enable token enumeration
- **pausable**: Enable pausing transfers
- **royalty**: ERC2981 royalty standard
- **snapshot**: Enable balance snapshots
- **controller**: Administrative control functions
- **consecutive**: ERC2309 consecutive transfer

## Project Structure

```
sdk/
├── abi/                    # Contract ABIs
├── config/                 # Token configurations
├── examples/               # Usage examples
├── src/
│   ├── admin/             # Role management
│   ├── core/              # Builders and resolvers
│   ├── types/             # Type definitions
│   └── utils/             # Utilities
└── client-configurations/ # Deployment history
```

## License

MIT
```

##  Core Components

### 1. ISBEClient

Main entry point for the SDK. Handles network connection and Factory Diamond interaction.

```typescript
// Read-only client
const client = ISBEClient.readOnly('dev');

// Client from private key
const client = ISBEClient.fromPrivateKey(privateKey, 'dev');

// Client from mnemonic
const client = ISBEClient.fromMnemonic(mnemonic, 'dev', 0);
```

### 2. ConfigurationManager

Manages token configuration mappings.

```typescript
// List all configurations
const configs = client.configManager.listConfigurations();

// Get specific configuration
const config = client.configManager.getConfiguration(configId);

// Find by name
const config = client.configManager.getConfigurationByName('ERC20 Mintable with Cap');

// Filter by standard
const erc20Configs = client.configManager.listConfigurationsByStandard('ERC20');
```

### 3. ProxyDeployer

Handles token proxy deployment through the Factory Diamond.

```typescript
const result = await client.proxyDeployer.deployProxy({
  configId: '0x...2a20',
  initializeData: [encodedInitData],
  roles: [{ role: ROLES.MINTER_ROLE, account: signerAddress }],
  signer: client.getSigner()!,
});

console.log('Deployed at:', result.proxyAddress);
```

## 🌐 Networks

### Dev Network (Current)
- RPC: `https://besu-node-validator-1-rpc.dev.aws.envs.redisbe.com/`
- Chain ID: `1337`
- Factory Diamond: `0xeF7FCccE809437ba23D8D9b25CeC127cEC19f0de`

### Mainnet (Future)
- RPC: `https://rpc.isbe.network`
- Chain ID: `9999` (placeholder)
- Factory Diamond: TBD

## 📋 Available Configurations

Currently deployed configurations:

1. **ERC20 Basic** (`0x...0020`)
   - Simple ERC20 token
   - Features: transfers, balances, allowances

2. **ERC20 Mintable with Cap** (`0x...2a20`)
   - ERC20 with minting capability
   - Features: minting, supply cap, role-based access

3. **ERC20 with Controller** (`0x...006a`)
   - ERC20 with administrative control
   - Features: forced transfers, balance management

## 🛠 Development

### Build SDK

```bash
npm run build
```

### Run Examples

```bash
npm run example:connection
```

### Project Structure

```
sdk/
├── src/
│   ├── core/
│   │   ├── ISBEClient.ts
│   │   ├── ConfigurationManager.ts
│   │   └── ProxyDeployer.ts
│   ├── types/
│   │   ├── networks.ts
│   │   ├── configuration.ts
│   │   └── index.ts
│   └── index.ts
├── examples/
│   └── 01-basic-connection.ts
├── package.json
└── tsconfig.json
```

## 📚 Next Steps

- [ ] Add ERC20Builder for fluent token deployment
- [ ] Add ERC721Builder for NFT deployment
- [ ] Implement admin tools (BusinessLogicChecker, ErrorDecoder)
- [ ] Add comprehensive testing suite
- [ ] Map all 150+ possible configurations
- [ ] Create React integration examples

## 📖 Documentation

For complete documentation, see [ISBE-SDK-Documentation.md](./ISBE-SDK-Documentation.md)

## 📄 License

MIT
