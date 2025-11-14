# Network bootstrapping

This Hardhat task allows you to deploy all facets of use cases and subsequently the use cases in a network that has the Diamond Governance contract deployed.

## Basic Usage

The task has two parameters:
| Parameter|Description|
|----------|-----------|
| governanceaddress | Address where the governance parameter is located **(MANDATORY)** |
| network | Network name configured in **config/networks.ts**|

### Example

```bash
npx hardhat genesis:bootstrap \
    --governanceaddress 0x00000000000000000000000000000000000015BE
    --network genesis_validation_network_k1
```

## Network configuration

In order to deploy on a network, it must be properly configured in **config/networks.ts file**

**Example for a case network:**

```javascript
 genesis_validation_network_k1: {
    url: 'http://127.0.0.1:8545',
    accounts,
    gasPrice: 1000000001,
    curve: 'secp256k1', //Curve for CASE
}
```

**Example for a bare network:**

```javascript
genesis_validation_network_r1: {
    url: 'http://127.0.0.1:8545',
    accounts: secp256r1PrivateKeys,
    secp256r1Accounts,
    gasPrice: 1000000001,
    curve: 'secp256r1', // Curve for BARE
}
```

**IMPORTANT**: accouts are extracted from .env file:

```
ACCOUNTS=<private key without '0x'>
```

**IMPORTANT**: Bear in mind that parameter **gasPrice** should be appropriatelly configured to reflect the network gasPrice. This parameter is used to calculate gas price for all the transaction. If this parameter is below network gas price this will cause all transactions to be reverted.
