# Client Configurations

Storage for client deployment history.

## Structure

Each client has their own JSON file identified by their Ethereum address:

```
client-configurations/
├── 0x86df4b738d592c31f4a9a657d6c8d6d05dc1d462.json
└── README.md
```

## JSON Format

```json
{
  "address": "0x86DF4B738D592c31F4A9A657D6c8d6D05DC1D462",
  "deployments": [
    {
      "address": "0xfD7d89F7F2b3D7e257425028C8094C0F460a1d76",
      "type": "ERC20",
      "name": "My Token",
      "symbol": "MTK",
      "features": ["base", "mintable", "capped"],
      "timestamp": 1730635800000,
      "txHash": "0x1234...",
      "blockNumber": 237145
    }
  ]
}
```

## Purpose

- Track deployment history per client
- Store token metadata
- Record transaction details
- Organize by client address

## Usage

```typescript
import { ClientConfigurationManager } from '../src/core/ClientConfigurationManager';

const manager = new ClientConfigurationManager();

// Add deployment
manager.addDeployment(clientAddress, {
  address: tokenAddress,
  type: 'ERC20',
  name: 'My Token',
  timestamp: Date.now()
});

// Get deployments
const deployments = manager.getDeployments(clientAddress);
```

## Git Ignore

Add to `.gitignore`:
```
sdk/client-configurations/*.json
!sdk/client-configurations/README.md
```
```
